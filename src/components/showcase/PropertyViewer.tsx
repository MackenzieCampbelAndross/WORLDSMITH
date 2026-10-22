"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildWorld, DEFAULT_VIEWS, ROOMS } from "./scene";

export type ViewMode = "overview" | "dollhouse" | "explore";

interface PropertyViewerProps {
  reducedMotion: boolean;
  onReady: () => void;
}

const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.35;
const MOVE_SPEED = 3.2; // m/s

interface Engine {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  orbit: OrbitControls;
  yaw: number;
  pitch: number;
  keys: Set<string>;
  mode: ViewMode;
  roofOn: boolean;
  tween: { from: THREE.Vector3; to: THREE.Vector3; fromT: THREE.Vector3; toT: THREE.Vector3; t: number } | null;
  joy: { active: boolean; dx: number; dy: number };
  lookTouch: { id: number | null; x: number; y: number };
  collidesAt?: (x: number, z: number) => boolean;
}

export default function PropertyViewer({ reducedMotion, onReady }: PropertyViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const worldRef = useRef<ReturnType<typeof buildWorld> | null>(null);
  const [mode, setMode] = useState<ViewMode>("overview");
  const [roofOn, setRoofOn] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [locked, setLocked] = useState(false);
  const [webglOk] = useState(() => {
    try {
      const probe = document.createElement("canvas");
      return !!(probe.getContext("webgl2") || probe.getContext("webgl"));
    } catch {
      return false;
    }
  });
  const [isTouch] = useState(() => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0));

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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.tabIndex = 0;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101512);
    scene.fog = new THREE.Fog(0x101512, 90, 190);

    const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 400);
    camera.position.copy(DEFAULT_VIEWS.overview.pos);

    // Sky + sun
    const hemi = new THREE.HemisphereLight(0xcfe3d8, 0x2c3a30, 0.85);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffd9a8, 2.4);
    sun.position.set(28, 34, -22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    sun.shadow.camera.far = 120;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    const world = buildWorld();
    worldRef.current = world;
    scene.add(world.root);
    world.roofGroup.visible = true;

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.copy(DEFAULT_VIEWS.overview.target);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.maxPolarAngle = Math.PI / 2 - 0.03;
    orbit.minDistance = 4;
    orbit.maxDistance = 90;
    orbit.update();

    const engine: Engine = {
      renderer, scene, camera, orbit,
      yaw: 0, pitch: 0, keys: new Set(),
      mode: "overview", roofOn: true,
      tween: null,
      joy: { active: false, dx: 0, dy: 0 },
      lookTouch: { id: null, x: 0, y: 0 },
    };
    engineRef.current = engine;

    // --------------------------------------------------------------
    // Input: keyboard (Explore only), pointer lock, touch
    // --------------------------------------------------------------
    const onKeyDown = (e: KeyboardEvent) => {
      if (engine.mode !== "explore") return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault(); // stop page scroll while viewer has keyboard control
        engine.keys.add(e.key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => engine.keys.delete(e.key);
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    const onPointerLockMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement || engine.mode !== "explore") return;
      engine.yaw -= e.movementX * 0.0022;
      engine.pitch -= e.movementY * 0.0022;
      engine.pitch = Math.max(-1.45, Math.min(1.45, engine.pitch)); // clamp to prevent flipping
    };
    const onLockChange = () => setLocked(document.pointerLockElement === renderer.domElement);
    document.addEventListener("mousemove", onPointerLockMove);
    document.addEventListener("pointerlockchange", onLockChange);

    const el = renderer.domElement;
    const onCanvasDown = () => {
      if (engine.mode === "explore" && !isTouch && document.pointerLockElement !== el) {
        el.requestPointerLock?.();
      }
    };
    el.addEventListener("mousedown", onCanvasDown);

    // Touch: left half = movement joystick, right half = look drag
    const onTouchStart = (e: TouchEvent) => {
      if (engine.mode !== "explore") return;
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
      if (engine.mode !== "explore") return;
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
          engine.yaw -= (t.clientX - engine.lookTouch.x) * 0.0045;
          engine.pitch -= (t.clientY - engine.lookTouch.y) * 0.0045;
          engine.pitch = Math.max(-1.45, Math.min(1.45, engine.pitch));
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
    // Resize + render loop
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

    const clock = new THREE.Clock();
    const playerBox = new THREE.Box3();
    const scratch = new THREE.Vector3();
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

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);

      if (engine.tween) {
        const tw = engine.tween;
        tw.t = reducedMotion ? 1 : Math.min(1, tw.t + dt / 0.9);
        const k = 1 - Math.pow(1 - tw.t, 3);
        camera.position.lerpVectors(tw.from, tw.to, k);
        orbit.target.lerpVectors(tw.fromT, tw.toT, k);
        if (tw.t >= 1) engine.tween = null;
        orbit.update();
      } else if (engine.mode === "explore") {
        // First-person movement follows the camera's horizontal direction
        const fwd = scratch.set(-Math.sin(engine.yaw), 0, -Math.cos(engine.yaw));
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        let mx = 0, mz = 0;
        if (engine.keys.has("ArrowUp")) mz += 1;
        if (engine.keys.has("ArrowDown")) mz -= 1;
        if (engine.keys.has("ArrowLeft")) mx -= 1;
        if (engine.keys.has("ArrowRight")) mx += 1;
        if (engine.joy.active) {
          mz -= engine.joy.dy;
          mx += engine.joy.dx;
        }
        const len = Math.hypot(mx, mz);
        if (len > 0.01) {
          const speed = MOVE_SPEED * dt * Math.min(1, len);
          const nx = camera.position.x + (fwd.x * mz + right.x * mx) * (speed / Math.max(len, 1)) * 2;
          const nz = camera.position.z + (fwd.z * mz + right.z * mx) * (speed / Math.max(len, 1)) * 2;
          // per-axis resolution keeps doorways and corridors navigable
          if (!collides(nx, camera.position.z)) camera.position.x = nx;
          if (!collides(camera.position.x, nz)) camera.position.z = nz;
        }
        camera.position.y = EYE_HEIGHT;
        camera.quaternion.setFromEuler(new THREE.Euler(engine.pitch, engine.yaw, 0, "YXZ"));
      } else {
        orbit.update();
      }

      renderer.render(scene, camera);
    };
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
    engine.mode = next;
    setMode(next);
    setSelectedRoom("");
    const el = engine.renderer.domElement;

    if (next === "explore") {
      engine.orbit.enabled = false;
      // drop the player into the living room, facing the corridor
      engine.camera.position.set(-4.6, EYE_HEIGHT, -2.2);
      engine.yaw = Math.PI; // look north toward corridor/rooms
      engine.pitch = 0;
      world.roofGroup.visible = true;
      setRoofOn(true);
    } else {
      if (document.pointerLockElement === el) document.exitPointerLock();
      engine.orbit.enabled = true;
      const view = next === "overview" ? DEFAULT_VIEWS.overview : DEFAULT_VIEWS.dollhouse;
      engine.tween = {
        from: engine.camera.position.clone(),
        to: view.pos.clone(),
        fromT: engine.orbit.target.clone(),
        toT: view.target.clone(),
        t: 0,
      };
      if (next === "dollhouse") {
        // Dollhouse opens the home by default; roof toggle stays available
        engine.roofOn = false;
        setRoofOn(false);
        world.roofGroup.visible = false;
      } else {
        engine.roofOn = true;
        setRoofOn(true);
        world.roofGroup.visible = true;
      }
    }
  }, []);

  const toggleRoof = useCallback(() => {
    const world = worldRef.current;
    const engine = engineRef.current;
    if (!world || !engine || engine.mode === "explore") return;
    setRoofOn((prev) => {
      const next = !prev;
      world.roofGroup.visible = next;
      return next;
    });
  }, []);

  const resetView = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.mode === "explore") {
      engine.camera.position.set(-4.6, EYE_HEIGHT, -2.2);
      engine.yaw = Math.PI;
      engine.pitch = 0;
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
    if (engine.mode === "explore") {
      const [x, z] = room.anchor;
      // find a nearby standing spot that is collision-free
      const candidates: Array<[number, number]> = [
        [x, z], [x + 0.6, z], [x - 0.6, z], [x, z + 0.6], [x, z - 0.6],
      ];
      const box = new THREE.Box3();
      const clear = (px: number, pz: number) => {
        box.min.set(px - PLAYER_RADIUS, 0.3, pz - PLAYER_RADIUS);
        box.max.set(px + PLAYER_RADIUS, 1.9, pz + PLAYER_RADIUS);
        return !world.colliders.some((c) => box.intersectsBox(c));
      };
      const spot = candidates.find(([cx, cz]) => clear(cx, cz)) ?? [x, z];
      engine.camera.position.set(spot[0], EYE_HEIGHT, spot[1]);
      const dx = 0 - spot[0], dz = 0 - spot[1];
      engine.yaw = Math.atan2(-dx, -dz);
      engine.pitch = 0;
    } else {
      if (!engine.roofOn && engine.mode === "dollhouse") {
        // keep roof off for interior framing
      }
      engine.tween = {
        from: engine.camera.position.clone(),
        to: new THREE.Vector3(...room.view.pos),
        fromT: engine.orbit.target.clone(),
        toT: new THREE.Vector3(...room.view.target),
        t: 0,
      };
    }
  }, []);

  // ------------------------------------------------------------------
  // Mobile joystick visual (driven by custom events from the canvas)
  // ------------------------------------------------------------------
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const engine = engineRef.current;
    const el = engine?.renderer.domElement;
    if (!el) return;
    const show = (e: Event) => {
      const d = (e as CustomEvent).detail;
      const host = el.closest("div[data-stage]") as HTMLElement | null;
      const rect = (host ?? el).getBoundingClientRect();
      if (joyRef.current) {
        joyRef.current.style.display = "block";
        joyRef.current.style.left = `${d.x - rect.left - 55}px`;
        joyRef.current.style.top = `${d.y - rect.top - 55}px`;
      }
    };
    const move = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (knobRef.current) {
        const host = el.closest("div[data-stage]") as HTMLElement | null;
        const rect = (host ?? el).getBoundingClientRect();
        const cx = parseFloat(joyRef.current!.style.left) + 55;
        const cy = parseFloat(joyRef.current!.style.top) + 55;
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
          Your browser does not support WebGL, which is required for the interactive property experience.
          Please try a modern desktop browser, or contact our studio for a guided presentation.
        </p>
      </div>
    );
  }

  const modeBtn = (m: ViewMode, label: string) => (
    <button
      type="button"
      onClick={() => applyMode(m)}
      className={`px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 font-display ${
        mode === m
          ? "bg-[#B5D5C5] text-[#121212]"
          : "bg-[#F0EDE3]/10 text-[#F0EDE3]/75 hover:bg-[#F0EDE3]/20"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div data-stage className="relative w-full h-full bg-[#121212]">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Top bar: modes + utilities */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex gap-1.5 p-1 rounded-full bg-[#121212]/70 backdrop-blur-sm pointer-events-auto">
          {modeBtn("overview", "Overview")}
          {modeBtn("dollhouse", "Dollhouse")}
          {modeBtn("explore", "Explore")}
        </div>
        <div className="ml-auto flex items-center gap-2 pointer-events-auto">
          {mode !== "explore" && (
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
        </div>
      </div>

      {/* Explore: pointer-lock hint / instructions */}
      {mode === "explore" && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          {!isTouch && !locked && (
            <p className="px-4 py-2 rounded-full bg-[#121212]/80 backdrop-blur-sm text-[#B5D5C5] text-[11px] font-body font-semibold tracking-[0.12em] uppercase">
              Click inside the experience to look around
            </p>
          )}
          <p className="px-4 py-2 rounded-full bg-[#121212]/80 backdrop-blur-sm text-[#F0EDE3]/85 text-[10px] sm:text-[11px] font-body tracking-[0.06em]">
            <span className="font-display font-semibold text-[#B5D5C5]">MOVE</span> — Arrow keys
            {"   "}
            <span className="font-display font-semibold text-[#B5D5C5]">LOOK</span> — Mouse
            {"   "}
            <span className="font-display font-semibold text-[#B5D5C5]">EXIT</span> — Esc
          </p>
        </div>
      )}

      {/* Mobile joystick visual */}
      <div
        ref={joyRef}
        style={{ display: "none" }}
        className="absolute w-[110px] h-[110px] rounded-full border-2 border-[#B5D5C5]/50 bg-[#121212]/40 pointer-events-none"
      >
        <div
          ref={knobRef}
          className="absolute left-1/2 top-1/2 -ml-6 -mt-6 w-12 h-12 rounded-full bg-[#B5D5C5]/80"
        />
      </div>
    </div>
  );
}
