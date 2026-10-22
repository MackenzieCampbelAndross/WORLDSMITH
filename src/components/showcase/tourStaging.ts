import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Vec3 = [number, number, number];

/**
 * Light staging for the buyer tour. The architecture and core furniture come
 * from buildWorld(); these pieces add the lived-in layer visible on the tour.
 */
export function addTourStaging(root: THREE.Group): () => void {
  const group = new THREE.Group();
  group.name = "buyer-tour-staging";
  root.add(group);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];

  const material = (color: number, roughness = 0.9, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(m);
    return m;
  };

  const linen = material(0xdcd3c2, 0.96);
  const cream = material(0xf1ece0, 0.95);
  const rust = material(0xa46548, 0.94);
  const sage = material(0x79856d, 0.94);
  const clay = material(0xb6805f, 0.9);
  const oak = material(0x8b6543, 0.62);
  const darkWood = material(0x3a2b21, 0.6);
  const brass = material(0xc2a066, 0.32, 0.8);
  const ceramic = material(0xf0ebdf, 0.35);
  const stone = material(0x6f7a74, 0.5);
  const hedge = material(0x3d5a43, 1);

  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, position: Vec3, rotation: Vec3 = [0, 0, 0]) => {
    geometries.push(geometry);
    const m = new THREE.Mesh(geometry, mat);
    m.position.set(...position);
    m.rotation.set(...rotation);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };

  const box = (w: number, h: number, d: number, mat: THREE.Material, position: Vec3, rotation: Vec3 = [0, 0, 0]) =>
    mesh(new THREE.BoxGeometry(w, h, d), mat, position, rotation);

  const soft = (w: number, h: number, d: number, mat: THREE.Material, position: Vec3, rotation: Vec3 = [0, 0, 0]) =>
    mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.22), mat, position, rotation);

  const cylinder = (rTop: number, rBottom: number, h: number, mat: THREE.Material, position: Vec3, rotation: Vec3 = [0, 0, 0], segments = 20) =>
    mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat, position, rotation);

  const sphere = (r: number, mat: THREE.Material, position: Vec3, scale: Vec3 = [1, 1, 1]) => {
    const m = mesh(new THREE.SphereGeometry(r, 18, 12), mat, position);
    m.scale.set(...scale);
    return m;
  };

  // ---------- Art ----------
  const artTexture = (palette: [string, string, string], mode: "arches" | "landscape" | "strokes") => {
    const c = document.createElement("canvas");
    c.width = 480;
    c.height = 340;
    const ctx = c.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 480, 340);
    grad.addColorStop(0, palette[0]);
    grad.addColorStop(1, palette[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 480, 340);

    if (mode === "arches") {
      ctx.strokeStyle = palette[2];
      ctx.lineWidth = 26;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(240, 350, 100 + i * 48, Math.PI, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = palette[2];
      ctx.globalAlpha = 0.22;
      ctx.fillRect(0, 0, 480, 340);
    } else if (mode === "landscape") {
      ctx.fillStyle = palette[2];
      ctx.globalAlpha = 0.28;
      ctx.beginPath();
      ctx.moveTo(0, 260);
      ctx.bezierCurveTo(140, 220, 260, 290, 480, 200);
      ctx.lineTo(480, 340);
      ctx.lineTo(0, 340);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = palette[2];
      ctx.beginPath();
      ctx.arc(120, 100, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.strokeStyle = palette[2];
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.18 + i * 0.05;
        ctx.lineWidth = 8 + i * 3;
        ctx.beginPath();
        ctx.moveTo(40 + i * 22, 300);
        ctx.bezierCurveTo(160, 60 + i * 14, 300, 300 - i * 16, 450, 70 + i * 18);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < 2600; i++) {
      const v = 120 + Math.random() * 70;
      ctx.fillStyle = `rgba(${v},${v},${v},0.035)`;
      ctx.fillRect(Math.random() * 480, Math.random() * 340, 1.4, 1.4);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    textures.push(tex);
    return tex;
  };

  const framedArt = (
    texture: THREE.Texture,
    position: Vec3,
    width: number,
    height: number,
    facing: "east" | "west"
  ) => {
    const frameMat = oak;
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88 });
    materials.push(mat);
    mesh(
      new THREE.PlaneGeometry(width, height),
      mat,
      position,
      [0, facing === "east" ? Math.PI / 2 : -Math.PI / 2, 0]
    );
    const frameX = position[0] + (facing === "east" ? -0.025 : 0.025);
    box(0.035, height + 0.1, width + 0.1, frameMat, [frameX, position[1], position[2]]);
  };

  framedArt(
    artTexture(["#d8c7ad", "#ad987c", "#54402f"], "landscape"),
    [-6.38, 2.1, 2.4],
    1.35,
    0.98,
    "east"
  );

  // ---------- Living room ----------
  const rugCanvas = document.createElement("canvas");
  rugCanvas.width = 512;
  rugCanvas.height = 512;
  const rugCtx = rugCanvas.getContext("2d")!;
  rugCtx.fillStyle = "#b3a186";
  rugCtx.fillRect(0, 0, 512, 512);
  rugCtx.strokeStyle = "#6d5a45";
  rugCtx.lineWidth = 22;
  rugCtx.strokeRect(18, 18, 476, 476);
  rugCtx.strokeStyle = "#8f7a5e";
  rugCtx.lineWidth = 4;
  rugCtx.strokeRect(46, 46, 420, 420);
  for (let i = 0; i < 14; i++) {
    rugCtx.fillStyle = i % 2 === 0 ? "rgba(93,109,91,0.18)" : "rgba(118,86,62,0.12)";
    rugCtx.fillRect(64, 70 + i * 27, 384, 10);
  }
  for (let i = 0; i < 3200; i++) {
    const v = 110 + Math.random() * 80;
    rugCtx.fillStyle = `rgba(${v},${v - 8},${v - 18},0.05)`;
    rugCtx.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6);
  }
  const rugTex = new THREE.CanvasTexture(rugCanvas);
  rugTex.colorSpace = THREE.SRGBColorSpace;
  textures.push(rugTex);
  const rugMat = new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 });
  materials.push(rugMat);
  mesh(new THREE.BoxGeometry(4.2, 0.014, 4.4), rugMat, [-4.4, 0.299, -5.0]);

  // Soft contact shadows keep low-poly furniture from floating.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shadowCtx = shadowCanvas.getContext("2d")!;
  const shadowGrad = shadowCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0.62)");
  shadowGrad.addColorStop(0.5, "rgba(0,0,0,0.34)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
  shadowCtx.fillStyle = shadowGrad;
  shadowCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  textures.push(shadowTex);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.72,
    color: 0x1a1712,
  });
  materials.push(shadowMat);
  const contact = (w: number, d: number, x: number, y: number, z: number) => {
    const m = mesh(new THREE.PlaneGeometry(w, d), shadowMat, [x, y, z], [-Math.PI / 2, 0, 0]);
    m.castShadow = false;
    m.receiveShadow = false;
    m.renderOrder = 2;
  };
  contact(1.15, 1.15, -4.9, 0.309, -7.1);
  contact(1.15, 1.15, -3.5, 0.309, -7.1);
  contact(1.6, 1.0, -4.5, 0.309, -3.1);
  contact(1.35, 3.0, -5.85, 0.309, -3.15);
  contact(0.85, 0.85, -6.0, 0.273, -8.0);
  contact(0.85, 0.85, -2.5, 0.273, -7.9);
  contact(2.3, 1.45, -4.6, 0.273, 1.1);
  contact(2.4, 2.3, 5.25, 0.273, -6.1);
  contact(2.3, 2.05, 5.35, 0.273, 0.55);
  contact(2.3, 2.2, 5.35, 0.273, 6.9);
  contact(0.7, 0.7, 6.15, 0.273, -7.55);
  contact(0.7, 0.7, 6.15, 0.273, -4.65);
  contact(1.2, 1.2, -1.5, 0.311, -10.36);
  contact(1.2, 1.2, 1.7, 0.311, -9.55);
  contact(1.0, 1.0, 0.05, 0.311, -10.25);
  const sofaPillows: Array<[number, THREE.Material]> = [
    [-3.82, rust],
    [-3.15, linen],
    [-2.5, sage],
  ];
  for (const [z, mat] of sofaPillows) {
    soft(0.16, 0.52, 0.5, mat, [-6.05, 0.88, z], [0, 0, 0.08]);
  }
  soft(0.15, 0.34, 0.62, clay, [-5.98, 0.79, -3.16], [0, 0, 0.04]);

  for (const [x, mat] of [[-4.9, rust], [-3.5, cream]] as const) {
    soft(0.42, 0.42, 0.15, mat, [x, 0.84, -7.32], [0.1, 0, 0]);
  }
  soft(0.56, 0.05, 0.54, sage, [-3.5, 0.75, -7.03], [0, 0.12, 0]);

  box(0.34, 0.045, 0.25, cream, [-4.74, 0.562, -3.22], [0, 0.16, 0]);
  box(0.3, 0.04, 0.22, rust, [-4.72, 0.604, -3.2], [0, -0.06, 0]);
  sphere(0.16, ceramic, [-4.18, 0.59, -2.98], [1.3, 0.38, 1.3]);
  sphere(0.055, clay, [-4.2, 0.64, -2.94]);
  sphere(0.05, sage, [-4.12, 0.635, -3.01]);
  cylinder(0.055, 0.075, 0.2, ceramic, [-4.7, 0.665, -2.92]);
  for (const [dx, dz, tilt] of [[-0.09, -0.02, -0.2], [0.02, 0.04, 0.12], [0.1, -0.04, 0.3]] as const) {
    cylinder(0.005, 0.005, 0.42, darkWood, [-4.7 + dx, 0.96, -2.92 + dz], [tilt, 0, tilt * 0.5], 5);
    sphere(0.05, sage, [-4.7 + dx * 2.2, 1.16, -2.92 + dz], [0.6, 1.4, 0.6]);
  }

  // ---------- Dining ----------
  box(0.5, 0.012, 1.36, linen, [-4.6, 1.078, 1.1]);
  cylinder(0.09, 0.11, 0.24, ceramic, [-4.15, 1.2, 1.1]);
  for (const [dx, dz, rz] of [[-0.05, 0, -0.18], [0.03, 0.03, 0.1], [0.06, -0.05, 0.28]] as const) {
    cylinder(0.004, 0.004, 0.44, darkWood, [-4.15 + dx, 1.53, 1.1 + dz], [0, 0, rz], 5);
    sphere(0.055, sage, [-4.15 + dx * 2, 1.74, 1.1 + dz], [0.55, 1.3, 0.55]);
  }
  cylinder(0.15, 0.15, 0.055, stone, [-5.0, 1.1, 1.1]);
  sphere(0.07, clay, [-5.03, 1.16, 1.08]);
  sphere(0.062, cream, [-4.94, 1.155, 1.14]);
  cylinder(0.032, 0.032, 0.2, ceramic, [-3.95, 1.19, 1.45]);

  // ---------- Kitchen ----------
  const runnerCanvas = document.createElement("canvas");
  runnerCanvas.width = 200;
  runnerCanvas.height = 560;
  const runnerCtx = runnerCanvas.getContext("2d")!;
  runnerCtx.fillStyle = "#c8bda6";
  runnerCtx.fillRect(0, 0, 200, 560);
  for (let i = 0; i < 9; i++) {
    runnerCtx.fillStyle = i % 2 ? "rgba(84,104,84,0.5)" : "rgba(150,94,66,0.34)";
    runnerCtx.fillRect(18, 26 + i * 58, 164, 16);
  }
  for (let i = 0; i < 1800; i++) {
    const v = 120 + Math.random() * 60;
    runnerCtx.fillStyle = `rgba(${v},${v - 8},${v - 16},0.06)`;
    runnerCtx.fillRect(Math.random() * 200, Math.random() * 560, 1.5, 1.5);
  }
  const runnerTex = new THREE.CanvasTexture(runnerCanvas);
  runnerTex.colorSpace = THREE.SRGBColorSpace;
  textures.push(runnerTex);
  const runnerMat = new THREE.MeshStandardMaterial({ map: runnerTex, roughness: 1 });
  materials.push(runnerMat);
  mesh(new THREE.BoxGeometry(1.02, 0.012, 2.7), runnerMat, [-3.22, 0.278, 6.35]);

  for (const [sx, sz] of [[-3.52, 4.78], [-3.52, 5.58]] as const) {
    cylinder(0.17, 0.17, 0.05, linen, [sx, 0.66, sz]);
    for (const [dx, dz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]] as const) {
      cylinder(0.018, 0.023, 0.62, oak, [sx + dx, 0.31, sz + dz], [0, 0, 0], 8);
    }
  }

  for (const hx of [-3.95, -3.55, -3.15]) {
    cylinder(0.008, 0.008, 0.16, brass, [hx, 0.86, 7.79], [0, 0, Math.PI / 2], 6);
  }
  for (const hz of [4.85, 5.55]) {
    cylinder(0.008, 0.008, 0.16, brass, [-3.83, 0.86, hz], [Math.PI / 2, 0, 0], 6);
  }

  const steelTrim = material(0x5f6762, 0.42, 0.2);
  box(0.62, 0.012, 0.01, steelTrim, [-2.27, 1.62, 7.696]);
  cylinder(0.012, 0.012, 0.5, steelTrim, [-2.02, 1.35, 7.676], [0, 0, 0], 8);
  cylinder(0.012, 0.012, 0.42, steelTrim, [-2.02, 1.94, 7.676], [0, 0, 0], 8);

  box(0.38, 0.028, 0.26, oak, [-3.25, 1.2, 8.02], [0, -0.08, 0]);
  cylinder(0.16, 0.13, 0.07, ceramic, [-3.94, 1.22, 8.12]);
  for (const [dx, dz, mat] of [[-0.06, 0.02, clay], [0.05, 0.04, rust], [0.01, -0.06, sage]] as const) {
    sphere(0.06, mat, [-3.94 + dx, 1.29, 8.12 + dz]);
  }
  cylinder(0.1, 0.115, 0.17, darkWood, [-2.82, 1.27, 7.94]);
  cylinder(0.015, 0.015, 0.16, brass, [-2.99, 1.33, 7.94], [0, 0, Math.PI / 2], 8);
  cylinder(0.075, 0.085, 0.15, ceramic, [-2.62, 1.26, 8.28]);
  sphere(0.1, sage, [-2.62, 1.4, 8.28], [1, 0.8, 1]);
  sphere(0.07, sage, [-2.72, 1.43, 8.24]);
  sphere(0.065, sage, [-2.55, 1.44, 8.32]);

  // The procedural kitchen has an upper cabinet floating across its window
  // and two artworks pinned over glazing. Hide those for the buyer tour.
  const hiddenPositions = [
    new THREE.Vector3(-3.55, 2.75, 8.34),
    new THREE.Vector3(-6.44, 2.2, -3.0),
    new THREE.Vector3(-6.42, 2.2, -3.0),
    new THREE.Vector3(-6.44, 2.1, 2.4),
    new THREE.Vector3(-6.42, 2.1, 2.4),
    // This exterior cladding panel lands across Bedroom 2's north glazing.
    new THREE.Vector3(4.2, 2.0, 8.72),
  ];
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    if (object.parent === group) return;
    for (const position of hiddenPositions) {
      if (object.position.distanceTo(position) < 0.05) object.visible = false;
    }
    // The procedural wood map is very dark under interior light. A flat sage
    // finish keeps wardrobes and cabinetry readable during the tour.
    const mats = Array.isArray(object.material) ? object.material : [object.material];
    for (const mat of mats) {
      if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
      if (mat.color.getHex() === 0x2f4f43) {
        mat.map = null;
        mat.color.setHex(0x5b7564);
        mat.roughness = 0.55;
        mat.needsUpdate = true;
      }
      if (mat.color.getHex() === 0x6e7573) {
        mat.color.setHex(0x9aa096);
        mat.roughness = 0.38;
        mat.metalness = 0.05;
      }
    }
  });

  // Give the refrigerator a brushed-steel finish instead of a black void.
  // Keep metalness low: the interior has almost no environment map, so a
  // metallic material would read as pure black.
  const fridgePos = new THREE.Vector3(-2.27, 1.32, 8.05);
  const steel = material(0xb4b9b3, 0.5, 0.08);
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.position.distanceTo(fridgePos) < 0.2) {
      object.material = steel;
    }
  });

  // ---------- Beds ----------
  const bedDressing = (cx: number, cz: number, w: number, d: number) => {
    soft(w - 0.02, 0.12, d - 0.02, linen, [cx, 0.84, cz]);
    soft(0.58, 0.055, d * 0.92, rust, [cx - w * 0.28, 0.905, cz], [0, 0, 0]);
    soft(0.16, 0.44, 0.44, clay, [cx + w * 0.32, 0.98, cz - d * 0.25], [0, 0, 0.06]);
    soft(0.16, 0.42, 0.42, cream, [cx + w * 0.32, 0.97, cz + d * 0.25], [0, 0, -0.05]);
    soft(0.14, 0.3, 0.56, sage, [cx + w * 0.38, 0.92, cz], [0, 0, 0]);
  };
  bedDressing(5.25, -6.1, 2.1, 2.05);
  bedDressing(5.35, 0.55, 2.0, 1.6);
  bedDressing(5.35, 6.9, 2.0, 1.8);

  box(0.22, 0.03, 0.16, rust, [6.15, 0.82, -7.55], [0, 0.1, 0]);
  box(0.2, 0.028, 0.15, cream, [6.15, 0.85, -7.53], [0, -0.08, 0]);
  box(0.22, 0.03, 0.16, sage, [6.15, 0.82, 5.65], [0, -0.12, 0]);

  // ---------- Garden outside the rear/east glazing ----------
  const hedgeRow = (points: Array<[number, number, number, number]>) => {
    for (const [x, y, z, s] of points) {
      sphere(0.8 * s, hedge, [x, y, z], [1.15, 0.9, 0.8]);
      sphere(0.62 * s, hedge, [x + 0.55 * s, y - 0.18, z + 0.15], [1, 0.8, 0.9]);
    }
  };
  hedgeRow([
    [-4.5, 0.98, 9.6, 0.62],
    [-3.75, 1.08, 9.7, 0.72],
    [-3.0, 1.0, 9.55, 0.64],
    [-2.35, 0.94, 9.65, 0.58],
    [-1.75, 0.98, 9.7, 0.54],
  ]);
  hedgeRow([
    [7.45, 0.98, 0.4, 0.6],
    [7.6, 1.12, 1.3, 0.68],
    [7.45, 1.02, 2.3, 0.6],
    [7.6, 1.1, 4.75, 0.64],
    [7.5, 1.2, 5.75, 0.7],
    [7.6, 1.05, 6.7, 0.6],
    [7.45, 0.98, 7.5, 0.54],
  ]);
  const gardenFill = new THREE.PointLight(0xffd7ad, 40, 16, 1.8);
  gardenFill.position.set(9.4, 3.6, 4.0);
  group.add(gardenFill);

  // ---------- Porch / balcony ----------
  box(4.2, 0.018, 1.5, linen, [0.3, 0.302, -10.28]);
  soft(0.7, 0.12, 0.42, cream, [-2.07, 0.68, -10.33], [0.08, 0, 0]);
  soft(0.38, 0.36, 0.14, rust, [-2.35, 0.82, -10.5], [0.05, 0.22, 0]);

  const lounge = (cx: number, z: number) => {
    box(0.72, 0.07, 0.66, oak, [cx, 0.44, z]);
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        box(0.05, 0.32, 0.05, oak, [cx + sx * 0.3, 0.27, z + sz * 0.27]);
      }
    }
    soft(0.64, 0.1, 0.58, cream, [cx, 0.53, z]);
    const back = soft(0.66, 0.58, 0.08, cream, [cx, 0.77, z + 0.3], [0.14, 0, 0]);
    back.castShadow = true;
    for (const sx of [-1, 1]) {
      box(0.66, 0.05, 0.06, oak, [cx + sx * 0.32, 0.5, z + 0.02]);
    }
  };
  lounge(-1.5, -10.36);
  lounge(1.7, -9.55);

  cylinder(0.34, 0.34, 0.045, stone, [0.05, 0.5, -10.25]);
  cylinder(0.07, 0.09, 0.42, oak, [0.05, 0.26, -10.25]);
  sphere(0.09, ceramic, [0.05, 0.56, -10.25], [1.4, 0.5, 1.4]);
  cylinder(0.06, 0.07, 0.11, ceramic, [-2.6, 0.42, -9.55]);
  sphere(0.18, sage, [-2.6, 0.61, -9.55], [1, 0.9, 1]);
  sphere(0.13, sage, [-2.48, 0.67, -9.6]);

  // Warm pools in the kitchen; practical, not shadow casters.
  const kitchenGlow = new THREE.PointLight(0xffd9ae, 7, 4, 2);
  kitchenGlow.position.set(-3.5, 2.2, 7.8);
  group.add(kitchenGlow);

  const kitchenFill = new THREE.PointLight(0xffe2c2, 9, 5, 2);
  kitchenFill.position.set(-3.15, 1.9, 6.4);
  group.add(kitchenFill);

  const porchFill = new THREE.PointLight(0xffd6a6, 16, 10, 2);
  porchFill.position.set(0, 2.7, -10.1);
  group.add(porchFill);

  return () => {
    root.remove(group);
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
  };
}
