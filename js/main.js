import * as THREE from 'three';
import { site, projects } from './config.js';
import { createMountains } from './mountains.js';
import { createSky, createStars, createClouds, skyColor, skyValue } from './sky.js';
import { createPath, createPanels, layoutPanels, createTrail } from './journey.js';
import { createCursorFX } from './cursor.js';
import { createBuddy } from './buddy.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const pad = (n, l = 2) => String(n).padStart(l, '0');

const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const V3 = THREE.Vector3;

history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ───────────────────────── night / day ─────────────────────────
const theme = { target: 0, value: 0 };
function storedTheme() {
  try { return localStorage.getItem('sky-theme'); } catch (e) { return null; }
}
function setTheme(name, { instant = false } = {}) {
  const day = name === 'day';
  theme.target = day ? 1 : 0;
  if (instant) theme.value = theme.target;
  document.documentElement.dataset.sky = day ? 'day' : 'night';
  $$('[data-theme-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.themeSet === name)));
  $$('.theme-toggle').forEach((b) => b.setAttribute('aria-label', day ? 'Switch to night sky' : 'Switch to day sky'));
  document.querySelector('meta[name=theme-color]').content = day ? '#3c84dd' : '#03060f';
  try { localStorage.setItem('sky-theme', name); } catch (e) { /* private mode */ }
}
setTheme(storedTheme() || site.theme || 'night', { instant: true });
$$('[data-theme-set]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeSet)));
$$('.theme-toggle').forEach((b) => b.addEventListener('click', () => setTheme(theme.target ? 'night' : 'day')));

// ───────────────────────── content ─────────────────────────
function lines(arr) {
  return arr.map((l, i) => `<span class="line" style="--i:${i}"><span>${l}</span></span>`).join('');
}

function fillContent() {
  document.title = `${site.name[0]}${site.name.slice(1).toLowerCase()} — ${site.role}`;
  $$('[data-name]').forEach((el) => (el.textContent = site.name));
  $$('[data-role]').forEach((el) => (el.textContent = site.role));
  $$('[data-initial]').forEach((el) => (el.textContent = site.name[0]));
  $$('[data-email]').forEach((el) => { el.textContent = site.email; el.href = `mailto:${site.email}`; });
  $$('[data-location]').forEach((el) => (el.textContent = site.location));
  $$('[data-socials]').forEach((el) => {
    el.innerHTML = site.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('');
  });
  if (!site.available) $('.status').classList.add('is-off');

  $('.block-hero .kicker').textContent = site.hero.kicker;
  $('.block-hero h2').innerHTML = lines(site.hero.title);
  $('.scroll-hint span').textContent = site.hero.hint;
  $('.block-about .kicker').textContent = site.about.kicker;
  $('.block-about h2').innerHTML = lines([site.about.title]);
  $('.block-about .body').textContent = site.about.text;
  $('.block-work .count').textContent = pad(projects.length);
  $('.block-outro .kicker').textContent = site.outro.kicker;
  $('.block-outro h2').innerHTML = lines(site.outro.title);

  const tpl = $('#project-tpl');
  projects.forEach((p, i) => {
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.dataset.block = `project${i}`;
    el.classList.add(i % 2 === 0 ? 'side-left' : 'side-right');
    $('.idx', el).textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
    $('.year', el).textContent = p.year;
    $('h2', el).innerHTML = lines([p.title]);
    $('.tagline', el).textContent = p.tagline;
    $('.desc', el).textContent = p.description;
    $('.role', el).textContent = p.role;
    $('.stack', el).textContent = p.stack.join(' · ');
    const a = $('.visit', el);
    if (p.url && p.url !== '#') a.href = p.url; else a.remove();
    const repo = $('.repo', el);
    if (p.repo) repo.href = p.repo; else repo.remove();
    $('.block-outro').before(el);
  });

  $('#lite-list').innerHTML = projects
    .map((p, i) => `<li><span>${pad(i + 1)}</span><div><h3>${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${p.title} ↗</a>` : p.title}</h3><p>${p.tagline}</p><small>${p.year} · ${p.stack.join(' · ')}</small></div></li>`)
    .join('');
}

// ───────────────────────── timeline ─────────────────────────
const phaseDefs = [['hero', 0.7], ['assemble', 1.7], ['about', 1.2], ['depart', 1.5]];
projects.forEach((_, i) => phaseDefs.push([`travel${i}`, 1.1], [`project${i}`, 1.3]));
phaseDefs.push(['travelOutro', 1.1], ['outro', 1.1]);
const total = phaseDefs.reduce((s, [, w]) => s + w, 0);
const phases = [];
{
  let acc = 0;
  for (const [name, w] of phaseDefs) {
    phases.push({ name, start: acc / total, end: (acc + w) / total });
    acc += w;
  }
}
const ph = Object.fromEntries(phases.map((p) => [p.name, p]));
const at = (name, t) => ph[name].start + (ph[name].end - ph[name].start) * t;

function phaseAt(p) {
  for (const x of phases) if (p < x.end) return [x, clamp01((p - x.start) / (x.end - x.start))];
  return [phases[phases.length - 1], 1];
}

const blocks = [
  { key: 'hero', from: -1, to: at('assemble', 0.18) },
  { key: 'about', from: at('assemble', 0.85), to: at('depart', 0.22) },
  { key: 'work', from: at('depart', 0.45), to: at('travel0', 0.55) },
  ...projects.map((_, i) => ({
    key: `project${i}`,
    from: at(`travel${i}`, 0.82),
    to: i < projects.length - 1 ? at(`travel${i + 1}`, 0.18) : at('travelOutro', 0.18),
  })),
  { key: 'outro', from: at('outro', 0.2), to: 2 },
];

const railStops = [
  { label: 'Origin', p: 0 },
  { label: 'Portrait', p: at('about', 0.3) },
  ...projects.map((x, i) => ({ label: pad(i + 1), title: x.title, p: at(`project${i}`, 0.4) })),
  { label: 'Contact', p: at('outro', 0.6) },
];
const gotoTargets = {
  hero: 0,
  about: at('about', 0.3),
  projects: at('project0', 0.4),
  contact: 1,
};

// ───────────────────────── boot ─────────────────────────
const loader = { target: 0, shown: 0 };
loader.done = new Promise((r) => (loader.resolve = r));

async function boot() {
  fillContent();
  buildRail();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    document.body.classList.add('lite');
    document.body.classList.remove('is-loading');
    return;
  }

  tickLoader();
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  loader.target = 0.15;

  const dpr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060d20, 0.0045);
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 4000);

  const sunDir = new V3(0.12, 0.02, -1).normalize();
  const SKY_UP = new V3(0, 26, 0); // sun sits in the lower third at the end
  const sky = createSky(sunDir);
  const stars = createStars(mobile ? 1200 : 2500);
  scene.add(sky, stars);
  loader.target = 0.3;

  const mountains = await createMountains({ mobile, portrait: site.portrait });
  scene.add(mountains);
  loader.target = 0.65;

  const { curve, uStart, uOutro } = createPath();
  const n = projects.length;
  const stops = projects.map((_, i) => uStart + ((i + 0.85) / (n + 0.3)) * (uOutro - uStart));
  const panels = await createPanels(projects);
  panels.forEach((m) => scene.add(m));
  layoutPanels(panels, curve, stops, innerWidth / innerHeight); // so clouds can keep clear of them
  loader.target = 0.85;

  const trail = createTrail(curve, uStart, stops);
  scene.add(trail);

  const panelZones = () => panels.map((m) => m.position);
  const clouds = createClouds(curve, (p) => panelZones().some((z) => z.distanceTo(p) < 26), mobile);
  scene.add(clouds);

  // ── layout / resize
  const HERO_POS = new V3(0, 3, 76);
  const HERO_LOOK = new V3(0, 0, -20);
  const HOLD_POS = curve.getPointAt(0);
  const HOLD_LOOK = new V3();
  let narrow = false;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 55 : 45;
    camera.updateProjectionMatrix();
    narrow = w / h < 0.9;
    const scale = (h * renderer.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    mountains.material.uniforms.uScale.value = scale;
    trail.material.uniforms.uScale.value = scale;
    stars.material.uniforms.uPR.value = renderer.getPixelRatio();
    if (narrow) {
      mountains.scale.setScalar(0.62);
      mountains.position.set(0, 9, 0);
      HOLD_LOOK.set(0, 1, 0);
    } else {
      mountains.scale.setScalar(1);
      mountains.position.set(0, 0, 0);
      HOLD_LOOK.set(-11.5, 0, 0);
    }
    layoutPanels(panels, curve, stops, w / h);
    $('#scroll').style.height = `${total * (narrow ? 70 : 80)}vh`;
  }
  resize();
  addEventListener('resize', resize);

  // ── camera state from progress
  const tmp = new V3(), tmp2 = new V3();
  const state = { pos: new V3(), look: new V3(), morph: 0, dissolve: 0, u: 0, end: 0, active: -1, activeT: 0 };
  const ahead = (u, out) => curve.getPointAt(Math.min(u + 0.028, 1), out);

  function computeState(p) {
    const [x, t] = phaseAt(p);
    const name = x.name;
    state.morph = 0; state.dissolve = 0; state.u = 0; state.active = -1;

    if (name === 'hero') {
      state.pos.copy(HERO_POS); state.look.copy(HERO_LOOK);
    } else if (name === 'assemble') {
      const e = easeInOut(t);
      state.morph = t;
      state.pos.lerpVectors(HERO_POS, HOLD_POS, e);
      state.look.lerpVectors(HERO_LOOK, HOLD_LOOK, e);
    } else if (name === 'about') {
      state.morph = 1;
      state.pos.copy(HOLD_POS); state.look.copy(HOLD_LOOK);
    } else if (name === 'depart') {
      state.morph = 1;
      state.dissolve = smooth(0.05, 0.75, t);
      state.u = uStart * easeInOut(t);
      curve.getPointAt(state.u, state.pos);
      ahead(state.u, tmp);
      state.look.lerpVectors(HOLD_LOOK, tmp, smooth(0.0, 0.55, t));
    } else if (name.startsWith('travel')) {
      state.morph = 1; state.dissolve = 1;
      const i = name === 'travelOutro' ? n : +name.slice(6);
      const from = i === 0 ? uStart : stops[i - 1];
      const to = i === n ? uOutro : stops[i];
      state.u = from + (to - from) * easeInOut(t);
      curve.getPointAt(state.u, state.pos);
      ahead(state.u, state.look);
      if (i > 0) state.look.lerpVectors(panels[i - 1].userData.look, state.look, smooth(0, 0.4, t));
      if (i < n) state.look.lerp(panels[i].userData.look, smooth(0.55, 1, t));
      else state.look.lerp(tmp2.copy(state.pos).addScaledVector(sunDir, 100).add(SKY_UP), smooth(0.45, 1, t));
      state.active = i - 1; state.activeT = 1 - smooth(0, 0.3, t);
      if (t > 0.5) { state.active = i < n ? i : -1; state.activeT = smooth(0.6, 1, t); }
    } else if (name.startsWith('project')) {
      state.morph = 1; state.dissolve = 1;
      const i = +name.slice(7);
      state.u = stops[i] + t * 0.004;
      curve.getPointAt(state.u, state.pos);
      state.look.copy(panels[i].userData.look);
      state.active = i; state.activeT = 1;
    } else {
      state.morph = 1; state.dissolve = 1;
      state.u = uOutro + (0.985 - uOutro) * easeOut(t);
      curve.getPointAt(state.u, state.pos);
      state.look.copy(state.pos).addScaledVector(sunDir, 100).add(SKY_UP);
    }
    state.end = Math.pow(clamp01((state.u - uStart) / (0.99 - uStart)), 2.8);
  }

  // ── interaction
  const clock = new THREE.Clock();
  const mouse = new THREE.Vector2(0, 0);
  const mouseSmooth = new THREE.Vector2(0, 0);
  let lastMove = -10;
  const ray = new THREE.Raycaster();
  let hovered = null;
  const tiltQ = new THREE.Quaternion(), tiltE = new THREE.Euler();
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    lastMove = clock.elapsedTime;
  });
  document.addEventListener('mouseleave', () => { lastMove = -10; });
  const fx = mobile || matchMedia('(prefers-reduced-motion: reduce)').matches
    ? null
    : createCursorFX($('#fx'), { isDay: () => theme.target > 0.5 });
  addEventListener('click', (e) => {
    if (hovered && hovered.userData.url && hovered.userData.url !== '#' && !e.target.closest('a,button,.chat')) {
      window.open(hovered.userData.url, '_blank', 'noopener');
    }
  });

  // ── frame loop
  let progress = 0;
  let entered = false, intro = 0;
  let lastBlocks = '';
  const fwd = new V3();
  const tmpV2 = new THREE.Vector2();
  const altEl = $('#alt'), hdgEl = $('#hdg'), coordEl = $('#coords'), railFill = $('.rail-fill');
  const railItems = $$('.rail li');
  const blockEls = Object.fromEntries($$('[data-block]').map((el) => [el.dataset.block, el]));

  function update() {
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05);
    const time = clock.elapsedTime;
    const max = document.documentElement.scrollHeight - innerHeight;
    const target = max > 0 ? clamp01(scrollY / max) : 0;
    progress += (target - progress) * (1 - Math.exp(-rawDt * 4.5));
    if (Math.abs(target - progress) < 1e-5) progress = target;

    computeState(progress);

    if (entered) intro = Math.min(1, intro + dt / 2.8);
    const ie = easeOut(intro);

    camera.position.copy(state.pos);
    camera.position.z += (1 - ie) * 46;
    camera.position.y += (1 - ie) * 12;
    camera.lookAt(state.look);
    mouseSmooth.lerp(mouse, 1 - Math.exp(-dt * 2.5));
    camera.translateX(mouseSmooth.x * 1.4);
    camera.translateY(mouseSmooth.y * 0.9);

    sky.position.copy(camera.position);
    stars.position.copy(camera.position);

    // night / day sky, shifting toward its finale along the journey
    theme.value += (theme.target - theme.value) * (1 - Math.exp(-rawDt * 2.6));
    if (Math.abs(theme.target - theme.value) < 1e-3) theme.value = theme.target;
    const mode = theme.value, end = state.end;
    sky.userData.update(mode, end);
    skyColor('fog', mode, end, scene.fog.color);
    stars.material.uniforms.uOpacity.value = skyValue('stars', mode, end) * ie;
    stars.material.uniforms.uTime.value = time;
    const cloudBoost = skyValue('clouds', mode, end);
    clouds.userData.mats.forEach((m) => {
      skyColor('cloud', mode, end, m.color);
      m.opacity = Math.min(0.92, m.userData.base * cloudBoost);
    });
    clouds.children.forEach((c, i) => { c.position.x += c.userData.drift * dt; });

    // mountains → portrait
    const mu = mountains.material.uniforms;
    mu.uTime.value = time;
    mu.uMorph.value = state.morph;
    mu.uDissolve.value = state.dissolve;
    mu.uOpacity.value = ie;
    mu.uFogColor.value.copy(scene.fog.color);
    mu.uDay.value = mode;
    mu.uAspect.value = camera.aspect;
    mu.uPointer.value.copy(mouse);
    const pointerLive = !mobile && time - lastMove < 2 ? 1 : 0;
    mu.uPointerOn.value += (pointerLive - mu.uPointerOn.value) * (1 - Math.exp(-dt * 4));
    mountains.visible = state.dissolve < 0.999;

    // panels: hover light follows the cursor, the screen tilts toward it
    ray.setFromCamera(mouse, camera);
    let newHover = null, hoverUv = null;
    if (!mobile && state.active >= 0 && state.activeT > 0.9 && time - lastMove < 2) {
      const hits = ray.intersectObject(panels[state.active]);
      if (hits.length) { newHover = panels[state.active]; hoverUv = hits[0].uv; }
    }
    if (newHover !== hovered) {
      hovered = newHover;
      document.body.style.cursor = hovered && hovered.userData.url !== '#' ? 'pointer' : '';
    }
    panels.forEach((m, i) => {
      const u = m.material.uniforms;
      const reveal = smooth(at(`travel${i}`, 0.25), at(`travel${i}`, 0.85), progress);
      u.uReveal.value = reveal;
      const act = i === state.active ? state.activeT : 0;
      u.uActive.value += (act - u.uActive.value) * (1 - Math.exp(-dt * 6));
      u.uHover.value += ((m === hovered ? 1 : 0) - u.uHover.value) * (1 - Math.exp(-dt * 8));
      const tilt = m.userData.tilt;
      if (m === hovered && hoverUv) {
        u.uPointerUv.value.lerp(hoverUv, 1 - Math.exp(-dt * 14));
        tilt.lerp(tmpV2.set(hoverUv.x - 0.5, hoverUv.y - 0.5), 1 - Math.exp(-dt * 6));
      } else tilt.multiplyScalar(Math.exp(-dt * 4));
      tiltE.set(-tilt.y * 0.16, tilt.x * 0.22, 0);
      m.quaternion.copy(m.userData.baseQuat).multiply(tiltQ.setFromEuler(tiltE));
      u.uTime.value = time;
      u.uFogColor.value.copy(scene.fog.color);
      m.visible = reveal > 0.001 && m.position.distanceToSquared(camera.position) < 600 * 600;
    });

    const tu = trail.material.uniforms;
    tu.uHead.value = state.u;
    tu.uReveal.value = state.u > 0 ? Math.min(1.05, state.u + 0.12 + smooth(0, 0.3, state.u) * 0.05) : 0;
    tu.uTime.value = time;
    tu.uDay.value = mode;

    renderer.render(scene, camera);
    if (fx) fx.update(dt, time);

    // ── DOM
    const activeKeys = blocks.filter((b) => progress >= b.from && progress < b.to).map((b) => b.key);
    const sig = entered ? activeKeys.join() : '';
    if (sig !== lastBlocks) {
      lastBlocks = sig;
      for (const [k, el] of Object.entries(blockEls)) {
        const on = entered && activeKeys.includes(k);
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-hidden', String(!on));
      }
    }
    camera.getWorldDirection(fwd);
    altEl.textContent = Math.round(1350 + (8848 - 1350) * easeInOut(progress)).toLocaleString('en-US');
    hdgEl.textContent = pad(Math.round((Math.atan2(fwd.x, -fwd.z) * 180) / Math.PI + 360) % 360, 3);
    coordEl.textContent = `${(47.9184 - camera.position.z * 0.0004).toFixed(4)}°N ${(106.9177 + camera.position.x * 0.0004).toFixed(4)}°E`;
    railFill.style.transform = `scaleY(${progress})`;
    let cur = 0;
    railStops.forEach((s, i) => { if (progress >= s.p - 0.004) cur = i; });
    railItems.forEach((li, i) => li.classList.toggle('is-current', i === cur));
    document.body.classList.toggle('is-scrolled', progress > 0.01);
  }
  function frame() {
    update();
    requestAnimationFrame(frame);
  }

  renderer.compile(scene, camera);
  loader.target = 1;
  requestAnimationFrame(frame);

  // ── enter
  const btn = $('.enter');
  const enter = () => {
    entered = true;
    lastBlocks = '-';
    document.body.classList.remove('is-loading');
    $('#loader').classList.add('is-gone');
    setTimeout(() => $('#loader').remove(), 1600);
  };

  // ?debug → skip the loader and expose a jump(progress) helper for testing
  if (new URLSearchParams(location.search).has('debug')) {
    document.body.classList.add('debug');
    enter();
    window.__sky = {
      jump(p) {
        window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight));
        progress = p; intro = 1;
        update();
        return phaseAt(p)[0].name;
      },
    };
  } else {
    await loader.done;
    await new Promise((r) => setTimeout(r, 250));
    btn.disabled = false;
    $('#loader').classList.add('is-ready');
    btn.focus({ preventScroll: true });
    btn.addEventListener('click', enter, { once: true });
  }

  // nav
  $$('[data-goto]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo({ top: gotoTargets[a.dataset.goto] * max, behavior: 'smooth' });
    }),
  );
}

function buildRail() {
  $('.rail ol').innerHTML = railStops
    .map((s, i) => `<li style="top:${(s.p * 100).toFixed(2)}%" data-i="${i}"><button type="button" aria-label="${s.title || s.label}"><span>${s.label}</span></button></li>`)
    .join('');
  $$('.rail li button').forEach((b) =>
    b.addEventListener('click', () => {
      const s = railStops[+b.parentElement.dataset.i];
      const max = document.documentElement.scrollHeight - innerHeight;
      window.scrollTo({ top: s.p * max, behavior: 'smooth' });
    }),
  );
}

function tickLoader() {
  const el = $('.loader-count');
  const bar = $('.loader-bar i');
  const step = () => {
    if (!el.isConnected) return;
    loader.shown += (loader.target - loader.shown) * 0.08;
    if (loader.target === 1 && loader.shown > 0.995) loader.shown = 1;
    const v = Math.round(loader.shown * 100);
    el.textContent = pad(v, 3);
    bar.style.transform = `scaleX(${loader.shown})`;
    if (loader.shown < 1) requestAnimationFrame(step);
    else { $('.loader-status').textContent = 'Sky is clear'; loader.resolve(); }
  };
  step();
}

createBuddy();
boot();
