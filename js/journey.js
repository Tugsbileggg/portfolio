import * as THREE from 'three';
import { projectPlaceholder, loadImage } from './textures.js';

// The flight path: from the portrait, up over it, and on through the sky.
export function createPath() {
  const pts = [
    [-11, 0, 64],
    [-4, 12, 40],
    [6, 24, 2],
    [0, 22, -60],
    [-22, 18, -140],
    [8, 27, -220],
    [30, 21, -300],
    [4, 31, -380],
    [-24, 25, -460],
    [-2, 35, -540],
    [12, 42, -620],
    [14, 46, -680],
  ].map((p) => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.arcLengthDivisions = 2000;

  // curve parameter (arc-length) where the journey proper begins
  let best = 0, bestD = Infinity;
  const v = new THREE.Vector3();
  for (let i = 0; i <= 1000; i++) {
    curve.getPointAt(i / 1000, v);
    const d = v.distanceTo(pts[3]);
    if (d < bestD) { bestD = d; best = i / 1000; }
  }
  return { curve, uStart: best, uOutro: 0.93 };
}

function bentPlane(w, h, radius) {
  const geo = new THREE.PlaneGeometry(w, h, 40, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const a = x / radius;
    p.setX(i, Math.sin(a) * radius);
    p.setZ(i, (1 - Math.cos(a)) * radius);
  }
  geo.computeVertexNormals();
  return geo;
}

const panelVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const panelFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uReveal, uActive, uAspect, uTime, uFogDensity, uHover;
  uniform vec3 uFogColor, uAccent;
  uniform vec2 uPointerUv;
  varying vec2 vUv;
  varying float vDepth;

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float d = roundedBox(p, vec2(uAspect, 1.0) * 0.5, 0.045);
    float inside = 1.0 - smoothstep(-0.002, 0.002, d);
    if (inside < 0.01) discard;

    // wipe in from the bottom with a soft glowing edge
    float edge = uReveal * 1.25 - 0.1;
    float wipe = smoothstep(edge, edge - 0.08, vUv.y);
    float seam = smoothstep(0.06, 0.0, abs(vUv.y - edge)) * (1.0 - step(1.0, uReveal));

    vec2 uv = vUv;
    uv = (uv - 0.5) * (1.0 - 0.04 * uHover) + 0.5;
    vec3 col = texture2D(uMap, uv).rgb;
    col *= 0.55 + 0.45 * uActive;
    col += vec3(0.6, 0.8, 1.0) * seam * 0.6;

    // a soft light that follows the cursor across the screen
    vec2 pd = (vUv - uPointerUv) * vec2(uAspect, 1.0);
    float sheen = exp(-dot(pd, pd) / 0.08) * uHover;
    col += vec3(1.0) * sheen * 0.16;

    float border = smoothstep(0.006, 0.0, abs(d + 0.004));
    vec3 rim = mix(vec3(0.75, 0.85, 1.0), uAccent, 0.35 + 0.4 * uActive);
    col += rim * border * (0.25 + 0.5 * uActive + sheen * 1.5);

    float a = inside * max(wipe, seam);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, a * (1.0 - fog * 0.6));
  }
