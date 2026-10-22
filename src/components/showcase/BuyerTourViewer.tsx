"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { buildWorld, SUN_DIRECTION } from "./scene";
import { TOUR_VIEWS, type TourViewId } from "./tourViews";
import { addTourStaging } from "./tourStaging";

RectAreaLightUniformsLib.init();

const EYE_HEIGHT = 1.62;

interface Look {
  yaw: number;
  pitch: number;
}

interface Transition {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromYaw: number;
  toYaw: number;
  fromPitch: number;
  toPitch: number;
  t: number;
  duration: number;
  startedAt: number;
  blocked: boolean;
}

interface Engine {
  goTo: (id: TourViewId) => void;
  dispose: () => void;
}

interface Props {
  view: TourViewId;
  onReady?: () => void;
  onLook?: () => void;
}

const shortestAngle = (from: number, to: number) => {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function BuyerTourViewer({ view, onReady, onLook }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const viewRef = useRef<TourViewId>(view);
  const onReadyRef = useRef(onReady);
  const onLookRef = useRef(onLook);

  useEffect(() => {
    onReadyRef.current = onReady;
    onLookRef.current = onLook;
  }, [onReady, onLook]);

  useEffect(() => {
    viewRef.current = view;
    engineRef.current?.goTo(view);
  }, [view]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.35 : 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    const canvas = renderer.domElement;
    Object.assign(canvas.style, {
      display: "block",
      width: "100%",
      height: "100%",
      cursor: "grab",
      touchAction: "pan-y",
      userSelect: "none",
    });
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Interactive interior of Casa Verdant. Drag to look around.");
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd8c3a4, 110, 380);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.09;

    const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 5000);

    const hemi = new THREE.HemisphereLight(0xfff2df, 0x35402f, 0.16);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffd2a2, 1.7);
    sun.position.copy(SUN_DIRECTION).multiplyScalar(80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    sun.shadow.camera.far = 220;
    sun.shadow.bias = -0.00035;
    sun.shadow.normalBias = 0.025;
    scene.add(sun);
    scene.add(sun.target);

    const world = buildWorld();
    scene.add(world.root);
    world.roofGroup.visible = true;
    world.avatar.group.visible = false;

    world.root.traverse((object) => {
      if (object instanceof THREE.PointLight) {
        object.intensity *= 0.08;
        object.castShadow = false;
      }
    });

    const removeStaging = addTourStaging(world.root);

    const windowLights = [
      new THREE.RectAreaLight(0xffead0, 0, 3, 2.5),
      new THREE.RectAreaLight(0xffe4c3, 0, 3, 2.5),
    ];
    for (const light of windowLights) {
      light.visible = false;
      scene.add(light);
    }

    // A single warm key aimed through the room's main window. The existing
    // sun never reaches the interiors, so this supplies the architectural
    // sun patch and shadows without flattening the room.
    const keyLight = new THREE.SpotLight(0xffcf9e, 0, 30, 0.58, 0.78, 1.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.02;
    keyLight.visible = false;
    scene.add(keyLight);
    scene.add(keyLight.target);

    const configureWindows = (id: TourViewId) => {
      const def = TOUR_VIEWS[id];
      windowLights.forEach((light, index) => {
        const win = def.windows[index];
        if (!win) {
          light.intensity = 0;
          light.visible = false;
          return;
        }
        light.visible = true;
        light.position.set(...win.position);
        light.lookAt(new THREE.Vector3(...win.target));
        light.width = win.width;
        light.height = win.height;
        light.color.set(win.color ?? 0xffead0);
        light.intensity = win.intensity * 0.55;
      });

      const main = def.windows[0];
      if (main) {
        const target = new THREE.Vector3(...main.target);
        const outward = new THREE.Vector3(...main.position).sub(target);
        outward.y = 0;
        outward.normalize();
        keyLight.position.copy(new THREE.Vector3(...main.position)).addScaledVector(outward, 3.0);
        keyLight.position.y = main.position[1] + 0.25;
        keyLight.target.position.set(target.x, 0.35, target.z);
        keyLight.target.updateMatrixWorld();
        keyLight.angle = 0.58;
        keyLight.penumbra = 0.82;
        keyLight.intensity = 280;
        keyLight.visible = true;
      } else {
        keyLight.visible = false;
      }
    };

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(new OutputPass());

    const looks: Partial<Record<TourViewId, Look>> = {};
    let currentId: TourViewId | null = null;
    let yaw = 0;
    let pitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let transition: Transition | null = null;
    let dragging = false;
    let dragX = 0;
    let dragY = 0;
    let dragPointer: number | null = null;
    let dragMoved = false;
    let visible = true;
    let readyCalled = false;

    const defaultLookFor = (id: TourViewId, position: THREE.Vector3): Look => {
      const def = TOUR_VIEWS[id];
      const target = new THREE.Vector3(...def.target);
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const dy = target.y - position.y;
      return {
        yaw: Math.atan2(-dx, -dz),
        pitch: Math.atan2(dy, Math.hypot(dx, dz)),
      };
    };

    const destinationFor = (id: TourViewId) => {
      const def = TOUR_VIEWS[id];
      const position = new THREE.Vector3(
        def.eye[0],
        world.floorAt(def.eye[0], def.eye[1]) + EYE_HEIGHT,
        def.eye[1]
      );
      return { position, look: looks[id] ?? defaultLookFor(id, position) };
    };

    const pathBlocked = (from: THREE.Vector3, to: THREE.Vector3) => {
      const steps = 30;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = from.x + (to.x - from.x) * t;
        const z = from.z + (to.z - from.z) * t;
        for (const c of world.colliders) {
          if (x > c.min.x && x < c.max.x && z > c.min.z && z < c.max.z && 1.55 > c.min.y && 1.55 < c.max.y) {
            return true;
          }
        }
      }
      return false;
    };

    const applyCamera = () => {
      camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    };

    const goTo = (id: TourViewId, immediate = false) => {
      if (!immediate && id === currentId && !transition) return;
      const def = TOUR_VIEWS[id];
      if (currentId) looks[currentId] = { yaw: targetYaw, pitch: targetPitch };

      const destination = destinationFor(id);
      if (immediate) {
        camera.position.copy(destination.position);
        yaw = targetYaw = destination.look.yaw;
        pitch = targetPitch = destination.look.pitch;
        applyCamera();
        currentId = id;
        configureWindows(id);
        renderer.toneMappingExposure = (def.exposure ?? 1.02) * 0.8;
        return;
      }

      const blocked = pathBlocked(camera.position, destination.position);
      transition = {
        fromPos: camera.position.clone(),
        toPos: destination.position,
        fromYaw: targetYaw,
        toYaw: shortestAngle(targetYaw, destination.look.yaw),
        fromPitch: targetPitch,
        toPitch: destination.look.pitch,
        t: 0,
        duration: blocked ? 1.32 : 1.08,
        startedAt: performance.now(),
        blocked,
      };
      currentId = id;
      configureWindows(id);
      renderer.toneMappingExposure = (def.exposure ?? 1.02) * 0.8;
    };

    const resize = () => {
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 1 ? 60 : 48;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || transition) return;
      dragging = true;
      dragMoved = false;
      dragPointer = event.pointerId;
      dragX = event.clientX;
      dragY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      canvas.focus({ preventScroll: true });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== dragPointer || transition) return;
      const dx = event.clientX - dragX;
      const dy = event.clientY - dragY;
      dragX = event.clientX;
      dragY = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 1) {
        dragMoved = true;
        onLookRef.current?.();
      }
      targetYaw -= dx * (event.pointerType === "touch" ? 0.006 : 0.0042);
      if (event.pointerType !== "touch") {
        targetPitch = Math.max(-0.52, Math.min(0.52, targetPitch - dy * 0.0032));
      }
    };

    const endDrag = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== dragPointer) return;
      dragging = false;
      dragPointer = null;
      canvas.style.cursor = "grab";
      if (dragMoved && currentId) looks[currentId] = { yaw: targetYaw, pitch: targetPitch };
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const amount = 0.08;
        if (event.key === "ArrowLeft") targetYaw += amount;
        if (event.key === "ArrowRight") targetYaw -= amount;
        if (event.key === "ArrowUp") targetPitch = Math.min(0.52, targetPitch + amount * 0.7);
        if (event.key === "ArrowDown") targetPitch = Math.max(-0.52, targetPitch - amount * 0.7);
        if (currentId) looks[currentId] = { yaw: targetYaw, pitch: targetPitch };
        onLookRef.current?.();
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("keydown", onKeyDown);

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
      },
      { rootMargin: "240px 0px" }
    );
    intersection.observe(mount);

    const start = viewRef.current;
    goTo(start, true);

    const clock = new THREE.Timer();
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      clock.update();
      const rawDt = Math.min(clock.getDelta(), 0.1);
      const dt = Math.min(rawDt, 0.05);
      if (!visible) return;

      world.update(dt);

      if (transition) {
        const tr = transition;
        tr.t = Math.min(1, (performance.now() - tr.startedAt) / (tr.duration * 1000));
        const eased = easeInOutCubic(tr.t);
        camera.position.lerpVectors(tr.fromPos, tr.toPos, eased);
        yaw = tr.fromYaw + (tr.toYaw - tr.fromYaw) * eased;
        pitch = tr.fromPitch + (tr.toPitch - tr.fromPitch) * eased;
        targetYaw = yaw;
        targetPitch = pitch;
        applyCamera();
        if (veilRef.current) {
          veilRef.current.style.opacity = tr.blocked ? `${Math.sin(Math.PI * tr.t) * 0.92}` : "0";
        }
        if (tr.t >= 1) {
          transition = null;
          if (currentId) looks[currentId] = { yaw, pitch };
          if (veilRef.current) veilRef.current.style.opacity = "0";
        }
      } else {
        const k = Math.min(1, rawDt * 15);
        yaw += (targetYaw - yaw) * k;
        pitch += (targetPitch - pitch) * k;
        applyCamera();
      }

      composer.render();

      if (!readyCalled) {
        readyCalled = true;
        onReadyRef.current?.();
      }
    };
    tick();

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __tour?: unknown }).__tour = {
        renderer,
        scene,
        camera,
        world,
        THREE,
        sun,
        hemi,
        windowLights,
        keyLight,
        goTo,
        setLook: (nextYaw: number, nextPitch: number) => {
          targetYaw = nextYaw;
          targetPitch = nextPitch;
          looks[currentId ?? "living"] = { yaw: nextYaw, pitch: nextPitch };
        },
        currentId: () => currentId,
      };
    }

    const engine: Engine = {
      goTo: (id) => goTo(id),
      dispose: () => {
        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        intersection.disconnect();
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", endDrag);
        canvas.removeEventListener("pointercancel", endDrag);
        canvas.removeEventListener("keydown", onKeyDown);
        removeStaging();
        composer.dispose();
        envTex.dispose();
        pmrem.dispose();
        world.dispose();
        renderer.dispose();
        if (canvas.parentElement === mount) mount.removeChild(canvas);
      },
    };
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a1b14]">
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{ filter: "contrast(1.07) saturate(1.06) brightness(0.99)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgba(5,18,13,0.36)_100%)]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 paper-grain opacity-[0.05] mix-blend-soft-light" aria-hidden="true" />
      <div
        ref={veilRef}
        className="pointer-events-none absolute inset-0 bg-[#0b2119] opacity-0"
        aria-hidden="true"
      />
    </div>
  );
}
