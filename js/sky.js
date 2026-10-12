import * as THREE from 'three';
import { rng, cloudTexture } from './textures.js';

// Two skies, each with a start and an end state. `mode` blends night (0) → day (1),
// `end` follows the journey (0 at the portrait, 1 at the last screen).
//   night: deep night with stars → a full moon over moonlit clouds
//   day:   clear blue sky        → golden hour sun
const P = {
  night: {
    start: { top: '#010309', mid: '#050b1d', hor: '#122448', fog: '#060d20', cloud: '#2c3a62', light: '#9fb8ff', glow: 0.04, halo: 0.06, disc: 0.3, discSize: 0.99955, stars: 1, clouds: 1 },
    end: { top: '#01040c', mid: '#06122d', hor: '#1a3263', fog: '#09152f', cloud: '#4a5f94', light: '#e6eeff', glow: 0.1, halo: 0.3, disc: 1.15, discSize: 0.9989, stars: 0.85, clouds: 1.35 },
  },
  day: {
    start: { top: '#1a55b8', mid: '#3c84dd', hor: '#9fcbf4', fog: '#8bbae8', cloud: '#ffffff', light: '#fffaf0', glow: 0.22, halo: 0.3, disc: 1.5, discSize: 0.99965, stars: 0, clouds: 2.5 },
    end: { top: '#23509b', mid: '#6890d2', hor: '#ffcd94', fog: '#dcbfa4', cloud: '#fff0e0', light: '#ffd79c', glow: 0.42, halo: 0.55, disc: 1.8, discSize: 0.9996, stars: 0, clouds: 2.3 },
  },
};
for (const sky of Object.values(P)) for (const st of Object.values(sky)) for (const k in st) if (typeof st[k] === 'string') st[k] = new THREE.Color(st[k]);

const ca = new THREE.Color(), cb = new THREE.Color();
const mixNum = (k, mode, end) =>
  THREE.MathUtils.lerp(THREE.MathUtils.lerp(P.night.start[k], P.night.end[k], end), THREE.MathUtils.lerp(P.day.start[k], P.day.end[k], end), mode);

export function skyColor(key, mode, end, out) {
  ca.lerpColors(P.night.start[key], P.night.end[key], end);
  cb.lerpColors(P.day.start[key], P.day.end[key], end);
  return out.lerpColors(ca, cb, mode);
}
export function skyValue(key, mode, end) { return mixNum(key, mode, end); }

export function createSky(sunDir) {
  const geo = new THREE.SphereGeometry(1500, 48, 24);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uSun: { value: sunDir.clone().normalize() },
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
      uLight: { value: new THREE.Color() },
      uGlow: { value: 0 }, uHalo: { value: 0 }, uDisc: { value: 0 }, uDiscSize: { value: 0.9996 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uTop, uMid, uHor, uLight;
      uniform float uGlow, uHalo, uDisc, uDiscSize;
      varying vec3 vDir;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec3 dir = normalize(vDir);
        float y = dir.y;
        vec3 col = mix(uHor, uMid, smoothstep(-0.05, 0.25, y));
        col = mix(col, uTop, smoothstep(0.2, 0.75, y));
        col = mix(col, uHor * 0.55, smoothstep(0.0, -0.4, y));
        float s = max(dot(dir, uSun), 0.0);
        float edge = (1.0 - uDiscSize) * 0.35;
        col += uLight * (pow(s, 4.0) * uGlow + pow(s, 40.0) * uHalo
             + smoothstep(uDiscSize - edge, uDiscSize + edge, s) * uDisc);
        col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 2.0; // dither against banding
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.userData.update = (mode, end) => {
    const u = mat.uniforms;
    skyColor('top', mode, end, u.uTop.value);
    skyColor('mid', mode, end, u.uMid.value);
    skyColor('hor', mode, end, u.uHor.value);
    skyColor('light', mode, end, u.uLight.value);
    u.uGlow.value = mixNum('glow', mode, end);
    u.uHalo.value = mixNum('halo', mode, end);
    u.uDisc.value = mixNum('disc', mode, end);
    u.uDiscSize.value = mixNum('discSize', mode, end);
  };
  return mesh;
}
export function createStars(count = 2500) {
  const r = rng(3);
  const pos = new Float32Array(count * 3);
  const rnd = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const y = Math.abs(u) * 0.95 + 0.05;
    const rad = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * rad * 1200, y * 1200, Math.sin(a) * rad * 1200], i * 3);
    rnd[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uPR: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aRand;
      uniform float uTime, uPR;
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_Position.z = gl_Position.w * 0.9999;
        gl_PointSize = (0.8 + aRand * 1.8) * uPR;
        vA = (0.35 + 0.65 * aRand) * (0.6 + 0.4 * sin(uTime * (0.6 + aRand * 2.0) + aRand * 50.0));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * uOpacity;
        gl_FragColor = vec4(0.85, 0.9, 1.0, a);
      }
    `,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = -9;
  return pts;
}

// Sea of clouds below, drifting banks alongside the flight path.
export function createClouds(curve, keepClear, mobile) {
  const tex = cloudTexture();
  const group = new THREE.Group();
  const r = rng(11);
  const mats = [0.14, 0.2, 0.27, 0.34].map((o) => {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: o, depthWrite: false, fog: true });
    m.userData.base = o;
    return m;
  });
  const add = (x, y, z, s) => {
    const sp = new THREE.Sprite(mats[Math.floor(r() * mats.length)]);
    sp.position.set(x, y, z);
    sp.scale.set(s * (1.4 + r() * 0.8), s, 1);
    sp.material.rotation = 0;
    sp.userData.drift = (r() - 0.5) * 0.6;
    group.add(sp);
  };

  const n = mobile ? 0.55 : 1;

  // under the islands at the start
  for (let i = 0; i < 40 * n; i++) add((r() - 0.5) * 260, -38 - r() * 20, 30 - r() * 200, 30 + r() * 40);

  // along the journey
  const tmp = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 260 * n; i++) {
    const u = r();
    curve.getPointAt(u, tmp);
    curve.getTangentAt(u, tan);
    side.crossVectors(tan, up).normalize();
    const below = r() < 0.55;
    if (below) {
      tmp.addScaledVector(side, (r() - 0.5) * 220);
      tmp.y -= 28 + r() * 30;
      add(tmp.x, tmp.y, tmp.z, 35 + r() * 45);
    } else {
      const s = r() < 0.5 ? -1 : 1;
      tmp.addScaledVector(side, s * (30 + r() * 90));
      tmp.y += (r() - 0.4) * 40;
      if (keepClear(tmp)) continue;
      add(tmp.x, tmp.y, tmp.z, 16 + r() * 30);
    }
  }

  group.userData.mats = mats;
  return group;
}