`;

export async function createPanels(projects) {
  const W = 16, H = 10;
  const geo = bentPlane(W, H, 20);
  const panels = await Promise.all(
    projects.map(async (p, i) => {
      const img = await loadImage(p.image);
      let tex;
      if (img) {
        tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        tex.needsUpdate = true;
      } else tex = projectPlaceholder(p, i);
      const mat = new THREE.ShaderMaterial({
        vertexShader: panelVertex,
        fragmentShader: panelFragment,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uMap: { value: tex },
          uReveal: { value: 0 },
          uActive: { value: 0 },
          uHover: { value: 0 },
          uAspect: { value: W / H },
          uTime: { value: 0 },
          uFogColor: { value: new THREE.Color() },
          uFogDensity: { value: 0.006 },
          uAccent: { value: new THREE.Color(p.accent || '#9fd0ff') },
          uPointerUv: { value: new THREE.Vector2(0.5, 0.5) },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { index: i, url: p.url, hover: 0, tilt: new THREE.Vector2(), baseQuat: new THREE.Quaternion() };
      return mesh;
    }),
  );
  return panels;
}

// Where the camera parks for each project, and where the panel floats
// relative to that pose. Recomputed on resize: phones get a centred panel.
export function layoutPanels(panels, curve, stops, aspect) {
  const narrow = aspect < 0.9;
  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const camUp = new THREE.Vector3();
  panels.forEach((mesh, i) => {
    curve.getPointAt(stops[i], pos);
    curve.getTangentAt(stops[i], tan);
    side.crossVectors(tan, up).normalize();
    camUp.crossVectors(side, tan).normalize();
    const dir = i % 2 === 0 ? 1 : -1; // alternate right / left of screen
    const dist = narrow ? 30 : 23 * Math.pow(Math.max(1, 1.78 / aspect), 0.8);
    const lateral = narrow ? 0 : 7.9 * dir;
    const lift = narrow ? 4.2 : 0.4;
    mesh.position.copy(pos).addScaledVector(tan, dist).addScaledVector(side, lateral).addScaledVector(camUp, lift);
    mesh.up.copy(camUp);
    mesh.lookAt(pos.clone().addScaledVector(side, lateral * 0.35));
    mesh.userData.baseQuat.copy(mesh.quaternion);
    mesh.scale.setScalar(narrow ? Math.min(1, aspect * 1.55) : 1);
    mesh.userData.side = narrow ? 0 : dir;
    // where the camera looks while parked here: mostly ahead, turned a little
    // toward the panel so the copy has room on the other side
    mesh.userData.look = pos
      .clone()
      .addScaledVector(tan, dist)
      .addScaledVector(side, lateral * 0.22)
      .addScaledVector(camUp, narrow ? lift - 3.2 : 0);
  });
}

// A dotted route that draws itself ahead of the camera.
export function createTrail(curve, uStart, stops) {
  const count = 1400;
  const pos = new Float32Array(count * 3);
  const u = new Float32Array(count);
  const v = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const t = uStart * 0.35 + (i / (count - 1)) * (1 - uStart * 0.35);
    curve.getPointAt(t, v);
    curve.getTangentAt(t, tan);
    side.crossVectors(tan, up).normalize();
    v.y -= 4.5;
    pos.set([v.x, v.y, v.z], i * 3);
    u[i] = t;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(u, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: {
      uDay: { value: 0 },
      uHead: { value: 0 },
      uReveal: { value: 0 },
      uTime: { value: 0 },
      uScale: { value: 1 },
      uStops: { value: stops.concat(Array(8 - stops.length).fill(-1)).slice(0, 8) },
      uColor: { value: new THREE.Color('#9fd0ff') },
      uColorDay: { value: new THREE.Color('#ffffff') },
    },
    vertexShader: /* glsl */ `
      attribute float aU;
      uniform float uHead, uReveal, uTime, uScale;
      uniform float uStops[8];
      varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float ahead = aU - uHead;
        float near = 0.0;
        for (int i = 0; i < 8; i++) near = max(near, smoothstep(0.012, 0.0, abs(aU - uStops[i])));
        float pulse = 0.5 + 0.5 * sin(aU * 900.0 - uTime * 3.0);
        vA = smoothstep(uReveal, uReveal - 0.04, aU) * smoothstep(-0.01, 0.01, ahead + 0.004);
        vA *= (0.35 + 0.65 * pulse) * (1.0 + near * 2.0);
        vA *= smoothstep(260.0, 20.0, -mv.z);
        gl_PointSize = min((0.06 + near * 0.08) * uScale / -mv.z, 9.0 * uScale / 1600.0 + 4.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor, uColorDay;
      uniform float uDay;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = min(smoothstep(0.5, 0.1, d) * vA * (1.0 + uDay * 0.6), 1.0);
        if (a < 0.004) discard;
        gl_FragColor = vec4(mix(uColor, uColorDay, uDay) * a, a * uDay);
      }
    `,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
