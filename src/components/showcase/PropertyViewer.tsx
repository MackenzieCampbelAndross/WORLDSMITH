"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildWorld, DEFAULT_VIEWS, ROOMS, SPAWN, SUN_DIRECTION } from "./scene";

export type ViewMode = "overview" | "dollhouse" | "fpp" | "tpp";

interface PropertyViewerProps {
  reducedMotion: boolean;
  onReady: () => void;
}

const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.32;
const MOVE_SPEED = 2.2;

interface Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  player: { x: number; z: number; yaw: number; pitch: number };
  keys: Set<string>;
  mode: ViewMode;
  roofOn: boolean;
  tween: { from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number } | null;
  joy: { active: boolean; dx: number; dy: number };
  lookTouch: { id: number | null; x: number; y: number };
  collidesAt?: (x: number, z: number) => boolean;
  step?: (dt: number) => void;
}

export default function PropertyViewer({ reducedMotion, onReady }: PropertyViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const worldRef = useRef<ReturnType<typeof buildWorld> | null>(null);
  const [mode, setMode] = useState<ViewMode>("overview");
  const [roofOn, setRoofOn] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [locked, setLocked] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [webglOk] = useState(() => {
    try {
      const probe = document.createElement("canvas");
      return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    } catch {
      return false;
    }
  });
  const [isTouch] = useState(
    () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  const rooms = ROOMS;

  // ------------------------------------------------------------------
  // Engine bootstrap (once)
  // ------------------------------------------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !webglOk) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (err) {
      console.warn("WebGL context creation failed", err);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.66;
    mount.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
    renderer.domElement.tabIndex = 0;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc9d4d8, 130, 420);

    // Image-based lighting for believable PBR response
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.6;

    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 4000);
    camera.position.copy(DEFAULT_VIEWS.overview.pos);

    const hemi = new THREE.HemisphereLight(0xdfe9e2, 0x3a443c, 0.5);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffeecf, 3.6);
    sun.position.copy(SUN_DIRECTION).multiplyScalar(80);
    sun.castShadow = true;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    sun.shadow.mapSize.set(coarse ? 2048 : 4096, coarse ? 2048 : 4096);
    sun.shadow.camera.left = -34;
    sun.shadow.camera.right = 34;
    sun.shadow.camera.top = 36;
    sun.shadow.camera.bottom = -36;
    sun.shadow.camera.far = 220;
    sun.shadow.bias = -0.00035;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 2.5;
    scene.add(sun);
    scene.add(sun.target);

    const world = buildWorld();
    worldRef.current = world;
    scene.add(world.root);
    world.roofGroup.visible = true;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.copy(DEFAULT_VIEWS.overview.target);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.maxPolarAngle = Math.PI / 2 - 0.03;
    orbit.minDistance = 3;
    orbit.maxDistance = 90;
    orbit.update();

    const engine: Engine = {
      renderer, scene, camera, orbit,
      player: { x: SPAWN[0], z: SPAWN[1], yaw: Math.PI, pitch: 0 },
      keys: new Set(),
      mode: "overview",
      roofOn: true,
      tween: null,
      joy: { active: false, dx: 0, dy: 0 },
      lookTouch: { id: null, x: 0, y: 0 },
    };
    engineRef.current = engine;

    // --------------------------------------------------------------
    // Input
    // --------------------------------------------------------------
    const MOVE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (engine.mode !== "fpp" && engine.mode !== "tpp") return;
      if (MOVE_KEYS.includes(e.code)) {
        e.preventDefault(); // no page scroll while the viewer drives movement
        engine.keys.add(e.code);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => engine.keys.delete(e.code);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    const onPointerLockMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      if (engine.mode !== "fpp" && engine.mode !== "tpp") return;
      engine.player.yaw -= e.movementX * 0.0022;
      engine.player.pitch = Math.max(-1.45, Math.min(1.45, engine.player.pitch - e.movementY * 0.0022));
    };
    const onLockChange = () => setLocked(document.pointerLockElement === renderer.domElement);
    document.addEventListener("mousemove", onPointerLockMove);
    document.addEventListener("pointerlockchange", onLockChange);

    const el = renderer.domElement;
    const onCanvasDown = () => {
      if ((engine.mode === "fpp" || engine.mode === "tpp") && !isTouch && document.pointerLockElement !== el) {
        el.requestPointerLock?.();
      }
    };
    el.addEventListener("mousedown", onCanvasDown);

    // Touch: left half joystick, right half look
    const onTouchStart = (e: TouchEvent) => {
      if (engine.mode !== "fpp" && engine.mode !== "tpp") return;
      for (const t of Array.from(e.changedTouches)) {
        const rect = el.getBoundingClientRect();
        const relX = (t.clientX - rect.left) / rect.width;
        if (relX < 0.5 && !engine.joy.active) {
          engine.joy.active = true;
          engine.joy.dx = 0;
          engine.joy.dy = 0;
          (engine as unknown as { joyId: number }).joyId = t.identifier;
          el.dispatchEvent(new CustomEvent("showjoy", { detail: { x: t.clientX, y: t.clientY } }));
        } else if (engine.lookTouch.id === null) {
          engine.lookTouch.id = t.identifier;
          engine.lookTouch.x = t.clientX;
          engine.lookTouch.y = t.clientY;
        }
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (engine.mode !== "fpp" && engine.mode !== "tpp") return;
      e.preventDefault();
      const joyId = (engine as unknown as { joyId?: number }).joyId ?? -1;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId && engine.joy.active) {
          const rect = el.getBoundingClientRect();
          const startX = rect.left + rect.width * 0.22;
          const startY = rect.top + rect.height * 0.72;
          engine.joy.dx = Math.max(-1, Math.min(1, (t.clientX - startX) / 60));
          engine.joy.dy = Math.max(-1, Math.min(1, (t.clientY - startY) / 60));
          el.dispatchEvent(new CustomEvent("movejoy", { detail: { x: t.clientX, y: t.clientY } }));
        } else if (t.identifier === engine.lookTouch.id) {
          engine.player.yaw -= (t.clientX - engine.lookTouch.x) * 0.0045;
          engine.player.pitch = Math.max(-1.45, Math.min(1.45, engine.player.pitch - (t.clientY - engine.lookTouch.y) * 0.0045));
          engine.lookTouch.x = t.clientX;
          engine.lookTouch.y = t.clientY;
        }
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      const joyId = (engine as unknown as { joyId?: number }).joyId ?? -1;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyId) {
          engine.joy.active = false;
          engine.joy.dx = 0;
          engine.joy.dy = 0;
          el.dispatchEvent(new CustomEvent("hidejoy"));
        }
        if (t.identifier === engine.lookTouch.id) engine.lookTouch.id = null;
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    // --------------------------------------------------------------
    // Resize + loop
    // --------------------------------------------------------------
    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const clock = new THREE.Timer();
    const playerBox = new THREE.Box3();
    const tppCam = new THREE.Vector3();
    let raf = 0;

    const collides = (x: number, z: number) => {
      playerBox.min.set(x - PLAYER_RADIUS, 0.3, z - PLAYER_RADIUS);
      playerBox.max.set(x + PLAYER_RADIUS, 1.9, z + PLAYER_RADIUS);
      for (const c of world.colliders) if (playerBox.intersectsBox(c)) return true;
      return false;
    };
    if (process.env.NODE_ENV !== "production") {
      engine.collidesAt = collides;
      (window as unknown as { __wsEngine?: Engine }).__wsEngine = engine;
    }
    const camInside = (px: number, py: number, pz: number) => {
      for (const c of world.colliders) {
        if (px > c.min.x && px < c.max.x && pz > c.min.z && pz < c.max.z && py > c.min.y && py < c.max.y) return true;
      }
      return false;
    };

    const step = (dt: number) => {
      world.update(dt);

      if (engine.tween) {
        const tw = engine.tween;
        tw.t = reducedMotion ? 1 : Math.min(1, tw.t + dt / 0.9);
        const k = 1 - Math.pow(1 - tw.t, 3);
        camera.position.lerpVectors(tw.from, tw.to, k);
        orbit.target.lerpVectors(tw.fromT, tw.toT, k);
        if (tw.t >= 1) engine.tween = null;
        orbit.update();
      } else if (engine.mode === "fpp" || engine.mode === "tpp") {
        const p = engine.player;
        const fwd = new THREE.Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        let mx = 0, mz = 0;
        if (engine.keys.has("ArrowUp") || engine.keys.has("KeyW")) mz += 1;
        if (engine.keys.has("ArrowDown") || engine.keys.has("KeyS")) mz -= 1;
        if (engine.keys.has("ArrowLeft") || engine.keys.has("KeyA")) mx -= 1;
        if (engine.keys.has("ArrowRight") || engine.keys.has("KeyD")) mx += 1;
        if (engine.joy.active) {
          mz -= engine.joy.dy;
          mx += engine.joy.dx;
        }
        const len = Math.hypot(mx, mz);
        let moving = 0;
        if (len > 0.01) {
          const stepLen = MOVE_SPEED * dt;
          const nx = p.x + (fwd.x * mz + right.x * mx) * (stepLen / Math.max(len, 1));
          const nz = p.z + (fwd.z * mz + right.z * mx) * (stepLen / Math.max(len, 1));
          if (!collides(nx, p.z)) p.x = nx;
          if (!collides(p.x, nz)) p.z = nz;
          moving = Math.min(1, len);
        }
        world.avatar.setWalk(moving);

        if (engine.mode === "fpp") {
          const baseY = world.floorAt(p.x, p.z);
          camera.position.set(p.x, baseY + EYE_HEIGHT, p.z);
          camera.quaternion.setFromEuler(new THREE.Euler(p.pitch, p.yaw, 0, "YXZ"));
          world.avatar.group.visible = false;
        } else {
          const baseY = world.floorAt(p.x, p.z);
          world.avatar.group.visible = true;
          world.avatar.group.position.set(p.x, baseY, p.z);
          world.avatar.group.rotation.y = p.yaw + Math.PI;
          // follow camera behind the avatar; pull in when a wall blocks the view
          const wantDist = 4.0;
          const camY = baseY + 2.45 - p.pitch * 1.2;
          let dist = wantDist;
          for (let i = 1; i <= 9; i++) {
            const t = (i / 9) * wantDist;
            if (camInside(p.x - fwd.x * t, camY, p.z - fwd.z * t)) {
              dist = Math.max(0.9, t - 0.4);
              break;
            }
          }
          tppCam.set(p.x - fwd.x * dist, Math.max(baseY + 0.75, camY), p.z - fwd.z * dist);
          camera.position.lerp(tppCam, reducedMotion ? 1 : Math.min(1, dt * 8));
          camera.lookAt(p.x + fwd.x * 1.2, baseY + 1.2 - p.pitch * 1.4, p.z + fwd.z * 1.2);
        }
      } else {
        world.avatar.group.visible = false;
        orbit.update();
      }
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      clock.update();
      const dt = Math.min(clock.getDelta(), 0.05);
      step(dt);
      renderer.render(scene, camera);
    };
    if (process.env.NODE_ENV !== "production") engine.step = step;
    tick();
    onReady();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onPointerLockMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      el.removeEventListener("mousedown", onCanvasDown);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      if (document.pointerLockElement === el) document.exitPointerLock();
      orbit.dispose();
      envTex.dispose();
      pmrem.dispose();
      world.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      engineRef.current = null;
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Mode switching
  // ------------------------------------------------------------------
  const applyMode = useCallback((next: ViewMode) => {
    const engine = engineRef.current;
    const world = worldRef.current;
    if (!engine || !world) return;
    const wasWalking = engine.mode === "fpp" || engine.mode === "tpp";
    const isWalking = next === "fpp" || next === "tpp";
    engine.mode = next;
    setMode(next);
    setSelectedRoom("");
    const el = engine.renderer.domElement;

    if (isWalking) {
      engine.orbit.enabled = false;
      if (!wasWalking) {
        engine.player.x = SPAWN[0];
        engine.player.z = SPAWN[1];
        engine.player.yaw = Math.PI;
        engine.player.pitch = 0;
      }
      world.roofGroup.visible = true;
      engine.roofOn = true;
      setRoofOn(true);
      setShowHelp(true);
    } else {
      if (document.pointerLockElement === el) document.exitPointerLock();
      world.avatar.group.visible = false;
      engine.orbit.enabled = true;
      const view = next === "overview" ? DEFAULT_VIEWS.overview : DEFAULT_VIEWS.dollhouse;
      engine.tween = {
        from: engine.camera.position.clone(),
        to: view.pos.clone(),
        fromT: engine.orbit.target.clone(),
        toT: view.target.clone(),
        t: 0,
      };
      engine.roofOn = next === "overview";
      setRoofOn(next === "overview");
      world.roofGroup.visible = next === "overview";
      setShowHelp(false);
    }
  }, []);

  const toggleRoof = useCallback(() => {
    const world = worldRef.current;
    const engine = engineRef.current;
    if (!world || !engine || engine.mode === "fpp" || engine.mode === "tpp") return;
    setRoofOn((prev) => {
      const next = !prev;
      engine.roofOn = next;
      world.roofGroup.visible = next;
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.mode === "fpp" || engine.mode === "tpp") {
      engine.player.x = SPAWN[0];
      engine.player.z = SPAWN[1];
      engine.player.yaw = Math.PI;
      engine.player.pitch = 0;
    } else {
      const view = engine.mode === "overview" ? DEFAULT_VIEWS.overview : DEFAULT_VIEWS.dollhouse;
      engine.tween = {
        from: engine.camera.position.clone(),
        to: view.pos.clone(),
        fromT: engine.orbit.target.clone(),
        toT: view.target.clone(),
        t: 0,
      };
    }
  }, []);

  const selectRoom = useCallback((id: string) => {
    const engine = engineRef.current;
    const world = worldRef.current;
    if (!engine || !world || !id) return;
    setSelectedRoom(id);
    const room = world.rooms.find((r) => r.id === id);
    if (!room) return;
    if (engine.mode === "fpp" || engine.mode === "tpp") {
      const [x, z] = room.anchor;
      const box = new THREE.Box3();
      const clear = (px: number, pz: number) => {
        box.min.set(px - PLAYER_RADIUS, 0.3, pz - PLAYER_RADIUS);
        box.max.set(px + PLAYER_RADIUS, 1.9, pz + PLAYER_RADIUS);
        return !world.colliders.some((c) => box.intersectsBox(c));
      };
      const candidates: Array<[number, number]> = [
        [x, z], [x + 0.6, z], [x - 0.6, z], [x, z + 0.6], [x, z - 0.6],
      ];
      const spot = candidates.find(([cx, cz]) => clear(cx, cz)) ?? [x, z];
      engine.player.x = spot[0];
      engine.player.z = spot[1];
      engine.player.yaw = Math.atan2(spot[0], spot[1] + 0.001) + Math.PI;
      engine.player.pitch = 0;
    } else {
      engine.tween = {
        from: engine.camera.position.clone(),
        to: new THREE.Vector3(...room.view.pos),
        fromT: engine.orbit.target.clone(),
        toT: new THREE.Vector3(...room.view.target),
        t: 0,
      };
    }
  }, []);

  // Auto-hide the instruction overlay
  useEffect(() => {
    if (!showHelp) return;
    const t = setTimeout(() => setShowHelp(false), 8000);
    return () => clearTimeout(t);
  }, [showHelp]);

  // ------------------------------------------------------------------
  // Mobile joystick visual
  // ------------------------------------------------------------------
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const engine = engineRef.current;
    const el = engine?.renderer.domElement;
    if (!el) return;
    const show = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const rect = el.getBoundingClientRect();
      if (joyRef.current) {
        joyRef.current.style.display = "block";
        joyRef.current.style.left = `${d.x - rect.left - 55}px`;
        joyRef.current.style.top = `${d.y - rect.top - 55}px`;
      }
    };
    const move = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (knobRef.current && joyRef.current) {
        const rect = el.getBoundingClientRect();
        const cx = parseFloat(joyRef.current.style.left) + 55;
        const cy = parseFloat(joyRef.current.style.top) + 55;
        const dx = Math.max(-40, Math.min(40, d.x - rect.left - cx));
        const dy = Math.max(-40, Math.min(40, d.y - rect.top - cy));
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };
    const hide = () => {
      if (joyRef.current) joyRef.current.style.display = "none";
      if (knobRef.current) knobRef.current.style.transform = "translate(0px, 0px)";
    };
    el.addEventListener("showjoy", show);
    el.addEventListener("movejoy", move);
    el.addEventListener("hidejoy", hide);
    return () => {
      el.removeEventListener("showjoy", show);
      el.removeEventListener("movejoy", move);
      el.removeEventListener("hidejoy", hide);
    };
  }, [webglOk]);

  if (!webglOk) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121212] text-[#F0EDE3] font-body px-8 text-center">
        <p className="font-display text-lg tracking-[0.18em] text-[#B5D5C5] mb-3">WORLDSMITH</p>
        <p className="text-sm text-[#F0EDE3]/70 max-w-md leading-relaxed">
          Your browser does not support WebGL, which is required for the interactive villa experience.
          Please try a modern desktop browser, or contact our studio for a guided presentation.
        </p>
      </div>
    );
  }

  const walking = mode === "fpp" || mode === "tpp";
  const modeBtn = (m: ViewMode, label: string) => (
    <button
      type="button"
      onClick={() => applyMode(m)}
      className={`px-2.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 font-display ${
        mode === m ? "bg-[#B5D5C5] text-[#121212]" : "bg-[#121212]/10 text-[#F0EDE3]/75 hover:bg-[#F0EDE3]/20"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-stage className="relative w-full h-full bg-[#121212]">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex gap-1 p-1 rounded-full bg-[#121212]/70 backdrop-blur-sm pointer-events-auto">
          {modeBtn("overview", "Overview")}
          {modeBtn("dollhouse", "Dollhouse")}
          {modeBtn("fpp", "FPP")}
          {modeBtn("tpp", "TPP")}
        </div>
        <div className="ml-auto flex items-center gap-2 pointer-events-auto">
          {!walking && (
            <button
              type="button"
              onClick={toggleRoof}
              className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase font-display bg-[#121212]/70 backdrop-blur-sm text-[#F0EDE3]/75 hover:text-[#F0EDE3] transition-colors"
            >
              {roofOn ? "Hide Roof" : "Show Roof"}
            </button>
          )}
          <select
            aria-label="Jump to room"
            value={selectedRoom}
            onChange={(e) => selectRoom(e.target.value)}
            className="max-w-[9.5rem] px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium font-body bg-[#121212]/70 backdrop-blur-sm text-[#F0EDE3]/85 border border-[#F0EDE3]/15 focus:outline-none focus:border-[#B5D5C5]/60"
          >
            <option value="">Select room…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={resetView}
            className="px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase font-display bg-[#121212]/70 backdrop-blur-sm text-[#F0EDE3]/75 hover:text-[#F0EDE3] transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-label="Controls help"
            className="w-8 h-8 rounded-full bg-[#121212]/70 backdrop-blur-sm text-[#B5D5C5] text-sm font-display font-semibold hover:text-[#F0EDE3] transition-colors"
          >
            ?
          </button>
        </div>
      </div>

      {/* Instructions overlay */}
      {walking && showHelp && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          {!isTouch && !locked && (
            <p className="px-4 py-2 rounded-full bg-[#121212]/85 backdrop-blur-sm text-[#B5D5C5] text-[11px] font-body font-semibold tracking-[0.12em] uppercase">
              Click inside the experience to look around
            </p>
          )}
          <p className="px-4 py-2 rounded-full bg-[#121212]/85 backdrop-blur-sm text-[#F0EDE3]/85 text-[10px] sm:text-[11px] font-body tracking-[0.06em] text-center">
            <span className="font-display font-semibold text-[#B5D5C5]">MOVE</span> — WASD / Arrow Keys
            {"   "}
            <span className="font-display font-semibold text-[#B5D5C5]">LOOK</span> — Mouse
            {"   "}
            <span className="font-display font-semibold text-[#B5D5C5]">EXIT MOUSE LOOK</span> — Esc
          </p>
        </div>
      )}

      {/* Mobile joystick visual */}
      <div
        ref={joyRef}
        style={{ display: "none" }}
        className="absolute w-[110px] h-[110px] rounded-full border-2 border-[#B5D5C5]/50 bg-[#121212]/40 pointer-events-none"
      >
        <div ref={knobRef} className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-[#B5D5C5]/80" />
      </div>
    </div>
  );
}
