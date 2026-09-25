import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createStage } from "./stage";
import { glowTexture, seeded } from "./textures";

const TEAL = new THREE.Color("#3fd0c9");
const W = 1.5;
const H = 2.12; // A4 proportions
const ROWS = 18;

// Draws an abstract page (heading + text rows) and returns where its
// highlighted passage sits, in page-local units.
function pageTexture(rand) {
  const cw = 512;
  const ch = Math.round((cw * H) / W);
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const g = c.getContext("2d");

  g.fillStyle = "rgba(20, 26, 38, 0.92)";
  g.fillRect(0, 0, cw, ch);
  g.strokeStyle = "rgba(186, 215, 247, 0.35)";
  g.lineWidth = 3;
  g.strokeRect(1.5, 1.5, cw - 3, ch - 3);

  const pad = 44;
  g.fillStyle = "rgba(216, 236, 248, 0.75)";
  g.fillRect(pad, pad, cw * (0.35 + rand() * 0.25), 18);
  g.fillStyle = "rgba(157, 167, 186, 0.5)";
  g.fillRect(pad, pad + 32, cw * 0.22, 10);

  const top = pad + 80;
  const step = (ch - top - pad) / ROWS;
  const start = 3 + Math.floor(rand() * (ROWS - 7));
  const span = 2 + Math.floor(rand() * 2);
  for (let r = 0; r < ROWS; r++) {
    if (rand() < 0.12) continue;
    const y = top + r * step;
    const len = r % 5 === 4 ? 0.4 + rand() * 0.3 : 0.78 + rand() * 0.2;
    g.fillStyle = r >= start && r < start + span ? "rgba(216, 236, 248, 0.8)" : "rgba(157, 167, 186, 0.32)";
    g.fillRect(pad, y, (cw - pad * 2) * len, 8);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const y0 = top + start * step - step * 0.35;
  const y1 = top + (start + span) * step - step * 0.35;
  return {
    tex,
    passage: {
      y: H / 2 - ((y0 + y1) / 2 / ch) * H,
      h: ((y1 - y0) / ch) * H,
    },
  };
}

function build(stage) {
  const { scene, camera } = stage;
  const rand = seeded(23);

  const count = 7;
  const sheets = Array.from({ length: count }, (_, i) => {
    const { tex, passage } = pageTexture(rand);
    const group = new THREE.Group();
    const page = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    const highlight = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 0.9, passage.h),
      new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    highlight.position.set(0, passage.y, 0.005);
    group.add(page, highlight);

    const angle = (i / count) * Math.PI * 2;
    const home = new THREE.Vector3(Math.cos(angle) * 2.3, Math.sin(angle * 2) * 0.35, Math.sin(angle) * 1.6 - 0.6);
    group.position.copy(home);
    scene.add(group);
    return { group, highlight, home, angle, phase: rand() * Math.PI * 2, focus: 0, passage };
  });

  const orb = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 2), new THREE.MeshBasicMaterial({ color: 0xe6fffd }));
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.26, 1),
    new THREE.MeshBasicMaterial({ color: TEAL, wireframe: true, transparent: true, opacity: 0.6 })
  );
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  halo.scale.setScalar(1.6);
  orb.add(core, shell, halo);
  orb.position.set(0, -1.9, 1.4);
  scene.add(orb);

  const link = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 32 }, () => new THREE.Vector3())),
    new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
  );
  scene.add(link);

  const dustCount = 160;
  const dustPos = new Float32Array(dustCount * 3);
  for (let k = 0; k < dustCount; k++) {
    dustPos[k * 3] = (rand() - 0.5) * 9;
    dustPos[k * 3 + 1] = (rand() - 0.5) * 7;
    dustPos[k * 3 + 2] = (rand() - 0.5) * 5;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xb6d9fc, size: 0.03, transparent: true, opacity: 0.5, depthWrite: false })
  );
  scene.add(dust);

  let active = 0;
  let since = 0;
  const target = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  const onResize = (w, h) => {
    camera.position.set(0, 0.2, w / h < 0.8 ? 9.5 : 7.2);
  };

  const tick = (dt, t, p) => {
    since += dt;
    if (since > 3.2) {
      since = 0;
      active = (active + 1 + Math.floor(rand() * (count - 1))) % count;
    }

    camera.lookAt(0, 0, 0);
    scene.rotation.y = t * 0.06 + p.x * 0.25;
    scene.rotation.x = p.y * 0.08;

    sheets.forEach((s, i) => {
      const on = i === active;
      s.focus += ((on ? 1 : 0) - s.focus) * Math.min(dt * 3, 1);
      s.group.position.set(
        s.home.x * (1 - s.focus * 0.45),
        s.home.y + Math.sin(t * 0.8 + s.phase) * 0.12 + s.focus * 0.25,
        s.home.z + s.focus * 1.4
      );
      // Pages loosely face the viewer, the active one squarely.
      s.group.rotation.y = -scene.rotation.y * s.focus + (1 - s.focus) * (-s.angle * 0.35 + Math.sin(t * 0.5 + s.phase) * 0.15);
      s.group.rotation.z = (1 - s.focus) * Math.sin(t * 0.4 + s.phase) * 0.08;
      s.highlight.material.opacity = s.focus * (0.32 + Math.sin(t * 3) * 0.06);
    });

    const a = sheets[active];
    a.group.localToWorld(target.set(0, a.passage.y, 0));
    scene.worldToLocal(target);
    const from = orb.position;
    const pos = link.geometry.attributes.position;
    const grow = Math.min(since / 0.5, 1);
    for (let k = 0; k < pos.count; k++) {
      const u = (k / (pos.count - 1)) * grow;
      tmp.lerpVectors(from, target, u);
      tmp.y += Math.sin(u * Math.PI) * 0.6;
      pos.setXYZ(k, tmp.x, tmp.y, tmp.z);
    }
    pos.needsUpdate = true;
    link.material.opacity = since < 2.8 ? 0.85 : Math.max(0, 0.85 * (1 - (since - 2.8) / 0.4));

    shell.rotation.set(t * 0.4, t * 0.6, 0);
    orb.position.y = -1.9 + Math.sin(t * 1.3) * 0.06;
    halo.material.opacity = 0.7 + Math.sin(t * 2.4) * 0.15;
    dust.rotation.y = t * 0.02;
  };

  return { tick, onResize };
}

export default function DocsScene({ className }) {
  const ref = useRef(null);

  useEffect(() => {
    const stage = createStage(ref.current, { fov: 40 });
    const { tick, onResize } = build(stage);
    stage.start(tick, onResize);
    return () => stage.dispose();
  }, []);

  return <div ref={ref} className={className} />;
}
