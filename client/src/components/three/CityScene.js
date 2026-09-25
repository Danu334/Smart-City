import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "./stage";
import { fileIconTexture, glowTexture, seeded } from "./textures";
import { buildChisinau } from "./chisinau";

const BLUE = new THREE.Color("#1f6fd1");
const LINE = new THREE.Color("#8ea5c4");
const ORB = new THREE.Vector3(0, 3.1, -0.6);

// Central Chișinău as the corpus: each building stands for a document. A
// query orb hovers over Piața Marii Adunări Naționale and fires citation
// beams at the building that holds the answer; a file flies back.
function build(stage) {
  const { scene, camera } = stage;
  const rand = seeded(11);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd6e0ee, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(-6, 12, 8);
  scene.add(key);
  const orbLight = new THREE.PointLight(BLUE, 6, 12, 1.4);
  orbLight.position.copy(ORB);
  scene.add(orbLight);

  const grid = new THREE.GridHelper(44, 44, 0xc9d4e3, 0xc9d4e3);
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, opacity: 0.16, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.01;
  scene.add(pool);

  const city = buildChisinau(scene, rand, LINE);
  const { targets } = city;

  // Query orb
  const orb = new THREE.Group();
  orb.position.copy(ORB);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 2), new THREE.MeshBasicMaterial({ color: BLUE }));
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true, transparent: true, opacity: 0.45 })
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false })
  );
  halo.scale.setScalar(2.2);
  const rings = [0.7, 0.95].map((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.006, 6, 96),
      new THREE.MeshBasicMaterial({ color: i ? LINE : BLUE, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2 + (i ? 0.5 : -0.35);
    orb.add(ring);
    return ring;
  });
  orb.add(core, shell, halo);
  scene.add(orb);

  // Citation beams (pooled). Each beam reaches a building, then a file
  // flies back along it into the orb: the cited document being retrieved.
  const icons = ["page", "folder", "decision"].map((kind) => fileIconTexture(kind));
  const beamMat = () =>
    new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0, depthWrite: false });
  const beams = Array.from({ length: 4 }, () => {
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), beamMat());
    const mark = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), beamMat());
    mark.geometry.translate(0, 0.5, 0);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(mark.geometry),
      new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0 })
    );
    const ripple = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 48), beamMat());
    ripple.rotation.x = -Math.PI / 2;
    const file = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: icons[0], transparent: true, opacity: 0, depthWrite: false, depthTest: false, fog: false })
    );
    file.renderOrder = 10;
    scene.add(mesh, mark, edge, ripple, file);
    return { mesh, mark, edge, ripple, file, curve: null, age: Infinity, tilt: 0 };
  });

  let nextFire = 0.6;
  const fire = (beam) => {
    const b = targets[Math.floor(rand() * targets.length)];
    const top = new THREE.Vector3(b.x, b.h, b.z);
    const mid = ORB.clone().lerp(top, 0.5);
    mid.y += 1.6;
    beam.curve = new THREE.QuadraticBezierCurve3(ORB.clone(), mid, top);
    beam.mesh.geometry.dispose();
    beam.mesh.geometry = new THREE.TubeGeometry(beam.curve, 64, 0.014, 5, false);
    beam.mark.scale.set(b.w + 0.03, b.h + 0.02, b.d + 0.03);
    beam.mark.position.set(b.x, 0, b.z);
    beam.edge.scale.copy(beam.mark.scale);
    beam.edge.position.copy(beam.mark.position);
    beam.ripple.position.set(b.x, b.h + 0.02, b.z);
    beam.file.material.map = icons[Math.floor(rand() * icons.length)];
    beam.tilt = (rand() - 0.5) * 0.5;
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
    new THREE.PointsMaterial({ color: LINE, size: 0.035, transparent: true, opacity: 0.6, depthWrite: false })
  );
  scene.add(dust);

  let radius = 12.5;
  const onResize = (w, h) => {
    const wide = w > 900;
    radius = w / h < 1 ? 17.5 : 12.5;
    // Wide: push the city right so the headline sits on open sky.
    // Narrow: lift it into the empty band above the stacked text.
    if (wide) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    else camera.setViewOffset(w, h, 0, h * 0.27, w, h);
  };

  const tick = (dt, t, p) => {
    city.update(t);
    const a = t * 0.045 + p.x * 0.25 + 0.6;
    camera.position.set(Math.sin(a) * radius, 5.6 + p.y * -0.6, Math.cos(a) * radius - 0.8);
    camera.lookAt(0, 0.8, -0.8);

    orb.position.y = ORB.y + Math.sin(t * 1.2) * 0.08;
    shell.rotation.set(t * 0.3, t * 0.45, 0);
    rings[0].rotation.z = t * 0.6;
    rings[1].rotation.z = -t * 0.4;
    halo.material.opacity = 0.35 + Math.sin(t * 2.4) * 0.1;

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
        beam.ripple.material.opacity = beam.file.material.opacity = 0;
        return;
      }
      beam.age += dt;
      const g = beam.age;
      const grow = Math.min(g / 0.6, 1);
      const idx = beam.mesh.geometry.index;
      if (idx) beam.mesh.geometry.setDrawRange(0, Math.floor(idx.count * grow / 30) * 30);
      const fade = g < 1.8 ? 1 : Math.max(0, 1 - (g - 1.8) / 0.8);
      beam.mesh.material.opacity = 0.9 * fade;

      // File travels building -> orb, swelling mid-flight and shrinking into the orb.
      const u = (g - 0.65) / 1.0;
      if (u > 0 && u < 1) {
        const ease = u * u * (3 - 2 * u);
        beam.file.position.copy(beam.curve.getPoint(1 - ease));
        const size = 0.28 + 0.68 * Math.sin(Math.PI * Math.min(u * 1.25, 1)) ** 0.6 * (1 - ease * 0.35);
        beam.file.scale.setScalar(size);
        beam.file.material.rotation = beam.tilt + Math.sin(u * Math.PI * 2) * 0.15;
        beam.file.material.opacity = Math.min(u * 6, 1, (1 - u) * 6);
      } else {
        beam.file.material.opacity = 0;
      }

      const hit = g > 0.6 ? Math.min((g - 0.6) / 0.15, 1) * fade : 0;
      beam.mark.material.opacity = 0.12 * hit;
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
      fog: { color: 0xf3f6fa, density: 0.035 },
    });
    const { tick, onResize } = build(stage);
    stage.start(tick, onResize);
    return () => stage.dispose();
  }, []);

  return <div ref={ref} className={className} />;
}
