import * as THREE from 'three';
import { rng, fallbackPortrait, loadImage } from './textures.js';

// Floating mountains made of light. Scroll (uMorph) pulls every island apart
// and re-assembles the pieces into a relief of the portrait: the face becomes
// a mountain range, lit like snow.

const ISLANDS = [
  // x, y, z, radius, height, underside depth
  [-34, -6, -10, 9, 10, 12],
  [-12, 10, -40, 7, 8, 9],
  [8, -11, 2, 10, 9, 13],
  [30, 6, -18, 8, 11, 10],
  [52, -4, -50, 11, 12, 14],
  [-58, 12, -60, 10, 12, 12],
  [18, 19, -70, 6, 7, 8],
  [-20, -19, -30, 6, 6, 8],
  [64, 17, -92, 9, 10, 11],
  [-46, -17, 12, 5, 5, 6],
  [-4, 26, -110, 12, 13, 15],
];

const ROCK = new THREE.Color(0.3, 0.42, 0.7);
const SNOW = new THREE.Color(0.94, 0.97, 1.0);
const UNDER = new THREE.Color(0.12, 0.17, 0.34);
const RAMP = [
  [0.0, new THREE.Color(0.04, 0.07, 0.16)],
  [0.35, new THREE.Color(0.2, 0.3, 0.55)],
  [0.7, new THREE.Color(0.62, 0.74, 0.95)],
  [1.0, new THREE.Color(1, 1, 1)],
];

function ramp(l, out) {
  for (let i = 1; i < RAMP.length; i++) {
    if (l <= RAMP[i][0]) {
      const [a, ca] = RAMP[i - 1];
      const [b, cb] = RAMP[i];
      return out.copy(ca).lerp(cb, (l - a) / (b - a));
    }
  }
  return out.copy(RAMP[RAMP.length - 1][1]);
}

function sampleIslands(count, r) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const totalArea = ISLANDS.reduce((s, i) => s + i[3] * i[3], 0);
  const c = new THREE.Color();
  let k = 0;

  ISLANDS.forEach((isl, idx) => {
    const [cx, cy, cz, R, H, D] = isl;
    const n = idx === ISLANDS.length - 1 ? count - k : Math.round((count * R * R) / totalArea);
    const peaks = Array.from({ length: 3 }, (_, j) => ({
      x: (r() - 0.5) * R * (j === 0 ? 0.3 : 0.9),
      z: (r() - 0.5) * R * (j === 0 ? 0.3 : 0.9),
      h: H * (j === 0 ? 1 : 0.45 + r() * 0.35),
      s: R * (0.55 + r() * 0.35),
    }));
    const lightA = -2.3;

    for (let i = 0; i < n && k < count; i++, k++) {
      const a = r() * Math.PI * 2;
      const rr = Math.sqrt(r()) * R;
      const x = Math.cos(a) * rr;
      const z = Math.sin(a) * rr;
      let y;
      if (r() < 0.68) {
        // snowy top surface
        let h = 0;
        for (const p of peaks) {
          const d = Math.hypot(x - p.x, z - p.z) / p.s;
          h = Math.max(h, p.h * Math.pow(Math.max(0, 1 - d), 1.5));
        }
        h += Math.sin(x * 1.7 + idx) * Math.cos(z * 1.3) * 0.35 + (r() - 0.5) * 0.25;
        y = Math.max(0, h);
        const f = y / H;
        const light = 0.72 + 0.28 * Math.cos(a - lightA) * (rr / R);
        c.copy(ROCK).lerp(SNOW, THREE.MathUtils.smoothstep(f + (r() - 0.5) * 0.15, 0.35, 0.75));
        c.multiplyScalar(light);
      } else {
        // rocky underside, an inverted jagged cone
        const t = 1 - rr / R;
        const depth = D * Math.pow(t, 0.75) * (0.75 + 0.25 * Math.sin(a * 5 + idx) * Math.cos(a * 3));
        y = -depth * (0.3 + 0.7 * r());
        c.copy(UNDER).multiplyScalar(0.6 + 0.6 * (1 + y / D));
        if (rr > R * 0.85) c.lerp(ROCK, 0.5);
      }
      pos.set([cx + x, cy + y, cz + z], k * 3);
      col.set([c.r, c.g, c.b], k * 3);
    }
  });
  return { pos, col };
}

