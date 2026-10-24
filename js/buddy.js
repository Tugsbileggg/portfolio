// A little snow-capped mountain that wanders the screen: it hops to a spot, stays a few seconds,
// does a trick, then moves on. It drops hints for the section you're in; click it to chat with an
// AI that only knows config.js.
import { site, projects } from './config.js';
import { lang, onLang, pick, t, firstName } from './i18n.js';

const $ = (s, el = document) => el.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const STORE = 'buddy-chat';

export function mountainSVG(id) {
  return `<svg viewBox="0 0 100 90" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--bd-top)"/><stop offset="1" stop-color="var(--bd-bottom)"/></linearGradient></defs>
    <path class="bd-back" d="M4 84 L27 44 Q31 38 35 44 L58 80 Z"/>
    <path fill="url(#${id})" d="M14 85 C19 70 34 36 44 23 C48 17.5 54 17.5 58 23 C68 36 83 70 88 85 C70 89.5 32 89.5 14 85 Z"/>
    <path class="bd-shade" d="M53 19.5 C55 20 57 21 58 23 C68 36 83 70 88 85 C82 86.5 75 87.4 68 87.8 C69 66 63 38 53 19.5 Z"/>
    <path class="bd-cap" d="M37 33 C40 28 43 25 44 23 C48 17.5 54 17.5 58 23 C60 25.5 62.5 29 65 33 L60.5 38 L56 33.5 L51 39 L46 33.5 L41.5 38 Z"/>
    <g class="bd-arm"><path class="bd-arm-edge" d="M82.5 72 Q90.5 68 92.5 58.5"/><path d="M82.5 72 Q90.5 68 92.5 58.5"/></g>
    <g class="bd-face">
      <ellipse class="bd-blush" cx="35.5" cy="66" rx="4.4" ry="2.5"/>
      <ellipse class="bd-blush" cx="66.5" cy="66" rx="4.4" ry="2.5"/>
      <g class="bd-eyes">
        <g class="bd-eye"><ellipse cx="42" cy="58" rx="3.3" ry="4.2"/><circle class="bd-glint" cx="43.1" cy="56.4" r="1.2"/></g>
        <g class="bd-eye"><ellipse cx="60" cy="58" rx="3.3" ry="4.2"/><circle class="bd-glint" cx="61.1" cy="56.4" r="1.2"/></g>
      </g>
      <g class="bd-happy"><path d="M38.6 59.5 Q42 54 45.4 59.5"/><path d="M56.6 59.5 Q60 54 63.4 59.5"/></g>
      <g class="bd-sleep"><path d="M38.8 58.5 Q42 61.5 45.2 58.5"/><path d="M56.8 58.5 Q60 61.5 63.2 58.5"/></g>
      <path class="bd-mouth" d="M47.8 64.6 Q51 68.2 54.2 64.6"/>
    </g>
  </svg>`;
}

