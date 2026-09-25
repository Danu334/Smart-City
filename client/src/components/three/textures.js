import * as THREE from "three";

export function glowTexture(rgb = "31, 111, 209", size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${rgb}, 1)`);
  grad.addColorStop(0.25, `rgba(${rgb}, 0.45)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Deterministic PRNG so the skyline is identical on every load.
export function seeded(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Small file icons that fly along the citation beams.
// kind: "page" (highlighted passage), "folder", or "decision" (stamped).
export function fileIconTexture(kind, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const k = size / 128;
  g.scale(k, k);
  g.lineJoin = "round";
  g.lineCap = "round";
  g.shadowColor = "rgba(16, 32, 56, 0.28)";
  g.shadowBlur = 10;
  g.shadowOffsetY = 4;

  if (kind === "folder") {
    g.fillStyle = "#0b4f9c";
    g.beginPath();
    g.moveTo(14, 34);
    g.lineTo(50, 34);
    g.lineTo(58, 44);
    g.lineTo(114, 44);
    g.lineTo(114, 104);
    g.lineTo(14, 104);
    g.closePath();
    g.fill();
    g.shadowColor = "transparent";
    // paper peeking out
    g.fillStyle = "#ffffff";
    g.fillRect(24, 40, 80, 30);
    g.fillStyle = "#1f6fd1";
    g.fillRect(32, 50, 44, 5);
    // front flap
    g.fillStyle = "#1f6fd1";
    g.beginPath();
    g.moveTo(10, 58);
    g.lineTo(118, 58);
    g.lineTo(112, 106);
    g.lineTo(16, 106);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.45)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(22, 66);
    g.lineTo(106, 66);
    g.stroke();
  } else {
    // page with folded corner
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(28, 10);
    g.lineTo(82, 10);
    g.lineTo(102, 30);
    g.lineTo(102, 118);
    g.lineTo(28, 118);
    g.closePath();
    g.fill();
    g.shadowColor = "transparent";
    g.strokeStyle = "#8ea5c4";
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = "#dbe5f2";
    g.beginPath();
    g.moveTo(82, 10);
    g.lineTo(82, 30);
    g.lineTo(102, 30);
    g.closePath();
    g.fill();
    g.stroke();

    g.lineWidth = 5;
    g.strokeStyle = "#16202e";
    g.beginPath();
    g.moveTo(40, 30);
    g.lineTo(68, 30);
    g.stroke();
    g.strokeStyle = "#a9b4c4";
    const rows = kind === "decision" ? [46, 58, 70] : [46, 58, 82, 94];
    rows.forEach((y, i) => {
      g.beginPath();
      g.moveTo(40, y);
      g.lineTo(i % 2 ? 78 : 90, y);
      g.stroke();
    });

    if (kind === "decision") {
      // official stamp
      g.strokeStyle = "#0b4f9c";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(74, 96, 13, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(74, 96, 7, 0, Math.PI * 2);
      g.fillStyle = "#1f6fd1";
      g.fill();
    } else {
      // highlighted passage
      g.strokeStyle = "#1f6fd1";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(40, 70);
      g.lineTo(90, 70);
      g.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