async function samplePortrait(cfg, gw, gh) {
  const img = (await loadImage(cfg.src)) || fallbackPortrait();
  const c = document.createElement('canvas');
  c.width = gw; c.height = gh;
  const g = c.getContext('2d', { willReadFrequently: true });
  // cover-fit, biased to the top so the face stays in frame
  const s = Math.max(gw / img.width, gh / img.height);
  const w = img.width * s, h = img.height * s;
  g.drawImage(img, (gw - w) / 2, (gh - h) * 0.25, w, h);
  const data = g.getImageData(0, 0, gw, gh).data;

  const W = 32, H = (W * gh) / gw;
  const out = [];
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const u = i / (gw - 1), v = j / (gh - 1);
      const ex = (u - 0.5) / 0.5, ey = (v - 0.47) / 0.53;
      const e = Math.sqrt(ex * ex + ey * ey);
      const o = (j * gw + i) * 4;
      // soft oval vignette, and transparent pixels (cut-out PNGs) are left out
      const mask = (1 - THREE.MathUtils.smoothstep(e, 0.78, 1.0)) * (data[o + 3] / 255);
      if (mask <= 0.01) continue;
      let l = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
      l = THREE.MathUtils.clamp((l - 0.5) * cfg.contrast + 0.5, 0, 1);
      out.push({ x: (u - 0.5) * W, y: (0.5 - v) * H, z: l * cfg.depth, l, mask });
    }
  }
  return out;
}

// Chunked sort so that neighbouring mountain pieces fly to neighbouring
// parts of the face: left islands → left of the portrait, top → top.
function spatialOrder(items, getX, getY, buckets) {
  const byX = items.slice().sort((a, b) => getX(a) - getX(b));
  const size = Math.ceil(byX.length / buckets);
  const out = [];
  for (let b = 0; b < buckets; b++) {
    const chunk = byX.slice(b * size, (b + 1) * size);
    chunk.sort((a, b2) => getY(b2) - getY(a));
    out.push(...chunk);
  }
  return out;
}

const vertex = /* glsl */ `
  attribute vec3 aEnd;
  attribute vec3 aColB;
  attribute vec4 aRand; // delay, size, phase, portrait edge mask (0 = not in the portrait)
  attribute float aLum;  // portrait luminance
  uniform float uTime, uMorph, uDissolve, uScale, uSize, uDay;
  uniform vec2 uPointer;      // pointer in NDC
  uniform float uPointerOn, uAspect;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDepth;

  vec3 bezier(vec3 a, vec3 b, vec3 c, float t) {
    float it = 1.0 - t;
    return it * it * a + 2.0 * it * t * b + t * t * c;
  }

  void main() {
    float portrait = aRand.w;
    float isP = step(0.001, portrait);
    float lumN = (0.15 + 0.85 * aLum) * portrait;
    float delay = aRand.x * 0.45;
    float t = clamp((uMorph - delay) / 0.55, 0.0, 1.0);
    t = t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;

    vec3 start = position;
    start.y += sin(uTime * 0.35 + aRand.z * 0.15) * 0.6; // islands bob as one

    vec3 mid = mix(start, aEnd, 0.5);
    mid += vec3(sin(aRand.z * 6.0) * 10.0, cos(aRand.z * 4.0) * 8.0 + 6.0, 10.0 + aRand.y * 8.0);
    vec3 p = bezier(start, mid, aEnd, t);

    // breathing relief once assembled
    p.z += sin(p.x * 0.35 + p.y * 0.2 + uTime * 0.9) * 0.18 * t * isP;


    // scatter into the wind when the journey starts
    float dis = clamp((uDissolve - aRand.x * 0.4) / 0.6, 0.0, 1.0);
    vec3 dir = normalize(vec3(sin(aRand.z * 9.1), cos(aRand.z * 7.3) * 0.6 + 0.6, -1.0 - aRand.y));
    p += dir * dis * dis * (40.0 + aRand.y * 60.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;

    // the cursor parts the dust: push away in screen space and light it up
    vec4 clip = projectionMatrix * mv;
    vec2 dv = (clip.xy / clip.w - uPointer) * vec2(uAspect, 1.0);
    float md2 = dot(dv, dv);
    float pf = exp(-md2 / 0.03) * uPointerOn * step(0.0, clip.w);
    mv.xy += dv / (sqrt(md2) + 1e-4) * pf * vDepth * 0.05;
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.6 + aRand.y * 0.8);
    size *= mix(1.0, mix(0.75 + lumN * 0.6, 0.8 + (1.0 - aLum) * 0.5, uDay), t * isP);
    size *= 1.0 + pf * 0.9;
    gl_PointSize = clamp(size * uScale / vDepth, 1.0, 26.0);

    vec3 col = mix(color, aColB, t);
    // daylight: same palette, deeper shadows so it reads against a bright sky
    col = mix(col, pow(col, vec3(1.6)) * 0.9, uDay);
    // by day the portrait is drawn in ink: dark tones dense, highlights let the sky through
    vec3 ink = mix(vec3(0.02, 0.07, 0.2), vec3(0.3, 0.45, 0.75), aLum);
    col = mix(col, ink, uDay * t * isP);
    col += mix(vec3(0.35, 0.55, 1.0), vec3(1.0), uDay) * pf * 0.7;
    vColor = col;

    float a = mix(1.0, 1.0 - t, 1.0 - portrait);           // extras fade out
    float litNight = 0.2 + 0.8 * lumN;                   // night: light on dark
    float litDay = 0.04 + 0.96 * pow(1.0 - aLum, 1.3);   // day: ink on light
    a *= mix(1.0, mix(litNight, litDay, uDay), t * isP);
    a *= 1.0 - dis;
    vAlpha = a;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uOpacity, uDay;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDepth;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d) * vAlpha * uOpacity;
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    a *= 1.0 - fog;
    if (a < 0.003) discard;
    // premultiplied: alpha 0 → additive glow (night), alpha a → normal paint (day)
    gl_FragColor = vec4(vColor * a, a * uDay);
  }
`;

