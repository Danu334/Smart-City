import * as THREE from "three";

// A stylised model of central Chișinău around Bulevardul Ștefan cel Mare:
// low 2–5 floor neoclassical blocks with hip roofs along a tree-lined
// boulevard, Soviet-era mid-rises further out, and the landmarks of Piața
// Marii Adunări Naționale. North is -z; the boulevard runs along x.

const WALL = 0xf6f8fb;
const ROOF = 0xdde3ec;
const DOME = 0x4a5566;
const TREE = 0xb5cfbd;
const PARK = 0xe4eee7;
const ROAD = 0xe2e8f0;

// Areas kept free of generic blocks: parks, the square and the landmarks.
const RESERVED = [
  { x0: -2.8, x1: 2.8, z0: -6.8, z1: -0.9 }, // square + Cathedral Park
  { x0: -5.5, x1: -3.5, z0: -5.0, z1: -0.9 }, // Ștefan cel Mare Park
  { x0: -2.8, x1: 2.8, z0: 0.9, z1: 4.2 }, // Government House
  { x0: -7.3, x1: -4.8, z0: 0.9, z1: 3.3 }, // Primăria
];
const CROSS_X = [-7.6, -3.15, 3.15, 7.6]; // cross streets
const CROSS_Z = [-7.4, 5.4]; // parallel streets
const BOULEVARD = 1.0; // half-width incl. sidewalks

const inRect = (x, z, w, d, r) => x + w / 2 > r.x0 && x - w / 2 < r.x1 && z + d / 2 > r.z0 && z - d / 2 < r.z1;

function blocked(x, z, w, d) {
  if (Math.abs(z) - d / 2 < BOULEVARD) return true;
  if (CROSS_X.some((s) => Math.abs(x - s) - w / 2 < 0.35)) return true;
  if (CROSS_Z.some((s) => Math.abs(z - s) - d / 2 < 0.35)) return true;
  return RESERVED.some((r) => inRect(x, z, w, d, r));
}

