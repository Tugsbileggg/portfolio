import * as THREE from 'three';
import { site, projects } from './config.js';
import { createMountains } from './mountains.js';
import { createSky, createStars, createClouds, skyColor, skyValue } from './sky.js';
import { createPath, createPanels, layoutPanels, createTrail, setPanelMedia } from './journey.js';
import { createCursorFX } from './cursor.js';
import { createBuddy } from './buddy.js';
import { lang, setLang, onLang, pick, t, firstName } from './i18n.js';
import { scramble } from './scramble.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const pad = (n, l = 2) => String(n).padStart(l, '0');

const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
// phones and small windows show the panels small: the lighter recordings are enough
const narrowScreen = () => Math.min(screen.width, screen.height) < 820 || innerWidth / innerHeight < 0.9;
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
  $$('.theme-toggle').forEach((b) => b.setAttribute('aria-label', t(day ? 'toNight' : 'toDay')));
  document.querySelector('meta[name=theme-color]').content = day ? '#3c84dd' : '#03060f';
  try { localStorage.setItem('sky-theme', name); } catch (e) { /* private mode */ }
}
setTheme(storedTheme() || site.theme || 'night', { instant: true });
$$('[data-theme-set]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeSet)));
$$('.theme-toggle').forEach((b) => b.addEventListener('click', () => setTheme(theme.target ? 'night' : 'day')));

// ───────────────────────── language ─────────────────────────
$$('[data-lang-set]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.langSet)));
$$('[data-lang-toggle]').forEach((b) => b.addEventListener('click', () => setLang(lang === 'mn' ? 'en' : 'mn')));
onLang(() => {
  fillText();
  scramble($$('#loader, .hud, .rail, .scroll-hint, #story .block.is-active'));
});

// ───────────────────────── content ─────────────────────────
function lines(arr) {
  return arr.map((l, i) => `<span class="line" style="--i:${i}"><span>${l}</span></span>`).join('');
}

function fillContent() {
  $$('[data-email]').forEach((el) => { el.textContent = site.email; el.href = `mailto:${site.email}`; });
  $$('[data-resume]').forEach((el) => { if (site.resume) el.href = site.resume; else el.remove(); });
  $$('[data-socials]').forEach((el) => {
    el.innerHTML = site.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`).join('');
  });
  if (!site.available) $('.status').classList.add('is-off');
  $('.block-work .count').textContent = pad(projects.length);

  const tpl = $('#project-tpl');
  projects.forEach((p, i) => {
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.dataset.block = `project${i}`;
    el.classList.add(i % 2 === 0 ? 'side-left' : 'side-right');
    $('.idx', el).textContent = `${pad(i + 1)} / ${pad(projects.length)}`;
    $('.year', el).textContent = p.year;
    $('.stack', el).textContent = p.stack.join(' · ');
    const a = $('.visit', el);
    if (p.url && p.url !== '#') a.href = p.url; else a.remove();
    const repo = $('.repo', el);
    if (p.repo) repo.href = p.repo; else repo.remove();
    $('.block-outro').before(el);
  });
  fillText();
}

// everything worded — runs again whenever the language changes
function fillText() {
  const name = pick(site.name), role = pick(site.role);
  document.documentElement.lang = lang;
  document.documentElement.dataset.lang = lang;
  document.title = `${firstName()} — ${role}`;
  $$('[data-name]').forEach((el) => (el.textContent = name));
  $$('[data-role]').forEach((el) => (el.textContent = role));
  $$('[data-initial]').forEach((el) => (el.textContent = name[0]));
  $$('[data-location]').forEach((el) => (el.textContent = pick(site.location)));
  $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('.theme-toggle').forEach((b) => b.setAttribute('aria-label', t(theme.target ? 'toNight' : 'toDay')));
  $$('[data-lang-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langSet === lang)));
  $$('[data-lang-toggle]').forEach((b) => {
    const other = lang === 'mn' ? 'en' : 'mn';
    b.textContent = other === 'mn' ? 'МН' : 'EN';
    b.lang = other;
    b.setAttribute('aria-label', other === 'mn' ? 'Монгол хэлээр үзэх' : 'View in English');
  });

  $('.block-hero .kicker').textContent = pick(site.hero.kicker);
  $('.block-hero h2').innerHTML = lines(pick(site.hero.title));
  $('.scroll-hint span').textContent = pick(site.hero.hint);
  $('.block-about .kicker').textContent = pick(site.about.kicker);
  $('.block-about h2').innerHTML = lines([pick(site.about.title)]);
  $('.block-about .body').textContent = pick(site.about.text);
  $('.block-outro .kicker').textContent = pick(site.outro.kicker);
  $('.block-outro h2').innerHTML = lines(pick(site.outro.title));

  $$('#story .block-project').forEach((el, i) => {
    const p = projects[i];
    $('h2', el).innerHTML = lines([pick(p.title)]);
    $('.tagline', el).textContent = pick(p.tagline);
    $('.desc', el).textContent = pick(p.description);
    $('.role', el).textContent = pick(p.role);
  });

  $$('.rail li button').forEach((b, i) => {
    const s = railStops[i];
    const label = s.key ? t(s.key) : s.label;
    b.firstElementChild.textContent = label;
    b.setAttribute('aria-label', s.title ? pick(s.title) : label);
  });

  $('#lite-list').innerHTML = projects
    .map((p, i) => `<li><span>${pad(i + 1)}</span><div><h3>${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${pick(p.title)} ↗</a>` : pick(p.title)}</h3><p>${pick(p.tagline)}</p><small>${p.year} · ${p.stack.join(' · ')}</small></div></li>`)
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
  { key: 'origin', p: 0 },
  { key: 'portrait', p: at('about', 0.3) },
  ...projects.map((x, i) => ({ label: pad(i + 1), title: x.title, p: at(`project${i}`, 0.4) })),
  { key: 'contact', p: at('outro', 0.6) },
];
const gotoTargets = {
  hero: 0,
  about: at('about', 0.3),
  projects: at('project0', 0.4),
  contact: 1,
};

// Where the flight comes to rest. One wheel flick, swipe or key press moves exactly one stop.
const navStops = [
  0, // hero
  at('about', 0.3), // portrait + about
  ph.travel0.start, // "Selected work"
  ...projects.map((_, i) => at(`project${i}`, 0.4)),
  1, // contact, sunrise
];

// Flight time goes where the camera moves: phases that hold still count for little,
// so a flight between two stops is spent flying, not idling inside a still phase.
const warpPts = [];
{
  let w = 0;
  for (const x of phases) {
    const still = x.name === 'hero' || x.name === 'about' || x.name.startsWith('project');
    warpPts.push([x.start, w]);
    w += (x.end - x.start) * (still ? 0.2 : 1);
  }
  warpPts.push([1, w]);
}
function mapWarp(v, from, to) {
  for (let i = 1; i < warpPts.length; i++) {
    const a = warpPts[i - 1], b = warpPts[i];
    if (v <= b[from] || i === warpPts.length - 1) return a[to] + (b[to] - a[to]) * clamp01((v - a[from]) / (b[from] - a[from] || 1));
  }
}
const warp = (p) => mapWarp(p, 0, 1);
const unwarp = (w) => mapWarp(w, 1, 0);
const nearestStop = (p) => navStops.reduce((best, s) => (Math.abs(warp(s) - warp(p)) < Math.abs(warp(best) - warp(p)) ? s : best));

// critically damped spring (SmoothDamp): eases out of rest, keeps its speed when retargeted mid-flight
function spring(cur, goal, vel, smoothTime, dt) {
  const omega = 2 / smoothTime, x = omega * dt;
  const k = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - goal;
  const temp = (vel + omega * change) * dt;
  let v = (vel - omega * temp) * k;
  let out = goal + (change + temp) * k;
  if ((goal - cur > 0) === (out > goal) || (Math.abs(out - goal) < 2e-5 && Math.abs(v) < 2e-4)) { out = goal; v = 0; }
  return [out, v];
}
let goTo = (p) => window.scrollTo({ top: p * (document.documentElement.scrollHeight - innerHeight), behavior: 'smooth' });

// ───────────────────────── boot ─────────────────────────
const loader = { target: 0, shown: 0 };
loader.done = new Promise((r) => (loader.resolve = r));

async function boot() {
  buildRail();
  fillContent();

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

  // phones render near their native sharpness, so the portrait's small dots stay crisp
  const dpr = Math.min(window.devicePixelRatio, mobile ? 2.5 : 2);
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
  const panels = await createPanels(projects, { small: narrowScreen() });
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
    // the portrait is shrunk on narrow screens; shrink its dots with it so they don't pile into a glare
    const mu = mountains.material.uniforms;
    mu.uPortraitDot.value = narrow ? 0.18 / mu.uSize.value : 1;
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
  // nav: the stop being flown to. free = the page was scrolled some other way (scrollbar, find in page)
  const nav = { target: 0, w: 0, v: 0, free: false };
  let ownScrollY = 0, settleTimer = 0;
  const scrollMax = () => document.documentElement.scrollHeight - innerHeight;
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
    const max = scrollMax();
    if (nav.free) {
      const target = max > 0 ? clamp01(scrollY / max) : 0;
      progress += (target - progress) * (1 - Math.exp(-rawDt * 4.5));
      if (Math.abs(target - progress) < 1e-5) progress = target;
    } else {
      [nav.w, nav.v] = spring(nav.w, warp(nav.target), nav.v, 0.5, dt);
      progress = unwarp(nav.w);
      // keep the real scroll position in step, for the scrollbar and anything reading scrollY
      const y = Math.round(progress * max);
      if (max > 0 && Math.abs(scrollY - y) > 1) { ownScrollY = y; window.scrollTo({ top: y, behavior: 'instant' }); }
    }

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
      // the recording downloads while the flight heads for it and plays while it is in view
      setPanelMedia(m, {
        load: entered && progress >= ph.depart.start && (i === state.active || i === state.active + 1),
        play: entered && m.visible && reveal > 0.15,
      });
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
    coordEl.textContent = `${(47.9184 - camera.position.z * 0.0004).toFixed(4)}°${t('north')} ${(106.9177 + camera.position.x * 0.0004).toFixed(4)}°${t('east')}`;
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

  // ── stops: wheel, swipe and keys move one stop at a time
  function go(p) {
    if (nav.free) { nav.free = false; nav.w = warp(progress); nav.v = 0; }
    clearTimeout(settleTimer);
    nav.target = clamp01(p);
  }
  goTo = (p) => go(nearestStop(p));
  function step(dir) {
    const from = nav.free ? progress : nav.target;
    const next = dir > 0 ? navStops.find((s) => s > from + 1e-4) : navStops.findLast((s) => s < from - 1e-4);
    if (next !== undefined) go(next);
  }
  const ownInput = (el) => el.closest?.('.chat, #loader'); // the chat scrolls itself

  // One gesture = one step. Trackpad inertia keeps firing for a second or more, so the events of
  // a gesture are spent once it has stepped; a pause, or a fresh push while inertia fades, starts the next.
  const wheel = { last: 0, acc: 0, prev: 0, count: 0, spent: false, at: 0, timer: 0 };
  const wheelStep = () => { wheel.spent = true; wheel.at = performance.now(); clearTimeout(wheel.timer); step(Math.sign(wheel.acc)); };
  addEventListener('wheel', (e) => {
    if (!entered || e.ctrlKey || ownInput(e.target)) return;
    e.preventDefault();
    const d = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    if (!d) return;
    const now = e.timeStamp, mag = Math.abs(d); // when it happened, so a busy frame can't split a gesture
    const fresh = now - wheel.last > 200 || Math.sign(d) !== Math.sign(wheel.acc)
      || (wheel.spent && now - wheel.at > 300 && mag > 12 && mag > wheel.prev * 2);
    if (fresh) { wheel.acc = 0; wheel.count = 0; wheel.spent = false; }
    wheel.last = now; wheel.prev = mag;
    if (wheel.spent) return;
    wheel.acc += d;
    wheel.count++;
    // a mouse wheel click (trackpads report wheelDeltaY = -3 × deltaY)
    const notch = e.deltaMode !== 0 || (e.wheelDeltaY && e.wheelDeltaY % 120 === 0 && e.wheelDeltaY !== -3 * e.deltaY);
    if (notch || Math.abs(wheel.acc) >= 24) return wheelStep();
    // a slow mouse wheel click can be a single small delta: count it once nothing follows
    clearTimeout(wheel.timer);
    wheel.timer = setTimeout(() => { if (!wheel.spent && wheel.count <= 2 && Math.abs(wheel.acc) >= 3) wheelStep(); }, 140);
  }, { passive: false });

  let touch = null;
  addEventListener('touchstart', (e) => {
    touch = entered && e.touches.length === 1 && !ownInput(e.target) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  addEventListener('touchmove', (e) => { if (touch && e.touches.length === 1) e.preventDefault(); }, { passive: false });
  addEventListener('touchend', (e) => {
    if (!touch) return;
    const f = e.changedTouches[0], dx = f.clientX - touch.x, dy = touch.y - f.clientY;
    touch = null;
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx)) step(Math.sign(dy));
  });
  addEventListener('touchcancel', () => { touch = null; });

  addEventListener('keydown', (e) => {
    if (!entered || e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable], .chat')) return;
    const k = e.key;
    if (k === 'Home' || k === 'End') { e.preventDefault(); go(k === 'Home' ? 0 : 1); return; }
    const dir = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey) ? 1
      : k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey) ? -1 : 0;
    if (!dir || (k === ' ' && e.target.closest?.('button, a'))) return;
    e.preventDefault();
    step(dir);
  });

  // scrolled some other way (scrollbar drag, find in page…): follow along, then settle on the nearest stop
  addEventListener('scroll', () => {
    if (!entered || Math.abs(scrollY - ownScrollY) <= 2) return;
    nav.free = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => go(nearestStop(scrollY / Math.max(1, scrollMax()))), 180);
  }, { passive: true });

  // ?debug → skip the loader and expose a jump(progress) helper for testing
  if (new URLSearchParams(location.search).has('debug')) {
    document.body.classList.add('debug');
    enter();
    window.__sky = {
      jump(p) {
        nav.free = false; nav.target = p; nav.w = warp(p); nav.v = 0;
        progress = p; intro = 1;
        update();
        return phaseAt(p)[0].name;
      },
      state: () => ({ progress, target: nav.target, free: nav.free, stop: navStops.indexOf(nav.target), stops: navStops.length }),
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
      goTo(gotoTargets[a.dataset.goto]);
    }),
  );
}

function buildRail() {
  $('.rail ol').innerHTML = railStops
    .map((s, i) => `<li style="top:${(s.p * 100).toFixed(2)}%" data-i="${i}"><button type="button"><span></span></button></li>`)
    .join('');
  $$('.rail li button').forEach((b) =>
    b.addEventListener('click', () => goTo(railStops[+b.parentElement.dataset.i].p)),
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
    else {
      const status = $('.loader-status');
      status.dataset.i18n = 'ready';
      status.textContent = t('ready');
      loader.resolve();
    }
  };
  step();
}

createBuddy();
boot();