export async function createMountains({ mobile, portrait }) {
  const r = rng(42);
  const gw = mobile ? 120 : 176;
  const gh = Math.round(gw * 1.25);
  const targets = await samplePortrait(portrait, gw, gh);
  const count = Math.max(targets.length + 4000, mobile ? 30000 : 68000);
  const { pos, col } = sampleIslands(count, r);

  // pick which mountain points become the portrait
  const idx = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const chosen = idx.slice(0, targets.length);
  const buckets = Math.round(Math.sqrt(targets.length) / 3);
  const srcOrder = spatialOrder(chosen, (i) => pos[i * 3] + pos[i * 3 + 2] * 0.15, (i) => pos[i * 3 + 1], buckets);
  const dstOrder = spatialOrder(targets, (t) => t.x, (t) => t.y, buckets);

  const end = new Float32Array(count * 3);
  const colB = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);
  const lum = new Float32Array(count);
  const c = new THREE.Color();

  for (let i = 0; i < count; i++) {
    rand.set([r(), r(), r() * 100, 0], i * 4);
    // default: sink into the clouds below
    end.set([pos[i * 3] + (r() - 0.5) * 10, pos[i * 3 + 1] - 30 - r() * 20, pos[i * 3 + 2]], i * 3);
    colB.set([col[i * 3], col[i * 3 + 1], col[i * 3 + 2]], i * 3);
  }
  srcOrder.forEach((pi, n) => {
    const t = dstOrder[n];
    end.set([t.x + (r() - 0.5) * 0.08, t.y + (r() - 0.5) * 0.08, t.z], pi * 3);
    ramp(t.l, c);
    colB.set([c.r, c.g, c.b], pi * 3);
    lum[pi] = t.l;
    rand[pi * 4 + 3] = Math.max(0.002, t.mask);
    // stagger: assemble from the centre outwards
    rand[pi * 4] = Math.min(1, Math.hypot(t.x / 16, t.y / 20) * 0.75 + r() * 0.25);
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 3));
  geo.setAttribute('aColB', new THREE.BufferAttribute(colB, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
  geo.setAttribute('aLum', new THREE.BufferAttribute(lum, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uDissolve: { value: 0 },
      uScale: { value: 1 },
      uSize: { value: mobile ? 0.28 : 0.23 },
      uDay: { value: 0 },
      uPointer: { value: new THREE.Vector2(9, 9) },
      uPointerOn: { value: 0 },
      uAspect: { value: 1 },
      uFogColor: { value: new THREE.Color() },
      uFogDensity: { value: 0.006 },
      uOpacity: { value: 1 },
    },
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
