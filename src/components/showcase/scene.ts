import * as THREE from "three";

export interface RoomDef {
  id: string;
  label: string;
  /** First-person standing position [x, z] */
  anchor: [number, number];
  /** Orbit/dollhouse camera framing */
  view: { pos: [number, number, number]; target: [number, number, number] };
}

export interface World {
  root: THREE.Group;
  roofGroup: THREE.Group;
  colliders: THREE.Box3[];
  rooms: RoomDef[];
  dispose: () => void;
}

const WALL_H = 3;
const WALL_T = 0.2;

type Opening = { a: number; b: number; sill?: number; head?: number };

export const ROOMS: RoomDef[] = [
  { id: "living", label: "Living Room", anchor: [-4.6, -2.2], view: { pos: [-4.5, 2.0, -4.8], target: [-3, 1, -1] } },
  { id: "dining", label: "Dining", anchor: [1.4, -2.2], view: { pos: [1.5, 2.0, -4.6], target: [2, 1, -1.5] } },
  { id: "kitchen", label: "Kitchen", anchor: [6.2, -2.6], view: { pos: [6.5, 2.0, -4.8], target: [6.5, 1, -2.5] } },
  { id: "corridor", label: "Corridor", anchor: [0, 0.75], view: { pos: [0, 2.0, -1.2], target: [0, 1.2, 3] } },
  { id: "master", label: "Master Bedroom", anchor: [-5.2, 2.6], view: { pos: [-5, 2.2, 2.2], target: [-5.4, 1, 4.6] } },
  { id: "bed2", label: "Bedroom 2", anchor: [-0.6, 2.6], view: { pos: [-0.5, 2.2, 2.2], target: [-0.5, 1, 4.4] } },
  { id: "bed3", label: "Bedroom 3", anchor: [3.1, 2.6], view: { pos: [3.2, 2.2, 2.2], target: [3.2, 1, 4.4] } },
  { id: "bath1", label: "Bathroom 1", anchor: [5.8, 2.9], view: { pos: [5.8, 2.0, 0.8], target: [5.8, 1, 3.8] } },
  { id: "bath2", label: "Bathroom 2", anchor: [7.2, 2.9], view: { pos: [6.6, 1.9, 1.2], target: [7.4, 1, 4] } },
  { id: "balcony", label: "Balcony", anchor: [-5, -6.6], view: { pos: [-5, 2.4, -9.5], target: [-5, 1.2, -6] } },
];

