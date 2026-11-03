"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Collider {
  min: [number, number];
  max: [number, number];
  height?: number;
}

interface CollisionFile {
  walls?: Collider[];
  furniture?: Collider[];
  spawn?: { position: [number, number, number]; yaw?: number };
  wall_height?: number;
}

interface DeliveredWorldProps {
  glbUrl: string;
  collisionUrl: string | null;
  className?: string;
}

const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.24;
const WALK_SPEED = 2.2;
const RUN_SPEED = 4.0;
const PITCH_LIMIT = Math.PI / 2.2;

export function DeliveredWorld({ glbUrl, collisionUrl, className = "" }: DeliveredWorldProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let frame = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "block h-full w-full touch-none";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0e1310");
    const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 400);
    camera.rotation.order = "YXZ";

    const hemi = new THREE.HemisphereLight(0xdfeaf6, 0x8a7f6a, 1.15);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
    sun.position.set(18, 26, 12);
    scene.add(sun);

    const colliders: THREE.Box3[] = [];
    const keys = new Set<string>();
    const rotation = { yaw: 0, pitch: -0.05 };
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
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    const addBox = (min: [number, number], max: [number, number], height: number) => {
      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(Math.min(min[0], max[0]), 0, Math.min(min[1], max[1])),
          new THREE.Vector3(Math.max(min[0], max[0]), height, Math.max(min[1], max[1])),
        ),
      );
    };

    const onKeyDown = (event: KeyboardEvent) => keys.add(event.code);
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || !lastPointer) return;
      rotation.yaw -= (event.clientX - lastPointer.x) * 0.0035;
      rotation.pitch -= (event.clientY - lastPointer.y) * 0.0035;
      rotation.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, rotation.pitch));
      lastPointer = { x: event.clientX, y: event.clientY };
    };
    const onPointerUp = () => {
      dragging = false;
      lastPointer = null;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const blocked = (position: THREE.Vector3) => {
      const point = new THREE.Box3(
        new THREE.Vector3(position.x - PLAYER_RADIUS, 0.2, position.z - PLAYER_RADIUS),
        new THREE.Vector3(position.x + PLAYER_RADIUS, EYE_HEIGHT, position.z + PLAYER_RADIUS),
      );
      return colliders.some((box) => box.intersectsBox(point));
    };

    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? RUN_SPEED : WALK_SPEED;
      const forward = new THREE.Vector3(-Math.sin(rotation.yaw), 0, -Math.cos(rotation.yaw));
      const right = new THREE.Vector3(Math.cos(rotation.yaw), 0, -Math.sin(rotation.yaw));
      const step = new THREE.Vector3();
      if (keys.has("KeyW") || keys.has("ArrowUp")) step.add(forward);
      if (keys.has("KeyS") || keys.has("ArrowDown")) step.sub(forward);
      if (keys.has("KeyD") || keys.has("ArrowRight")) step.add(right);
      if (keys.has("KeyA") || keys.has("ArrowLeft")) step.sub(right);
      if (step.lengthSq() > 0) {
        step.normalize().multiplyScalar(speed * delta);
        const next = camera.position.clone().add(new THREE.Vector3(step.x, 0, step.z));
        if (!blocked(next)) camera.position.copy(next);
        else {
          const slideX = camera.position.clone();
          slideX.x += step.x;
          if (!blocked(slideX)) camera.position.x = slideX.x;
          const slideZ = camera.position.clone();
          slideZ.z += step.z;
          if (!blocked(slideZ)) camera.position.z = slideZ.z;
        }
      }
      camera.rotation.y = rotation.yaw;
      camera.rotation.x = rotation.pitch;
      renderer.render(scene, camera);
    };

    const finish = (spawn: CollisionFile["spawn"]) => {
      const position = spawn?.position ?? [0, EYE_HEIGHT, 0];
      camera.position.set(position[0], EYE_HEIGHT, position[2]);
      rotation.yaw = spawn?.yaw ?? 0;
      setStatus("ready");
      animate();
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
        for (const wall of collision.walls ?? []) addBox(wall.min, wall.max, wallHeight);
        for (const item of collision.furniture ?? [])
          addBox(item.min, item.max, item.height ?? 0.9);
        scene.add(model);
        finish(collision.spawn);
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
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [glbUrl, collisionUrl]);

  return (
    <div className={`relative overflow-hidden rounded-[10px] bg-[#0e1310] ${className}`}>
      <div ref={mountRef} className="absolute inset-0" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 font-body text-[11px] text-[#f0f1e6]/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#a8cebc]" aria-hidden="true" />
          Opening your world…
        </div>
      )}
      {status === "failed" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-body text-[12px] text-[#f0f1e6]">This world could not be opened.</p>
          <p className="max-w-[420px] font-body text-[10.5px] leading-5 text-[#f0f1e6]/55">{message}</p>
        </div>
      )}
      {status === "ready" && (
        <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#111713]/75 px-3.5 py-1.5 font-body text-[10px] text-[#f0f1e6]/75 backdrop-blur">
          Drag to look around · W A S D to walk
        </p>
      )}
    </div>
  );
}

export default DeliveredWorld;
