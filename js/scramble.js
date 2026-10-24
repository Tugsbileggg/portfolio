// Matrix-style decode for a language switch: every letter flickers through random Latin / Cyrillic
// glyphs, then settles on the new text, roughly left to right.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЖЗИЙКЛМНОӨПРСТУҮФХЦЧШЭЮЯ0123456789#%&*+=<>/';
const DURATION = 900;
const FLICKER = 45; // ms between glyph changes
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

let jobs = [];
let raf = 0;

const isLower = (c) => c !== c.toUpperCase();
const glyph = (c) => {
  const g = GLYPHS[(Math.random() * GLYPHS.length) | 0];
  return isLower(c) ? g.toLowerCase() : g;
};

// call right after the elements already hold their new text
export function scramble(roots) {
  if (still) return;
  // switched again mid-way: put unchanged text (email, links…) back before reading it
  cancelAnimationFrame(raf);
  jobs.forEach((j) => { j.n.nodeValue = j.chars.join(''); });
  jobs = [];
  for (const root of roots) {
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode()); ) {
      const chars = [...n.nodeValue];
      if (!n.nodeValue.trim()) continue;
      const settle = chars.map((_, i) => (i / chars.length) * 0.55 + Math.random() * 0.45);
      jobs.push({ n, chars, settle });
    }
  }
  if (!jobs.length) return;
  const t0 = performance.now();
  let lastTick = -1;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / DURATION);
    const tick = Math.floor((now - t0) / FLICKER);
    if (tick !== lastTick || p === 1) {
      lastTick = tick;
      for (const j of jobs) {
        j.n.nodeValue = j.chars.map((c, i) => (p >= j.settle[i] || !c.trim() ? c : glyph(c))).join('');
      }
    }
    if (p < 1) raf = requestAnimationFrame(step);
    else jobs = [];
  };
  raf = requestAnimationFrame(step);
}
