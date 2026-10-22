import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

export interface RoomDef {
  id: string;
  label: string;
  anchor: [number, number];
  view: { pos: [number, number, number]; target: [number, number, number] };
}

export interface World {
  root: THREE.Group;
  roofGroup: THREE.Group;
  colliders: THREE.Box3[];
  rooms: RoomDef[];
  avatar: { group: THREE.Group; setWalk: (v: number) => void };
  update: (dt: number) => void;
  dispose: () => void;
}

const WALL_H = 3.6;
const T_EXT = 0.24;
const T_INT = 0.14;

export const ROOMS: RoomDef[] = [
  { id: "living", label: "Living Room", anchor: [-1.8, -3.9], view: { pos: [-2.4, 2.2, -5.6], target: [-2.4, 1.2, -2.6] } },
  { id: "dining", label: "Dining Area", anchor: [-1.0, 0.6], view: { pos: [-2.5, 2.2, -1.2], target: [-2.5, 1.2, 1.4] } },
  { id: "kitchen", label: "Kitchen", anchor: [-3.4, 3.6], view: { pos: [-3.3, 2.2, 1.9], target: [-3.4, 1.2, 4.6] } },
  { id: "utility", label: "Utility", anchor: [-1.2, 4.9], view: { pos: [-0.2, 2.1, 3.6], target: [-1.4, 1.2, 5.4] } },
  { id: "foyer", label: "Foyer", anchor: [0.65, -4.6], view: { pos: [0.5, 2.2, -6.9], target: [0.5, 1.4, -4.4] } },
  { id: "hall", label: "Hall & Staircase", anchor: [0.2, -2.6], view: { pos: [-1.6, 2.3, -4.6], target: [0.6, 1.2, -1.8] } },
  { id: "toilet", label: "Guest Toilet", anchor: [0.5, 0.5], view: { pos: [-0.9, 2.1, -1.4], target: [0.5, 1.2, 0.7] } },
  { id: "passage", label: "Passage", anchor: [0.5, 3.2], view: { pos: [-1.4, 2.2, 0.8], target: [0.5, 1.4, 4.6] } },
  { id: "master", label: "Master Bedroom", anchor: [1.9, -3.2], view: { pos: [2.6, 2.3, -6.4], target: [3.1, 1.2, -3.4] } },
  { id: "masterbath", label: "Master Bathroom", anchor: [1.8, -0.9], view: { pos: [0.8, 2.1, -2.4], target: [2.3, 1.2, -0.6] } },
  { id: "bed3", label: "Bedroom 3", anchor: [2.2, 1.6], view: { pos: [1.0, 2.2, 0.1], target: [3.1, 1.2, 2.2] } },
  { id: "bed2", label: "Bedroom 2", anchor: [2.35, 3.65], view: { pos: [1.2, 2.2, 2.4], target: [3.1, 1.2, 5.0] } },
  { id: "porch", label: "Front Porch", anchor: [0.65, -7.0], view: { pos: [0.65, 2.6, -9.6], target: [0.65, 1.4, -6.6] } },
];

export const DEFAULT_VIEWS = {
  overview: { pos: new THREE.Vector3(17, 12, -19), target: new THREE.Vector3(0, 1.8, -0.5) },
  dollhouse: { pos: new THREE.Vector3(7.5, 13.5, -9.5), target: new THREE.Vector3(0, 0.6, 0.3) },
};

export const SPAWN: [number, number] = [0.65, -7.0];
export const SUN_DIRECTION = new THREE.Vector3().setFromSpherical(
  new THREE.Spherical(1, THREE.MathUtils.degToRad(90 - 22), THREE.MathUtils.degToRad(140))
);

type Opening = { a: number; b: number; sill?: number; head?: number };

function makeCanvas(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  return c;
}

const noise = (ctx: CanvasRenderingContext2D, s: number, amount: number, alpha: number) => {
  for (let i = 0; i < s * s * 0.3; i++) {
    const v = Math.floor(Math.random() * amount);
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5);
  }
};

