import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "./stage";
import { glowTexture, seeded } from "./textures";

const TEAL = new THREE.Color("#3fd0c9");
const FROST = new THREE.Color("#b6d9fc");
const GRID = 13;
const GAP = 1.15;
const ORB = new THREE.Vector3(0, 3.4, 0);

// A skyline of "documents": each building is a piece of the corpus. A query
// orb hovers over the central plaza and fires citation beams at the specific
// building (document) that holds the answer.
function build(stage) {
  const { scene, camera } = stage;
  const rand = seeded(11);

  scene.add(new THREE.HemisphereLight(0xc7d3ea, 0x05060f, 0.7));
  const key = new THREE.DirectionalLight(0xd8ecf8, 1.4);
  key.position.set(-6, 12, 8);
  scene.add(key);
  const orbLight = new THREE.PointLight(TEAL, 18, 16, 1.4);
  orbLight.position.copy(ORB);
  scene.add(orbLight);

  const grid = new THREE.GridHelper(44, 44, 0x3f4959, 0x3f4959);
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.01;
  scene.add(pool);

  // Buildings
  const buildings = [];
  const half = (GRID - 1) / 2;
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = (i - half) * GAP;
      const z = (j - half) * GAP;
      const d = Math.hypot(x, z);
      if (d < 2.2) continue; // plaza under the orb
      const falloff = Math.max(0.25, 1 - d / 10);
      const h = 0.3 + Math.pow(rand(), 2.2) * 4.2 * falloff + rand() * 0.4;
      const w = 0.62 + rand() * 0.28;
      buildings.push({ x, z, w, h });
    }
  }

  const box = new THREE.BoxGeometry(1, 1, 1);
  box.translate(0, 0.5, 0);
  const towers = new THREE.InstancedMesh(
    box,
    new THREE.MeshStandardMaterial({ color: 0x151a26, roughness: 0.55, metalness: 0.35 }),
    buildings.length
  );
  const m = new THREE.Matrix4();
  buildings.forEach((b, k) => {
    m.makeScale(b.w, b.h, b.w).setPosition(b.x, 0, b.z);
    towers.setMatrixAt(k, m);
  });
  scene.add(towers);

  // All building outlines merged into one draw call.
  const unitEdges = new THREE.EdgesGeometry(box).attributes.position.array;
  const edgePos = new Float32Array(unitEdges.length * buildings.length);
  buildings.forEach((b, k) => {
    for (let p = 0; p < unitEdges.length; p += 3) {
      const o = k * unitEdges.length + p;
      edgePos[o] = unitEdges[p] * b.w + b.x;
      edgePos[o + 1] = unitEdges[p + 1] * b.h;
      edgePos[o + 2] = unitEdges[p + 2] * b.w + b.z;
    }
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
  scene.add(
    new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: FROST, transparent: true, opacity: 0.2 }))
  );

  // "Text lines" on building faces: thin horizontal slats, like rows of a page.
  const slatGeo = new THREE.PlaneGeometry(1, 1);
  const slats = [];
  buildings.forEach((b) => {
    if (b.h < 1.2) return;
    const rows = Math.floor(b.h / 0.22);
    for (let r = 1; r < rows; r++) {
      if (rand() < 0.35) continue;
      slats.push({ b, y: r * 0.22, len: 0.35 + rand() * 0.55 });
    }
  });
  const slatMesh = new THREE.InstancedMesh(
    slatGeo,
    new THREE.MeshBasicMaterial({ color: FROST, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    slats.length
  );
  slats.forEach((s, k) => {
    const len = s.b.w * s.len;
    m.makeScale(len, 0.035, 1).setPosition(s.b.x - (s.b.w - len) / 2 + 0.06, s.y, s.b.z + s.b.w / 2 + 0.003);
    slatMesh.setMatrixAt(k, m);
  });
  scene.add(slatMesh);

  // Query orb
  const orb = new THREE.Group();
  orb.position.copy(ORB);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), new THREE.MeshBasicMaterial({ color: 0xe6fffd }));
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.55 })
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.setScalar(2.6);
  const rings = [0.7, 0.95].map((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.006, 6, 96),
      new THREE.MeshBasicMaterial({ color: i ? FROST : TEAL, transparent: true, opacity: 0.5 })
    );
    ring.rotation.x = Math.PI / 2 + (i ? 0.5 : -0.35);
    orb.add(ring);
    return ring;
  });
  orb.add(core, shell, halo);
  scene.add(orb);

  // Citation beams (pooled)
  const tall = buildings.filter((b) => b.h > 1.4);
  const beamMat = () =>
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const beams = Array.from({ length: 4 }, () => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), beamMat());
    const mark = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), beamMat());
    mark.geometry.translate(0, 0.5, 0);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mark.geometry),
      new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0 })
    );
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 48), beamMat());
    ripple.rotation.x = -Math.PI / 2;
    const spark = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: halo.material.map, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    spark.scale.setScalar(0.5);
    scene.add(mesh, mark, edge, ripple, spark);
    return { mesh, mark, edge, ripple, spark, curve: null, age: Infinity, target: null };
  });

  let nextFire = 0.6;
  const fire = (beam) => {
    const b = tall[Math.floor(rand() * tall.length)];
    const top = new THREE.Vector3(b.x, b.h, b.z);
    const mid = ORB.clone().lerp(top, 0.5);
    mid.y += 1.6;
    beam.curve = new THREE.QuadraticBezierCurve3(ORB.clone(), mid, top);
    beam.mesh.geometry.dispose();
    beam.mesh.geometry = new THREE.TubeGeometry(beam.curve, 64, 0.014, 5, false);
    beam.mark.scale.set(b.w + 0.03, b.h + 0.02, b.w + 0.03);
    beam.mark.position.set(b.x, 0, b.z);
    beam.edge.scale.copy(beam.mark.scale);
    beam.edge.position.copy(beam.mark.position);
    beam.ripple.position.set(b.x, b.h + 0.02, b.z);
    beam.age = 0;
  };

  // Dust
  const dustCount = 420;
  const dustPos = new Float32Array(dustCount * 3);
  for (let k = 0; k < dustCount; k++) {
    dustPos[k * 3] = (rand() - 0.5) * 20;
    dustPos[k * 3 + 1] = rand() * 8;
    dustPos[k * 3 + 2] = (rand() - 0.5) * 20;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: FROST, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })
  );
  scene.add(dust);

  let radius = 14;
  const onResize = (w, h) => {
    const wide = w > 900;
    radius = w / h < 1 ? 20 : 14;
    // On wide layouts, push the city right so the headline sits on open sky.
    if (wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.clearViewOffset();
  };

  const tick = (dt, t, p) => {
    const a = t * 0.045 + p.x * 0.25 + 0.6;
    camera.position.set(Math.sin(a) * radius, 7 + p.y * -0.8, Math.cos(a) * radius);
    camera.lookAt(0, 1.4, 0);

    orb.position.y = ORB.y + Math.sin(t * 1.2) * 0.08;
    shell.rotation.set(t * 0.3, t * 0.45, 0);
    rings[0].rotation.z = t * 0.6;
    rings[1].rotation.z = -t * 0.4;
    halo.material.opacity = 0.75 + Math.sin(t * 2.4) * 0.15;

    const d = dust.geometry.attributes.position;
    for (let k = 0; k < dustCount; k++) {
      let y = d.getY(k) + dt * 0.12;
      if (y > 8) y = 0;
      d.setY(k, y);
    }
    d.needsUpdate = true;

    nextFire -= dt;
    if (nextFire <= 0) {
      const free = beams.find((b) => b.age > 2.6);
      if (free) fire(free);
      nextFire = 1.1 + rand() * 0.6;
    }

    beams.forEach((beam) => {
      if (beam.age > 2.6) {
        beam.mesh.material.opacity = beam.mark.material.opacity = beam.edge.material.opacity = 0;
        beam.ripple.material.opacity = beam.spark.material.opacity = 0;
        return;
      }
      beam.age += dt;
      const g = beam.age;
      const grow = Math.min(g / 0.6, 1);
      const idx = beam.mesh.geometry.index;
      if (idx) beam.mesh.geometry.setDrawRange(0, Math.floor(idx.count * grow / 30) * 30);
      const fade = g < 1.8 ? 1 : Math.max(0, 1 - (g - 1.8) / 0.8);
      beam.mesh.material.opacity = 0.9 * fade;

      beam.spark.material.opacity = grow < 1 ? 1 : 0;
      beam.spark.position.copy(beam.curve.getPoint(grow));

      const hit = g > 0.6 ? Math.min((g - 0.6) / 0.15, 1) * fade : 0;
      beam.mark.material.opacity = 0.14 * hit;
      beam.edge.material.opacity = 0.9 * hit;
      const r = g > 0.6 ? (g - 0.6) * 1.8 : 0;
      beam.ripple.scale.setScalar(1 + r);
      beam.ripple.material.opacity = g > 0.6 ? Math.max(0, 0.8 - r * 0.35) : 0;
    });
  };

  return { tick, onResize };
}

export default function CityScene({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const stage = createStage(ref.current, {
      fov: 38,
      fog: { color: 0x05060f, density: 0.045 },
    });
    const { tick, onResize } = build(stage);
    stage.start(tick, onResize);
    return () => stage.dispose();
  }, []);

  return <div ref={ref} className={className} />;
}
