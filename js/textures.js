import * as THREE from 'three';
import { pick } from './i18n.js';

// Seeded RNG so the world looks the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cloudTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = rng(7);
  for (let i = 0; i < 28; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.pow(r(), 0.7) * size * 0.26;
    const x = size / 2 + Math.cos(a) * d * 1.3;
    const y = size / 2 + Math.sin(a) * d * 0.7;
    const rad = size * (0.12 + r() * 0.16);
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, 'rgba(255,255,255,0.22)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Shown until assets/portrait.jpg exists: a softly lit head-and-shoulders bust.
export function fallbackPortrait() {
  const w = 400, h = 500;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  // transparent backdrop: only the figure becomes portrait particles

  // shoulders + neck as one silhouette
  g.beginPath();
  g.moveTo(170, 280);
  g.lineTo(166, 345);
  g.bezierCurveTo(120, 372, 40, 380, 18, 450);
  g.lineTo(6, 500);
  g.lineTo(394, 500);
  g.lineTo(382, 450);
  g.bezierCurveTo(360, 380, 280, 372, 234, 345);
  g.lineTo(230, 280);
  g.closePath();
  let grd = g.createRadialGradient(160, 400, 10, 200, 430, 240);
  grd.addColorStop(0, '#b8b8b8');
  grd.addColorStop(1, '#2a2a2a');
  g.fillStyle = grd;
  g.fill();

  // shadow under the chin
  grd = g.createLinearGradient(0, 290, 0, 360);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.globalCompositeOperation = 'source-atop';
  g.fillRect(150, 280, 100, 80);
  g.globalCompositeOperation = 'source-over';

  // head, lit from the upper left
  grd = g.createRadialGradient(172, 165, 4, 200, 200, 140);
  grd.addColorStop(0, '#ffffff');
  grd.addColorStop(0.55, '#c9c9c9');
  grd.addColorStop(1, '#3c3c3c');
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(200, 190, 90, 116, 0, 0, Math.PI * 2);
  g.fill();

  // hair falls off softly toward the crown
  g.globalCompositeOperation = 'source-atop';
  grd = g.createLinearGradient(0, 70, 0, 150);
  grd.addColorStop(0, 'rgba(0,0,0,0.6)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(100, 60, 200, 100);
  g.globalCompositeOperation = 'source-over';
  return c;
}

// Placeholder screen for a project with no image yet.
export function projectPlaceholder(p, index) {
  const w = 1600, h = 1000;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const r = rng(index * 31 + 5);
  const accent = p.accent || '#7cc4ff';

  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0b0f1a');
  bg.addColorStop(1, '#141b2e');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  // glow
  const gl = g.createRadialGradient(w * 0.72, h * 0.42, 0, w * 0.72, h * 0.42, w * 0.55);
  gl.addColorStop(0, accent + 'aa');
  gl.addColorStop(1, accent + '00');
  g.fillStyle = gl;
  g.fillRect(0, 0, w, h);

  // grid
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  g.lineWidth = 1;
  for (let x = 0; x < w; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 80) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }

  // ridge line — a small mountain range motif
  g.beginPath();
  g.moveTo(0, h * 0.8);
  let y = h * 0.8;
  for (let x = 0; x <= w; x += 40) {
    y += (r() - 0.5) * 90;
    y = Math.min(h * 0.92, Math.max(h * 0.5, y));
    g.lineTo(x, y);
  }
  g.lineTo(w, h); g.lineTo(0, h); g.closePath();
  const mg = g.createLinearGradient(0, h * 0.5, 0, h);
  mg.addColorStop(0, accent + '55');
  mg.addColorStop(1, '#0b0f1a00');
  g.fillStyle = mg;
  g.fill();

  // orbit rings
  g.strokeStyle = accent;
  g.globalAlpha = 0.7;
  g.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.ellipse(w * 0.72, h * 0.42, 120 + i * 70, 40 + i * 24, -0.3, 0, Math.PI * 2);
    g.stroke();
  }
  g.globalAlpha = 1;

  // fake browser chrome
  g.fillStyle = 'rgba(255,255,255,0.06)';
  g.fillRect(0, 0, w, 64);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath(); g.arc(40 + i * 30, 32, 9, 0, Math.PI * 2); g.fill();
  });
  g.fillStyle = 'rgba(255,255,255,0.1)';
  g.fillRect(w / 2 - 260, 18, 520, 28);

  // copy
  g.fillStyle = '#fff';
  g.font = '800 132px "Inter Tight", sans-serif';
  g.fillText(pick(p.title).toUpperCase(), 90, 330);
  g.font = '500 34px "JetBrains Mono", monospace';
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillText(String(index + 1).padStart(2, '0') + ' — ' + p.year, 96, 200);
  g.font = '400 40px "Inter Tight", sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.75)';
  wrap(g, pick(p.tagline), 96, 420, 760, 54);

  // fake buttons
  g.fillStyle = accent;
  roundRect(g, 96, 560, 240, 70, 35); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.4)';
  roundRect(g, 356, 560, 240, 70, 35); g.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function wrap(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line + word + ' ';
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y);
      line = word + ' ';
      y += lh;
    } else line = test;
  }
  g.fillText(line, x, y);
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
