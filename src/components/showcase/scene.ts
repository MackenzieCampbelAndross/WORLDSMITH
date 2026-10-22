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
  floorAt: (x: number, z: number) => number;
  update: (dt: number) => void;
  dispose: () => void;
}

const WALL_H = 4.0;
const T_EXT = 0.28;
const T_INT = 0.16;

export const ROOMS: RoomDef[] = [
  { id: "living", label: "Living Room", anchor: [-3.6, -5.6], view: { pos: [-2.4, 2.6, -3.0], target: [-4.8, 1.2, -6.4] } },
  { id: "dining", label: "Dining Area", anchor: [-3.2, 2.6], view: { pos: [-2.6, 2.5, 0.4], target: [-4.9, 1.2, 2.9] } },
  { id: "kitchen", label: "Kitchen", anchor: [-3.2, 5.6], view: { pos: [-2.4, 2.4, 4.4], target: [-3.9, 1.2, 7.6] } },
  { id: "utility", label: "Utility", anchor: [-5.4, 6.6], view: { pos: [-4.5, 2.2, 5.6], target: [-5.9, 1.2, 8.0] } },
  { id: "foyer", label: "Foyer", anchor: [0, -7.0], view: { pos: [0, 2.6, -9.6], target: [0, 1.4, -6.4] } },
  { id: "hall", label: "Hall", anchor: [0, -3.4], view: { pos: [-1.2, 2.8, -6.0], target: [0.8, 1.3, -2.2] } },
  { id: "passage", label: "Passage", anchor: [0, 4.6], view: { pos: [-1.2, 2.4, 1.8], target: [0.4, 1.3, 6.6] } },
  { id: "master", label: "Master Bedroom", anchor: [3.0, -5.0], view: { pos: [2.6, 2.6, -3.6], target: [5.0, 1.2, -6.4] } },
  { id: "masterbath", label: "Master Bathroom", anchor: [4.2, -1.4], view: { pos: [2.4, 2.3, -3.3], target: [4.8, 1.1, -1.0] } },
  { id: "bed3", label: "Bedroom 3", anchor: [3.2, 1.0], view: { pos: [2.4, 2.3, -0.9], target: [5.2, 1.2, 2.0] } },
  { id: "bed2", label: "Bedroom 2", anchor: [3.4, 5.2], view: { pos: [2.6, 2.3, 3.7], target: [5.2, 1.2, 6.8] } },
  { id: "porch", label: "Front Porch", anchor: [0, -10.0], view: { pos: [0, 3.0, -14.2], target: [0, 1.5, -9.4] } },
];

export const DEFAULT_VIEWS = {
  overview: { pos: new THREE.Vector3(26, 16, -30), target: new THREE.Vector3(0, 2.0, -1.0) },
  dollhouse: { pos: new THREE.Vector3(10.5, 19, -13.5), target: new THREE.Vector3(0, 0.8, 0.5) },
};

