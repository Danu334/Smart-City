import * as THREE from "three";

/** 2D context of a fresh canvas; every browser that runs WebGL has one. */
export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = canvas.getContext("2d");
  if (!g) throw new Error("2D canvas is not available");
  return g;
}

export function glowTexture(rgb = "31, 111, 209", size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = context2d(c);
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
export function seeded(seed = 7): () => number {
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
export type FileIcon = "page" | "folder" | "decision";

export function fileIconTexture(kind: FileIcon, size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = context2d(c);
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
      // highlighted passage (yellow marker)
      g.strokeStyle = "#ffd200";
      g.lineWidth = 10;
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

// Flag of the Republic of Moldova (1:2) with a simplified coat of arms:
// an eagle holding a shield (red over blue) with the aurochs head. The
// emblem matters: the plain tricolour would be Romania's flag.
export function moldovaFlagTexture() {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = context2d(c);
  g.fillStyle = "#0046ae";
  g.fillRect(0, 0, W / 3, H);
  g.fillStyle = "#ffd200";
  g.fillRect(W / 3, 0, W / 3, H);
  g.fillStyle = "#cc092f";
  g.fillRect((2 * W) / 3, 0, W / 3, H);

  const cx = W / 2;
  const cy = H / 2 + 4;
  const brown = "#8a5a1c";
  const dark = "#5c3a10";
  g.lineJoin = "round";

  // wings
  g.fillStyle = brown;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + side * 10, cy - 30);
    g.lineTo(cx + side * 58, cy - 62);
    g.lineTo(cx + side * 62, cy - 30);
    g.lineTo(cx + side * 52, cy - 8);
    g.lineTo(cx + side * 56, cy + 12);
    g.lineTo(cx + side * 30, cy + 20);
    g.closePath();
    g.fill();
  }
  // body, tail, head and beak
  g.beginPath();
  g.ellipse(cx, cy, 24, 42, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(cx - 18, cy + 36);
  g.lineTo(cx + 18, cy + 36);
  g.lineTo(cx, cy + 62);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(cx, cy - 50, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e0a100";
  g.beginPath();
  g.moveTo(cx + 8, cy - 52);
  g.lineTo(cx + 20, cy - 48);
  g.lineTo(cx + 8, cy - 44);
  g.closePath();
  g.fill();
  // cross held in the beak
  g.strokeStyle = "#e0a100";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx + 22, cy - 66);
  g.lineTo(cx + 22, cy - 42);
  g.moveTo(cx + 16, cy - 60);
  g.lineTo(cx + 28, cy - 60);
  g.stroke();

  // shield: red over blue, with a yellow aurochs head
  const sw = 32;
  const sh = 40;
  const sx = cx - sw / 2;
  const sy = cy - 16;
  g.save();
  g.beginPath();
  g.moveTo(sx, sy);
  g.lineTo(sx + sw, sy);
  g.lineTo(sx + sw, sy + sh * 0.6);
  g.quadraticCurveTo(sx + sw, sy + sh, cx, sy + sh);
  g.quadraticCurveTo(sx, sy + sh, sx, sy + sh * 0.6);
  g.closePath();
  g.clip();
  g.fillStyle = "#cc092f";
  g.fillRect(sx, sy, sw, sh / 2);
  g.fillStyle = "#0046ae";
  g.fillRect(sx, sy + sh / 2, sw, sh / 2);
  g.restore();
  g.strokeStyle = dark;
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#ffd200";
  g.beginPath();
  g.ellipse(cx, sy + 18, 6, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#ffd200";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cx - 5, sy + 12);
  g.quadraticCurveTo(cx - 12, sy + 6, cx - 10, sy + 2);
  g.moveTo(cx + 5, sy + 12);
  g.quadraticCurveTo(cx + 12, sy + 6, cx + 10, sy + 2);
  g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