export function createBuddy() {
  const root = $('.buddy');
  const btn = $('.buddy-btn', root);
  const body = $('.buddy-body', root);
  const bubble = $('.buddy-bubble', root);
  const panel = $('#chat');
  const log = $('.chat-log', panel);
  const chips = $('.chat-chips', panel);
  const form = $('.chat-form', panel);
  const input = $('textarea', form);
  const sendBtn = $('button', form);
  const a = site.assistant;

  body.innerHTML = `<span class="buddy-pose">${mountainSVG('bd-g1')}</span>`;
  const fx = document.createElement('span');
  fx.className = 'buddy-fx';
  fx.setAttribute('aria-hidden', 'true');
  root.append(fx);
  $('.chat-avatar', panel).innerHTML = mountainSVG('bd-g2');
  const eyes = $('.bd-eyes', body);
  function labels() {
    $('.chat-name', panel).textContent = pick(a.name);
    $('.chat-sub', panel).textContent = t('chatSub', firstName());
    btn.setAttribute('aria-label', t('chatWith', pick(a.name), firstName()));
    input.placeholder = t('placeholder', firstName());
  }
  labels();

  // ───────── hints ─────────
  let hintTimer = 0, greet = 0, lastKey = '', open = false;
  function hint(text, ms = 4800) {
    if (open) return;
    bubble.textContent = text;
    root.classList.add('is-talking');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => root.classList.remove('is-talking'), ms);
  }
  const greeting = () => { const g = pick(a.greetings); return g[greet++ % g.length]; };
  const hintFor = (key) => {
    if (key === 'hero') return greeting();
    if (key === 'about') return t('hintAbout', firstName());
    if (key === 'work') return t('hintWork');
    if (key === 'outro') return t('hintOutro');
    const p = projects[+key.replace('project', '')];
    return p ? t('hintProject', pick(p.title)) : null;
  };
  const activeKey = () => $('#story .is-active')?.dataset.block || '';

  let settle = 0;
  new MutationObserver(() => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const key = activeKey();
      if (!key || key === lastKey) return;
      lastKey = key;
      dodge();
      const text = hintFor(key);
      if (text) hint(text);
    }, 700);
  }).observe($('#story'), { subtree: true, attributes: true, attributeFilter: ['class'] });

  const entered = new MutationObserver(() => {
    if (document.body.classList.contains('is-loading')) return;
    entered.disconnect();
    setTimeout(() => hint(greeting(), 6000), 1800);
    restUntil = clock + 8; // say hello from the corner first, then start wandering
  });
  entered.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  root.addEventListener('pointerenter', () => { if (!open && !root.classList.contains('is-talking')) hint(greeting(), 3000); });

  // ───────── roaming: walk somewhere, stay 3–5 s and do a trick, move on ─────────
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => innerWidth <= 760;
  const ptr = { x: innerWidth / 2, y: innerHeight / 2, on: false };
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; } });
  document.addEventListener('mouseleave', () => { ptr.on = false; });
  let hovered = false;
  btn.addEventListener('pointerenter', () => { hovered = true; });
  btn.addEventListener('pointerleave', () => { hovered = false; });

  const home = () => narrow()
    ? { x: innerWidth - btn.offsetWidth - 14, y: 78 }
    : { x: innerWidth - btn.offsetWidth - clamp(innerWidth * 0.022, 16, 32) - 4, y: innerHeight - btn.offsetHeight - 104 };
  const blocked = () => [...document.querySelectorAll('#story .is-active, .scroll-hint')]
    .map((el) => el.getBoundingClientRect()).filter((r) => r.width);
  const overlaps = (p, rects) => rects.some((r) => p.x < r.right + 24 && p.x + btn.offsetWidth > r.left - 24 && p.y < r.bottom + 24 && p.y + btn.offsetHeight > r.top - 24);
  function pickSpot() {
    const w = btn.offsetWidth, h = btn.offsetHeight;
    const top = narrow() ? 80 : 96, bottom = narrow() ? 100 : 124, side = narrow() ? 12 : 64;
    const rects = blocked();
    for (let i = 0; i < 40; i++) {
      const p = { x: side + Math.random() * (innerWidth - w - side * 2), y: top + Math.random() * (innerHeight - h - top - bottom) };
      if (i < 30 && Math.hypot(p.x - pos.x, p.y - pos.y) < Math.min(innerWidth, innerHeight) * 0.25) continue;
      if (!overlaps(p, rects)) return p;
    }
    return home();
  }

  const pos = home(), from = { ...pos }, to = { ...pos };
  let clock = 0, mode = 'rest', prog = 0, dur = 1, hops = 1, restUntil = Infinity, trickAt = Infinity, lastTrick = '', gaze = null;
  function walkTo(p, pace = 1) {
    Object.assign(from, pos);
    Object.assign(to, p);
    const d = Math.hypot(to.x - from.x, to.y - from.y);
    if (d < 4) return;
    dur = clamp(d / (230 * pace), 0.45, 2.8);
    hops = Math.max(1, Math.round(d / 85));
    prog = 0;
    mode = 'walk';
  }
  function arrive() {
    mode = 'rest';
    restUntil = clock + 3 + Math.random() * 2;
    trickAt = open ? Infinity : clock + 0.5 + Math.random() * 0.6;
    root.classList.add('is-landing');
    setTimeout(() => root.classList.remove('is-landing'), 260);
  }
  // step out of the way when a new section's text appears under it
  function dodge() {
    if (!still && !open && mode === 'rest' && overlaps(pos, blocked())) walkTo(pickSpot(), 1.4);
  }

  // ───────── tricks ─────────
  const tricks = { jump: 1100, wave: 1600, dance: 1800, spin: 900, snow: 1500, sleep: 2600, look: 1600, talk: 0 };
  function spawn(text, n, cls) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = `fx ${cls}`;
      s.textContent = text;
      s.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
      s.style.animationDelay = `${i * (cls === 'fx-snow' ? 0.06 : 0.35)}s`;
      fx.append(s);
      s.addEventListener('animationend', () => s.remove());
    }
  }
  function trick() {
    const names = Object.keys(tricks).filter((k) => k !== lastTrick);
    const name = names[Math.floor(Math.random() * names.length)];
    lastTrick = name;
    if (name === 'talk') {
      const p = projects[Math.floor(Math.random() * projects.length)];
      const lines = [...pick(a.greetings), hintFor(activeKey()), t('psst'), t('hintProject', pick(p.title))].filter(Boolean);
      return hint(lines[Math.floor(Math.random() * lines.length)], 3800);
    }
    if (name === 'look') {
      gaze = { x: -2.3, y: -0.4 };
      setTimeout(() => { gaze = { x: 2.3, y: -0.4 }; }, 650);
      setTimeout(() => { gaze = null; spawn('?', 1, 'fx-mark'); }, 1300);
    }
    if (name === 'dance') spawn('♪', 3, 'fx-note');
    if (name === 'sleep') spawn('z', 3, 'fx-zzz');
    if (name === 'snow') spawn('', 10, 'fx-snow');
    if (name === 'jump') spawn('✦', 2, 'fx-star');
    root.classList.add(`act-${name}`);
    setTimeout(() => root.classList.remove(`act-${name}`), tricks[name]);
    restUntil = Math.max(restUntil, clock + tricks[name] / 1000 + 0.8);
  }

  // ───────── frame: position, hops, lean, eyes ─────────
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let last = performance.now(), lastY = scrollY, speed = 0, dir = 0, phase = 0, lean = 0, look = { x: 0, y: 0 }, side = '';
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
    last = now;
    clock += dt;
    const dy = scrollY - lastY;
    lastY = scrollY;
    speed += (Math.abs(dy) / dt - speed) * (1 - Math.exp(-dt * 6));
    if (dy) dir = Math.sign(dy);
    const run = clamp(speed / 900, 0, 1);
    const held = open || hovered || !!root.querySelector(':focus-visible') || root.classList.contains('is-talking');

    let walkHop = 0, walkLean = 0, gx = 0, gy = 0;
    if (mode === 'walk') {
      if (!hovered) prog = Math.min(1, prog + dt / dur);
      const e = ease(prog), dx = to.x - from.x, dyw = to.y - from.y;
      pos.x = from.x + dx * e;
      pos.y = from.y + dyw * e;
      walkHop = hovered ? 0 : Math.abs(Math.sin(prog * Math.PI * hops)) * clamp(Math.hypot(dx, dyw) / 30, 6, 16);
      walkLean = Math.sign(dx) * 7 * Math.sin(prog * Math.PI);
      gx = Math.sign(dx) * 1.8; gy = Math.sign(dyw) * 0.9;
      if (prog >= 1) arrive();
    } else if (!still) {
      if (clock >= trickAt) { trickAt = Infinity; trick(); }
      if (held) restUntil = Math.max(restUntil, clock + 1.2);
      if (clock >= restUntil) walkTo(pickSpot());
    }
    pos.x = clamp(pos.x, 6, innerWidth - btn.offsetWidth - 6);
    pos.y = clamp(pos.y, 6, innerHeight - btn.offsetHeight - 6);
    root.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;

    // speech bubble goes on whichever side has more room
    const room = { l: pos.x, r: innerWidth - pos.x - btn.offsetWidth };
    const s = room.r > room.l ? 'r' : 'l';
    if (s !== side) { side = s; root.classList.toggle('bubble-r', s === 'r'); }
    bubble.style.maxWidth = `${clamp(Math.max(room.l, room.r) - 26, 130, 240)}px`;

    if (!still) {
      phase += dt * (5 + run * 9);
      const hop = Math.max(walkHop, Math.abs(Math.sin(phase)) * run * 10);
      const bob = mode === 'rest' ? Math.sin(now / 520) * 2 * (1 - run) : 0;
      lean += (walkLean + dir * run * 7 - lean) * (1 - Math.exp(-dt * 10));
      const squash = mode === 'walk' ? (1 - Math.abs(Math.sin(prog * Math.PI * hops))) * 0.08 : run * (1 - Math.abs(Math.sin(phase))) * 0.07;
      body.style.transform = `translateY(${(-hop + bob).toFixed(2)}px) rotate(${lean.toFixed(2)}deg) scale(${1 + squash}, ${1 - squash})`;
      root.style.setProperty('--hop', (hop / 16).toFixed(3));
    }

    // pupils: scripted gaze, then thinking, walking, running, else the cursor
    let tx = 0, ty = 0;
    if (gaze) { tx = gaze.x; ty = gaze.y; }
    else if (root.classList.contains('is-thinking')) { tx = 1.4; ty = -2; }
    else if (mode === 'walk' && !hovered) { tx = gx; ty = gy; }
    else if (run > 0.3) { ty = dir > 0 ? -1.4 : 1.4; }
    else if (ptr.on) {
      const ddx = ptr.x - (pos.x + btn.offsetWidth / 2), ddy = ptr.y - (pos.y + btn.offsetHeight * 0.6);
      const d = Math.hypot(ddx, ddy) || 1, k = Math.min(d / 260, 1) * 2.2;
      tx = (ddx / d) * k; ty = (ddy / d) * k;
    }
    look.x += (tx - look.x) * (1 - Math.exp(-dt * 10));
    look.y += (ty - look.y) * (1 - Math.exp(-dt * 10));
    eyes.setAttribute('transform', `translate(${look.x.toFixed(2)} ${look.y.toFixed(2)})`);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => { if (open || still) Object.assign(pos, home()); });

  (function blink() {
    setTimeout(() => {
      root.classList.add('is-blinking');
      setTimeout(() => { root.classList.remove('is-blinking'); blink(); }, 140);
    }, 2200 + Math.random() * 3800);
  })();

  // ───────── chat ─────────
  let msgs = [];
  try { msgs = JSON.parse(sessionStorage.getItem(STORE)) || []; } catch (e) { /* private mode */ }
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-30))); } catch (e) { /* private mode */ } };
  let busy = false;

  function bubbleEl(m) {
    const el = document.createElement('div');
    el.className = `msg from-${m.role === 'user' ? 'user' : 'bot'}${m.error ? ' is-error' : ''}`;
    el.innerHTML = m.content ? format(m.content) : '<span class="typing"><i></i><i></i><i></i></span>';
    return el;
  }
  function render() {
    log.innerHTML = '';
    log.append(bubbleEl({ role: 'assistant', content: t('welcome', pick(a.name), firstName()) }));
    msgs.forEach((m) => log.append(bubbleEl(m)));
    renderChips();
    log.scrollTop = log.scrollHeight;
  }
  function renderChips() {
    const asked = msgs.some((m) => m.role === 'user');
    const p = projects[+(activeKey().match(/^project(\d+)$/)?.[1] ?? -1)];
    const list = asked ? [] : [...(p ? [t('tellMe', pick(p.title))] : []), ...pick(a.suggestions)];
    chips.innerHTML = '';
    list.forEach((q) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', () => send(q));
      chips.append(b);
    });
    chips.hidden = !list.length;
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    sendBtn.disabled = true;
    root.classList.add('is-thinking');
    msgs.push({ role: 'user', content: text });
    const reply = { role: 'assistant', content: '' };
    msgs.push(reply);
    render();
    input.value = '';
    autosize();
    const el = log.lastElementChild;

    try {
      const history = msgs.filter((m) => m !== reply && !m.error).map(({ role, content }) => ({ role, content }));
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, lang }) });
      if (!res.ok || !res.body) {
        reply.content = (await res.text().catch(() => '')) || t('error');
        reply.error = true;
      } else {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          reply.content += dec.decode(value, { stream: true });
          el.innerHTML = format(reply.content);
          log.scrollTop = log.scrollHeight;
        }
      }
    } catch (e) {
      reply.content = t('offline');
      reply.error = true;
    }
    if (!reply.content) { reply.content = t('error'); reply.error = true; }
    el.className = bubbleEl(reply).className;
    el.innerHTML = format(reply.content);
    log.scrollTop = log.scrollHeight;
    save();
    busy = false;
    sendBtn.disabled = false;
    root.classList.remove('is-thinking');
  }

  function autosize() {
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });

  function setOpen(on) {
    open = on;
    panel.classList.toggle('is-open', on);
    panel.inert = !on;
    root.classList.toggle('is-open', on);
    btn.setAttribute('aria-expanded', String(on));
    if (on) {
      root.classList.remove('is-talking');
      trickAt = Infinity;
      walkTo(home(), 2.6);
      render();
      setTimeout(() => input.focus({ preventScroll: true }), 220);
    } else {
      restUntil = clock + 2;
      btn.focus({ preventScroll: true });
    }
  }
  panel.inert = true;
  btn.addEventListener('click', () => setOpen(!open));
  bubble.addEventListener('click', () => setOpen(true));
  $('.chat-close', panel).addEventListener('click', () => setOpen(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  onLang(() => { labels(); if (open) render(); });

  // the page scroll drives the flight — don't let wheel/touch inside the panel move it
  panel.addEventListener('wheel', (e) => {
    if (!log.contains(e.target) || log.scrollHeight <= log.clientHeight) e.preventDefault();
  }, { passive: false });
}

function format(s) {
  return s
    .replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'&]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '')}</a>`)
    .replace(/(^|[\s(])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, '$1<a href="mailto:$2">$2</a>')
    .replace(/\n/g, '<br>');
}