export const SPAWN: [number, number] = [0, -10.2];
export const SUN_DIRECTION = new THREE.Vector3().setFromSpherical(
  new THREE.Spherical(1, THREE.MathUtils.degToRad(90 - 11), THREE.MathUtils.degToRad(138))
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
  const sway: Array<{ obj: THREE.Object3D; amp: number; phase: number; speed: number }> = [];
  const flutter: Array<{ obj: THREE.Object3D; baseX: number; baseZ: number; amp: number; phase: number; speed: number }> = [];
  const WIND_DIR = new THREE.Vector2(0.82, 0.57).normalize();
  const windUniforms = { uTime: { value: 0 }, uWindDir: { value: WIND_DIR } };

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

  // ---------- Procedural PBR textures ----------
  const bStucco = bump(256, [4, 4], (c, s) => { c.fillStyle = "#808080"; c.fillRect(0, 0, s, s); noise(c, s, 255, 0.5); });
  const bStone = bump(512, [2, 2], (c, s) => {
    c.fillStyle = "#303030"; c.fillRect(0, 0, s, s);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      let x = 0;
      while (x < s) {
        const w = 60 + Math.random() * 110;
        const v = 120 + Math.random() * 100;
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(x + 3, r * (s / rows) + 3, w - 6, s / rows - 6);
        x += w;
      }
    }
  });
  const bPlanks = bump(256, [6, 6], (c, s) => {
    c.fillStyle = "#909090"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 32) { c.fillStyle = "#585858"; c.fillRect(0, y, s, 3); }
    noise(c, s, 200, 0.3);
  });
  const bGrout = bump(256, [7, 7], (c, s) => {
    c.fillStyle = "#c0c0c0"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#181818"; c.fillRect(0, 0, s, 6); c.fillRect(0, 0, 6, s);
  });
  const bFabric = bump(256, [3, 3], (c, s) => {
    c.fillStyle = "#8a8a8a"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 4) { c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(0, y, s, 1.4); }
    for (let x = 0; x < s; x += 4) { c.fillStyle = "rgba(0,0,0,0.28)"; c.fillRect(x, 0, 1.4, s); }
    noise(c, s, 255, 0.2);
  });
  const bLeaf = bump(256, [3, 3], (c, s) => {
    c.fillStyle = "#808080"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const v = 60 + Math.random() * 140;
      c.fillStyle = `rgba(${v},${v},${v},0.55)`;
      c.beginPath();
      c.ellipse(Math.random() * s, Math.random() * s, 2 + Math.random() * 5, 1 + Math.random() * 2, Math.random() * 3, 0, Math.PI * 2);
      c.fill();
    }
  });

  const tPlaster = tex(512, [4, 4], (c, s) => {
    c.fillStyle = "#efe9dd"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * s, y = Math.random() * s, r = 30 + Math.random() * 130;
      const tone = Math.random() > 0.5 ? "255,252,244" : "210,202,185";
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(${tone},0.10)`);
      g.addColorStop(1, `rgba(${tone},0)`);
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    noise(c, s, 255, 0.05);
  });
  const tPlasterGrey = tex(512, [4, 4], (c, s) => {
    c.fillStyle = "#d3d5d1"; c.fillRect(0, 0, s, s);
    noise(c, s, 210, 0.06);
    for (let i = 0; i < 14; i++) {
      const g = c.createLinearGradient(0, Math.random() * s, s, Math.random() * s);
      g.addColorStop(0, "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(120,125,120,0.05)");
      c.fillStyle = g; c.fillRect(0, 0, s, s);
    }
  });
  const tStoneClad = tex(512, [2, 2], (c, s) => {
    c.fillStyle = "#232527"; c.fillRect(0, 0, s, s);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      let x = 0;
      while (x < s) {
        const w = 60 + Math.random() * 110;
        const base = 46 + Math.random() * 34;
        c.fillStyle = `rgb(${base},${base + 3},${base + 1})`;
        c.fillRect(x + 2, r * (s / rows) + 2, w - 4, s / rows - 4);
        c.fillStyle = "rgba(255,255,255,0.08)";
        c.fillRect(x + 2, r * (s / rows) + 2, w - 4, 3);
        c.fillStyle = "rgba(0,0,0,0.4)";
        c.fillRect(x + 2, r * (s / rows) + s / rows - 5, w - 4, 3);
        x += w;
      }
    }
    noise(c, s, 255, 0.14);
  });
  const tMarble = tex(512, [4, 4], (c, s) => {
    c.fillStyle = "#ede9df"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 18; i++) {
      c.strokeStyle = `rgba(${140 + Math.random() * 45},${135 + Math.random() * 45},${120 + Math.random() * 45},${0.10 + Math.random() * 0.16})`;
      c.lineWidth = 0.6 + Math.random() * 2.6;
      c.beginPath();
      let x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 9; k++) { x += (Math.random() - 0.5) * 140; y += (Math.random() - 0.5) * 140; c.quadraticCurveTo(x + 34, y - 34, x, y); }
      c.stroke();
    }
    noise(c, s, 244, 0.03);
    c.strokeStyle = "rgba(150,145,132,0.5)"; c.lineWidth = 3;
    for (let i = 0; i <= s; i += s / 2) {
      c.beginPath(); c.moveTo(i, 0); c.lineTo(i, s); c.stroke();
      c.beginPath(); c.moveTo(0, i); c.lineTo(s, i); c.stroke();
    }
  });
  const tWood = tex(512, [6, 6], (c, s) => {
    c.fillStyle = "#9a7850"; c.fillRect(0, 0, s, s);
    for (let band = 0; band < 10; band++) {
      const base = 120 + Math.random() * 42;
      c.fillStyle = `rgb(${base},${base * 0.72},${base * 0.47})`;
      const y = band * (s / 10);
      c.fillRect(0, y, s, s / 10 - 2);
      for (let i = 0; i < 12; i++) {
        c.strokeStyle = `rgba(${64 + Math.random() * 40},${42 + Math.random() * 26},${22 + Math.random() * 16},${0.22 + Math.random() * 0.2})`;
        c.lineWidth = 0.7 + Math.random() * 1.7;
        c.beginPath();
        const y0 = y + Math.random() * (s / 10);
        c.moveTo(0, y0);
        for (let x = 0; x <= s; x += 12) c.lineTo(x, y0 + Math.sin(x * 0.035 + i * 2.6 + band) * 3.2);
        c.stroke();
      }
      c.fillStyle = "rgba(48,30,16,0.6)";
      c.fillRect(0, y + s / 10 - 2, s, 2);
    }
  });
  const tTileGrey = tex(512, [8, 8], (c, s) => {
    c.fillStyle = "#8f9692"; c.fillRect(0, 0, s, s);
    c.fillStyle = "#b0b6b2"; c.fillRect(6, 6, s - 12, s - 12);
    c.fillStyle = "rgba(255,255,255,0.15)"; c.fillRect(6, 6, s - 12, 3);
    noise(c, s, 190, 0.07);
  });
  const tLawn = tex(512, [120, 120], (c, s) => {
    c.fillStyle = "#466d4b"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 12000; i++) {
      c.fillStyle = `rgba(${26 + Math.random() * 44},${56 + Math.random() * 78},${36 + Math.random() * 40},0.4)`;
      const x = Math.random() * s, y = Math.random() * s;
      c.fillRect(x, y, 1.6, 5);
    }
    for (let i = 0; i < 260; i++) {
      c.fillStyle = "rgba(120,110,70,0.08)";
      c.beginPath(); c.arc(Math.random() * s, Math.random() * s, 10 + Math.random() * 40, 0, Math.PI * 2); c.fill();
      c.fillStyle = "rgba(150,170,95,0.05)";
      c.beginPath(); c.arc(Math.random() * s, Math.random() * s, 16 + Math.random() * 46, 0, Math.PI * 2); c.fill();
    }
  });
  const tAsphalt = tex(512, [12, 2], (c, s) => {
    c.fillStyle = "#33363a"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 7000; i++) {
      const v = 30 + Math.random() * 55;
      c.fillStyle = `rgba(${v},${v},${v + 6},0.25)`;
      c.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4);
    }
    for (let i = 0; i < 12; i++) {
      c.strokeStyle = "rgba(18,18,20,0.25)"; c.lineWidth = 1 + Math.random() * 2;
      c.beginPath();
      const x = Math.random() * s, y = Math.random() * s;
      c.moveTo(x, y);
      for (let k = 0; k < 4; k++) c.lineTo(x + (Math.random() - 0.5) * 90, y + (Math.random() - 0.5) * 90);
      c.stroke();
    }
  });
  const tFabric = tex(512, [2, 2], (c, s) => {
    c.fillStyle = "#6f7f74"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 3) { c.fillStyle = "rgba(255,255,255,0.055)"; c.fillRect(0, y, s, 1); }
    for (let x = 0; x < s; x += 3) { c.fillStyle = "rgba(0,0,0,0.055)"; c.fillRect(x, 0, 1, s); }
    noise(c, s, 170, 0.07);
  });
  const tRug = tex(512, [1, 1], (c, s) => {
    c.fillStyle = "#b3a88e"; c.fillRect(0, 0, s, s);
    c.strokeStyle = "rgba(88,78,58,0.55)"; c.lineWidth = 16; c.strokeRect(24, 24, s - 48, s - 48);
    c.strokeStyle = "rgba(140,120,90,0.6)"; c.lineWidth = 4; c.strokeRect(56, 56, s - 112, s - 112);
    c.strokeStyle = "rgba(95,120,100,0.4)"; c.lineWidth = 3;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(s / 2, s / 2, 30 + i * 22, 0, Math.PI * 2); c.stroke(); }
    noise(c, s, 200, 0.07);
  });
  const tPaving = tex(512, [6, 6], (c, s) => {
    c.fillStyle = "#7d7a70"; c.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 128) for (let x = 0; x < s; x += 128) {
      const v = 152 + Math.random() * 34;
      c.fillStyle = `rgb(${v},${v - 4},${v - 12})`;
      c.fillRect(x + 3, y + 3, 122, 122);
      c.fillStyle = "rgba(255,255,255,0.06)"; c.fillRect(x + 3, y + 3, 122, 5);
    }
    noise(c, s, 210, 0.06);
  });
  const tCeiling = tex(256, [4, 4], (c, s) => { c.fillStyle = "#f4f1e8"; c.fillRect(0, 0, s, s); noise(c, s, 250, 0.03); });

  const mat = (opts: Partial<THREE.MeshStandardMaterialParameters>) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02, ...opts });
    materials.push(m);
    return m;
  };

  const M = {
    plasterExt: mat({ map: tPlaster, bumpMap: bStucco, bumpScale: 0.06, roughness: 0.92 }),
    plasterGrey: mat({ map: tPlasterGrey, bumpMap: bStucco, bumpScale: 0.05, roughness: 0.9 }),
    cladding: mat({ map: tStoneClad, bumpMap: bStone, bumpScale: 0.16, roughness: 0.86 }),
    wallInt: mat({ map: tPlaster, bumpMap: bStucco, bumpScale: 0.035, roughness: 0.95 }),
    ceiling: mat({ map: tCeiling, roughness: 0.95 }),
    floorTile: mat({ map: tMarble, bumpMap: bGrout, bumpScale: 0.02, roughness: 0.2, metalness: 0.05, envMapIntensity: 1.3 }),
    floorWood: mat({ map: tWood, bumpMap: bPlanks, bumpScale: 0.05, roughness: 0.42, envMapIntensity: 0.9 }),
    floorTileGrey: mat({ map: tTileGrey, bumpMap: bGrout, bumpScale: 0.03, roughness: 0.28, envMapIntensity: 1.1 }),
    lawn: mat({ map: tLawn, roughness: 1 }),
    asphalt: mat({ map: tAsphalt, roughness: 0.95 }),
    kerb: mat({ color: 0x9a9891, bumpMap: bStucco, bumpScale: 0.03, roughness: 0.95 }),
    paving: mat({ map: tPaving, bumpMap: bGrout, bumpScale: 0.05, roughness: 0.85 }),
    roof: mat({ color: 0xe6e1d5, bumpMap: bStucco, bumpScale: 0.03, roughness: 0.9 }),
    fascia: mat({ color: 0xf2efe7, roughness: 0.7 }),
    timber: mat({ map: tWood, color: 0xb08d60, bumpMap: bPlanks, bumpScale: 0.04, roughness: 0.5 }),
    timberDark: mat({ map: tWood, color: 0x6b4e35, bumpMap: bPlanks, bumpScale: 0.035, roughness: 0.5 }),
    doorWood: mat({ map: tWood, color: 0x7a5636, roughness: 0.38, envMapIntensity: 0.9 }),
    frameDark: mat({ color: 0x24282b, roughness: 0.32, metalness: 0.6 }),
    glass: mat({ color: 0xa8c8d8, roughness: 0.02, metalness: 0.35, transparent: true, opacity: 0.24, envMapIntensity: 2.4 }),
    glassClear: mat({ color: 0xd7ecef, roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.16, envMapIntensity: 2.6 }),
    metal: mat({ color: 0xa8adac, roughness: 0.22, metalness: 0.92 }),
    brass: mat({ color: 0xc9a86a, roughness: 0.25, metalness: 0.9 }),
    fabric: mat({ map: tFabric, bumpMap: bFabric, bumpScale: 0.02, roughness: 0.97 }),
    fabricSand: mat({ map: tFabric, color: 0xd8cbb0, bumpMap: bFabric, bumpScale: 0.02, roughness: 0.97 }),
    bedding: mat({ map: tFabric, color: 0xf5f0e4, bumpMap: bFabric, bumpScale: 0.015, roughness: 0.96 }),
    rug: mat({ map: tRug, roughness: 1 }),
    porcelain: mat({ color: 0xf7f5ef, roughness: 0.1, envMapIntensity: 1.6 }),
    counter: mat({ color: 0x6e7573, bumpMap: bStone, bumpScale: 0.025, roughness: 0.1, metalness: 0.14, envMapIntensity: 1.8 }),
    cabinet: mat({ map: tWood, color: 0x2f4f43, roughness: 0.28, envMapIntensity: 1.1 }),
    foliageA: mat({ color: 0x38603f, bumpMap: bLeaf, bumpScale: 0.35, roughness: 0.95, flatShading: true }),
    foliageB: mat({ color: 0x4c7a4c, bumpMap: bLeaf, bumpScale: 0.35, roughness: 0.95, flatShading: true }),
    foliageC: mat({ color: 0x5f8a55, bumpMap: bLeaf, bumpScale: 0.35, roughness: 0.95, flatShading: true }),
    foliageLight: mat({ color: 0x6f9a5c, bumpMap: bLeaf, bumpScale: 0.3, roughness: 1, flatShading: true }),
    trunk: mat({ color: 0x54422f, bumpMap: bPlanks, bumpScale: 0.12, roughness: 1 }),
    hedge: mat({ color: 0x2f5138, bumpMap: bLeaf, bumpScale: 0.25, roughness: 1, flatShading: true }),
    lampWarm: mat({ color: 0xfff1d0, emissive: 0xffd99e, emissiveIntensity: 2.4, roughness: 1 }),
    art1: mat({ color: 0x87a596, roughness: 0.9 }),
    art2: mat({ color: 0xc08a5c, roughness: 0.9 }),
    art3: mat({ color: 0x2e4638, roughness: 0.9 }),
    carBlack: mat({ color: 0x14181c, roughness: 0.08, metalness: 0.9, envMapIntensity: 2.6 }),
    carWhite: mat({ color: 0xeae8e1, roughness: 0.1, metalness: 0.85, envMapIntensity: 2.6 }),
    carGreen: mat({ color: 0x24463a, roughness: 0.12, metalness: 0.85, envMapIntensity: 2.4 }),
    carSilver: mat({ color: 0x9aa2a6, roughness: 0.12, metalness: 0.92, envMapIntensity: 2.4 }),
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
    const g = new THREE.SphereGeometry(r, 16, 12);
    geometries.push(g);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const addCollider = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    colliders.push(
      new THREE.Box3(
        new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2),
        new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)
      )
    );
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
      const isDoorway = sill < 0.02;
      if (gh > 0.2) {
        const fx = horizontal ? mid : fixed;
        const fz = horizontal ? fixed : mid;
        if (!isDoorway) {
          const glass = horizontal
            ? box(M.glass, gw - 0.08, gh - 0.08, 0.04, fx, sill + gh / 2, fz)
            : box(M.glass, 0.04, gh - 0.08, gw - 0.08, fx, sill + gh / 2, fz);
          glass.castShadow = false;
          const n = Math.max(1, Math.round(gw / 1.35));
          for (let i = 1; i < n; i++) {
            const f = i / n;
            if (horizontal) box(M.frameDark, 0.06, gh, 0.08, o.a + gw * f, sill + gh / 2, fz);
            else box(M.frameDark, 0.08, gh, 0.06, fx, sill + gh / 2, o.a + gw * f);
          }
        }
        const f1 = horizontal
          ? box(M.frameDark, gw, 0.07, t + 0.06, fx, sill + 0.035, fz)
          : box(M.frameDark, t + 0.06, 0.07, gw, fx, sill + 0.035, fz);
        const f2 = horizontal
          ? box(M.frameDark, gw, 0.07, t + 0.06, fx, head - 0.035, fz)
          : box(M.frameDark, t + 0.06, 0.07, gw, fx, head - 0.035, fz);
        const f3 = horizontal
          ? box(M.frameDark, 0.07, gh, t + 0.06, o.a + 0.035, sill + gh / 2, fz)
          : box(M.frameDark, t + 0.06, gh, 0.07, fx, sill + gh / 2, o.a + 0.035);
        const f4 = horizontal
          ? box(M.frameDark, 0.07, gh, t + 0.06, o.b - 0.035, sill + gh / 2, fz)
          : box(M.frameDark, t + 0.06, gh, 0.07, fx, sill + gh / 2, o.b - 0.035);
        for (const f of [f1, f2, f3, f4]) f.receiveShadow = true;
        if (!isDoorway) {
          if (horizontal) box(M.counter, gw + 0.16, 0.08, t + 0.2, fx, sill - 0.02, fz);
          else box(M.counter, t + 0.2, 0.08, gw + 0.16, fx, sill - 0.02, fz);
        }
      }
      cursor = o.b;
    }
    seg(cursor, to, 0, WALL_H);
  };

  // ============================================================
  // VILLA SHELL — 13.2 × 17.2 m footprint, open foyer→hall spine
  // ============================================================
  const house = new THREE.Group();
  root.add(house);

  box(M.plasterGrey, 13.9, 0.2, 17.9, 0, 0.1, 0, house);
  box(M.counter, 13.5, 0.06, 17.5, 0, 0.22, 0, house);

  const floor = (m: THREE.Material, w: number, d: number, x: number, z: number) =>
    box(m, w, 0.04, d, x, 0.25, z, house);

  floor(M.floorTile, 4.58, 6.78, -4.17, -5.07);
  floor(M.floorTile, 4.58, 5.44, -4.17, 1.2);
  floor(M.floorTileGrey, 2.54, 4.38, -3.15, 6.27);
  floor(M.floorTileGrey, 1.88, 4.38, -5.52, 6.27);
  floor(M.floorTile, 3.44, 6.78, 0, -5.07);
  floor(M.floorTile, 3.44, 2.64, 0, -0.2);
  floor(M.floorTile, 3.44, 7.18, 0, 4.87);
  floor(M.floorWood, 4.58, 5.58, 4.17, -5.67);
  floor(M.floorTileGrey, 4.58, 2.44, 4.17, -1.5);
  floor(M.floorWood, 4.58, 3.54, 4.17, 1.65);
  floor(M.floorWood, 4.58, 4.88, 4.17, 6.02);

  // ---- Perimeter ----
  wall(true, -8.6, -6.6, 6.6, [
    { a: -5.9, b: -2.4, sill: 0.15, head: 3.6 },
    { a: -0.6, b: 0.6, head: 3.3 },
    { a: 2.4, b: 5.8, sill: 1.0, head: 3.5 },
  ], M.plasterExt);
  wall(true, 8.6, -6.6, 6.6, [
    { a: -6.0, b: -4.9, sill: 1.3, head: 3.4 },
    { a: -4.2, b: -2.3, sill: 1.3, head: 3.4 },
    { a: 0.2, b: 1.2, head: 3.2 },
    { a: 2.8, b: 5.9, sill: 0.95, head: 3.5 },
  ], M.plasterExt);
  wall(false, -6.6, -8.6, 8.6, [
    { a: -7.7, b: -4.3, sill: 0.15, head: 3.6 },
    { a: -3.2, b: -0.2, sill: 0.9, head: 3.4 },
    { a: 5.0, b: 7.4, sill: 1.3, head: 3.4 },
  ], M.plasterExt);
  wall(false, 6.6, -8.6, 8.6, [
    { a: -7.2, b: -4.6, sill: 1.0, head: 3.5 },
    { a: -2.3, b: -0.9, sill: 2.1, head: 3.4 },
    { a: 0.6, b: 2.8, sill: 0.95, head: 3.4 },
    { a: 4.6, b: 6.8, sill: 0.95, head: 3.4 },
  ], M.plasterExt);

  // ---- Internal walls ----
  const IW = M.wallInt;
  wall(false, -1.8, -8.6, 8.6, [
    { a: -6.4, b: -5.0, head: 3.4 },
    { a: 6.5, b: 7.7, head: 3.2 },
  ], IW, T_INT);
  wall(false, 1.8, -8.6, 8.6, [
    { a: -5.2, b: -4.0, head: 3.2 },
    { a: 1.4, b: 2.5, head: 3.2 },
    { a: 4.8, b: 5.9, head: 3.2 },
  ], IW, T_INT);
  wall(true, -1.6, -6.6, -1.8, [{ a: -4.9, b: -2.4, head: 3.4 }], IW, T_INT);
  wall(true, 4.0, -6.6, -1.8, [{ a: -4.1, b: -2.4, head: 3.4 }], IW, T_INT);
  wall(false, -4.5, 4.0, 8.6, [{ a: 6.5, b: 7.5, head: 3.2 }], IW, T_INT);
  wall(true, -2.8, 1.8, 6.6, [{ a: 2.7, b: 3.8, head: 3.2 }], IW, T_INT);
  wall(true, -0.2, 1.8, 6.6, [], IW, T_INT);
  wall(true, 3.5, 1.8, 6.6, [], IW, T_INT);

  // Entrance door (open inward) + handle
  box(M.doorWood, 0.06, 3.05, 1.14, 0.62, 1.8, -8.02, house);
  box(M.brass, 0.05, 0.36, 0.04, 0.6, 1.45, -8.55, house);
  box(M.brass, 0.05, 0.36, 0.04, 0.6, 1.45, -7.5, house);
  box(M.glass, 0.02, 1.2, 0.5, 0.59, 2.45, -7.95, house);

  // Skirting boards
  const skirt = (w: number, d: number, x: number, z: number) => box(M.timberDark, w, 0.12, d, x, 0.33, z, house);
  skirt(4.5, 0.045, -4.17, -8.44); skirt(0.045, 6.7, -6.44, -5.07);
  skirt(2.3, 0.045, -5.27, 3.9); skirt(0.5, 0.045, -2.17, 3.9);
  skirt(0.045, 5.3, -6.44, 1.2);
  skirt(4.5, 0.045, 4.17, -8.44); skirt(0.045, 5.5, 6.44, -5.67);
  skirt(1.12, 0.045, -1.16, -8.44); skirt(1.12, 0.045, 1.16, -8.44);
  skirt(4.5, 0.045, 4.17, 8.44);
  skirt(0.045, 4.8, 6.44, 6.02);

  // ---- Exterior character ----
  box(M.cladding, 1.3, 4.0, 0.08, 1.55, 2.0, -8.75, house);
  box(M.cladding, 1.3, 4.0, 0.08, -1.65, 2.0, -8.75, house);
  box(M.cladding, 0.08, 4.0, 1.7, 6.75, 2.0, -3.35, house);
  box(M.cladding, 3.0, 4.0, 0.08, 4.2, 2.0, 8.72, house);
  for (let i = 0; i < 7; i++) cyl(M.timber, 0.055, 0.055, 3.9, -2.85 + i * 0.17, 2.05, -8.78, house, 8);
  box(M.fascia, 2.7, 0.36, 0.16, -1.75, 3.95, -8.82, house);
  // entry canopy + sconces
  box(M.timber, 2.5, 0.12, 1.5, 0, 3.45, -9.3, roofGroup);
  box(M.fascia, 2.7, 0.22, 1.65, 0, 3.6, -9.3, roofGroup);
  for (const lx of [-1.35, 1.35]) {
    box(M.frameDark, 0.12, 0.4, 0.12, lx, 2.7, -8.78, house);
    box(M.lampWarm, 0.1, 0.24, 0.1, lx, 2.66, -8.78, house);
  }

  // ---- Ceiling + roof ----
  box(M.ceiling, 13.1, 0.1, 17.1, 0, WALL_H + 0.05, 0, roofGroup);
  for (const [w, d, x, z] of [
    [4.4, 6.6, -4.17, -5.07], [4.4, 5.3, -4.17, 1.2], [4.4, 5.4, 4.17, -5.67],
    [3.3, 6.6, 0, -5.07], [4.4, 3.4, 4.17, 1.65], [4.4, 4.7, 4.17, 6.02],
  ] as const) {
    box(M.ceiling, w, 0.06, d, x, WALL_H - 0.02, z, roofGroup);
  }
  const roofSlab = box(M.roof, 14.6, 0.28, 18.6, 0, WALL_H + 0.24, 0, roofGroup);
  roofSlab.receiveShadow = true;
  box(M.fascia, 14.7, 0.42, 0.14, 0, WALL_H + 0.32, -9.36, roofGroup);
  box(M.fascia, 14.7, 0.42, 0.14, 0, WALL_H + 0.32, 9.36, roofGroup);
  box(M.fascia, 0.14, 0.42, 18.8, -7.36, WALL_H + 0.32, 0, roofGroup);
  box(M.fascia, 0.14, 0.42, 18.8, 7.36, WALL_H + 0.32, 0, roofGroup);
  // raised master volume
  box(M.plasterExt, 5.2, 0.8, 6.0, 4.17, WALL_H + 0.72, -5.67, roofGroup);
  box(M.roof, 5.7, 0.2, 6.5, 4.17, WALL_H + 1.2, -5.67, roofGroup);
  box(M.cladding, 5.2, 0.82, 0.08, 4.17, WALL_H + 0.72, -8.7, roofGroup);

  // ---- Covered porch ----
  box(M.floorTileGrey, 6.8, 0.1, 2.7, 0, 0.24, -9.95, house);
  for (const px of [-2.9, 2.9]) {
    box(M.plasterGrey, 0.42, 0.16, 0.42, px, 0.36, -10.9, house);
    cyl(M.plasterGrey, 0.13, 0.15, 3.4, px, 2.2, -10.9, house, 14);
    box(M.plasterGrey, 0.36, 0.14, 0.36, px, 3.94, -10.9, house);
  }
  box(M.fascia, 7.4, 0.26, 3.0, 0, WALL_H + 0.05, -9.95, roofGroup);
  box(M.timber, 7.0, 0.12, 2.8, 0, WALL_H - 0.12, -9.95, roofGroup);
  box(M.kerb, 6.4, 0.14, 0.5, 0, 0.12, -11.55, house);
  box(M.kerb, 6.0, 0.1, 0.4, 0, 0.06, -11.95, house);
  box(M.timber, 1.9, 0.09, 0.52, -2.1, 0.58, -10.35, house, true);
  for (const [lx, lz] of [[-2.95, -10.6], [-1.25, -10.6], [-2.95, -10.1], [-1.25, -10.1]] as const)
    cyl(M.timberDark, 0.035, 0.04, 0.42, lx, 0.4, lz, house, 8);
  const porchPlants: Array<[number, number]> = [[-2.9, -9.3], [2.9, -9.3]];
  for (const [px, pz] of porchPlants) cyl(M.timberDark, 0.24, 0.19, 0.5, px, 0.52, pz, house, 14);

  // ============================================================
  // FURNISHING — generous circulation loops
  // ============================================================
  const sofa = (x: number, z: number, w: number, d: number, back: "-x" | "+x" | "-z" | "+z") => {
    box(M.fabric, w, 0.34, d, x, 0.44, z, house, true);
    box(M.fabric, w - 0.08, 0.16, d - 0.08, x, 0.62, z, house);
    const bw = back === "-x" || back === "+x" ? 0.24 : w;
    const bd = back === "-x" || back === "+x" ? d : 0.24;
    const bx = back === "-x" ? -(w / 2 - 0.12) : back === "+x" ? w / 2 - 0.12 : 0;
    const bz = back === "-z" ? -(d / 2 - 0.12) : back === "+z" ? d / 2 - 0.12 : 0;
    box(M.fabric, bw, 0.66, bd, x + bx, 0.78, z + bz, house);
    if (back === "-x" || back === "+x") {
      for (const sz of [-1, 1]) box(M.fabric, w, 0.32, 0.18, x, 0.7, z + sz * (d / 2 - 0.09), house);
    } else {
      for (const sx of [-1, 1]) box(M.fabric, 0.18, 0.32, d, x + sx * (w / 2 - 0.09), 0.7, z, house);
    }
    const n = Math.max(2, Math.round((back === "-x" || back === "+x" ? d : w) / 0.85));
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      const cx = back === "-z" || back === "+z" ? x + t * (w - 0.5) : x + bx * 0.5;
      const cz = back === "-x" || back === "+x" ? z + t * (d - 0.5) : z + bz * 0.5;
      box(M.fabricSand, back === "-x" || back === "+x" ? 0.18 : 0.56, 0.44, back === "-x" || back === "+x" ? 0.56 : 0.18, cx, 0.82, cz, house);
    }
    for (const [lx, lz] of [[-w / 2 + 0.1, -d / 2 + 0.1], [w / 2 - 0.1, -d / 2 + 0.1], [-w / 2 + 0.1, d / 2 - 0.1], [w / 2 - 0.1, d / 2 - 0.1]] as const)
      cyl(M.brass, 0.018, 0.024, 0.16, x + lx, 0.33, z + lz, house, 8);
    const px = back === "-x" ? x + w * 0.18 : back === "+x" ? x - w * 0.18 : x + w * 0.3;
    const pz = back === "-z" ? z + d * 0.18 : back === "+z" ? z - d * 0.18 : z - d * 0.3;
    sph(M.art2, 0.19, px, 0.88, pz, house, 0.9, 0.9, 0.5);
  };

  const armchair = (x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    house.add(g);
    box(M.fabricSand, 0.9, 0.3, 0.86, 0, 0.44, 0, g);
    box(M.fabricSand, 0.78, 0.16, 0.74, 0, 0.62, 0.02, g);
    box(M.fabricSand, 0.9, 0.56, 0.2, 0, 0.82, -0.35, g);
    for (const sx of [-1, 1]) box(M.fabricSand, 0.16, 0.28, 0.8, sx * 0.37, 0.72, 0, g);
    for (const [lx, lz] of [[-0.36, -0.34], [0.36, -0.34], [-0.36, 0.34], [0.36, 0.34]] as const)
      cyl(M.brass, 0.018, 0.022, 0.18, lx, 0.34, lz, g, 8);
    sph(M.art1, 0.18, 0.1, 0.88, -0.22, g, 0.9, 0.9, 0.5);
  };

  const plant = (x: number, z: number, s = 1) => {
    cyl(M.porcelain, 0.21 * s, 0.16 * s, 0.42 * s, x, 0.46 * s, z, house, 14);
    sph(M.foliageLight, 0.3 * s, x, 0.9 * s, z, house);
    sph(M.foliageA, 0.26 * s, x + 0.15 * s, 1.12 * s, z - 0.1 * s, house);
    sph(M.foliageB, 0.22 * s, x - 0.16 * s, 1.2 * s, z + 0.09 * s, house);
  };
  const ceilingLamp = (x: number, z: number, r = 0.18) => {
    cyl(M.metal, 0.015, 0.015, 0.3, x, WALL_H - 0.18, z, house, 6);
    const g = new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    geometries.push(g);
    const shade = new THREE.Mesh(g, M.lampWarm);
    shade.position.set(x, WALL_H - 0.32, z);
    shade.rotation.x = Math.PI;
    house.add(shade);
  };
  const downlight = (x: number, z: number) => {
    const g = new THREE.CylinderGeometry(0.075, 0.075, 0.02, 14);
    geometries.push(g);
    const m = new THREE.Mesh(g, M.lampWarm);
    m.position.set(x, WALL_H - 0.04, z);
    house.add(m);
    cyl(M.frameDark, 0.09, 0.09, 0.012, x, WALL_H - 0.05, z, house, 14);
  };
  const pendant = (x: number, z: number, drop: number) => {
    cyl(M.brass, 0.012, 0.012, drop, x, WALL_H - drop / 2 - 0.1, z, house, 6);
    const cone = new THREE.ConeGeometry(0.18, 0.22, 18, 1, true);
    geometries.push(cone);
    const shade = new THREE.Mesh(cone, M.brass);
    shade.position.set(x, WALL_H - drop - 0.12, z);
    shade.castShadow = true;
    house.add(shade);
    sph(M.lampWarm, 0.06, x, WALL_H - drop - 0.21, z, house);
  };
  const chair = (x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    house.add(g);
    box(M.timberDark, 0.46, 0.05, 0.46, 0, 0.5, 0, g);
    box(M.timberDark, 0.46, 0.6, 0.05, 0, 0.82, -0.2, g);
    box(M.fabricSand, 0.42, 0.07, 0.42, 0, 0.56, 0, g);
    for (const [lx, lz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]] as const)
      cyl(M.timberDark, 0.022, 0.026, 0.5, lx, 0.27, lz, g, 8);
  };
  const bed = (cx: number, cz: number, w: number, d: number, head: "-x" | "+x" | "-z" | "+z") => {
    box(M.timberDark, w, 0.34, d, cx, 0.45, cz, house, true);
    box(M.bedding, w - 0.08, 0.22, d - 0.08, cx, 0.68, cz, house);
    box(M.fabricSand, w * 0.92, 0.08, d * 0.5, cx + (head === "+x" ? -w * 0.16 : head === "-x" ? w * 0.16 : 0), 0.82, cz + (head === "+z" ? -d * 0.16 : head === "-z" ? d * 0.16 : 0), house);
    const hx = head === "-x" ? -(w / 2 + 0.06) : head === "+x" ? w / 2 + 0.06 : 0;
    const hz = head === "-z" ? -(d / 2 + 0.06) : head === "+z" ? d / 2 + 0.06 : 0;
    if (head === "-x" || head === "+x") box(M.timberDark, 0.12, 1.2, d + 0.14, cx + hx, 0.98, cz, house);
    else box(M.timberDark, w + 0.14, 1.2, 0.12, cx, 0.98, cz + hz, house);
    const pillows: Array<[number, number, number, number, number, number]> =
      head === "-x" || head === "+x"
        ? [
            [cx + hx * 0.72, 0.93, cz - d * 0.24, 0.6, 0.32, 0.9],
            [cx + hx * 0.72, 0.93, cz + d * 0.24, 0.6, 0.32, 0.9],
          ]
        : [
            [cx - w * 0.24, 0.93, cz + hz * 0.72, 0.9, 0.32, 0.6],
            [cx + w * 0.24, 0.93, cz + hz * 0.72, 0.9, 0.32, 0.6],
          ];
    for (const [px, py, pz, sx, sy, sz] of pillows) sph(M.bedding, 0.28, px, py, pz, house, sx, sy, sz);
  };
  const nightstand = (x: number, z: number) => {
    box(M.timberDark, 0.48, 0.5, 0.48, x, 0.52, z, house);
    box(M.timber, 0.5, 0.04, 0.5, x, 0.79, z, house);
    box(M.frameDark, 0.36, 0.02, 0.02, x, 0.68, z + 0.245, house);
    cyl(M.brass, 0.012, 0.012, 0.1, x, 0.6, z + 0.28, house, 8).rotation.x = Math.PI / 2;
    cyl(M.porcelain, 0.09, 0.11, 0.3, x, 0.95, z, house, 12);
    cyl(M.lampWarm, 0.11, 0.08, 0.22, x, 1.18, z, house, 12);
  };
  const wardrobe = (x: number, z: number, w: number, d: number) => {
    box(M.cabinet, w, 2.5, d, x, 1.52, z, house, true);
    box(M.timber, w + 0.04, 0.05, d + 0.04, x, 2.79, z, house);
    const n = Math.max(2, Math.round(w / 0.55));
    for (let i = 1; i < n; i++) box(M.timberDark, 0.015, 2.4, 0.02, x - w / 2 + (w * i) / n, 1.5, z + d / 2 + 0.01, house);
    for (const sx of [-0.12, 0.12]) cyl(M.brass, 0.012, 0.012, 0.22, x + sx, 1.5, z + d / 2 + 0.03, house, 8);
  };
  const desk = (x: number, z: number, w: number, d: number) => {
    box(M.timber, w, 0.06, d, x, 1.0, z, house, true);
    for (const [lx, lz] of [[-w / 2 + 0.07, -d / 2 + 0.07], [w / 2 - 0.07, -d / 2 + 0.07], [-w / 2 + 0.07, d / 2 - 0.07], [w / 2 - 0.07, d / 2 - 0.07]] as const)
      cyl(M.metal, 0.02, 0.022, 0.72, x + lx, 0.63, z + lz, house, 8);
    box(M.frameDark, 0.5, 0.34, 0.03, x, 1.35, z - d / 2 + 0.25, house);
    box(M.porcelain, 0.16, 0.16, 0.16, x + w * 0.25, 1.1, z, house);
    cyl(M.art1, 0.04, 0.03, 0.26, x + w * 0.25, 1.3, z, house, 8);
  };
  const wc = (x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    house.add(g);
    addCollider(0.58, 0.6, 0.5, x, 0.45, z);
    box(M.porcelain, 0.4, 0.36, 0.54, 0, 0.44, 0.05, g);
    const bowl = new THREE.SphereGeometry(0.2, 16, 10);
    geometries.push(bowl);
    const b = new THREE.Mesh(bowl, M.porcelain);
    b.position.set(0, 0.6, 0.12);
    b.scale.set(1, 0.4, 1.3);
    g.add(b);
    box(M.porcelain, 0.44, 0.5, 0.2, 0, 0.75, -0.22, g);
    box(M.counter, 0.4, 0.04, 0.52, 0, 0.65, 0.04, g);
  };
  const vanity = (x: number, z: number, w: number) => {
    box(M.cabinet, w, 0.72, 0.5, x, 0.63, z, house, true);
    box(M.counter, w + 0.06, 0.06, 0.56, x, 1.03, z, house);
    box(M.porcelain, w * 0.5, 0.12, 0.36, x, 1.09, z, house);
    cyl(M.brass, 0.016, 0.016, 0.26, x, 1.25, z - 0.2, house, 8);
    box(M.brass, w * 0.9, 0.85, 0.03, x, 1.75, z + 0.28, house);
    box(M.frameDark, w * 0.94, 0.9, 0.02, x, 1.75, z + 0.3, house);
  };
  const tub = (x: number, z: number, w: number, d: number) => {
    box(M.porcelain, w, 0.52, d, x, 0.52, z, house, true);
    box(M.floorTileGrey, w - 0.18, 0.06, d - 0.18, x, 0.72, z, house);
    for (const [bw, bd, bx, bz] of [[w, 0.08, 0, -d / 2 + 0.04], [w, 0.08, 0, d / 2 - 0.04], [0.08, d, -w / 2 + 0.04, 0], [0.08, d, w / 2 - 0.04, 0]] as const)
      box(M.porcelain, bw, 0.1, bd, x + bx, 0.8, z + bz, house);
    cyl(M.brass, 0.018, 0.018, 0.3, x - w / 2 + 0.1, 0.92, z, house, 8);
    sph(M.bedding, 0.16, x, 0.86, z, house, 0.5, 0.9, 2.2);
  };

  // Living — clear 1.4 m walking corridor at z[-6.4,-5.0]
  sofa(-5.85, -3.15, 1.0, 2.7, "-x");
  box(M.timber, 1.3, 0.07, 0.7, -4.5, 0.5, -3.1, house, true);
  box(M.timber, 1.1, 0.05, 0.56, -4.5, 0.3, -3.1, house);
  for (const [lx, lz] of [[-5.0, -3.35], [-4.0, -3.35], [-5.0, -2.85], [-4.0, -2.85]] as const)
    cyl(M.metal, 0.02, 0.02, 0.36, lx, 0.3, lz, house, 8);
  box(M.rug, 3.1, 0.02, 2.3, -4.45, 0.28, -3.9, house);
  box(M.frameDark, 0.42, 0.5, 1.6, -2.25, 0.52, -3.1, house, true);
  box(M.frameDark, 0.06, 1.25, 1.7, -2.12, 1.7, -3.1, house);
  box(M.art3, 1.5, 0.9, 0.05, -6.44, 2.2, -3.0, house);
  box(M.timber, 0.04, 1.0, 1.6, -6.42, 2.2, -3.0, house);
  armchair(-4.9, -7.1, 0);
  armchair(-3.5, -7.1, 0);
  box(M.timberDark, 0.42, 0.5, 0.42, -4.2, 0.51, -7.3, house);
  sph(M.art2, 0.1, -4.2, 0.85, -7.3, house, 1, 1.3, 1);
  plant(-6.0, -8.0, 1.2);
  plant(-2.5, -7.9, 0.95);
  cyl(M.metal, 0.028, 0.045, 1.7, -2.6, 1.1, -7.7, house, 10);
  const lampShadeG = new THREE.ConeGeometry(0.22, 0.28, 18, 1, true);
  geometries.push(lampShadeG);
  const lampShade = new THREE.Mesh(lampShadeG, M.lampWarm);
  lampShade.position.set(-2.6, 2.05, -7.7);
  house.add(lampShade);
  ceilingLamp(-4.2, -5.2);
  downlight(-2.8, -7.4); downlight(-5.6, -7.4);
  for (const z of [-7.82, -4.35]) {
    for (let i = 0; i < 4; i++) box(M.fabricSand, 0.08, 2.7, 0.16, -6.36, 1.95, z + i * 0.09, house);
    cyl(M.brass, 0.014, 0.014, 1.2, -6.36, 3.3, z, house, 6).rotation.x = Math.PI / 2;
  }

  // Dining
  box(M.timber, 2.0, 0.09, 1.15, -4.6, 1.02, 1.1, house, true);
  for (const [lx, lz] of [[-5.4, 0.65], [-3.8, 0.65], [-5.4, 1.55], [-3.8, 1.55]] as const)
    cyl(M.timberDark, 0.04, 0.04, 0.74, lx, 0.63, lz, house, 8);
  chair(-5.15, -0.1, 0); chair(-4.05, -0.1, 0);
  chair(-5.15, 2.3, Math.PI); chair(-4.05, 2.3, Math.PI);
  chair(-5.95, 1.1, Math.PI / 2);
  for (const px of [-5.2, -4.5, -3.9]) {
    cyl(M.porcelain, 0.14, 0.14, 0.02, px, 1.08, 1.1, house, 16);
    cyl(M.porcelain, 0.06, 0.06, 0.05, px, 1.11, 1.1, house, 12);
  }
  cyl(M.porcelain, 0.06, 0.09, 0.28, -4.6, 1.2, 1.1, house, 12);
  sph(M.foliageB, 0.16, -4.6, 1.42, 1.1, house, 0.8, 1, 0.8);
  pendant(-4.95, 1.1, 1.0); pendant(-4.25, 1.1, 1.0);
  box(M.timberDark, 0.48, 0.82, 1.5, -6.14, 0.68, -0.75, house, true);
  box(M.counter, 0.52, 0.05, 1.54, -6.14, 1.11, -0.75, house);
  sph(M.art2, 0.12, -6.14, 1.28, -1.2, house, 1, 1.2, 1);
  box(M.art1, 0.05, 1.1, 1.4, -6.44, 2.1, 2.4, house);
  plant(-2.35, 3.3, 1.1);
  ceilingLamp(-4.2, 1.2, 0.16);

  // Kitchen
  box(M.cabinet, 1.7, 0.86, 0.6, -3.55, 0.69, 8.12, house, true);
  box(M.counter, 1.78, 0.06, 0.66, -3.55, 1.15, 8.12, house);
  box(M.metal, 0.52, 0.05, 0.4, -3.7, 1.17, 8.1, house);
  cyl(M.metal, 0.016, 0.016, 0.34, -3.7, 1.34, 8.3, house, 8);
  box(M.cabinet, 1.6, 0.8, 0.36, -3.55, 2.75, 8.34, house);
  box(M.cabinet, 0.56, 0.86, 1.4, -4.14, 0.69, 5.2, house, true);
  box(M.counter, 0.62, 0.06, 1.46, -4.14, 1.15, 5.2, house);
  box(M.frameDark, 0.5, 0.03, 0.58, -4.14, 1.19, 5.2, house);
  for (const [bx, bz] of [[-4.28, 5.0], [-4.0, 5.0], [-4.28, 5.4], [-4.0, 5.4]] as const)
    cyl(M.metal, 0.075, 0.075, 0.012, bx, 1.21, bz, house, 14);
  box(M.frameDark, 0.68, 2.1, 0.7, -2.27, 1.32, 8.05, house, true);
  box(M.metal, 0.03, 0.55, 0.05, -1.95, 1.45, 7.78, house);
  box(M.metal, 0.03, 0.55, 0.05, -1.95, 1.45, 8.05, house);
  box(M.counter, 0.05, 0.08, 0.6, -1.91, 1.16, 6.9, house);
  for (const [jx, jz] of [[-3.6, 8.48], [-3.35, 8.48], [-3.1, 8.48]] as const) {
    cyl(M.porcelain, 0.055, 0.05, 0.2, jx, 1.4, jz, house, 10);
    cyl(M.timber, 0.06, 0.06, 0.03, jx, 1.51, jz, house, 10);
  }
  ceilingLamp(-3.2, 6.2, 0.14);
  downlight(-3.15, 4.6);

  // Utility
  box(M.porcelain, 0.62, 0.86, 0.64, -6.05, 0.69, 8.1, house, true);
  box(M.frameDark, 0.44, 0.42, 0.03, -6.05, 0.72, 7.77, house);
  box(M.porcelain, 0.62, 0.86, 0.64, -5.35, 0.69, 8.1, house, true);
  box(M.frameDark, 0.44, 0.42, 0.03, -5.35, 0.72, 7.77, house);
  box(M.cabinet, 0.56, 0.8, 1.5, -6.14, 0.66, 5.1, house, true);
  box(M.counter, 0.6, 0.06, 1.54, -6.14, 1.09, 5.1, house);
  box(M.counter, 0.05, 0.6, 0.05, -6.3, 2.2, 6.4, house);
  for (let i = 0; i < 4; i++) box(M.fabricSand, 0.36, 0.28, 0.06, -6.3, 2.3 - i * 0.32, 6.4, house);
  ceilingLamp(-5.5, 6.2, 0.1);

  // Foyer + hall
  box(M.rug, 1.6, 0.02, 2.2, 0, 0.28, -6.9, house);
  box(M.timberDark, 0.42, 0.52, 1.15, 1.32, 0.52, -6.1, house, true);
  box(M.counter, 0.46, 0.04, 1.2, 1.32, 0.81, -6.1, house);
  box(M.metal, 0.04, 0.04, 1.0, 1.42, 1.95, -6.1, house);
  for (const cz of [-6.5, -6.1, -5.7]) cyl(M.brass, 0.012, 0.012, 0.18, 1.42, 1.83, cz, house, 6);
  box(M.brass, 0.03, 0.9, 0.7, 1.56, 1.9, -6.1, house);
  plant(1.35, -7.9, 0.9);
  ceilingLamp(0, -6.4, 0.15);
  downlight(0, -8.0);
  // Hall console
  box(M.timberDark, 0.36, 0.7, 1.1, -1.58, 0.62, -2.7, house);
  box(M.art2, 0.04, 0.9, 0.7, -1.4, 2.1, -2.7, house);
  ceilingLamp(0.2, -3.0, 0.15);

  // Central spine is left open from foyer to passage

  // Passage
  box(M.timberDark, 0.32, 1.9, 0.9, -1.42, 1.22, 3.3, house, true);
  box(M.art1, 0.04, 0.8, 0.6, 1.6, 2.0, 3.0, house);
  box(M.rug, 1.1, 0.02, 3.4, 0, 0.28, 5.0, house);
  downlight(0, 2.0); downlight(0, 4.0); downlight(0, 6.0); downlight(0, 7.8);

  // Master bedroom
  bed(5.25, -6.1, 2.1, 2.05, "+x");
  nightstand(6.15, -7.55);
  nightstand(6.15, -4.65);
  wardrobe(3.35, -8.15, 2.4, 0.6);
  box(M.timberDark, 0.5, 0.86, 1.2, 5.85, 0.7, -3.4, house, true);
  box(M.counter, 0.54, 0.04, 1.24, 5.85, 1.15, -3.4, house);
  sph(M.art1, 0.12, 5.85, 1.3, -3.1, house);
  box(M.rug, 2.6, 0.02, 2.0, 3.9, 0.28, -6.2, house);
  plant(2.4, -3.3, 1.0);
  box(M.art2, 0.05, 0.85, 1.2, 2.02, 2.3, -6.5, house);
  ceilingLamp(4.2, -5.8, 0.16);
  downlight(2.7, -7.6); downlight(5.6, -7.6); downlight(2.7, -3.6); downlight(5.6, -3.6);
  for (const z of [-7.4, -4.4]) {
    for (let i = 0; i < 4; i++) box(M.fabricSand, 0.08, 2.7, 0.16, 6.34, 1.95, z + i * 0.09, house);
    cyl(M.brass, 0.014, 0.014, 1.3, 6.34, 3.3, z, house, 6).rotation.x = Math.PI / 2;
  }

  // Master bath
  tub(5.95, -1.5, 0.9, 1.9);
  vanity(3.25, -0.55, 1.5);
  wc(4.9, -2.25, 0);
  box(M.glassClear, 0.04, 2.3, 1.1, 4.35, 1.45, -1.5, house);
  box(M.floorTileGrey, 0.72, 0.03, 1.1, 3.96, 0.28, -1.5, house);
  cyl(M.metal, 0.02, 0.02, 0.5, 3.75, 2.4, -1.5, house, 8);
  box(M.metal, 0.22, 0.03, 0.22, 3.75, 2.65, -1.5, house);
  cyl(M.metal, 0.014, 0.014, 0.75, 2.1, 1.65, -1.9, house, 8).rotation.z = Math.PI / 2;
  box(M.bedding, 0.4, 0.55, 0.03, 2.1, 1.55, -1.9, house);
  ceilingLamp(4.2, -1.5, 0.11);
  downlight(3.0, -1.5);

  // Bedroom 3
  bed(5.35, 0.55, 2.0, 1.6, "+x");
  nightstand(6.15, 1.7);
  wardrobe(2.95, 0.2, 1.5, 0.55);
  desk(2.75, 3.0, 1.1, 0.5);
  chair(3.0, 2.45, 0);
  box(M.rug, 1.8, 0.02, 1.4, 3.9, 0.28, 1.4, house);
  plant(6.25, 2.9, 0.8);
  ceilingLamp(4.2, 1.5, 0.13);
  downlight(2.7, 2.6);
  for (let i = 0; i < 3; i++) box(M.fabricSand, 0.07, 2.4, 0.16, 6.36, 1.9, 0.55 + i * 0.1, house);

  // Bedroom 2
  bed(5.35, 6.9, 2.0, 1.8, "+x");
  nightstand(6.15, 5.65);
  wardrobe(3.05, 3.95, 1.6, 0.55);
  desk(2.7, 7.9, 1.1, 0.55);
  chair(3.1, 7.25, 0);
  box(M.rug, 1.9, 0.02, 1.5, 3.9, 0.28, 6.5, house);
  plant(2.3, 8.2, 0.85);
  ceilingLamp(4.2, 6.0, 0.13);
  downlight(3.0, 5.0);
  for (let i = 0; i < 3; i++) box(M.fabricSand, 0.07, 2.4, 0.16, 6.36, 1.9, 6.3 + i * 0.1, house);

  // ============================================================
  // SITE — plot, garden, street
  // ============================================================
  const groundG = new THREE.PlaneGeometry(420, 420);
  geometries.push(groundG);
  const ground = new THREE.Mesh(groundG, M.lawn);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  // walks + drive
  box(M.paving, 2.4, 0.06, 2.9, 0, 0.07, -12.75, root);
  box(M.asphalt, 2.8, 0.07, 5.2, 4.85, 0.08, -11.55, root);
  box(M.asphalt, 2.9, 0.07, 0.9, 4.85, 0.08, -9.1, root);

  // boundary walls
  const boundary = (w: number, d: number, x: number, z: number) => {
    box(M.plasterGrey, w, 1.7, d, x, 0.85, z, root, true);
    box(M.kerb, w + 0.06, 0.12, d + 0.06, x, 1.76, z, root);
  };
  boundary(10.0, 0.3, -6.2, -14);
  boundary(2.4, 0.3, 2.0, -14);
  boundary(4.8, 0.3, 8.8, -14);
  boundary(0.3, 26.4, -11.2, -0.8);
  boundary(0.3, 26.4, 11.2, -0.8);
  boundary(22.4, 0.3, 0, 12.4);
  for (let x = -10.4; x <= 10.6; x += 1.1) {
    if (x > -1.4 && x < 0.9) continue;
    if (x > 3.1 && x < 6.5) continue;
    cyl(M.metal, 0.02, 0.02, 0.55, x, 1.95, -14, root, 6);
  }
  for (const gx of [-1.35, 0.85, 3.15, 6.55]) {
    box(M.plasterGrey, 0.5, 2.35, 0.5, gx, 1.17, -14, root, true);
    box(M.cladding, 0.58, 0.34, 0.58, gx, 2.5, -14, root);
    box(M.lampWarm, 0.16, 0.12, 0.16, gx, 2.72, -14, root);
  }
  // gates — leaves opened inward, hinged on the piers
  const gate = (x: number, len: number, height: number, bars: number) => {
    const z0 = -13.82;
    const cz = z0 + len / 2;
    box(M.frameDark, 0.06, 0.07, len, x, height - 0.04, cz, root);
    box(M.frameDark, 0.055, 0.05, len, x, height * 0.55, cz, root);
    box(M.frameDark, 0.055, 0.05, len, x, 0.24, cz, root);
    box(M.frameDark, 0.07, height, 0.07, x, height / 2, z0, root);
    box(M.frameDark, 0.07, height, 0.07, x, height / 2, z0 + len, root);
    for (let i = 1; i < bars; i++) box(M.frameDark, 0.032, height - 0.16, 0.032, x, (height - 0.16) / 2 + 0.06, z0 + (len * i) / bars, root);
    for (const hy of [height * 0.35, height * 0.8]) {
      const hinge = cyl(M.metal, 0.045, 0.045, 0.12, x - 0.045, hy, z0 - 0.02, root, 8);
      hinge.rotation.z = Math.PI / 2;
    }
  };
  gate(-1.07, 1.62, 1.65, 9);
  gate(3.42, 1.42, 1.8, 7);
  gate(6.28, 1.42, 1.8, 7);

  // hedges + beds
  box(M.hedge, 4.6, 0.62, 0.7, -4.4, 0.31, -13.3, root);
  for (const [x, z] of [[-6.8, -13.2], [-2.2, -13.1], [8.2, -13.2], [-9.2, -13.1]] as const)
    sph(M.hedge, 0.42, x, 0.44, z, root, 1.4, 0.9, 1.3);
  box(M.timberDark, 3.0, 0.16, 1.0, -5.1, 0.1, -9.4, root);
  for (let i = 0; i < 14; i++) {
    const fx = -6.4 + Math.random() * 2.7;
    const fz = -9.75 + Math.random() * 0.7;
    cyl(M.foliageB, 0.1, 0.13, 0.4, fx, 0.36, fz, root, 6);
    sph(i % 3 === 0 ? M.lampWarm : M.foliageLight, 0.07, fx, 0.6, fz, root);
  }
  box(M.timberDark, 1.8, 0.16, 1.0, 8.7, 0.1, -13.0, root);
  for (let i = 0; i < 12; i++) {
    const fx = 7.95 + Math.random() * 1.5;
    const fz = -13.35 + Math.random() * 0.7;
    cyl(M.foliageB, 0.1, 0.13, 0.42, fx, 0.37, fz, root, 6);
    sph(M.foliageLight, 0.09, fx, 0.62, fz, root);
  }

  // stepping lights
  for (const [lx, lz] of [[-1.5, -12.2], [1.5, -12.2], [-1.5, -13.3], [1.5, -13.3]] as const) {
    cyl(M.frameDark, 0.05, 0.05, 0.6, lx, 0.3, lz, root, 8);
    box(M.lampWarm, 0.1, 0.12, 0.1, lx, 0.64, lz, root);
  }
  const mailbox = (x: number, z: number) => {
    cyl(M.timberDark, 0.05, 0.06, 1.1, x, 0.55, z, root, 8);
    box(M.frameDark, 0.3, 0.24, 0.44, x, 1.2, z, root);
    box(M.brass, 0.02, 0.03, 0.2, x, 1.2, z + 0.23, root);
  };
  mailbox(2.35, -13.7);

  // ============================================================
  // VEGETATION — detailed, wind-swept, clear of the house
  // ============================================================
  const addSway = (obj: THREE.Object3D, amp: number, phase: number, speed: number) => {
    sway.push({ obj, amp, phase, speed });
  };

  const leafGeo = new THREE.IcosahedronGeometry(1, 2);
  {
    const pos = leafGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const k = 0.84 + Math.random() * 0.3;
      pos.setXYZ(i, v.x * k, v.y * k, v.z * k);
    }
    leafGeo.computeVertexNormals();
  }
  geometries.push(leafGeo);

  const leafCluster = (m: THREE.Material, sx: number, sy: number, sz: number) => {
    const mesh = new THREE.Mesh(leafGeo, m);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const tree = (x: number, z: number, s: number, seed: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    addCollider(0.5 * s, 3.0, 0.5 * s, x, 1.5, z);
    cyl(M.trunk, 0.14 * s, 0.24 * s, 3.3 * s, 0, 1.65 * s, 0, g, 10);
    for (let i = 0; i < 3; i++) {
      const a = seed + i * 2.1;
      const rootFlare = cyl(M.trunk, 0.02, 0.14 * s, 0.55 * s, Math.sin(a) * 0.16 * s, 0.2 * s, Math.cos(a) * 0.16 * s, g, 6);
      rootFlare.rotation.z = Math.sin(a) * 0.5;
      rootFlare.rotation.x = Math.cos(a) * 0.5;
    }
    for (let i = 0; i < 4; i++) {
      const a = seed * 1.7 + i * 1.6;
      const br = cyl(M.trunk, 0.035 * s, 0.09 * s, 1.5 * s, Math.sin(a) * 0.35 * s, (2.5 + (i % 2) * 0.35) * s, Math.cos(a) * 0.35 * s, g, 7);
      br.rotation.z = Math.sin(a) * 0.55;
      br.rotation.x = Math.cos(a) * 0.55;
    }
    const crown = new THREE.Group();
    crown.position.y = 3.05 * s;
    g.add(crown);
    const clusters: Array<[number, number, number, number, number, number, THREE.Material]> = [
      [0, 1.1, 0, 1.5, 1.05, 1.5, M.foliageA],
      [-0.85, 0.7, 0.35, 1.0, 0.8, 1.0, M.foliageB],
      [0.85, 0.75, -0.4, 1.05, 0.82, 1.05, M.foliageC],
      [0.1, 1.85, -0.15, 0.95, 0.7, 0.95, M.foliageB],
      [-0.5, 1.5, -0.8, 0.8, 0.62, 0.8, M.foliageC],
      [0.6, 1.35, 0.75, 0.82, 0.6, 0.82, M.foliageA],
    ];
    for (const [ox, oy, oz, sx, sy, sz, m] of clusters) {
      const cg = leafCluster(m, sx * s, sy * s, sz * s);
      cg.position.set(ox * s, oy * s, oz * s);
      cg.rotation.set(Math.random() * 0.4, Math.random() * Math.PI * 2, Math.random() * 0.4);
      crown.add(cg);
      flutter.push({
        obj: cg, baseX: cg.rotation.x, baseZ: cg.rotation.z,
        amp: 0.006 + Math.random() * 0.007, phase: Math.random() * Math.PI * 2, speed: 1.0 + Math.random() * 0.7,
      });
    }
    addSway(crown, 0.03 + (seed % 0.02), seed % 6.28, 0.55 + (seed % 0.3));
  };

  const palm = (x: number, z: number, s: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    addCollider(0.35, 3.0, 0.35, x, 1.5, z);
    for (let i = 0; i < 6; i++) {
      const seg = cyl(M.trunk, 0.1 * s, 0.14 * s, 1.15 * s, Math.sin(i * 0.16) * 0.18 * s, 0.55 * s + i * 1.05 * s, 0, g, 8);
      seg.rotation.z = -0.05 * i;
    }
    const fronds = new THREE.Group();
    fronds.position.set(Math.sin(5 * 0.16) * 0.18 * s, 6.0 * s, 0);
    g.add(fronds);
    for (let i = 0; i < 9; i++) {
      const fg = new THREE.PlaneGeometry(3.0 * s, 0.6 * s, 10, 2);
      fg.rotateX(-Math.PI / 2);
      fg.translate(1.5 * s, 0, 0);
      const pos = fg.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        const px = pos.getX(k);
        const pz = pos.getZ(k);
        pos.setZ(k, pz * (1 - px / (3.4 * s)));
        pos.setY(k, -0.1 * px * px * 0.8 - Math.abs(pz) * 0.08);
      }
      fg.computeVertexNormals();
      geometries.push(fg);
      const frond = new THREE.Mesh(fg, M.foliageB);
      frond.castShadow = true;
      frond.receiveShadow = true;
      frond.rotation.y = (i * Math.PI * 2) / 9;
      frond.rotation.z = 0.16;
      fronds.add(frond);
      flutter.push({
        obj: frond, baseX: 0, baseZ: 0.16,
        amp: 0.008 + Math.random() * 0.006, phase: Math.random() * Math.PI * 2, speed: 1.2 + Math.random() * 0.5,
      });
    }
    addSway(fronds, 0.05, x * 0.3, 0.8);
  };

  const bush = (x: number, z: number, s: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    const c1 = leafCluster(M.hedge, 0.55 * s, 0.4 * s, 0.55 * s);
    c1.position.set(0, 0.32 * s, 0);
    const c2 = leafCluster(M.foliageB, 0.4 * s, 0.32 * s, 0.4 * s);
    c2.position.set(0.32 * s, 0.45 * s, 0.1 * s);
    const c3 = leafCluster(M.foliageA, 0.36 * s, 0.3 * s, 0.36 * s);
    c3.position.set(-0.28 * s, 0.42 * s, -0.12 * s);
    g.add(c1, c2, c3);
    addSway(g, 0.008, x + z, 1.3);
  };

  tree(-9.8, -6.0, 0.95, 1.3);
  tree(9.9, -4.6, 0.88, 2.7);
  tree(-9.9, 5.0, 0.92, 4.1);
  tree(9.9, 8.2, 0.82, 5.5);
  tree(-8.2, -12.4, 0.68, 0.7);
  tree(8.6, -12.6, 0.62, 3.3);
  tree(-9.8, 10.4, 0.8, 2.2);
  tree(9.8, 10.8, 0.75, 4.8);
  tree(-16, -7, 1.05, 1.9);
  tree(17, -5, 0.98, 3.8);
  tree(-17, 7, 1.1, 5.1);
  tree(18, 9.5, 1.0, 0.9);
  tree(-22, -21, 1.15, 2.9);
  tree(23, -22, 1.1, 4.4);
  tree(-9, 19, 1.05, 1.1);
  tree(9, 20, 1.0, 3.5);
  tree(20, 17, 1.0, 5.8);
  tree(-25, 13, 1.15, 0.4);
  tree(27, -12, 1.1, 2.4);
  palm(-14, -12, 0.95);
  palm(14.5, -12.5, 0.9);
  palm(-15.5, 2, 0.92);
  palm(15, 1.5, 0.88);
  palm(-12, 20, 0.95);
  palm(13, 21, 0.9);
  for (const [bx, bz, bs] of [
    [-7.6, -7.6, 1.0], [-7.5, -2.0, 0.9], [7.7, -0.4, 0.95], [7.8, 3.0, 1.0],
    [7.7, 8.2, 0.9], [-7.6, 8.4, 1.0], [-3.0, -13.2, 0.8], [1.6, -13.2, 0.8],
    [-10.2, -10.0, 1.1], [10.4, -9.4, 1.05],
  ] as const) bush(bx, bz, bs);

  // street trees on the far verge
  tree(-9, -24.5, 0.9, 3.1);
  tree(2, -25.2, 0.85, 4.6);
  tree(13, -24.8, 0.9, 1.6);

  // ============================================================
  // GRASS — instanced, wind-reactive
  // ============================================================
  const bladeGeo = new THREE.PlaneGeometry(0.065, 0.5, 1, 4);
  bladeGeo.translate(0, 0.25, 0);
  geometries.push(bladeGeo);
  const grassMat = mat({ color: 0xffffff, roughness: 0.92, side: THREE.DoubleSide });
  grassMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uWindDir = windUniforms.uWindDir;
    shader.vertexShader = `uniform float uTime;\nuniform vec2 uWindDir;\n` + shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 grassOrigin = instanceMatrix[3].xyz;
        vec3 instX = normalize(instanceMatrix[0].xyz + vec3(0.0001));
        vec3 instZ = normalize(instanceMatrix[2].xyz + vec3(0.0001));
      #else
        vec3 grassOrigin = vec3(0.0);
        vec3 instX = vec3(1.0, 0.0, 0.0);
        vec3 instZ = vec3(0.0, 0.0, 1.0);
      #endif
      float bladeH = max(transformed.y, 0.0);
      float phase = grassOrigin.x * 0.31 + grassOrigin.z * 0.23;
      float travel = (grassOrigin.x * uWindDir.x + grassOrigin.z * uWindDir.y) * 0.19;
      float wave = sin(uTime * 1.05 - travel + phase * 0.35);
      float ripple = sin(uTime * 1.9 - travel * 1.7 + phase * 1.3);
      float tip = bladeH * bladeH;
      float amp = 0.115 * (0.75 + 0.25 * sin(phase * 2.1));
      vec2 off = uWindDir * ((wave * 0.75 + ripple * 0.25) * amp * tip);
      transformed.x += dot(off, instX.xz);
      transformed.z += dot(off, instZ.xz);`
    );
  };

  const GRASS_COUNT = 48000;
  const grass = new THREE.InstancedMesh(bladeGeo, grassMat, GRASS_COUNT);
  grass.receiveShadow = true;
  grass.frustumCulled = false;
  let gseed = 20261022;
  const grad = () => {
    gseed = (gseed * 1664525 + 1013904223) >>> 0;
    return gseed / 4294967296;
  };
  const grassBlocked = (x: number, z: number) => {
    if (z > -23.6 && z < -13.55) return true;
    if (x > -7.35 && x < 7.35 && z > -11.9 && z < 9.4) return true;
    if (x > 3.1 && x < 6.7 && z > -14 && z < -8.7) return true;
    if (x > -1.5 && x < 1.5 && z > -14 && z < -11.0) return true;
    if (x > -6.6 && x < -3.4 && z > -10.1 && z < -8.9) return true;
    if (x > 7.6 && x < 9.8 && z > -13.9 && z < -12.3) return true;
    if (x > -3.8 && x < 7.8 && z > 22.6 && z < 31.4) return true;
    return false;
  };
  const dummy = new THREE.Object3D();
  const grassColor = new THREE.Color();
  let placed = 0;
  for (let attempt = 0; attempt < GRASS_COUNT * 6 && placed < GRASS_COUNT; attempt++) {
    const x = -48 + grad() * 96;
    const z = -25 + grad() * 71;
    if (grassBlocked(x, z)) continue;
    const density = 0.5 + 0.5 * Math.sin(x * 0.23 + 1.3) * Math.cos(z * 0.19 - 0.7);
    if (grad() > 0.35 + 0.65 * density) continue;
    dummy.position.set(x, 0.02, z);
    dummy.rotation.set(0, grad() * Math.PI * 2, 0);
    let h = 0.55 + grad() * 1.05;
    if (grad() < 0.05) h += 0.5;
    dummy.scale.set(0.7 + grad() * 0.85, h, 1);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    grassColor.setHSL(0.245 + grad() * 0.06, 0.3 + grad() * 0.25, 0.2 + grad() * 0.19);
    grass.setColorAt(placed, grassColor);
    placed++;
  }
  grass.count = placed;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  root.add(grass);

  // Outer meadow: a coarser field extending the lawn to the horizon
  const OUTER_COUNT = 30000;
  const grassOuter = new THREE.InstancedMesh(bladeGeo, grassMat, OUTER_COUNT);
  grassOuter.receiveShadow = true;
  grassOuter.frustumCulled = false;
  let outerPlaced = 0;
  for (let attempt = 0; attempt < OUTER_COUNT * 5 && outerPlaced < OUTER_COUNT; attempt++) {
    const x = -115 + grad() * 230;
    const z = -65 + grad() * 185;
    if (x > -40 && x < 40 && z > -20 && z < 40) continue;
    if (z > -23.6 && z < -13.55 && x > -80 && x < 80) continue;
    dummy.position.set(x, 0.02, z);
    dummy.rotation.set(0, grad() * Math.PI * 2, 0);
    const h = 0.9 + grad() * 1.3;
    dummy.scale.set(1.1 + grad() * 1.3, h, 1);
    dummy.updateMatrix();
    grassOuter.setMatrixAt(outerPlaced, dummy.matrix);
    grassColor.setHSL(0.245 + grad() * 0.06, 0.3 + grad() * 0.24, 0.2 + grad() * 0.18);
    grassOuter.setColorAt(outerPlaced, grassColor);
    outerPlaced++;
  }
  grassOuter.count = outerPlaced;
  if (grassOuter.instanceColor) grassOuter.instanceColor.needsUpdate = true;
  root.add(grassOuter);

  // street lights
  for (const x of [-18, 0, 18]) {
    cyl(M.metal, 0.07, 0.1, 5.8, x, 2.9, -23.7, root, 10);
    box(M.metal, 1.0, 0.08, 0.12, x + 0.47, 5.75, -23.7, root);
    box(M.lampWarm, 0.46, 0.12, 0.26, x + 0.9, 5.7, -23.7, root);
  }

  // neighbours
  const neighbour = (x: number, z: number, ry: number, w: number, d: number, m: THREE.Material) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(m, w, 3.4, d, 0, 1.75, 0, g);
    box(M.roof, w + 0.9, 0.28, d + 0.9, 0, 3.6, 0, g);
    box(M.glass, w * 0.55, 1.5, 0.06, 0, 1.8, -(d / 2 + 0.05), g);
    box(M.cladding, w * 0.28, 3.4, 0.08, w * 0.32, 1.75, -(d / 2 + 0.04), g);
    for (let i = 0; i < 4; i++) cyl(M.frameDark, 0.025, 0.025, 1.4, -w / 2 + 0.6 + i * (w / 4), 1.7, -(d / 2 + 0.06), g, 4);
    root.add(g);
  };
  neighbour(2, 27, Math.PI, 11, 8, M.plasterExt);

  // street
  box(M.asphalt, 160, 0.1, 6.9, 0, 0.05, -19.15, root);
  box(M.kerb, 160, 0.22, 0.36, 0, 0.11, -15.5, root);
  box(M.kerb, 160, 0.22, 0.36, 0, 0.11, -22.85, root);
  box(M.paving, 160, 0.07, 1.6, 0, 0.12, -14.55, root);
  const lineMat = mat({ color: 0xd9d4c3, roughness: 0.9 });
  for (let i = -18; i <= 18; i++) box(lineMat, 2.2, 0.02, 0.15, i * 4.6, 0.11, -19.15, root);
  box(M.kerb, 160, 0.06, 0.12, 0, 0.115, -15.95, root);
  box(M.kerb, 160, 0.06, 0.12, 0, 0.115, -22.35, root);
  // grass verge beyond sidewalk
  box(M.lawn, 160, 0.02, 2.2, 0, 0.052, -25.3, root);

  // ============================================================
  // TRAFFIC — occasional, correct heading, spinning wheels
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
    eg.translate(0, 0, -0.87);
    carGeo.push(eg);
    const bodyMesh = new THREE.Mesh(eg, body);
    bodyMesh.rotation.y = -Math.PI / 2;
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
    const wg = new THREE.CylinderGeometry(0.33, 0.33, 0.24, 22);
    const rg = new THREE.CylinderGeometry(0.19, 0.19, 0.26, 16);
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
  const carMats = [M.carBlack, M.carWhite, M.carSilver];
  for (let i = 0; i < 3; i++) {
    const { group, wheels } = buildCar(carMats[i]);
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const lane = dir === 1 ? -17.9 : -20.4;
    group.position.set((i - 1) * 52, 0.1, lane);
    group.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
    root.add(group);
    cars.push({ obj: group, wheels, dir, x: (i - 1) * 52 + Math.random() * 10, speed: 7 + Math.random() * 3 });
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
  // SKY, CLOUDS, INTERIOR LIGHT
  // ============================================================
  const sky = new Sky();
  sky.scale.setScalar(2000);
  const su = sky.material.uniforms;
  su["turbidity"].value = 7.0;
  su["rayleigh"].value = 2.8;
  su["mieCoefficient"].value = 0.006;
  su["mieDirectionalG"].value = 0.88;
  su["sunPosition"].value.copy(SUN_DIRECTION);
  root.add(sky);

  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  {
    const c = cloudCanvas.getContext("2d")!;
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * 1024;
      const y = 30 + Math.random() * 300;
      const r = 16 + Math.random() * 80;
      const a = 0.06 + Math.random() * 0.26;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.55, `rgba(250,252,255,${a * 0.5})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    const fade = c.createLinearGradient(0, 330, 0, 512);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(0.7, "rgba(0,0,0,0.65)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = fade;
    c.fillRect(0, 0, 1024, 512);
    c.globalCompositeOperation = "source-over";
  }
  const cloudTex = new THREE.CanvasTexture(cloudCanvas);
  cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
  cloudTex.repeat.set(2.2, 1);
  cloudTex.colorSpace = THREE.SRGBColorSpace;
  textures.push(cloudTex);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex, color: 0xffd9b8, transparent: true, opacity: 0.65, depthWrite: false,
    side: THREE.BackSide, fog: false,
  });
  materials.push(cloudMat);
  const cloudDome = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.53), cloudMat);
  cloudDome.position.y = -30;
  root.add(cloudDome);

  const p1 = new THREE.PointLight(0xffe0b0, 46, 16, 2);
  p1.position.set(-4.2, 3.3, -5.2);
  root.add(p1);
  const p2 = new THREE.PointLight(0xffe0b0, 38, 15, 2);
  p2.position.set(4.2, 3.3, -5.6);
  root.add(p2);
  const p3 = new THREE.PointLight(0xfff0d8, 30, 14, 2);
  p3.position.set(0, 3.3, -3.0);
  root.add(p3);
  const p4 = new THREE.PointLight(0xffe8c8, 28, 13, 2);
  p4.position.set(-3.2, 3.3, 4.8);
  root.add(p4);
  const p5 = new THREE.PointLight(0xfff0d8, 24, 12, 2);
  p5.position.set(4.2, 3.3, 5.6);
  root.add(p5);
  const p6 = new THREE.PointLight(0xffe8c8, 18, 10, 2);
  p6.position.set(4.2, 3.3, -1.5);
  root.add(p6);
  const porchLight = new THREE.PointLight(0xffd9a0, 24, 9, 2);
  porchLight.position.set(0, 3.0, -9.8);
  root.add(porchLight);

  // ============================================================
  // ANIMATION
  // ============================================================
  const floorAt = (x: number, z: number) => {
    if (x > -6.7 && x < 6.7 && z > -8.7 && z < 8.7) return 0.27;
    if (x > -3.5 && x < 3.5 && z > -11.45 && z < -8.6) return 0.29;
    return 0.03;
  };

  let elapsed = 0;
  const update = (dt: number) => {
    elapsed += dt;
    windUniforms.uTime.value = elapsed;
    const gust = 0.62 + 0.38 * Math.sin(elapsed * 0.42 + 1.7) * Math.cos(elapsed * 0.21);
    for (const s of sway) {
      const wave = Math.sin(elapsed * s.speed + s.phase) * 0.7 + Math.sin(elapsed * s.speed * 1.63 + s.phase * 2.1) * 0.3;
      const tilt = wave * s.amp * gust;
      s.obj.rotation.z = -WIND_DIR.x * tilt;
      s.obj.rotation.x = WIND_DIR.y * tilt;
    }
    for (const f of flutter) {
      const m = Math.sin(elapsed * f.speed + f.phase) * f.amp * (0.8 + 0.2 * Math.sin(elapsed * 0.5 + f.phase));
      f.obj.rotation.x = f.baseX + m;
      f.obj.rotation.z = f.baseZ + m * 0.7;
    }
    cloudDome.rotation.y += dt * 0.0035;
    cloudTex.offset.x = elapsed * 0.0018;

    for (const c of cars) {
      c.x += c.dir * c.speed * dt;
      if (c.x > 74) { c.x = -74 - Math.random() * 40; c.speed = 7 + Math.random() * 3; }
      if (c.x < -74) { c.x = 74 + Math.random() * 40; c.speed = 7 + Math.random() * 3; }
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
    cloudDome.geometry.dispose();
    sky.geometry.dispose();
    (sky.material as THREE.Material).dispose();
  };

  return { root, roofGroup, colliders, rooms: ROOMS, avatar, floorAt, update, dispose };
}