export function buildChisinau(scene, rand, lineColor) {
  const wallMat = new THREE.MeshStandardMaterial({ color: WALL, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: ROOF, roughness: 0.9, flatShading: true });
  const domeMat = new THREE.MeshStandardMaterial({ color: DOME, roughness: 0.45, metalness: 0.25 });
  const edgeMat = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.55 });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const targets = []; // what citation beams can hit

  // ---------- Ground: boulevard, streets, parks ----------
  const flat = (w, d, x, z, color, y = 0.004) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ color }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, y, z);
    scene.add(mesh);
  };
  flat(30, 1.2, 0, 0, ROAD);
  CROSS_X.forEach((x) => flat(0.55, 30, x, 0, ROAD));
  CROSS_Z.forEach((z) => flat(30, 0.55, 0, z, ROAD));
  RESERVED.slice(0, 2).forEach((r) => flat(r.x1 - r.x0, r.z1 - r.z0, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, PARK, 0.006));
  flat(3.2, 1.1, 0, -1.75, 0xeef2f7, 0.008); // paved square in front of the arch
  for (let x = -14; x < 14; x += 0.7) flat(0.35, 0.04, x, 0, 0xffffff, 0.01); // lane markings

  // ---------- Generic blocks ----------
  const blocks = [];
  for (let gx = -12; gx <= 12; gx += 1.05) {
    for (let gz = -11; gz <= 11; gz += 1.05) {
      const x = gx + (rand() - 0.5) * 0.12;
      const z = gz + (rand() - 0.5) * 0.12;
      const dist = Math.hypot(x, z);
      if (rand() < 0.08 + dist * 0.02) continue; // courtyards, thinning out
      let w = 0.62 + rand() * 0.28;
      let d = 0.62 + rand() * 0.28;
      let h;
      let roof = false;
      const r = rand();
      if (Math.abs(z) < 3.4) {
        // boulevard frontage: 19th-century 2–4 floor buildings
        h = 0.42 + rand() * 0.55;
        roof = rand() < 0.7;
      } else if (r < 0.14) {
        // Soviet-era 9-floor slab
        h = 1.35 + rand() * 0.45;
        w = 0.95;
        d = 0.55;
      } else if (r < 0.16 && dist > 8) {
        // occasional 16-floor tower on the edge of the centre
        h = 2.1 + rand() * 0.4;
        w = d = 0.6;
      } else {
        h = 0.45 + rand() * 0.75;
        roof = rand() < 0.45;
      }
      if (blocked(x, z, w, d)) continue;
      blocks.push({ x, z, w, d, h, roof });
    }
  }

  // Government House: long modernist block facing the square across the boulevard.
  blocks.push({ x: 0, z: 2.75, w: 4.4, d: 1.0, h: 1.3, roof: false });
  blocks.push({ x: 0, z: 2.75, w: 1.5, d: 1.3, h: 1.65, roof: false });
  targets.push({ x: 0, z: 2.75, w: 4.4, d: 1.3, h: 1.65 });
  // Primăria main building (tower added below).
  blocks.push({ x: -6.15, z: 2.1, w: 2.0, d: 1.1, h: 0.8, roof: true });
  targets.push({ x: -6.15, z: 2.1, w: 2.0, d: 1.1, h: 1.0 });

  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const walls = new THREE.InstancedMesh(box, wallMat, blocks.length);
  blocks.forEach((b, k) => {
    m.makeScale(b.w, b.h, b.d).setPosition(b.x, 0, b.z);
    walls.setMatrixAt(k, m);
  });
  scene.add(walls);

  // Hip roofs on the older buildings.
  const hip = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
  hip.rotateY(Math.PI / 4);
  hip.translate(0, 0.5, 0);
  const roofed = blocks.filter((b) => b.roof);
  const roofs = new THREE.InstancedMesh(hip, roofMat, roofed.length);
  roofed.forEach((b, k) => {
    m.makeScale(b.w * 1.06, 0.2, b.d * 1.06).setPosition(b.x, b.h, b.z);
    roofs.setMatrixAt(k, m);
  });
  scene.add(roofs);

  // All block outlines in one draw call.
  const unit = new THREE.EdgesGeometry(box).attributes.position.array;
  const edgePos = new Float32Array(unit.length * blocks.length);
  blocks.forEach((b, k) => {
    for (let p = 0; p < unit.length; p += 3) {
      const o = k * unit.length + p;
      edgePos[o] = unit[p] * b.w + b.x;
      edgePos[o + 1] = unit[p + 1] * b.h;
      edgePos[o + 2] = unit[p + 2] * b.d + b.z;
    }
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
  scene.add(new THREE.LineSegments(edgeGeo, edgeMat));

  // Window rows on every face (one per floor).
  const rows = [];
  blocks.forEach((b) => {
    const floors = Math.floor(b.h / 0.2);
    for (let f = 1; f < floors; f++) {
      const y = f * 0.2 - 0.04;
      rows.push([b.x, y, b.z + b.d / 2 + 0.003, b.w * 0.78, 0]);
      rows.push([b.x, y, b.z - b.d / 2 - 0.003, b.w * 0.78, 0]);
      rows.push([b.x + b.w / 2 + 0.003, y, b.z, b.d * 0.78, Math.PI / 2]);
      rows.push([b.x - b.w / 2 - 0.003, y, b.z, b.d * 0.78, Math.PI / 2]);
    }
  });
  const rowMesh = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: lineColor, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }),
    rows.length
  );
  const s = new THREE.Vector3();
  const pos = new THREE.Vector3();
  rows.forEach(([x, y, z, len, ry], k) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, ry);
    rowMesh.setMatrixAt(k, m.compose(pos.set(x, y, z), q, s.set(len, 0.035, 1)));
  });
  scene.add(rowMesh);

  // Only cite buildings near the centre so beams stay in frame.
  blocks.forEach((b) => b.h > 0.7 && Math.hypot(b.x, b.z + 0.6) < 6.5 && targets.push(b));

  // ---------- Landmarks ----------
  const part = (geo, x, y, z, mat = wallMat, parent = scene) => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    if (mat !== domeMat) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat);
      e.position.copy(mesh.position);
      parent.add(e);
    }
    return mesh;
  };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const halfSphere = (r) => new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);

  // Arcul de Triumf (1840): white stone arch on the square.
  {
    const x = 0;
    const z = -1.75;
    for (const sx of [-0.36, 0.36]) for (const sz of [-0.26, 0.26]) part(B(0.2, 0.9, 0.2), x + sx, 0.45, z + sz);
    part(B(1.0, 0.2, 0.76), x, 1.0, z);
    part(B(0.8, 0.14, 0.58), x, 1.17, z);
    part(new THREE.CylinderGeometry(0.13, 0.13, 0.14, 16), x, 1.31, z);
    part(halfSphere(0.14), x, 1.38, z);
    targets.push({ x, z, w: 1.0, d: 0.76, h: 1.52 });
  }

  // Catedrala Nașterea Domnului: cross plan, four porticos, drum and dark dome.
  {
    const cx = 0;
    const cz = -4.3;
    part(B(2.1, 0.75, 0.95), cx, 0.375, cz);
    part(B(0.95, 0.75, 2.1), cx, 0.375, cz);
    const pediment = new THREE.CylinderGeometry(0.34, 0.34, 1.0, 3);
    pediment.rotateZ(Math.PI / 2);
    pediment.rotateX(-Math.PI / 2);
    pediment.scale(1, 0.55, 1);
    for (let i = 0; i < 4; i++) {
      const portico = new THREE.Group();
      portico.position.set(cx, 0, cz);
      portico.rotation.y = (i * Math.PI) / 2;
      scene.add(portico);
      for (let c = 0; c < 6; c++) {
        part(new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8), -0.4 + c * 0.16, 0.31, 1.3, wallMat, portico);
      }
      part(B(1.0, 0.09, 0.36), 0, 0.665, 1.2, wallMat, portico);
      part(pediment, 0, 0.8, 1.2, wallMat, portico);
    }
    part(new THREE.CylinderGeometry(0.42, 0.42, 0.45, 24), cx, 0.975, cz);
    part(halfSphere(0.44), cx, 1.2, cz, domeMat);
    part(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 12), cx, 1.72, cz);
    part(halfSphere(0.075), cx, 1.81, cz, domeMat);
    targets.push({ x: cx, z: cz, w: 2.1, d: 2.1, h: 1.9 });
  }

  // Clopotnița: the tall tiered bell tower in Cathedral Park.
  {
    const x = -1.95;
    const z = -2.75;
    let y = 0;
    for (const [w, h] of [
      [0.62, 0.7],
      [0.52, 0.5],
      [0.44, 0.45],
      [0.36, 0.4],
    ]) {
      part(B(w, h, w), x, y + h / 2, z);
      y += h;
    }
    part(new THREE.CylinderGeometry(0.15, 0.15, 0.24, 16), x, y + 0.12, z);
    part(halfSphere(0.16), x, y + 0.24, z, domeMat);
    part(new THREE.ConeGeometry(0.03, 0.28, 6), x, y + 0.54, z, domeMat);
    targets.push({ x, z, w: 0.62, d: 0.62, h: y + 0.68 });
  }

  // Primăria's clock tower with its pointed roof.
  {
    const x = -5.25;
    const z = 1.62;
    part(B(0.36, 1.75, 0.36), x, 0.875, z);
    part(B(0.44, 0.06, 0.44), x, 1.78, z);
    const spire = new THREE.ConeGeometry(0.27, 0.55, 4);
    spire.rotateY(Math.PI / 4);
    part(spire, x, 2.085, z, roofMat);
    const clock = new THREE.MeshBasicMaterial({ color: 0x0b4f9c });
    for (const side of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), clock);
      face.position.set(x, 1.5, z + side * 0.183);
      if (side < 0) face.rotation.y = Math.PI;
      scene.add(face);
    }
    targets.push({ x, z, w: 0.36, d: 0.36, h: 2.36 });
  }

  // Ștefan cel Mare monument at the corner of his park.
  {
    const x = -3.75;
    const z = -1.25;
    part(B(0.26, 0.34, 0.26), x, 0.17, z);
    part(new THREE.CylinderGeometry(0.05, 0.07, 0.26, 10), x, 0.47, z);
    part(new THREE.SphereGeometry(0.05, 12, 8), x, 0.64, z);
  }

  // ---------- Trees ----------
  const trees = [];
  const clear = (x, z) =>
    !(Math.abs(x) < 1.35 && z > -5.5 && z < -3.1) && // cathedral
    !(Math.abs(x) < 1.6 && z > -2.35 && z < -1.1) && // arch + square
    !(Math.hypot(x + 1.95, z + 2.75) < 0.55) && // bell tower
    !(Math.hypot(x + 3.75, z + 1.25) < 0.4); // monument
  // Boulevard lined with trees on both sides.
  for (let x = -13; x <= 13; x += 0.55) {
    for (const z of [-0.78, 0.78]) {
      if (CROSS_X.some((s) => Math.abs(x - s) < 0.4)) continue;
      if (z < 0 && Math.abs(x) < 1.6) continue; // keep the arch visible
      trees.push([x + (rand() - 0.5) * 0.08, z, 0.8 + rand() * 0.25]);
    }
  }
  // Cathedral Park and Ștefan cel Mare Park.
  RESERVED.slice(0, 2).forEach((r) => {
    for (let x = r.x0 + 0.3; x < r.x1 - 0.2; x += 0.5) {
      for (let z = r.z0 + 0.3; z < r.z1 - 0.2; z += 0.5) {
        const tx = x + (rand() - 0.5) * 0.3;
        const tz = z + (rand() - 0.5) * 0.3;
        if (rand() < 0.2 || !clear(tx, tz)) continue;
        trees.push([tx, tz, 0.85 + rand() * 0.4]);
      }
    }
  });
  const crown = new THREE.IcosahedronGeometry(0.2, 0);
  const treeMesh = new THREE.InstancedMesh(
    crown,
    new THREE.MeshStandardMaterial({ color: TREE, roughness: 0.9, flatShading: true }),
    trees.length
  );
  trees.forEach(([x, z, sc], k) => {
    q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rand() * Math.PI);
    treeMesh.setMatrixAt(k, m.compose(pos.set(x, 0.18 * sc + 0.08, z), q, s.set(sc, sc * 1.1, sc)));
  });
  scene.add(treeMesh);

  return targets;
}
