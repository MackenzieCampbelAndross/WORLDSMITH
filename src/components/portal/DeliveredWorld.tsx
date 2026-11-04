"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type LightingPreset = "daylight" | "evening" | "neutral";
type Quality = "low" | "medium" | "high";

interface Collider {
  min: [number, number];
  max: [number, number];
  height?: number;
}

interface RoomArea {
  id: number;
  name?: string;
  center: [number, number];
  area_m2?: number;
}

interface CollisionFile {
  walls?: Collider[];
  furniture?: Collider[];
  rooms?: RoomArea[];
  spawn?: { position: [number, number, number]; yaw?: number };
  wall_height?: number;
}

interface Runtime {
  setLighting: (preset: LightingPreset) => void;
  setFurnitureVisible: (visible: boolean) => void;
  setCeilingVisible: (visible: boolean) => void;
  setQuality: (quality: Quality) => void;
  teleportToRoom: (roomId: number) => void;
  reset: () => void;
}

interface DeliveredWorldProps {
  glbUrl: string;
  collisionUrl: string | null;
  className?: string;
  onStill?: (blob: Blob) => void;
}

const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.24;
const WALK_SPEED = 2.2;
const RUN_SPEED = 4.2;
const PITCH_LIMIT = Math.PI / 2.2;

interface LightingConfig {
  exposure: number;
  sunColor: number;
  sunIntensity: number;
  sunDirection: [number, number, number];
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  lampColor: number;
  lampIntensity: number;
  envIntensity: number;
  skyTop: number;
  skyHorizon: number;
  groundColor: number;
}

const LIGHTING_PRESETS: Record<LightingPreset, LightingConfig> = {
  daylight: {
    exposure: 0.86,
    sunColor: 0xfff2df,
    sunIntensity: 2.05,
    sunDirection: [0.42, 0.86, 0.3],
    hemiSky: 0xe9f1fb,
    hemiGround: 0xa79b87,
    hemiIntensity: 0.54,
    lampColor: 0xffefd7,
    lampIntensity: 12,
    envIntensity: 0.52,
    skyTop: 0x9abfe2,
    skyHorizon: 0xf0e6d4,
    groundColor: 0x9a9180,
  },
  evening: {
    exposure: 0.84,
    sunColor: 0xffb377,
    sunIntensity: 0.8,
    sunDirection: [-0.55, 0.42, -0.35],
    hemiSky: 0x38425c,
    hemiGround: 0x352a20,
    hemiIntensity: 0.32,
    lampColor: 0xffc78d,
    lampIntensity: 24,
    envIntensity: 0.28,
    skyTop: 0x222c45,
    skyHorizon: 0xc9895f,
    groundColor: 0x3b342b,
  },
  neutral: {
    exposure: 0.9,
    sunColor: 0xffffff,
    sunIntensity: 1.6,
    sunDirection: [0.2, 0.92, 0.36],
    hemiSky: 0xf1f3f5,
    hemiGround: 0x867f73,
    hemiIntensity: 0.66,
    lampColor: 0xfff6e8,
    lampIntensity: 15,
    envIntensity: 0.5,
    skyTop: 0xc3ced8,
    skyHorizon: 0xefeee8,
    groundColor: 0x8e8c84,
  },
};

const LIGHTING_OPTIONS: { value: LightingPreset; label: string }[] = [
  { value: "daylight", label: "Daylight" },
  { value: "evening", label: "Evening" },
  { value: "neutral", label: "Neutral" },
];

const QUALITY_OPTIONS: { value: Quality; label: string }[] = [
  { value: "low", label: "Performance" },
  { value: "medium", label: "Balanced" },
  { value: "high", label: "High" },
];

const qualityPixelRatio = (quality: Quality) =>
  Math.min(window.devicePixelRatio || 1, quality === "low" ? 1 : quality === "medium" ? 1.5 : 2);

const hudIcon =
  "flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-[#111713]/80 text-[#f0f1e6]/70 backdrop-blur transition-colors hover:border-white/30 hover:text-[#f0f1e6]";
const hudPill =
  "rounded-full border border-white/12 bg-[#111713]/80 px-3.5 py-2 font-body text-[10.5px] text-[#f0f1e6]/60 transition-colors hover:border-white/25 hover:text-[#f0f1e6]";

function rootsMatching(model: THREE.Object3D, test: (name: string) => boolean): THREE.Object3D[] {
  const matches: THREE.Object3D[] = [];
  model.traverse((object) => {
    if (!test(object.name)) return;
    for (let parent = object.parent; parent; parent = parent.parent) {
      if (test(parent.name)) return;
    }
    matches.push(object);
  });
  return matches;
}

const skyVertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const skyFragmentShader = `
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
    vec3 color = mix(bottomColor, topColor, pow(max(h, 0.0), exponent));
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function DeliveredWorld({ glbUrl, collisionUrl, className = "", onStill }: DeliveredWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const stillRef = useRef<DeliveredWorldProps["onStill"]>(onStill);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomArea[]>([]);
  const [locked, setLocked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lighting, setLighting] = useState<LightingPreset>("evening");
  const [furnitureVisible, setFurnitureVisible] = useState(true);
  const [ceilingVisible, setCeilingVisible] = useState(true);
  const [quality, setQuality] = useState<Quality>("medium");

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frame = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(qualityPixelRatio(quality));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // updateStyle stays false: the canvas is sized by h-full w-full, so an inline
    // pixel size would freeze the view at its initial height and leave the rest black.
    renderer.setSize(mount.clientWidth, mount.clientHeight, false);
    renderer.domElement.className = "block h-full w-full touch-none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      0.06,
      600,
    );
    camera.rotation.order = "YXZ";

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    const environment = pmrem.fromScene(roomEnvironment, 0.04);
    scene.environment = environment.texture;
    pmrem.dispose();
    roomEnvironment.dispose();

    const colliders: THREE.Box3[] = [];
    const keys = new Set<string>();
    const view = { yaw: 0, pitch: -0.05 };
    let spawn: { position: [number, number, number]; yaw: number } = { position: [0, EYE_HEIGHT, 0], yaw: 0 };
    let roomAreas: RoomArea[] = [];
    let dragging = false;
    let lastPointer: { x: number; y: number } | null = null;

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const blocked = (position: THREE.Vector3) => {
      const probe = new THREE.Box3(
        new THREE.Vector3(position.x - PLAYER_RADIUS, 0.2, position.z - PLAYER_RADIUS),
        new THREE.Vector3(position.x + PLAYER_RADIUS, EYE_HEIGHT, position.z + PLAYER_RADIUS),
      );
      return colliders.some((box) => box.intersectsBox(probe));
    };

    const canvas = renderer.domElement;
    const onLockChange = () => setLocked(document.pointerLockElement === canvas);
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        view.yaw -= event.movementX * 0.0022;
        view.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, view.pitch - event.movementY * 0.0022));
      } else if (dragging && lastPointer) {
        view.yaw -= (event.clientX - lastPointer.x) * 0.0035;
        view.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, view.pitch - (event.clientY - lastPointer.y) * 0.0035));
        lastPointer = { x: event.clientX, y: event.clientY };
      }
    };
    const onClick = () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    };
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = () => {
      dragging = false;
      lastPointer = null;
    };
    const onKeyDown = (event: KeyboardEvent) => keys.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const clock = new THREE.Clock();
    let stillAt = 0;
    // The drawing buffer is cleared once the frame is presented, so the still has
    // to be read from the GPU inside the same animation frame as the render.
    const captureStill = () => {
      const gl = renderer.getContext();
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const rowBytes = width * 4;
      const flipped = new Uint8ClampedArray(pixels.length);
      for (let y = 0; y < height; y++) {
        const source = (height - 1 - y) * rowBytes;
        for (let x = 0; x < rowBytes; x += 4) {
          const target = y * rowBytes + x;
          flipped[target] = pixels[source + x];
          flipped[target + 1] = pixels[source + x + 1];
          flipped[target + 2] = pixels[source + x + 2];
          flipped[target + 3] = 255;
        }
      }
      const surface = document.createElement("canvas");
      surface.width = width;
      surface.height = height;
      surface.getContext("2d")?.putImageData(new ImageData(flipped, width, height), 0, 0);
      surface.toBlob((blob) => {
        if (blob) stillRef.current?.(blob);
      }, "image/jpeg", 0.85);
    };
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN_SPEED : WALK_SPEED;
      const forward = new THREE.Vector3(-Math.sin(view.yaw), 0, -Math.cos(view.yaw));
      const right = new THREE.Vector3(Math.cos(view.yaw), 0, -Math.sin(view.yaw));
      const step = new THREE.Vector3();
      if (keys.has("KeyW") || keys.has("ArrowUp")) step.add(forward);
      if (keys.has("KeyS") || keys.has("ArrowDown")) step.sub(forward);
      if (keys.has("KeyD") || keys.has("ArrowRight")) step.add(right);
      if (keys.has("KeyA") || keys.has("ArrowLeft")) step.sub(right);
      if (step.lengthSq() > 0) {
        step.normalize().multiplyScalar(speed * delta);
        const attempt = camera.position.clone().add(new THREE.Vector3(step.x, 0, step.z));
        if (!blocked(attempt)) camera.position.copy(attempt);
        else {
          const alongX = camera.position.clone();
          alongX.x += step.x;
          if (!blocked(alongX)) camera.position.x = alongX.x;
          const alongZ = camera.position.clone();
          alongZ.z += step.z;
          if (!blocked(alongZ)) camera.position.z = alongZ.z;
        }
      }
      camera.rotation.y = view.yaw;
      camera.rotation.x = view.pitch;
      renderer.render(scene, camera);
      if (stillAt && performance.now() >= stillAt) {
        stillAt = 0;
        captureStill();
      }
    };

    const applyLighting = (
      preset: LightingConfig,
      lights: { sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; lamps: THREE.SpotLight[] },
      skyUniforms: { topColor: { value: THREE.Color }; bottomColor: { value: THREE.Color } },
      ground: THREE.Mesh,
    ) => {
      renderer.toneMappingExposure = preset.exposure;
      scene.environmentIntensity = preset.envIntensity;
      lights.sun.color.setHex(preset.sunColor);
      lights.sun.intensity = preset.sunIntensity;
      lights.sun.position.set(preset.sunDirection[0] * 40, preset.sunDirection[1] * 40, preset.sunDirection[2] * 40);
      lights.hemi.color.setHex(preset.hemiSky);
      lights.hemi.groundColor.setHex(preset.hemiGround);
      lights.hemi.intensity = preset.hemiIntensity;
      for (const lamp of lights.lamps) {
        lamp.color.setHex(preset.lampColor);
        lamp.intensity = preset.lampIntensity;
      }
      skyUniforms.topColor.value.setHex(preset.skyTop);
      skyUniforms.bottomColor.value.setHex(preset.skyHorizon);
      (ground.material as THREE.MeshStandardMaterial).color.setHex(preset.groundColor);
    };

    Promise.all([
      new Promise<THREE.Group>((resolve, reject) => {
        new GLTFLoader().load(
          glbUrl,
          (gltf) => resolve(gltf.scene),
          undefined,
          (error) => reject(error instanceof Error ? error : new Error(String(error))),
        );
      }),
      collisionUrl
        ? fetch(collisionUrl)
            .then(async (response): Promise<CollisionFile> =>
              response.ok ? ((await response.json()) as CollisionFile) : {},
            )
            .catch((): CollisionFile => ({}))
        : Promise.resolve<CollisionFile>({}),
    ])
      .then(([model, collision]) => {
        if (disposed) return;

        const wallHeight = collision.wall_height ?? 2.8;
        const addBox = (min: [number, number], max: [number, number], height: number) =>
          colliders.push(
            new THREE.Box3(
              new THREE.Vector3(Math.min(min[0], max[0]), 0, Math.min(min[1], max[1])),
              new THREE.Vector3(Math.max(min[0], max[0]), height, Math.max(min[1], max[1])),
            ),
          );
        for (const wall of collision.walls ?? []) addBox(wall.min, wall.max, wallHeight);
        for (const item of collision.furniture ?? []) addBox(item.min, item.max, item.height ?? 0.9);
        roomAreas = collision.rooms ?? [];
        setRooms(roomAreas);

        scene.add(model);
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());

        const skyUniforms = {
          topColor: { value: new THREE.Color(0x9abfe2) },
          bottomColor: { value: new THREE.Color(0xf0e6d4) },
          offset: { value: 24 },
          exponent: { value: 0.72 },
        };
        const skyMaterial = new THREE.ShaderMaterial({
          uniforms: skyUniforms,
          vertexShader: skyVertexShader,
          fragmentShader: skyFragmentShader,
          side: THREE.BackSide,
          depthWrite: false,
          fog: false,
        });
        const sky = new THREE.Mesh(new THREE.SphereGeometry(340, 32, 18), skyMaterial);
        sky.position.set(center.x, 0, center.z);
        sky.frustumCulled = false;
        sky.renderOrder = -10;
        scene.add(sky);

        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(300, 48),
          new THREE.MeshStandardMaterial({ color: 0x9a9180, roughness: 0.98, metalness: 0 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(center.x, bounds.min.y - 0.05, center.z);
        scene.add(ground);

        const hemi = new THREE.HemisphereLight(0xe9f1fb, 0xa79b87, 0.54);
        scene.add(hemi);
        const ambient = new THREE.AmbientLight(0xffffff, 0.12);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xfff2df, 2.05);
        sun.position.set(18, 36, 12);
        sun.target.position.set(center.x, 0, center.z);
        scene.add(sun);
        scene.add(sun.target);

        const lamps: THREE.SpotLight[] = [];
        for (const room of roomAreas) {
          const lamp = new THREE.SpotLight(
            0xffefd7,
            12,
            Math.max(9, wallHeight * 3.6),
            Math.PI / 2.7,
            0.85,
            2,
          );
          lamp.position.set(room.center[0], Math.max(2.1, wallHeight - 0.12), room.center[1]);
          lamp.target.position.set(room.center[0], 0, room.center[1]);
          scene.add(lamp);
          scene.add(lamp.target);
          lamps.push(lamp);
        }

        const furnitureRoots = rootsMatching(model, (name) => name.startsWith("Furniture_"));
        const ceilingRoots = rootsMatching(model, (name) => /ceiling/i.test(name));

        if (collision.spawn?.position) {
          spawn = { position: collision.spawn.position, yaw: collision.spawn.yaw ?? 0 };
        }
        camera.position.set(spawn.position[0], EYE_HEIGHT, spawn.position[2]);
        view.yaw = spawn.yaw;

        const apply = (preset: LightingPreset) =>
          applyLighting(LIGHTING_PRESETS[preset], { sun, hemi, lamps }, skyUniforms, ground);
        apply(lighting);
        if (furnitureVisible === false) furnitureRoots.forEach((root) => (root.visible = false));
        if (ceilingVisible === false) ceilingRoots.forEach((root) => (root.visible = false));
        if (quality !== "medium") renderer.setPixelRatio(qualityPixelRatio(quality));

        runtimeRef.current = {
          setLighting: apply,
          setFurnitureVisible: (visible) => furnitureRoots.forEach((root) => (root.visible = visible)),
          setCeilingVisible: (visible) => ceilingRoots.forEach((root) => (root.visible = visible)),
          setQuality: (next) => renderer.setPixelRatio(qualityPixelRatio(next)),
          teleportToRoom: (roomId) => {
            const room = roomAreas.find((entry) => entry.id === roomId);
            if (!room) return;
            // The plan's second axis is the world's z; walk outward from the centre
            // until the spot isn't inside a wall.
            for (const radius of [0, 0.4, 0.8, 1.2]) {
              for (const angle of [0, 1, 2, 3, 4, 5]) {
                const probe = new THREE.Vector3(
                  room.center[0] + Math.cos(angle) * radius,
                  EYE_HEIGHT,
                  room.center[1] + Math.sin(angle) * radius,
                );
                if (!blocked(probe)) {
                  camera.position.copy(probe);
                  view.yaw = Math.atan2(center.x - probe.x, center.z - probe.z);
                  view.pitch = -0.05;
                  return;
                }
              }
            }
          },
          reset: () => {
            camera.position.set(spawn.position[0], EYE_HEIGHT, spawn.position[2]);
            view.yaw = spawn.yaw;
            view.pitch = -0.05;
          },
        };

        setStatus("ready");
        // Give the embedded textures a moment to decode before the still is taken.
        if (stillRef.current) stillAt = performance.now() + 2500;
        animate();
      })
      .catch((error) => {
        if (disposed) return;
        setStatus("failed");
        setMessage(error.message || "The finished world could not be opened.");
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      runtimeRef.current = null;
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      renderer.dispose();
      environment.dispose();
      renderer.domElement.remove();
    };
    // Rebuilding on an option change would re-download the world; the runtime
    // setters apply them instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glbUrl, collisionUrl]);

  useEffect(() => {
    runtimeRef.current?.setLighting(lighting);
  }, [lighting]);

  useEffect(() => {
    runtimeRef.current?.setFurnitureVisible(furnitureVisible);
  }, [furnitureVisible]);

  useEffect(() => {
    runtimeRef.current?.setCeilingVisible(ceilingVisible);
  }, [ceilingVisible]);

  useEffect(() => {
    runtimeRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    stillRef.current = onStill;
  }, [onStill]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);


  const toggleFullscreen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void panel.requestFullscreen();
    }
  }, []);

  return (
    <div
      ref={panelRef}
      className={`relative overflow-hidden bg-[#2f3423] ${className}`}
      data-testid="delivered-world"
    >
      <div ref={mountRef} className="absolute inset-0" />

      {/* The hero's datum lines and paper grain, laid over the scene. */}
      <div className="grid-lines pointer-events-none absolute inset-0 z-[5]" aria-hidden="true" />
      <div
        className="paper-grain pointer-events-none absolute inset-0 z-[5] opacity-80 mix-blend-soft-light"
        aria-hidden="true"
      />

      {status === "loading" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 font-body text-[11px] text-[#f0f1e6]/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a8cebc]" aria-hidden="true" />
          Opening your world…
        </div>
      )}

      {status === "failed" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-body text-[12px] text-[#f0f1e6]">This world could not be opened.</p>
          <p className="max-w-[420px] font-body text-[10.5px] leading-5 text-[#f0f1e6]/55">{message}</p>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            <button
              type="button"
              className={hudIcon}
              aria-label="Walkthrough settings"
              aria-pressed={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.3" />
                <path
                  d="M10 2.4v2.1M10 15.5v2.1M17.6 10h-2.1M4.5 10H2.4M15.4 4.6l-1.5 1.5M6.1 13.9l-1.5 1.5M15.4 15.4l-1.5-1.5M6.1 6.1 4.6 4.6"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className={hudIcon}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              onClick={toggleFullscreen}
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                {fullscreen ? (
                  <path
                    d="M3.4 7.6h4.2V3.4M16.6 7.6h-4.2V3.4M3.4 12.4h4.2v4.2M16.6 12.4h-4.2v4.2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <path
                    d="M7.6 3.4H3.4v4.2M12.4 3.4h4.2v4.2M7.6 16.6H3.4v-4.2M12.4 16.6h4.2v-4.2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </svg>
            </button>
          </div>

          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            {rooms.length > 0 && (
              <select
                value=""
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (Number.isFinite(id)) runtimeRef.current?.teleportToRoom(id);
                  event.currentTarget.selectedIndex = 0;
                }}
                aria-label="Go to room"
                className="max-w-[13rem] rounded-full border border-white/12 bg-[#111713]/80 px-3 py-1.5 font-body text-[11px] text-[#f0f1e6]/85 outline-none backdrop-blur transition hover:border-white/25"
              >
                <option value="">Go to room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name || `Room ${room.id + 1}`}
                    {room.area_m2 != null ? ` · ${Number(room.area_m2).toFixed(0)} m²` : ""}
                  </option>
                ))}
              </select>
            )}
            <button type="button" className={hudIcon} aria-label="Reset view" onClick={() => runtimeRef.current?.reset()}>
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M15.6 8.2A5.8 5.8 0 1 0 10 15.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M16.2 4.2v4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {menuOpen && (
            <div className="absolute right-3 top-14 z-20 w-[min(19rem,calc(100%-1.5rem))] rounded-[14px] border border-white/10 bg-[#111713]/94 p-3.5 backdrop-blur">
              <p className="px-1 pb-2.5 font-body text-[9px] uppercase tracking-[0.2em] text-[#f0f1e6]/35">Lighting</p>
              <div className="flex overflow-hidden rounded-full border border-white/12">
                {LIGHTING_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLighting(option.value)}
                    aria-pressed={lighting === option.value}
                    className={`flex-1 px-2 py-1.5 font-body text-[10.5px] transition-colors ${
                      lighting === option.value
                        ? "bg-[#b3914e]/25 text-[#f0f1e6]"
                        : "text-[#f0f1e6]/50 hover:text-[#f0f1e6]/85"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" className={hudPill} aria-pressed={furnitureVisible} onClick={() => setFurnitureVisible((v) => !v)}>
                  {furnitureVisible ? "Furniture on" : "Furniture off"}
                </button>
                <button type="button" className={hudPill} aria-pressed={ceilingVisible} onClick={() => setCeilingVisible((v) => !v)}>
                  {ceilingVisible ? "Ceiling on" : "Ceiling off"}
                </button>
              </div>
              <label className="mt-3 flex items-center justify-between gap-2 rounded-full border border-white/12 bg-[#111713]/80 px-3.5 py-2 font-body text-[10.5px] text-[#f0f1e6]/50">
                <span>Quality</span>
                <select
                  value={quality}
                  onChange={(event) => setQuality(event.target.value as Quality)}
                  aria-label="Rendering quality"
                  className="bg-transparent font-body text-[10.5px] text-[#f0f1e6] outline-none"
                >
                  {QUALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#111713]/75 px-3.5 py-1.5 font-body text-[10.5px] text-[#f0f1e6]/80">
            {locked
              ? "Move the mouse to look · WASD to walk · Esc to release"
              : "Click the scene to look around · WASD to walk"}
          </p>
        </>
      )}
    </div>
  );
}

export default DeliveredWorld;