export function buildWorld(): World {
  const root = new THREE.Group();
  const roofGroup = new THREE.Group();
  root.add(roofGroup);
  const colliders: THREE.Box3[] = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];

  const tex = (size: number, repeat: [number, number], draw: (c: CanvasRenderingContext2D, s: number) => void) => {
    const t = new THREE.CanvasTexture(makeCanvas(size, draw));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    return t;
  };
  const bump = (size: number, repeat: [number, number], draw: (c: CanvasRenderingContext2D, s: number) => void) => {
    const t = new THREE.CanvasTexture(makeCanvas(size, draw));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    textures.push(t);
    return t;
  };

  // ---------- Rich procedural textures with relief ----------
  const bStucco = bump(256, [3, 3], (c, s) => { c.fillStyle = "#808080"; c.fillRect(0, 0, s, s); noise(c, s, 255, 0.5); });
  const bStone = bump(256, [2, 2], (c, s) => {
    c.fillStyle = "#404040"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) { c.fillStyle = "#b0b0b0"; c.fillRect(0, y, s, 12); c.fillStyle = "#101010"; c.fillRect(0, y + 12, s, 4); }
  });
  const bPlanks = bump(256, [5, 5], (c, s) => {
    c.fillStyle = "#909090"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 32) { c.fillStyle = "#606060"; c.fillRect(0, y, s, 3); }
    noise(c, s, 200, 0.25);
  });
  const bGrout = bump(256, [6, 6], (c, s) => {
    c.fillStyle = "#b0b0b0"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#202020"; c.fillRect(0, 0, s, 6); c.fillRect(0, 0, 6, s);
  });

  const tPlaster = tex(256, [3, 3], (c, s) => { c.fillStyle = "#efe9dd"; c.fillRect(0, 0, s, s); noise(c, s, 235, 0.06); });
  const tPlasterGrey = tex(256, [3, 3], (c, s) => { c.fillStyle = "#cfd2cf"; c.fillRect(0, 0, s, s); noise(c, s, 200, 0.08); });
  const tStoneClad = tex(256, [2, 2], (c, s) => {
    c.fillStyle = "#3b3d3a"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      c.fillStyle = `rgb(${52 + Math.random() * 26},${54 + Math.random() * 26},${50 + Math.random() * 24})`;
      c.fillRect(0, y, s, 13);
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(0, y + 13, s, 3);
      for (let x = 0; x < s; x += 42 + Math.random() * 20) c.fillRect(x, y, 2, 13);
    }
  });
  const tMarble = tex(512, [4, 4], (c, s) => {
    c.fillStyle = "#ece7db"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = `rgba(${150 + Math.random() * 40},${145 + Math.random() * 40},${130 + Math.random() * 40},${0.12 + Math.random() * 0.18})`;
      c.lineWidth = 0.6 + Math.random() * 2.4;
      c.beginPath();
      let x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 8; k++) { x += (Math.random() - 0.5) * 130; y += (Math.random() - 0.5) * 130; c.quadraticCurveTo(x + 30, y - 30, x, y); }
      c.stroke();
    }
    noise(c, s, 240, 0.03);
    c.strokeStyle = "rgba(120,115,100,0.4)"; c.lineWidth = 3;
    c.strokeRect(0, 0, s, s);
  });
  const tWood = tex(512, [5, 5], (c, s) => {
    c.fillStyle = "#9c7a52"; c.fillRect(0, 0, s, s);
    for (let band = 0; band < 8; band++) {
      const base = 128 + Math.random() * 40;
      c.fillStyle = `rgb(${base},${base * 0.72},${base * 0.48})`;
      c.fillRect(0, band * (s / 8), s, s / 8 - 2);
      for (let i = 0; i < 10; i++) {
        c.strokeStyle = `rgba(${70 + Math.random() * 40},${45 + Math.random() * 25},${25 + Math.random() * 15},0.28)`;
        c.lineWidth = 0.8 + Math.random() * 1.6;
        c.beginPath();
        const y0 = band * (s / 8) + Math.random() * (s / 8);
        c.moveTo(0, y0);
        for (let x = 0; x <= s; x += 12) c.lineTo(x, y0 + Math.sin(x * 0.04 + i * 3 + band) * 3);
        c.stroke();
      }
      c.fillStyle = "rgba(45,28,14,0.6)";
      c.fillRect(0, band * (s / 8) + s / 8 - 2, s, 2);
    }
  });
  const tTileGrey = tex(256, [8, 8], (c, s) => {
    c.fillStyle = "#9aa09c"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#b4b9b5"; c.fillRect(4, 4, s - 8, s - 8);
    noise(c, s, 190, 0.07);
  });
  const tLawn = tex(512, [26, 26], (c, s) => {
    c.fillStyle = "#41694a"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = `rgba(${28 + Math.random() * 45},${58 + Math.random() * 75},${38 + Math.random() * 40},0.4)`;
      const x = Math.random() * s, y = Math.random() * s;
      c.fillRect(x, y, 1.6, 5);
    }
  });
  const tAsphalt = tex(512, [10, 2], (c, s) => {
    c.fillStyle = "#33363a"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) {
      const v = 30 + Math.random() * 55;
      c.fillStyle = `rgba(${v},${v},${v + 6},0.25)`;
      c.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4);
    }
  });
  const tFabric = tex(256, [2, 2], (c, s) => {
    c.fillStyle = "#6f7f74"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) { c.fillStyle = "rgba(255,255,255,0.05)"; c.fillRect(0, y, s, 1); }
    for (let x = 0; x < s; x += 3) { c.fillStyle = "rgba(0,0,0,0.05)"; c.fillRect(x, 0, 1, s); }
    noise(c, s, 160, 0.08);
  });
  const tRug = tex(512, [1, 1], (c, s) => {
    c.fillStyle = "#b8ac92"; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(90,80,60,0.55)"; c.lineWidth = 14; c.strokeRect(22, 22, s - 44, s - 44);
    c.strokeStyle = "rgba(140,120,90,0.6)"; c.lineWidth = 4; c.strokeRect(52, 52, s - 104, s - 104);
    c.strokeStyle = "rgba(95,120,100,0.4)"; c.lineWidth = 3;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(s / 2, s / 2, 30 + i * 22, 0, Math.PI * 2); c.stroke(); }
    noise(c, s, 200, 0.07);
  });
  const tPaving = tex(256, [4, 4], (c, s) => {
    c.fillStyle = "#8f8a7e"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 64) for (let x = 0; x < s; x += 64) {
      const v = 160 + Math.random() * 30;
      c.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
      c.fillRect(x + 2, y + 2, 60, 60);
    }
    noise(c, s, 200, 0.06);
  });
  const tCeiling = tex(256, [4, 4], (c, s) => { c.fillStyle = "#f4f1e8"; c.fillRect(0, 0, s, s); noise(c, s, 250, 0.03); });

  const mat = (opts: Partial<THREE.MeshStandardMaterialParameters>) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02, ...opts });
    materials.push(m);
    return m;
  };

  const M = {
    plasterExt: mat({ map: tPlaster, bumpMap: bStucco, bumpScale: 0.05, roughness: 0.92 }),
    plasterGrey: mat({ map: tPlasterGrey, bumpMap: bStucco, bumpScale: 0.04, roughness: 0.9 }),
    cladding: mat({ map: tStoneClad, bumpMap: bStone, bumpScale: 0.12, roughness: 0.88 }),
    wallInt: mat({ map: tPlaster, bumpMap: bStucco, bumpScale: 0.03, roughness: 0.95 }),
    ceiling: mat({ map: tCeiling, roughness: 0.95 }),
    floorTile: mat({ map: tMarble, bumpMap: bGrout, bumpScale: 0.02, roughness: 0.22, metalness: 0.04, envMapIntensity: 1.2 }),
    floorWood: mat({ map: tWood, bumpMap: bPlanks, bumpScale: 0.04, roughness: 0.45, envMapIntensity: 0.8 }),
    floorTileGrey: mat({ map: tTileGrey, bumpMap: bGrout, bumpScale: 0.03, roughness: 0.3, envMapIntensity: 1.0 }),
    lawn: mat({ map: tLawn, roughness: 1 }),
    asphalt: mat({ map: tAsphalt, roughness: 0.95 }),
    kerb: mat({ color: 0x9a9891, bumpMap: bStucco, bumpScale: 0.03, roughness: 0.95 }),
    paving: mat({ map: tPaving, bumpMap: bGrout, bumpScale: 0.05, roughness: 0.85 }),
    roof: mat({ color: 0xe6e1d5, bumpMap: bStucco, bumpScale: 0.02, roughness: 0.9 }),
    fascia: mat({ color: 0xf2efe7, roughness: 0.7 }),
    timber: mat({ map: tWood, color: 0xb08d60, bumpMap: bPlanks, bumpScale: 0.03, roughness: 0.5 }),
    timberDark: mat({ map: tWood, color: 0x6b4e35, bumpMap: bPlanks, bumpScale: 0.03, roughness: 0.5 }),
    doorWood: mat({ map: tWood, color: 0x7a5636, roughness: 0.4, envMapIntensity: 0.8 }),
    frameDark: mat({ color: 0x24282b, roughness: 0.35, metalness: 0.6 }),
    glass: mat({ color: 0xa8c8d8, roughness: 0.02, metalness: 0.35, transparent: true, opacity: 0.25, envMapIntensity: 2.2 }),
    glassClear: mat({ color: 0xd7ecef, roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.18, envMapIntensity: 2.4 }),
    metal: mat({ color: 0xa8adac, roughness: 0.22, metalness: 0.92 }),
    brass: mat({ color: 0xc9a86a, roughness: 0.25, metalness: 0.9 }),
    fabric: mat({ map: tFabric, roughness: 0.97 }),
    fabricSand: mat({ map: tFabric, color: 0xd8cbb0, roughness: 0.97 }),
    bedding: mat({ map: tFabric, color: 0xf5f0e4, roughness: 0.96 }),
    rug: mat({ map: tRug, roughness: 1 }),
    porcelain: mat({ color: 0xf7f5ef, roughness: 0.12, envMapIntensity: 1.5 }),
    counter: mat({ color: 0x6e7573, bumpMap: bStone, bumpScale: 0.02, roughness: 0.12, metalness: 0.12, envMapIntensity: 1.6 }),
    cabinet: mat({ map: tWood, color: 0x2f4f43, roughness: 0.3, envMapIntensity: 1.0 }),
    foliage: mat({ color: 0x3a6847, roughness: 1 }),
    foliageLight: mat({ color: 0x5f8a5c, roughness: 1 }),
    trunk: mat({ color: 0x54422f, bumpMap: bPlanks, bumpScale: 0.08, roughness: 1 }),
    hedge: mat({ color: 0x33583d, roughness: 1 }),
    lampWarm: mat({ color: 0xfff1d0, emissive: 0xffd99e, emissiveIntensity: 2.2, roughness: 1 }),
    art1: mat({ color: 0x87a596, roughness: 0.9 }),
    art2: mat({ color: 0xc08a5c, roughness: 0.9 }),
    carBlack: mat({ color: 0x14181c, roughness: 0.08, metalness: 0.9, envMapIntensity: 2.4 }),
    carWhite: mat({ color: 0xeae8e1, roughness: 0.1, metalness: 0.85, envMapIntensity: 2.4 }),
    carGreen: mat({ color: 0x24463a, roughness: 0.12, metalness: 0.85, envMapIntensity: 2.2 }),
    tire: mat({ color: 0x101010, roughness: 0.95 }),
    rim: mat({ color: 0xcdd2d2, roughness: 0.15, metalness: 0.95 }),
    headlight: mat({ color: 0xffffff, emissive: 0xfff6da, emissiveIntensity: 1.4 }),
    taillight: mat({ color: 0x5a0f0f, emissive: 0xff2a1a, emissiveIntensity: 1.2 }),
    skin: mat({ color: 0x9a6b4f, roughness: 0.75 }),
    hair: mat({ color: 0x1c1613, roughness: 0.85 }),
    shirt: mat({ color: 0xf0ede3, roughness: 0.9 }),
    pants: mat({ color: 0x36404a, roughness: 0.9 }),
    shoes: mat({ color: 0x1c1e22, roughness: 0.4 }),
  };

  const box = (
    m: THREE.Material, w: number, h: number, d: number,
    x: number, y: number, z: number,
    parent: THREE.Object3D = root, collide = false
  ) => {
    const g = new THREE.BoxGeometry(w, h, d);
    geometries.push(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (collide) {
      colliders.push(
        new THREE.Box3(
          new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
          new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)
        )
      );
    }
    return mesh;
  };

  const cyl = (
    m: THREE.Material, rTop: number, rBot: number, h: number,
    x: number, y: number, z: number, parent: THREE.Object3D = root, seg = 14
  ) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
    geometries.push(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const sph = (m: THREE.Material, r: number, x: number, y: number, z: number, parent: THREE.Object3D = root, sx = 1, sy = 1, sz = 1) => {
    const g = new THREE.SphereGeometry(r, 14, 10);
    geometries.push(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  /** Axis-aligned wall run with glazed/framed openings; full-height gaps are doorways. */
  const wall = (
    horizontal: boolean, fixed: number, from: number, to: number,
    openings: Opening[], material: THREE.Material, t = T_EXT
  ) => {
    const sorted = [...openings].sort((p, q) => p.a - q.a);
    const seg = (a: number, b: number, sy: number, sh: number) => {
      if (b - a < 0.02 || sh < 0.02) return;
      if (horizontal) box(material, b - a, sh, t, (a + b) / 2, sy + sh / 2, fixed, root, true);
      else box(material, t, sh, b - a, fixed, sy + sh / 2, (a + b) / 2, root, true);
    };
    let cursor = from;
    for (const o of sorted) {
      seg(cursor, o.a, 0, WALL_H);
      const sill = o.sill ?? 0;
      const head = o.head ?? WALL_H;
      if (sill > 0.02) seg(o.a, o.b, 0, sill);
      if (head < WALL_H - 0.02) seg(o.a, o.b, head, WALL_H - head);
      const gw = o.b - o.a;
      const gh = head - sill;
      const mid = (o.a + o.b) / 2;
      const isDoorway = sill < 0.02 && head > WALL_H - 0.02;
      if (gh > 0.2) {
        const fx = horizontal ? mid : fixed;
        const fz = horizontal ? fixed : mid;
        if (!isDoorway) {
          const glass = horizontal
            ? box(M.glass, gw - 0.08, gh - 0.08, 0.04, fx, sill + gh / 2, fz)
            : box(M.glass, 0.04, gh - 0.08, gw - 0.08, fx, sill + gh / 2, fz);
          glass.castShadow = false;
          // mullions
          const n = Math.max(1, Math.round(gw / 1.2));
          for (let i = 1; i < n; i++) {
            const f = i / n;
            if (horizontal) box(M.frameDark, 0.05, gh, 0.07, o.a + gw * f, sill + gh / 2, fz);
            else box(M.frameDark, 0.07, gh, 0.05, fx, sill + gh / 2, o.a + gw * f);
          }
        }
        // frame + architrave (also for doorways)
        const f1 = horizontal
          ? box(M.frameDark, gw, 0.06, t + 0.05, fx, sill + 0.03, fz)
          : box(M.frameDark, t + 0.05, 0.06, gw, fx, sill + 0.03, fz);
        const f2 = horizontal
          ? box(M.frameDark, gw, 0.06, t + 0.05, fx, head - 0.03, fz)
          : box(M.frameDark, t + 0.05, 0.06, gw, fx, head - 0.03, fz);
        const f3 = horizontal
          ? box(M.frameDark, 0.06, gh, t + 0.05, o.a + 0.03, sill + gh / 2, fz)
          : box(M.frameDark, t + 0.05, gh, 0.06, fx, sill + gh / 2, o.a + 0.03);
        const f4 = horizontal
          ? box(M.frameDark, 0.06, gh, t + 0.05, o.b - 0.03, sill + gh / 2, fz)
          : box(M.frameDark, t + 0.05, gh, 0.06, fx, sill + gh / 2, o.b - 0.03);
        for (const f of [f1, f2, f3, f4]) f.receiveShadow = true;
        if (!isDoorway) {
          // stone sill ledge
          if (horizontal) box(M.counter, gw + 0.14, 0.07, t + 0.18, fx, sill - 0.02, fz);
          else box(M.counter, t + 0.18, 0.07, gw + 0.14, fx, sill - 0.02, fz);
        }
      }
      cursor = o.b;
    }
    seg(cursor, to, 0, WALL_H);
  };

  // ============================================================
  // VILLA SHELL — footprint x[-4.6,4.6] z[-6.1,6.1], taller storey
  // ============================================================
  const house = new THREE.Group();
  root.add(house);

  box(M.plasterGrey, 9.9, 0.2, 12.9, 0, 0.1, 0, house); // plinth
  box(M.counter, 9.5, 0.06, 12.5, 0, 0.22, 0, house); // polished base edge
  box(M.floorTile, 4.0, 0.04, 4.3, -2.5, 0.25, -3.8, house); // living
  box(M.floorTile, 4.0, 0.04, 4.0, -2.5, 0.25, 0.5, house); // dining
  box(M.floorTileGrey, 2.2, 0.04, 3.3, -3.4, 0.25, 4.3, house); // kitchen
  box(M.floorTileGrey, 1.6, 0.04, 1.4, -1.3, 0.25, 5.3, house); // utility
  box(M.floorTile, 1.6, 0.04, 2.0, 0.5, 0.25, -5.0, house); // foyer
  box(M.floorTile, 1.6, 0.04, 3.2, 0.5, 0.25, -2.2, house); // hall
  box(M.floorTileGrey, 1.6, 0.04, 1.6, 0.5, 0.25, 0.4, house); // guest toilet
  box(M.floorTile, 1.6, 0.04, 4.6, 0.5, 0.25, 3.7, house); // passage
  box(M.floorWood, 3.0, 0.04, 4.3, 3.1, 0.25, -3.8, house); // master
  box(M.floorTileGrey, 1.6, 0.04, 1.8, 2.3, 0.25, -0.6, house); // master bath
  box(M.floorWood, 3.0, 0.04, 2.6, 3.1, 0.25, 1.9, house); // bed3
  box(M.floorWood, 3.0, 0.04, 2.7, 3.1, 0.25, 4.65, house); // bed2

  // ---- Perimeter (fully enclosing, overlapping corners) ----
  wall(true, -6.1, -4.6, 4.6, [
    { a: -4.3, b: -1.0, sill: 0.1, head: 3.3 },
    { a: 0.2, b: 1.1 },
    { a: 1.9, b: 4.1, sill: 0.95, head: 2.9 },
  ], M.plasterExt);
  wall(true, 6.1, -4.6, 4.6, [
    { a: -4.2, b: -2.8, sill: 1.5, head: 2.9 },
    { a: -1.9, b: -0.9, sill: 1.6, head: 2.9 },
    { a: 0.2, b: 1.0 },
    { a: 2.1, b: 3.9, sill: 0.95, head: 2.9 },
  ], M.plasterExt);
  wall(false, -4.6, -6.1, 6.1, [
    { a: -5.2, b: -2.8, sill: 0.35, head: 3.1 },
    { a: -0.6, b: 1.6, sill: 0.95, head: 2.9 },
    { a: 3.6, b: 5.0, sill: 1.7, head: 2.9 },
  ], M.plasterExt);
  wall(false, 4.6, -6.1, 6.1, [
    { a: -5.2, b: -3.0, sill: 0.95, head: 2.9 },
    { a: 1.2, b: 2.6, sill: 0.95, head: 2.9 },
    { a: 3.8, b: 5.6, sill: 0.95, head: 2.9 },
  ], M.plasterExt);

  // ---- Internal walls (full height, sealed envelope) ----
  const IW = M.wallInt;
  wall(false, -0.4, -6.1, 6.1, [
    { a: -5.4, b: -4.6 },
    { a: -3.2, b: -2.4 },
    { a: 5.0, b: 5.8 },
  ], IW, T_INT);
  wall(true, 2.6, -4.6, -2.2, [{ a: -3.8, b: -2.8 }], IW, T_INT);
  wall(false, -2.2, 2.6, 6.1, [{ a: 4.6, b: 5.4 }], IW, T_INT);
  wall(true, -3.9, -0.4, 1.4, [{ a: 0.1, b: 1.0 }], IW, T_INT);
  wall(true, -0.5, -0.4, 1.4, [{ a: -0.3, b: 0.4 }], IW, T_INT);
  wall(true, 1.3, -0.4, 1.4, [], IW, T_INT);
  wall(false, 1.4, -6.1, 6.1, [
    { a: -4.8, b: -4.0 },
    { a: 1.8, b: 2.6 },
    { a: 4.4, b: 5.2 },
  ], IW, T_INT);
  wall(true, -1.6, 1.4, 3.2, [{ a: 2.0, b: 2.8 }], IW, T_INT);
  wall(false, 3.2, -1.6, 0.4, [], IW, T_INT);
  wall(true, 0.4, 1.4, 4.6, [{ a: 3.6, b: 4.4 }], IW, T_INT);
  wall(true, 3.2, 1.4, 4.6, [], IW, T_INT);

  // Entrance door (opened inward) + internal leaves (ajar, no colliders)
  box(M.doorWood, 0.86, 3.0, 0.05, 0.66, 1.68, -5.96, house);
  box(M.glass, 0.55, 1.3, 0.02, 0.66, 2.3, -5.93, house);
  box(M.brass, 0.04, 0.34, 0.04, 1.02, 1.45, -5.9, house);
  const leaf = (w: number, h: number, d: number, x: number, y: number, z: number) =>
    box(M.doorWood, w, h, d, x, y, z, house);
  leaf(0.9, 2.9, 0.05, 1.36, 1.7, -4.4);
  leaf(0.05, 2.9, 0.9, -0.47, 1.7, -5.35);
  leaf(0.7, 2.9, 0.05, 0.05, 1.7, -0.57);
  leaf(0.05, 2.9, 0.8, 1.33, 1.7, 1.85);
  leaf(0.05, 2.9, 0.8, 1.33, 1.7, 4.45);
  leaf(1.0, 2.9, 0.05, -3.3, 1.7, 2.68);
  leaf(0.05, 2.9, 0.8, -0.47, 1.7, 5.05);
  leaf(0.05, 2.9, 0.8, 3.16, 1.7, -1.5);

  // Skirting boards (interior character line)
  const skirt = (w: number, d: number, x: number, z: number) => box(M.timberDark, w, 0.12, d, x, 0.33, z, house);
  skirt(3.9, 0.04, -2.5, -5.96); skirt(0.04, 4.2, -4.46, -3.8);
  skirt(3.9, 0.04, -2.5, 2.46); skirt(2.9, 0.04, 3.1, -5.96);
  skirt(0.04, 4.2, 4.46, -3.8); skirt(0.04, 2.7, 4.46, 4.65);

  // ---- Exterior character ----
  box(M.cladding, 0.07, 3.6, 5.2, 4.68, 1.85, -3.6, house);
  box(M.cladding, 3.2, 3.6, 0.07, 3.0, 1.85, 6.18, house);
  box(M.cladding, 1.4, 3.6, 0.07, -3.9, 1.85, -6.18, house);
  for (let i = 0; i < 5; i++) cyl(M.timber, 0.05, 0.05, 3.4, -0.2 - i * 0.18, 1.85, -6.32, house, 8);
  box(M.fascia, 3.6, 0.34, 0.14, -2.65, 3.5, -6.28, house);

  // ---- Ceiling + roof ----
  box(M.ceiling, 9.24, 0.1, 12.24, 0, WALL_H + 0.05, 0, roofGroup);
  // ceiling coves per room
  for (const [w, d, x, z] of [
    [3.6, 3.9, -2.5, -3.8], [3.6, 3.6, -2.5, 0.5], [2.7, 2.9, 3.1, -3.8],
  ] as const) {
    box(M.ceiling, w, 0.06, d, x, WALL_H - 0.02, z, roofGroup);
  }
  const roofSlab = box(M.roof, 10.6, 0.24, 13.6, 0, WALL_H + 0.22, 0, roofGroup);
  roofSlab.receiveShadow = true;
  box(M.fascia, 10.7, 0.4, 0.12, 0, WALL_H + 0.3, -6.86, roofGroup);
  box(M.fascia, 10.7, 0.4, 0.12, 0, WALL_H + 0.3, 6.86, roofGroup);
  box(M.fascia, 0.12, 0.4, 13.8, -5.35, WALL_H + 0.3, 0, roofGroup);
  box(M.fascia, 0.12, 0.4, 13.8, 5.35, WALL_H + 0.3, 0, roofGroup);
  box(M.plasterExt, 3.8, 0.6, 5.4, 3.0, WALL_H + 0.62, -3.6, roofGroup);
  box(M.roof, 4.2, 0.18, 5.8, 3.0, WALL_H + 1.0, -3.6, roofGroup);
  box(M.cladding, 3.85, 0.62, 0.07, 3.0, WALL_H + 0.62, -6.31, roofGroup);

  // ---- Covered porch ----
  box(M.floorTileGrey, 2.6, 0.1, 1.9, 0.65, 0.24, -7.15, house);
  for (const px of [-0.45, 1.75]) {
    box(M.plasterGrey, 0.34, 0.14, 0.34, px, 0.34, -8.0, house);
    cyl(M.plasterGrey, 0.11, 0.13, 3.2, px, 2.0, -8.0, house, 12);
    box(M.plasterGrey, 0.3, 0.12, 0.3, px, 3.66, -8.0, house);
  }
  box(M.fascia, 2.9, 0.24, 2.3, 0.65, 3.82, -7.15, roofGroup);
  box(M.timber, 2.7, 0.1, 2.1, 0.65, 3.66, -7.15, roofGroup);
  box(M.kerb, 2.8, 0.1, 0.45, 0.65, 0.12, -8.35, house);
  box(M.kerb, 2.8, 0.1, 0.3, 0.65, 0.22, -8.6, house);
  box(M.lampWarm, 0.12, 0.34, 0.12, -0.42, 2.7, -6.32, house);
  box(M.lampWarm, 0.12, 0.34, 0.12, 1.72, 2.7, -6.32, house);
  box(M.timber, 0.9, 0.08, 0.45, -0.1, 0.53, -7.5, house); // porch bench
  cyl(M.timberDark, 0.03, 0.03, 0.4, -0.45, 0.3, -7.5, house, 8);
  cyl(M.timberDark, 0.03, 0.03, 0.4, 0.2, 0.3, -7.5, house, 8);

  // ============================================================
  // FURNITURE — planned around ≥0.9 m circulation loops
  // ============================================================
  const sofa = (x: number, z: number, w: number, d: number, back: "-x" | "+x" | "-z" | "+z") => {
    box(M.fabric, w, 0.42, d, x, 0.46, z, house, true);
    const bx = back === "-x" ? -(w / 2 - 0.14) : back === "+x" ? w / 2 - 0.14 : 0;
    const bz = back === "-z" ? -(d / 2 - 0.14) : back === "+z" ? d / 2 - 0.14 : 0;
    const bw = back === "-x" || back === "+x" ? 0.28 : w;
    const bd = back === "-x" || back === "+x" ? d : 0.28;
    box(M.fabric, bw, 0.78, bd, x + bx, 0.72, z + bz, house);
    const n = Math.max(2, Math.round((back === "-x" || back === "+x" ? d : w) / 0.85));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      const cx = back === "-z" || back === "+z" ? x + t * w : x;
      const cz = back === "-x" || back === "+x" ? z + t * d : z;
      sph(M.fabricSand, 0.24, cx, 0.72, cz, house, 1, 0.45, 1);
    }
  };
  const plant = (x: number, z: number, s = 1) => {
    cyl(M.porcelain, 0.19 * s, 0.15 * s, 0.38 * s, x, 0.44 * s, z, house, 12);
    sph(M.foliageLight, 0.3 * s, x, 0.85 * s, z, house);
    sph(M.foliage, 0.24 * s, x + 0.14 * s, 1.05 * s, z - 0.1 * s, house);
    sph(M.foliageLight, 0.2 * s, x - 0.15 * s, 1.12 * s, z + 0.08 * s, house);
  };
  const ceilingLamp = (x: number, z: number, r = 0.18) => {
    cyl(M.metal, 0.015, 0.015, 0.3, x, WALL_H - 0.18, z, house, 6);
    const g = new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    geometries.push(g);
    const shade = new THREE.Mesh(g, M.lampWarm);
    shade.position.set(x, WALL_H - 0.32, z);
    shade.rotation.x = Math.PI;
    house.add(shade);
  };
  const pendant = (x: number, z: number, drop: number) => {
    cyl(M.brass, 0.012, 0.012, drop, x, WALL_H - drop / 2 - 0.1, z, house, 6);
    const cone = new THREE.ConeGeometry(0.17, 0.2, 16, 1, true);
    geometries.push(cone);
    const shade = new THREE.Mesh(cone, M.brass);
    shade.position.set(x, WALL_H - drop - 0.12, z);
    shade.castShadow = true;
    house.add(shade);
    sph(M.lampWarm, 0.06, x, WALL_H - drop - 0.2, z, house);
  };
  const chair = (x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(M.timberDark, 0.44, 0.05, 0.44, 0, 0.5, 0, g);
    box(M.timberDark, 0.44, 0.62, 0.05, 0, 0.85, -0.2, g);
    box(M.fabricSand, 0.4, 0.06, 0.4, 0, 0.55, 0, g);
    for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]] as const)
      cyl(M.timberDark, 0.022, 0.026, 0.5, lx, 0.26, lz, g, 8);
    house.add(g);
  };
  const bed = (cx: number, cz: number, w: number, d: number, head: "-x" | "+x" | "-z" | "+z") => {
    box(M.timberDark, w, 0.38, d, cx, 0.44, cz, house, true);
    box(M.bedding, w - 0.1, 0.2, d - 0.12, cx, 0.73, cz, house);
    const hx = head === "-x" ? -(w / 2 + 0.05) : head === "+x" ? w / 2 + 0.05 : 0;
    const hz = head === "-z" ? -(d / 2 + 0.05) : head === "+z" ? d / 2 + 0.05 : 0;
    if (head === "-x" || head === "+x") box(M.timberDark, 0.12, 1.15, d + 0.1, cx + hx, 0.95, cz, house);
    else box(M.timberDark, w + 0.1, 1.15, 0.12, cx, 0.95, cz + hz, house);
    const px = head === "-x" || head === "+x" ? cx + hx * 0.8 : cx - w * 0.26;
    const pz = head === "-z" || head === "+z" ? cz + hz * 0.8 : cz - d * 0.26;
    sph(M.bedding, 0.26, px, 0.86, pz, house, head === "-x" || head === "+x" ? 0.6 : 1, 0.35, head === "-x" || head === "+x" ? 1 : 0.6);
    sph(M.bedding, 0.26, head === "-x" || head === "+x" ? px : cx + w * 0.26, 0.86, head === "-x" || head === "+x" ? cz + d * 0.24 : pz, house, 0.6, 0.35, 1);
    box(M.fabricSand, w * 0.9, 0.08, d * 0.4, cx, 0.85, cz + (head === "-z" || head === "+z" ? 0 : 0) + (head === "+z" ? -d * 0.3 : d * 0.3), house);
  };

  // Living
  sofa(-4.0, -3.6, 0.95, 2.4, "-x");
  sofa(-2.9, -5.5, 2.4, 0.95, "-z");
  box(M.timber, 1.05, 0.06, 0.62, -3.0, 0.44, -3.7, house, true); // coffee table top
  for (const [lx, lz] of [[-3.45, -3.98], [-2.55, -3.98], [-3.45, -3.42], [-2.55, -3.42]] as const)
    cyl(M.metal, 0.02, 0.02, 0.4, lx, 0.23, lz, house, 8);
  box(M.frameDark, 0.45, 0.45, 1.2, -0.72, 0.48, -3.9, house, true); // TV console
  box(M.frameDark, 0.05, 0.72, 1.15, -0.52, 1.45, -3.9, house); // TV
  box(M.rug, 2.5, 0.02, 1.9, -2.9, 0.28, -3.9, house);
  plant(-4.25, -5.65, 1.15);
  cyl(M.metal, 0.025, 0.04, 1.6, -0.85, 1.05, -1.95, house, 8); // floor lamp
  const lampShadeG = new THREE.ConeGeometry(0.2, 0.26, 16, 1, true);
  geometries.push(lampShadeG);
  const lampShade = new THREE.Mesh(lampShadeG, M.lampWarm);
  lampShade.position.set(-0.85, 1.95, -1.95);
  house.add(lampShade);
  box(M.art1, 0.04, 1.0, 1.4, -4.44, 2.0, -4.4, house); // canvas art
  box(M.timberDark, 0.05, 1.08, 1.48, -4.42, 2.0, -4.4, house);
  ceilingLamp(-2.9, -3.9);

  // Dining
  box(M.timber, 1.8, 0.08, 1.0, -2.6, 1.0, 0.6, house, true);
  for (const [lx, lz] of [[-3.4, 0.18], [-1.8, 0.18], [-3.4, 1.02], [-1.8, 1.02]] as const)
    cyl(M.timberDark, 0.035, 0.035, 0.72, lx, 0.62, lz, house, 8);
  chair(-3.05, -0.25, 0); chair(-2.15, -0.25, 0);
  chair(-3.05, 1.45, Math.PI); chair(-2.15, 1.45, Math.PI);
  chair(-3.75, 0.6, Math.PI / 2); chair(-1.45, 0.6, -Math.PI / 2);
  pendant(-2.9, 0.6, 0.9); pendant(-2.3, 0.6, 0.9);
  box(M.timberDark, 0.42, 0.8, 1.4, -4.3, 0.66, 1.6, house, true); // sideboard
  box(M.counter, 0.46, 0.04, 1.44, -4.3, 1.08, 1.6, house);
  plant(-0.75, 2.1, 0.95);
  box(M.art2, 0.04, 0.9, 1.1, -4.44, 2.0, 0.2, house);

  // Kitchen
  box(M.cabinet, 2.0, 0.86, 0.6, -3.45, 0.69, 5.72, house, true);
  box(M.counter, 2.1, 0.06, 0.66, -3.45, 1.15, 5.72, house);
  box(M.metal, 0.52, 0.06, 0.4, -3.95, 1.2, 5.7, house); // sink
  cyl(M.metal, 0.015, 0.015, 0.3, -3.95, 1.38, 5.88, house, 8);
  box(M.frameDark, 0.55, 0.02, 0.48, -2.95, 1.19, 5.7, house); // hob
  box(M.cabinet, 0.58, 0.86, 1.3, -4.22, 0.69, 3.5, house, true);
  box(M.counter, 0.64, 0.06, 1.36, -4.22, 1.15, 3.5, house);
  box(M.cabinet, 1.9, 0.75, 0.36, -3.45, 2.6, 5.92, house); // wall cabinets
  box(M.frameDark, 0.62, 2.1, 0.6, -2.5, 1.3, 4.0, house, true); // fridge
  box(M.metal, 0.03, 0.5, 0.04, -2.21, 1.5, 3.85, house); // handle
  ceilingLamp(-3.4, 4.2, 0.13);

  // Utility
  box(M.porcelain, 0.6, 0.86, 0.6, -1.9, 0.69, 5.72, house, true);
  box(M.frameDark, 0.42, 0.42, 0.03, -1.9, 0.7, 5.41, house);
  box(M.counter, 0.9, 0.06, 0.5, -0.95, 1.1, 5.8, house);
  ceilingLamp(-1.3, 5.0, 0.1);

  // Foyer
  box(M.rug, 1.2, 0.02, 1.5, 0.62, 0.28, -5.2, house);
  box(M.timberDark, 0.4, 0.5, 1.0, 1.18, 0.51, -5.6, house, true); // bench
  box(M.metal, 0.04, 0.04, 0.9, 1.34, 1.9, -5.6, house); // coat rail
  for (const cz of [-5.9, -5.6, -5.3]) cyl(M.brass, 0.012, 0.012, 0.16, 1.34, 1.8, cz, house, 6);
  ceilingLamp(0.62, -5.0, 0.11);

  // Hall + staircase
  for (let i = 0; i < 9; i++) {
    box(M.plasterGrey, 0.78, 0.18, 0.29, 1.0, 0.34 + i * 0.18, -3.05 + i * 0.29, house, true);
    box(M.fabricSand, 0.78, 0.04, 0.29, 1.0, 0.45 + i * 0.18, -3.05 + i * 0.29, house);
  }
  for (let i = 0; i < 5; i++) cyl(M.metal, 0.016, 0.016, 0.95, 0.6, 1.35 + i * 0.32, -2.9 + i * 0.58, house, 6);
  const rail = cyl(M.metal, 0.028, 0.028, 3.1, 0.6, 2.0, -1.6, house, 8);
  rail.rotation.x = -0.48;
  box(M.glassClear, 0.03, 1.0, 2.8, 0.62, 1.3, -1.9, house);
  box(M.timberDark, 0.35, 0.75, 1.0, -0.15, 0.64, -1.5, house, true); // console
  box(M.brass, 0.03, 0.8, 0.7, -0.3, 1.9, -1.5, house); // mirror
  ceilingLamp(0.5, -2.4, 0.15);

  // Guest toilet
  box(M.porcelain, 0.38, 0.44, 0.6, 1.12, 0.44, 0.95, house, true);
  box(M.porcelain, 0.38, 0.5, 0.24, 1.16, 0.92, 1.15, house);
  box(M.counter, 0.5, 0.06, 0.42, -0.05, 0.98, 0.45, house);
  box(M.porcelain, 0.46, 0.12, 0.38, -0.05, 1.05, 0.45, house);
  box(M.brass, 0.03, 0.7, 0.5, -0.32, 1.7, 0.45, house);
  ceilingLamp(0.5, 0.4, 0.09);

  // Passage
  box(M.timberDark, 0.32, 1.9, 0.9, -0.2, 1.21, 2.4, house, true);
  ceilingLamp(0.5, 3.6, 0.1);

  // Master bedroom
  bed(3.45, -4.4, 1.95, 2.05, "+x");
  box(M.timberDark, 0.45, 0.48, 0.45, 4.15, 0.5, -5.6, house, true);
  box(M.timberDark, 0.45, 0.48, 0.45, 4.15, 0.5, -3.2, house, true);
  cyl(M.lampWarm, 0.09, 0.12, 0.24, 4.15, 0.9, -5.6, house, 10);
  cyl(M.lampWarm, 0.09, 0.12, 0.24, 4.15, 0.9, -3.2, house, 10);
  box(M.cabinet, 1.8, 2.4, 0.6, 2.5, 1.46, -5.82, house, true); // wardrobe
  for (const wx of [2.1, 2.5, 2.9]) cyl(M.brass, 0.012, 0.012, 0.3, wx, 1.5, -5.5, house, 6);
  box(M.timberDark, 0.45, 0.85, 0.9, 4.0, 0.68, -5.9, house, true); // dresser (SE corner)
  box(M.counter, 0.47, 0.04, 0.92, 4.0, 1.13, -5.9, house);
  box(M.rug, 2.1, 0.02, 1.7, 2.7, 0.28, -4.4, house);
  plant(4.25, -2.05, 1.05);
  box(M.art2, 1.1, 0.7, 0.04, 3.2, 2.2, -6.0, house);
  ceilingLamp(3.0, -4.4, 0.15);
  box(M.fabricSand, 0.1, 2.4, 0.34, 4.4, 2.05, -5.1, house); // curtains
  box(M.fabricSand, 0.1, 2.4, 0.34, 4.4, 2.05, -3.15, house);
  cyl(M.brass, 0.015, 0.015, 2.3, 4.42, 3.1, -4.1, house, 6).rotation.x = Math.PI / 2;

  // Master bath
  box(M.porcelain, 0.72, 0.56, 1.4, 2.85, 0.54, -0.42, house, true); // tub on east side
  box(M.porcelain, 0.58, 0.08, 1.24, 2.85, 0.85, -0.42, house);
  box(M.counter, 0.9, 0.8, 0.5, 1.75, 0.66, 0.05, house, true); // vanity on north wall
  box(M.porcelain, 0.55, 0.1, 0.38, 1.75, 1.1, 0.05, house);
  box(M.brass, 0.7, 0.8, 0.03, 1.75, 1.85, 0.3, house); // mirror
  box(M.porcelain, 0.38, 0.44, 0.6, 2.95, 0.44, -1.45, house, true); // wc
  box(M.porcelain, 0.38, 0.48, 0.22, 3.08, 0.9, -1.45, house);
  box(M.glassClear, 0.04, 2.2, 1.0, 2.15, 1.4, -0.9, house); // shower screen
  box(M.floorTileGrey, 0.7, 0.03, 1.0, 1.78, 0.28, -0.9, house);
  cyl(M.metal, 0.02, 0.02, 0.4, 1.5, 2.3, -0.9, house, 8);
  ceilingLamp(2.3, -0.8, 0.1);

  // WIC
  box(M.cabinet, 0.5, 2.1, 1.6, 4.3, 1.31, -0.6, house, true);
  box(M.timber, 1.1, 0.05, 0.45, 3.85, 1.95, -1.35, house);

  // Bedroom 3
  bed(3.55, 1.9, 1.55, 1.9, "+x");
  box(M.timberDark, 0.4, 0.44, 0.4, 4.22, 0.48, 1.0, house, true);
  box(M.cabinet, 1.4, 2.3, 0.55, 2.15, 1.41, 2.9, house, true);
  box(M.timber, 1.15, 0.05, 0.55, 1.75, 1.0, 0.78, house, true); // desk
  for (const [lx, lz] of [[1.28, 0.56], [2.22, 0.56], [1.28, 1.0], [2.22, 1.0]] as const)
    cyl(M.metal, 0.02, 0.02, 0.72, lx, 0.62, lz, house, 8);
  chair(1.75, 1.4, Math.PI);
  box(M.rug, 1.5, 0.02, 1.1, 2.8, 0.28, 1.9, house);
  ceilingLamp(3.0, 1.8, 0.12);

  // Bedroom 2
  bed(3.1, 4.95, 1.5, 1.9, "+z");
  box(M.timberDark, 0.4, 0.44, 0.4, 2.1, 0.48, 5.7, house, true);
  box(M.cabinet, 1.0, 2.3, 0.55, 1.85, 1.41, 5.65, house, true);
  box(M.timber, 1.05, 0.05, 0.5, 3.95, 1.0, 3.75, house, true); // desk
  for (const [lx, lz] of [[3.5, 3.55], [4.4, 3.55], [3.5, 3.95], [4.4, 3.95]] as const)
    cyl(M.metal, 0.02, 0.02, 0.72, lx, 0.62, lz, house, 8);
  chair(3.95, 4.3, 0);
  box(M.rug, 1.5, 0.02, 1.3, 2.9, 0.28, 4.1, house);
  plant(4.3, 5.75, 0.9);
  ceilingLamp(3.1, 4.6, 0.12);

  // Curtains west glazing
  for (const z of [-5.0, -3.0, -0.9, 1.5]) box(M.fabricSand, 0.1, 2.6, 0.34, -4.4, 1.9, z, house);

  // ============================================================
  // SITE
  // ============================================================
  const groundG = new THREE.PlaneGeometry(140, 140);
  geometries.push(groundG);
  const ground = new THREE.Mesh(groundG, M.lawn);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  root.add(ground);

  box(M.paving, 3.0, 0.06, 2.6, 0.65, 0.07, -9.7, root);
  box(M.paving, 2.2, 0.06, 4.4, -2.6, 0.07, -8.9, root);
  box(M.asphalt, 2.4, 0.07, 3.4, 3.2, 0.08, -8.2, root);
  box(M.paving, 2.4, 0.06, 1.8, 3.2, 0.09, -9.5, root);

  box(M.plasterGrey, 8.6, 1.6, 0.3, -2.7, 0.8, -9.7, root, true);
  box(M.plasterGrey, 2.2, 1.6, 0.3, 5.7, 0.8, -9.7, root, true);
  box(M.metal, 8.6, 0.07, 0.07, -2.7, 1.72, -9.7, root);
  box(M.metal, 2.2, 0.07, 0.07, 5.7, 1.72, -9.7, root);
  for (let i = 0; i < 17; i++) cyl(M.metal, 0.02, 0.02, 0.5, -6.9 + i * 0.5, 1.45, -9.7, root, 6);
  for (let i = 0; i < 4; i++) cyl(M.metal, 0.02, 0.02, 0.5, 4.75 + i * 0.5, 1.45, -9.7, root, 6);
  for (const gx of [1.6, 4.7]) {
    box(M.plasterGrey, 0.55, 2.5, 0.55, gx, 1.25, -9.7, root, true);
    box(M.cladding, 0.62, 0.35, 0.62, gx, 2.65, -9.7, root);
    box(M.lampWarm, 0.18, 0.12, 0.18, gx, 2.9, -9.7, root);
  }
  box(M.frameDark, 2.95, 0.09, 0.09, 3.15, 2.05, -9.7, root);
  box(M.frameDark, 2.95, 0.09, 0.09, 3.15, 0.3, -9.7, root);
  for (let i = 0; i < 10; i++) cyl(M.frameDark, 0.025, 0.025, 1.75, 1.8 + i * 0.3, 1.18, -9.7, root, 6);
  box(M.plasterGrey, 0.3, 1.6, 12.9, -7.2, 0.8, -3.4, root, true);
  box(M.plasterGrey, 0.3, 1.6, 12.9, 7.2, 0.8, -3.4, root, true);
  box(M.plasterGrey, 14.7, 1.6, 0.3, 0, 0.8, 7.6, root, true);

  box(M.hedge, 5.0, 0.6, 0.7, -4.3, 0.3, -8.9, root, true);
  box(M.hedge, 0.7, 0.6, 3.4, -6.4, 0.3, -7.4, root, true);
  for (const [x, z] of [[-3.4, -8.6], [-1.8, -8.8], [5.9, -6.0], [5.9, -2.0], [-6.0, 2.0]] as const)
    sph(M.hedge, 0.36, x, 0.42, z, root, 1.4, 0.9, 1.4);
  plant(5.8, -8.6, 1.4);
  plant(-5.6, -6.5, 1.2);

  const tree = (x: number, z: number, s: number) => {
    cyl(M.trunk, 0.12 * s, 0.2 * s, 3.4 * s, x, 1.7 * s, z, root, 10);
    for (const [ox, oy, oz, r] of [
      [0, 3.8, 0, 1.5], [-0.9, 3.2, 0.4, 1.0], [0.85, 3.3, -0.5, 1.1], [0.1, 4.6, -0.1, 1.0],
    ] as const) {
      sph((ox + oz) % 2 === 0 ? M.foliage : M.foliageLight, r * s, x + ox * s, oy * s, z + oz * s, root, 1, 0.85, 1);
    }
  };
  const palm = (x: number, z: number) => {
    cyl(M.trunk, 0.11, 0.2, 5.4, x, 2.7, z, root, 10);
    for (let i = 0; i < 8; i++) {
      const f = box(M.foliage, 2.5, 0.07, 0.45, x, 5.4, z, root);
      f.rotation.y = (i * Math.PI * 2) / 8;
      f.rotation.z = 0.32;
      f.position.x = x + Math.sin((i * Math.PI * 2) / 8) * 1.15;
      f.position.z = z + Math.cos((i * Math.PI * 2) / 8) * 1.15;
    }
  };
  tree(-5.9, -4.6, 1.0);
  tree(5.9, 3.4, 0.9);
  tree(-10.5, -12.5, 1.2);
  tree(11.5, -13, 1.1);
  tree(-11, 4, 1.0);
  tree(12, 6, 1.15);
  palm(-9.2, -8.8);
  palm(9.6, -9.2);
  palm(-13, -11);
  palm(13.5, -10.5);

  for (const x of [-16, 0, 16]) {
    cyl(M.metal, 0.06, 0.09, 5.6, x, 2.8, -15.6, root, 10);
    box(M.metal, 0.95, 0.08, 0.12, x + 0.45, 5.55, -15.6, root);
    box(M.lampWarm, 0.45, 0.12, 0.26, x + 0.85, 5.5, -15.6, root);
  }

  const neighbour = (x: number, z: number, ry: number, w: number, d: number, m: THREE.Material) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(m, w, 3.4, d, 0, 1.75, 0, g);
    box(M.roof, w + 0.9, 0.25, d + 0.9, 0, 3.55, 0, g);
    box(M.glass, w * 0.6, 1.4, 0.06, 0, 1.7, -(d / 2 + 0.06), g);
    box(M.cladding, w * 0.3, 3.4, 0.08, w * 0.3, 1.75, -(d / 2 + 0.04), g);
    root.add(g);
  };
  neighbour(-17, -2, 0.2, 9, 7, M.plasterExt);
  neighbour(18, 1, -0.15, 8, 7, M.plasterGrey);
  neighbour(2, 18, Math.PI, 10, 7, M.plasterExt);

  box(M.asphalt, 140, 0.09, 6.6, 0, 0.045, -12.9, root);
  box(M.kerb, 140, 0.2, 0.35, 0, 0.1, -9.5, root);
  box(M.kerb, 140, 0.2, 0.35, 0, 0.1, -16.35, root);
  box(M.paving, 140, 0.07, 1.7, 0, 0.12, -8.55, root);
  const lineMat = mat({ color: 0xd9d4c3, roughness: 0.9 });
  for (let i = -16; i <= 16; i++) box(lineMat, 1.9, 0.02, 0.15, i * 4.2, 0.1, -12.9, root);

  // ============================================================
  // CARS — front along local +z, correct heading
  // ============================================================
  const carGeo: THREE.BufferGeometry[] = [];
  const buildCar = (body: THREE.Material) => {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-2.1, 0.35);
    shape.lineTo(-2.05, 0.62);
    shape.quadraticCurveTo(-1.6, 0.8, -1.05, 0.82);
    shape.lineTo(-0.55, 1.3);
    shape.quadraticCurveTo(0.15, 1.45, 0.85, 1.3);
    shape.lineTo(1.35, 0.84);
    shape.quadraticCurveTo(1.95, 0.78, 2.12, 0.6);
    shape.lineTo(2.1, 0.32);
    shape.quadraticCurveTo(1.4, 0.22, 0.7, 0.24);
    shape.lineTo(-0.7, 0.24);
    shape.quadraticCurveTo(-1.5, 0.22, -2.1, 0.35);
    const eg = new THREE.ExtrudeGeometry(shape, {
      depth: 1.74, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 3, curveSegments: 10,
    });
    eg.translate(0, 0, -0.87); // centre body across axle width
    carGeo.push(eg);
    const bodyMesh = new THREE.Mesh(eg, body);
    bodyMesh.rotation.y = -Math.PI / 2;
    bodyMesh.position.z = 0;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    g.add(bodyMesh);
    box(M.glassClear, 1.48, 0.4, 1.5, 0, 1.16, 0.1, g).castShadow = false;
    box(M.headlight, 0.32, 0.13, 0.06, 0.55, 0.62, 2.1, g);
    box(M.headlight, 0.32, 0.13, 0.06, -0.55, 0.62, 2.1, g);
    box(M.taillight, 0.32, 0.13, 0.06, 0.55, 0.66, -2.08, g);
    box(M.taillight, 0.32, 0.13, 0.06, -0.55, 0.66, -2.08, g);
    box(M.frameDark, 0.9, 0.18, 0.05, 0, 0.46, 2.1, g);
    box(M.porcelain, 0.34, 0.12, 0.03, 0, 0.3, 2.1, g);
    const wg = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 20);
    const rg = new THREE.CylinderGeometry(0.19, 0.19, 0.26, 14);
    carGeo.push(wg, rg);
    const wheels: THREE.Group[] = [];
    for (const [wx, wz] of [[0.86, 1.35], [-0.86, 1.35], [0.86, -1.35], [-0.86, -1.35]] as const) {
      const pivot = new THREE.Group();
      pivot.position.set(wx, 0.33, wz);
      const tire = new THREE.Mesh(wg, M.tire);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(rg, M.rim);
      rim.rotation.z = Math.PI / 2;
      rim.position.x = wx > 0 ? 0.02 : -0.02;
      pivot.add(tire, rim);
      g.add(pivot);
      wheels.push(pivot);
    }
    return { group: g, wheels };
  };

  interface Car { obj: THREE.Group; wheels: THREE.Group[]; dir: 1 | -1; x: number; speed: number }
  const cars: Car[] = [];
  const carMats = [M.carBlack, M.carWhite, M.carGreen];
  for (let i = 0; i < 3; i++) {
    const { group, wheels } = buildCar(carMats[i]);
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const lane = dir === 1 ? -11.9 : -13.9;
    group.position.set(0, 0.09, lane);
    group.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    root.add(group);
    cars.push({ obj: group, wheels, dir, x: (i - 1) * 34 + Math.random() * 12, speed: 8 + Math.random() * 4 });
  }

  // ============================================================
  // AVATAR
  // ============================================================
  const avatarGroup = new THREE.Group();
  const legL = new THREE.Group();
  const legR = new THREE.Group();
  const armL = new THREE.Group();
  const armR = new THREE.Group();
  {
    const mk = (m: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number, parent: THREE.Object3D) => {
      const mesh = box(m, w, h, d, x, y, z, parent);
      mesh.castShadow = true;
      return mesh;
    };
    mk(M.pants, 0.34, 0.34, 0.2, 0, 0.86, 0, avatarGroup);
    mk(M.shirt, 0.42, 0.52, 0.24, 0, 1.28, 0, avatarGroup);
    sph(M.shirt, 0.24, 0, 1.5, 0, avatarGroup, 1, 0.5, 0.6);
    sph(M.skin, 0.13, 0, 1.68, 0, avatarGroup);
    const hairG = new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
    geometries.push(hairG);
    const hair = new THREE.Mesh(hairG, M.hair);
    hair.position.set(0, 1.69, -0.01);
    avatarGroup.add(hair);
    for (const [grp, sx] of [[legL, -0.09], [legR, 0.09]] as const) {
      grp.position.set(sx, 0.72, 0);
      cyl(M.pants, 0.07, 0.06, 0.68, 0, -0.36, 0, grp, 8);
      mk(M.shoes, 0.15, 0.07, 0.26, 0, -0.69, 0.05, grp);
      avatarGroup.add(grp);
    }
    for (const [grp, sx] of [[armL, -0.27], [armR, 0.27]] as const) {
      grp.position.set(sx, 1.5, 0);
      cyl(M.shirt, 0.055, 0.05, 0.42, 0, -0.22, 0, grp, 8);
      cyl(M.skin, 0.045, 0.04, 0.26, 0, -0.55, 0, grp, 8);
      avatarGroup.add(grp);
    }
  }
  avatarGroup.visible = false;
  root.add(avatarGroup);
  let walkPhase = 0;
  let walkAmp = 0;
  const avatar = { group: avatarGroup, setWalk: (v: number) => { walkAmp = v; } };

  // ============================================================
  // LIGHTING RIG — physical sky + sun, warm interior
  // ============================================================
  const sky = new Sky();
  sky.scale.setScalar(2000);
  const su = sky.material.uniforms;
  su["turbidity"].value = 6;
  su["rayleigh"].value = 1.6;
  su["mieCoefficient"].value = 0.004;
  su["mieDirectionalG"].value = 0.85;
  su["sunPosition"].value.copy(SUN_DIRECTION);
  root.add(sky);

  const p1 = new THREE.PointLight(0xffe0b0, 30, 14, 2);
  p1.position.set(-2.9, 3.1, -3.9);
  root.add(p1);
  const p2 = new THREE.PointLight(0xffe0b0, 26, 13, 2);
  p2.position.set(3.0, 3.1, -4.0);
  root.add(p2);
  const p3 = new THREE.PointLight(0xfff0d8, 20, 12, 2);
  p3.position.set(0.4, 3.1, 0.6);
  root.add(p3);
  const p4 = new THREE.PointLight(0xffe8c8, 16, 10, 2);
  p4.position.set(-3.2, 3.1, 4.2);
  root.add(p4);
  const p5 = new THREE.PointLight(0xfff0d8, 14, 9, 2);
  p5.position.set(3.0, 3.1, 4.4);
  root.add(p5);

  const update = (dt: number) => {
    for (const c of cars) {
      c.x += c.dir * c.speed * dt;
      if (c.x > 65) { c.x = -65 - Math.random() * 45; c.speed = 8 + Math.random() * 4; }
      if (c.x < -65) { c.x = 65 + Math.random() * 45; c.speed = 8 + Math.random() * 4; }
      c.obj.position.x = c.x;
      const spin = (c.speed * dt) / 0.33;
      for (const w of c.wheels) w.rotation.x += c.dir * spin;
    }
    walkPhase += dt * (2 + walkAmp * 10);
    const s = Math.sin(walkPhase * 3) * 0.55 * walkAmp;
    legL.rotation.x = s;
    legR.rotation.x = -s;
    armL.rotation.x = -s * 0.8;
    armR.rotation.x = s * 0.8;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    carGeo.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    sky.geometry.dispose();
    (sky.material as THREE.Material).dispose();
  };

  return { root, roofGroup, colliders, rooms: ROOMS, avatar, update, dispose };
}