export function buildWorld(): World {
  const root = new THREE.Group();
  const roofGroup = new THREE.Group();
  root.add(roofGroup);
  const colliders: THREE.Box3[] = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  const mat = (color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...opts });
    materials.push(m);
    return m;
  };

  const M = {
    ground: mat(0x2c3a30, { roughness: 1 }),
    lawn: mat(0x3f6b4f, { roughness: 1 }),
    road: mat(0x26282a, { roughness: 1 }),
    path: mat(0xb9b2a6, { roughness: 1 }),
    wallExt: mat(0xf0ede3, { roughness: 0.9 }),
    wallInt: mat(0xe9e4d8, { roughness: 0.92 }),
    stone: mat(0x9a917f, { roughness: 0.95 }),
    timber: mat(0x8a6a4b, { roughness: 0.75 }),
    timberDark: mat(0x5b4331, { roughness: 0.75 }),
    roof: mat(0xd8d2c4, { roughness: 0.9 }),
    roofEdge: mat(0x206046, { roughness: 0.8 }),
    sage: mat(0xb5d5c5, { roughness: 0.8 }),
    charcoal: mat(0x2a2d2b, { roughness: 0.7 }),
    glass: mat(0xa9c6d8, { roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.32 }),
    fabric: mat(0x6e7f74, { roughness: 0.95 }),
    fabricWarm: mat(0xc98a5e, { roughness: 0.95 }),
    bedding: mat(0xf0ede3, { roughness: 0.95 }),
    metal: mat(0x8f9490, { roughness: 0.35, metalness: 0.7 }),
    foliage: mat(0x35624a, { roughness: 1 }),
    foliageLight: mat(0x5d8a63, { roughness: 1 }),
    trunk: mat(0x4e3b2a, { roughness: 1 }),
    lampGlow: mat(0xffe9b8, { roughness: 1, emissive: 0xffdf9e, emissiveIntensity: 0.9 }),
    water: mat(0x2f5d63, { roughness: 0.2, metalness: 0.3 }),
    porcelain: mat(0xf6f4ee, { roughness: 0.4 }),
  };

  const box = (
    m: THREE.Material,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = root,
    collide = false
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

  /** Axis-aligned wall with openings expressed in absolute coords along the run. */
  const wall = (
    horizontal: boolean,
    fixed: number,
    from: number,
    to: number,
    openings: Opening[],
    material: THREE.Material,
    y0 = 0,
    height = WALL_H
  ) => {
    const sorted = [...openings].sort((p, q) => p.a - q.a);
    let cursor = from;
    const seg = (a: number, b: number, sy: number, sh: number) => {
      if (b - a < 0.01 || sh < 0.01) return;
      const len = b - a;
      if (horizontal) box(material, len, sh, WALL_T, (a + b) / 2, sy + sh / 2, fixed, root, true);
      else box(material, WALL_T, sh, len, fixed, sy + sh / 2, (a + b) / 2, root, true);
    };
    for (const o of sorted) {
      seg(cursor, o.a, y0, height);
      const sill = o.sill ?? 0;
      const head = o.head ?? height;
      if (sill > y0) seg(o.a, o.b, y0, sill - y0);
      if (head < y0 + height) seg(o.a, o.b, head, y0 + height - head);
      if (sill > 0.05 || head < height - 0.05) {
        // glazing for windows
        const gh = head - sill;
        if (horizontal) box(M.glass, o.b - o.a, gh, 0.04, (o.a + o.b) / 2, sill + gh / 2, fixed);
        else box(M.glass, 0.04, gh, o.b - o.a, fixed, sill + gh / 2, (o.a + o.b) / 2);
      }
      cursor = o.b;
    }
    seg(cursor, to, y0, height);
  };

  // ============================================================
  // FEATURED RESIDENCE — single-storey 3BHK
  // Footprint x[-8,8] z[-5.5,5.5]; south band living/dining/kitchen,
  // corridor z[0,1.5], north band master/bed2/bed3/bath1/bath2.
  // ============================================================
  const house = new THREE.Group();
  root.add(house);

  // Slab + plinth
  box(M.stone, 16.8, 0.15, 11.8, 0, 0.075, 0, house);
  box(M.wallInt, 16, 0.06, 11, 0, 0.18, 0, house);

  // Perimeter walls
  wall(true, -5.5, -8, 8, [
    { a: -6.5, b: -3.5 }, // balcony glazing wall (full height)
    { a: 1.5, b: 2.6 }, // main entrance
  ], M.wallExt);
  box(M.glass, 3.0, 2.6, 0.04, -5, 1.4, -5.5, house); // balcony slide door glass
  wall(true, 5.5, -8, 8, [
    { a: -6.5, b: -4, sill: 0.9, head: 2.4 }, // master window
    { a: -1.8, b: 0.2, sill: 0.9, head: 2.4 }, // bed2 window
    { a: 2.6, b: 4.4, sill: 0.9, head: 2.4 }, // bed3 window
  ], M.wallExt);
  wall(false, -8, -5.5, 5.5, [
    { a: -4.5, b: -2.5, sill: 0.9, head: 2.4 }, // living window
    { a: 2.8, b: 4.6, sill: 0.9, head: 2.4 }, // master side window
  ], M.wallExt);
  wall(false, 8, -5.5, 5.5, [
    { a: -4.5, b: -2.5, sill: 0.9, head: 2.4 }, // kitchen window
    { a: 2.6, b: 3.4, sill: 1.4, head: 2.4 }, // bath1 high window
    { a: 6.8, b: 7.6, sill: 1.4, head: 2.4 }, // bath2 high window
  ], M.wallExt);

  // South band / corridor wall (z = 0)
  wall(true, 0, -8, 8, [
    { a: -4.5, b: -3.5 }, // living door
    { a: 1, b: 2 }, // dining door
    { a: 5.5, b: 6.5 }, // kitchen door
  ], M.wallInt);
  // Corridor / north band wall (z = 1.5)
  wall(true, 1.5, -8, 8, [
    { a: -5.5, b: -4.5 }, // master door
    { a: -1, b: -0.2 }, // bed2 door
    { a: 2.8, b: 3.6 }, // bed3 door
    { a: 5.4, b: 6.0 }, // bath1 door
    { a: 6.9, b: 7.5 }, // bath2 door
  ], M.wallInt);
  // Partitions
  wall(false, -2.5, 1.5, 5.5, [], M.wallInt); // master | bed2
  wall(false, 1.5, 1.5, 5.5, [], M.wallInt); // bed2 | bed3
  wall(false, 5, 1.5, 5.5, [], M.wallInt); // bed3 | bath1
  wall(false, 6.6, 1.5, 5.5, [], M.wallInt); // bath1 | bath2
  wall(false, 4, -5.5, 0, [], M.wallInt); // dining | kitchen

  // Ceiling (lives in roofGroup so dollhouse opens the home)
  box(M.wallInt, 16, 0.12, 11, 0, WALL_H + 0.06, 0, roofGroup);

  // Roof slab + parapet
  box(M.roof, 16.6, 0.18, 11.6, 0, WALL_H + 0.21, 0, roofGroup);
  const par = (w: number, d: number, x: number, z: number) =>
    box(M.roofEdge, w, 0.45, d, x, WALL_H + 0.52, z, roofGroup);
  par(16.6, 0.16, 0, -5.72);
  par(16.6, 0.16, 0, 5.72);
  par(0.16, 11.6, -8.22, 0);
  par(0.16, 11.6, 8.22, 0);

  // ---- Balcony ----
  box(M.timber, 4.2, 0.12, 2.2, -5, 0.16, -6.7, house);
  box(M.glass, 4.2, 1.0, 0.05, -5, 0.75, -7.75, house);
  box(M.glass, 0.05, 1.0, 2.2, -7.05, 0.75, -6.7, house);
  box(M.glass, 0.05, 1.0, 2.2, -2.95, 0.75, -6.7, house);
  box(M.metal, 4.3, 0.06, 0.08, -5, 1.3, -7.75, house);
  box(M.timberDark, 0.18, 2.9, 0.18, -7, 1.5, -7.7, house);
  box(M.timberDark, 0.18, 2.9, 0.18, -3, 1.5, -7.7, house);
  colliders.push(new THREE.Box3(new THREE.Vector3(-7.2, 0, -7.9), new THREE.Vector3(-2.8, 1.4, -7.6)));
  colliders.push(new THREE.Box3(new THREE.Vector3(-7.2, 0, -7.9), new THREE.Vector3(-6.9, 1.4, -5.6)));
  colliders.push(new THREE.Box3(new THREE.Vector3(-3.1, 0, -7.9), new THREE.Vector3(-2.8, 1.4, -5.6)));

  // ---- Furniture helpers ----
  const bed = (cx: number, cz: number, w: number, d: number) => {
    box(M.timberDark, w, 0.35, d, cx, 0.35, cz, house, true);
    box(M.bedding, w - 0.1, 0.22, d - 0.15, cx, 0.62, cz - 0.03, house);
    box(M.bedding, w * 0.55, 0.1, 0.45, cx, 0.79, cz - d / 2 + 0.35, house); // pillows
    box(M.timberDark, w + 0.12, 1.05, 0.1, cx, 0.75, cz + d / 2 + 0.05, house); // headboard
  };
  const wardrobe = (x: number, z: number, w: number, d: number) =>
    box(M.timber, w, 2.2, d, x, 1.28, z, house, true);
  const sideTable = (x: number, z: number) => box(M.timberDark, 0.5, 0.5, 0.5, x, 0.42, z, house, true);
  const chair = (x: number, z: number, ry: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(M.timber, 0.45, 0.06, 0.45, 0, 0.46, 0, g);
    box(M.timber, 0.45, 0.55, 0.06, 0, 0.78, -0.2, g);
    box(M.fabric, 0.4, 0.05, 0.4, 0, 0.5, 0, g);
    house.add(g);
  };

  // Living room (x[-8,-1] z[-5.5,0])
  box(M.fabricWarm, 0.9, 0.42, 2.6, -7.1, 0.38, -2.6, house, true); // sofa seat
  box(M.fabricWarm, 0.35, 0.75, 2.6, -7.5, 0.62, -2.6, house); // sofa back
  box(M.timber, 1.1, 0.36, 0.7, -5.4, 0.34, -2.6, house, true); // coffee table
  box(M.charcoal, 1.8, 0.5, 0.5, -1.7, 0.42, -2.8, house, true); // TV console
  box(M.charcoal, 1.5, 0.9, 0.06, -1.7, 1.35, -2.8, house); // TV
  box(M.sage, 3.2, 0.03, 2.4, -4.8, 0.22, -2.6, house); // rug
  box(M.timberDark, 0.5, 1.2, 0.5, -7.4, 0.78, -0.7, house, true); // plant stand
  box(M.foliage, 0.55, 0.7, 0.55, -7.4, 1.6, -0.7, house);

  // Dining (x[-1,4] z[-5.5,0])
  box(M.timber, 1.7, 0.08, 1.0, 1.5, 0.76, -2.6, house, true);
  box(M.timberDark, 0.12, 0.7, 0.9, 0.75, 0.38, -2.6, house);
  box(M.timberDark, 0.12, 0.7, 0.9, 2.25, 0.38, -2.6, house);
  chair(1.05, -3.5, 0);
  chair(1.95, -3.5, 0);
  chair(1.05, -1.7, Math.PI);
  chair(1.95, -1.7, Math.PI);

  // Kitchen (x[4,8] z[-5.5,0])
  box(M.stone, 0.7, 0.95, 4.4, 7.5, 0.63, -2.8, house, true); // counter
  box(M.timberDark, 0.72, 0.9, 1.2, 7.5, 1.75, -4.6, house); // upper cabinets
  box(M.metal, 0.5, 0.06, 0.6, 7.5, 1.13, -1.6, house); // sink
  box(M.stone, 1.6, 0.95, 0.8, 5.9, 0.63, -2.4, house, true); // island
  box(M.charcoal, 0.8, 1.9, 0.8, 7.45, 1.1, -0.5, house, true); // fridge

  // Master (x[-8,-2.5] z[1.5,5.5])
  bed(-5.4, 4.3, 1.9, 2.1);
  sideTable(-6.6, 5.0);
  sideTable(-4.2, 5.0);
  wardrobe(-7.55, 2.6, 0.7, 1.8);
  box(M.sage, 2.6, 0.03, 1.8, -5.4, 0.22, 2.9, house); // rug

  // Bedroom 2 (x[-2.5,1.5] z[1.5,5.5])
  bed(-0.5, 4.4, 1.5, 2.0);
  sideTable(-1.6, 5.0);
  wardrobe(-2.0, 2.2, 0.6, 1.4);
  box(M.timber, 1.2, 0.75, 0.5, 0.8, 0.55, 5.2, house, true); // desk

  // Bedroom 3 (x[1.5,5] z[1.5,5.5])
  bed(3.2, 4.4, 1.5, 2.0);
  sideTable(2.1, 5.0);
  wardrobe(4.4, 2.2, 0.6, 1.4);
  box(M.timber, 1.4, 0.06, 0.6, 3.2, 1.55, 1.9, house, true); // shelf/desk

  // Bath 1 (x[5,6.6] z[1.5,5.5])
  box(M.porcelain, 0.4, 0.42, 0.6, 6.3, 0.38, 2.3, house, true); // wc
  box(M.porcelain, 0.4, 0.15, 0.65, 6.3, 0.9, 2.25, house); // cistern
  box(M.porcelain, 0.55, 0.15, 0.45, 5.3, 0.95, 5.2, house); // basin
  box(M.stone, 0.55, 0.8, 0.45, 5.3, 0.55, 5.2, house, true); // vanity
  box(M.glass, 0.05, 2.1, 1.4, 5.6, 1.18, 3.6, house); // shower screen
  box(M.porcelain, 0.9, 0.08, 1.4, 6.1, 0.28, 3.6, house); // shower tray

  // Bath 2 (x[6.6,8] z[1.5,5.5])
  box(M.porcelain, 0.4, 0.42, 0.6, 7.5, 0.38, 2.2, house, true);
  box(M.stone, 0.5, 0.8, 0.45, 7.55, 0.55, 5.1, house, true);
  box(M.porcelain, 0.5, 0.14, 0.45, 7.55, 0.97, 5.1, house);

  // Corridor (z[0,1.5])
  box(M.timberDark, 0.06, 2.1, 0.9, -2.44, 1.2, 3.2, house); // door leaves (open, decorative)
  for (const [x, z] of [[-6, 0.75], [-0.5, 0.75], [3.2, 0.75], [6, 0.75]] as const) {
    box(M.lampGlow, 0.35, 0.06, 0.35, x, WALL_H - 0.05, z, house);
  }
  for (const [x, z] of [[-5.4, -2.6], [1.5, -2.6], [6, -2.6], [-5.4, 3.6], [3.2, 3.6]] as const) {
    box(M.lampGlow, 0.45, 0.06, 0.45, x, WALL_H - 0.05, z, house);
  }

  // Entry porch + steps
  box(M.stone, 2.6, 0.12, 1.6, 2.05, 0.12, -6.4, house);
  box(M.stone, 2.6, 0.06, 0.4, 2.05, 0.06, -7.3, house);
  box(M.timberDark, 0.14, 2.9, 0.14, 0.95, 1.5, -7.3, house);
  box(M.timberDark, 0.14, 2.9, 0.14, 3.15, 1.5, -7.3, house);
  box(M.roofEdge, 2.8, 0.14, 1.9, 2.05, 3.0, -6.6, house);

  // ============================================================
  // GATED COMMUNITY CONTEXT
  // ============================================================
  const groundG = new THREE.PlaneGeometry(180, 180);
  geometries.push(groundG);
  const ground = new THREE.Mesh(groundG, M.lawn);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  root.add(ground);

  box(M.ground, 180, 0.02, 8, 0, 0.0, 26, root); // main avenue
  box(M.ground, 8, 0.02, 60, 0, 0.0, -2, root); // spur road past the house
  box(M.path, 2.2, 0.05, 8, 2.05, 0.05, -11.5, root); // front path
  box(M.path, 12, 0.05, 2.2, 0, 0.05, -9.5, root); // walk link

  // Reflective water feature + deck in front of residence
  box(M.water, 6, 0.06, 2.4, -13.5, 0.06, -8, root);
  box(M.timber, 6.8, 0.1, 3.4, -13.5, 0.03, -8, root);
  box(M.water, 6, 0.06, 2.4, -13.5, 0.09, -8, root);

  // Neighbour villas (massing only, own roof, no interiors)
  const villa = (x: number, z: number, ry: number, tone: THREE.Material) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    box(tone, 11, 3.1, 8, 0, 1.6, 0, g);
    box(M.roof, 11.6, 0.25, 8.6, 0, 3.3, 0, g);
    box(M.roofEdge, 11.6, 0.4, 0.14, 0, 3.55, -4.3, g);
    box(M.roofEdge, 11.6, 0.4, 0.14, 0, 3.55, 4.3, g);
    box(M.glass, 6.5, 1.3, 0.06, 0, 1.6, -4.05, g);
    box(M.timberDark, 1.2, 2.4, 0.15, -3.8, 1.25, -4.05, g);
    root.add(g);
  };
  villa(-26, 6, 0.35, M.wallExt);
  villa(26, 4, -0.4, M.sage);
  villa(-24, -16, 0.1, M.wallExt);
  villa(24, -18, -0.15, M.stone);
  villa(0, 24, Math.PI, M.wallExt);
  villa(-27, 26, 0.6, M.sage);
  villa(27, 25, -0.5, M.wallExt);

  // Community gate + guard house (south avenue)
  box(M.stone, 1.4, 4.4, 1.4, -6.5, 2.2, 26, root, true);
  box(M.stone, 1.4, 4.4, 1.4, 6.5, 2.2, 26, root, true);
  box(M.roofEdge, 15.5, 0.6, 1.6, 0, 4.7, 26, root);
  box(M.wallExt, 4, 2.8, 3, 10.5, 1.4, 29, root, true);
  box(M.roof, 4.6, 0.2, 3.6, 10.5, 2.9, 29, root);
  box(M.charcoal, 9.6, 0.12, 0.12, 0, 1.1, 26, root);
  box(M.metal, 0.25, 1.2, 0.25, 0, 0.6, 26, root);

  // Perimeter boundary wall + hedges
  const boundary = (horizontal: boolean, fixed: number, from: number, to: number) => {
    const len = to - from;
    const c = horizontal ? M.stone : M.stone;
    if (horizontal) box(c, len, 1.6, 0.35, (from + to) / 2, 0.8, fixed, root, true);
    else box(c, 0.35, 1.6, len, fixed, 0.8, (from + to) / 2, root, true);
  };
  boundary(true, 42, -45, 45);
  boundary(true, -42, -45, -12);
  boundary(true, -42, 12, 45);
  boundary(false, -45, -42, 42);
  boundary(false, 45, -42, 42);

  // Trees
  const tree = (x: number, z: number, s = 1) => {
    box(M.trunk, 0.3 * s, 2.4 * s, 0.3 * s, x, 1.2 * s, z, root);
    const g = new THREE.SphereGeometry(1.3 * s, 10, 8);
    geometries.push(g);
    const crown = new THREE.Mesh(g, Math.random() > 0.5 ? M.foliage : M.foliageLight);
    crown.position.set(x, 2.9 * s, z);
    crown.castShadow = true;
    root.add(crown);
  };
  const palm = (x: number, z: number) => {
    box(M.trunk, 0.24, 4.6, 0.24, x, 2.3, z, root);
    for (let i = 0; i < 6; i++) {
      const frond = box(M.foliage, 2.3, 0.09, 0.4, x, 4.6, z, root);
      frond.rotation.y = (i * Math.PI) / 3;
      frond.rotation.z = 0.28;
      frond.position.x = x + Math.sin((i * Math.PI) / 3) * 1.0;
      frond.position.z = z + Math.cos((i * Math.PI) / 3) * 1.0;
    }
  };
  const spots: Array<[number, number]> = [
    [-16, -14], [-19, -4], [-15, 12], [14, 10], [18, -6], [15, -15],
    [-35, -30], [35, -28], [-38, 15], [38, 12], [-12, 34], [12, 34],
    [-32, -5], [32, -2], [-8, -34], [8, -36], [22, 36], [-22, 36],
  ];
  spots.forEach(([x, z], i) => (i % 3 === 0 ? palm(x, z) : tree(x, z, 0.9 + (i % 4) * 0.18)));

  // Hedges around featured plot
  box(M.foliage, 22, 0.7, 0.6, 0, 0.35, -12.6, root, true);
  box(M.foliage, 0.6, 0.7, 10, -12.3, 0.35, -7.5, root, true);
  box(M.foliage, 0.6, 0.7, 10, 12.3, 0.35, -7.5, root, true);

  // Street lights along avenue
  for (const x of [-30, -10, 10, 30]) {
    box(M.metal, 0.14, 5, 0.14, x, 2.5, 30.5, root);
    box(M.lampGlow, 0.5, 0.14, 0.3, x, 5, 30.2, root);
  }

  // Clubhouse block at the entrance
  box(M.wallExt, 10, 3.4, 6, -18, 1.7, 33, root, true);
  box(M.roofEdge, 10.8, 0.3, 6.8, -18, 3.55, 33, root);
  box(M.glass, 7, 1.6, 0.06, -18, 1.5, 30.05, root);
  box(M.water, 5, 0.05, 2, -18, 0.12, 27.5, root);

  // Soft interior fill light so rooms aren't flat
  const fill = new THREE.PointLight(0xffe6c0, 22, 18, 2);
  fill.position.set(0, 2.6, -2);
  root.add(fill);
  const fill2 = new THREE.PointLight(0xffe6c0, 16, 14, 2);
  fill2.position.set(-3, 2.6, 3.5);
  root.add(fill2);

  // ============================================================
  // ROOMS
  // ============================================================
  const rooms: RoomDef[] = ROOMS;

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { root, roofGroup, colliders, rooms, dispose };
}

export const DEFAULT_VIEWS = {
  overview: { pos: new THREE.Vector3(34, 26, -34), target: new THREE.Vector3(0, 2, 0) },
  dollhouse: { pos: new THREE.Vector3(14, 17, -15), target: new THREE.Vector3(0, 1.5, 0) },
};
