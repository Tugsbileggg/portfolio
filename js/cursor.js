// Cursor trail drawn on a 2D canvas over the scene.
// Night: stardust that twinkles and drifts down. Day: little cloud puffs carried by the wind.

function sprite(size, stops) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

export function createCursorFX(canvas, { isDay }) {
  const g = canvas.getContext('2d');
  const star = sprite(64, [[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(210,230,255,0.9)'], [0.35, 'rgba(120,170,255,0.25)'], [1, 'rgba(120,170,255,0)']]);
  const puff = sprite(64, [[0, 'rgba(255,255,255,0.95)'], [0.45, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]);
  const haloNight = sprite(256, [[0, 'rgba(140,190,255,0.16)'], [1, 'rgba(140,190,255,0)']]);
  const haloDay = sprite(256, [[0, 'rgba(255,255,255,0.28)'], [1, 'rgba(255,255,255,0)']]);

  const parts = [];
  const pointer = { x: -999, y: -999, px: -999, py: -999, on: 0, seen: false };
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  resize();
  addEventListener('resize', resize);

  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (!pointer.seen) { pointer.px = pointer.x; pointer.py = pointer.y; pointer.seen = true; }
    const dx = pointer.x - pointer.px, dy = pointer.y - pointer.py;
    const dist = Math.hypot(dx, dy);
    const n = Math.min(10, Math.floor(dist / 7));
    const day = isDay();
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / n;
      const x = pointer.px + dx * t, y = pointer.py + dy * t;
      parts.push(day
        ? { x, y, vx: dx * 0.6 + 30 + Math.random() * 30, vy: -8 - Math.random() * 14, life: 0, max: 0.9 + Math.random() * 0.8, size: 6 + Math.random() * 10, grow: 26 + Math.random() * 22, day }
        : { x, y, vx: dx * 0.5 + (Math.random() - 0.5) * 24, vy: dy * 0.5 + 14 + Math.random() * 26, life: 0, max: 0.7 + Math.random() * 0.9, size: 2 + Math.random() * 5, grow: 0, tw: Math.random() * 6, sparkle: Math.random() < 0.07, day });
    }
    if (parts.length > 400) parts.splice(0, parts.length - 400);
    pointer.px = pointer.x;
    pointer.py = pointer.y;
  });
  addEventListener('pointerleave', () => { pointer.seen = false; pointer.x = pointer.y = -999; });
  document.addEventListener('mouseleave', () => { pointer.seen = false; pointer.x = pointer.y = -999; });

  function update(dt, time) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);

    // soft light around the cursor
    if (pointer.seen) {
      const h = isDay() ? haloDay : haloNight;
      g.globalCompositeOperation = isDay() ? 'source-over' : 'lighter';
      g.drawImage(h, pointer.x - 110, pointer.y - 110, 220, 220);
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      const k = p.life / p.max;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 2.2;
      if (p.day) {
        p.vy *= 1 - dt * 1.5;
        const s = p.size + p.grow * k;
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = (1 - k) * (1 - k) * 0.75;
        g.drawImage(puff, p.x - s / 2, p.y - s / 2, s, s);
      } else {
        p.vy *= 1 - dt * 1.2;
        const tw = 0.6 + 0.4 * Math.sin(time * 18 + p.tw);
        const s = p.size * (1 - k * 0.5) * 3;
        g.globalCompositeOperation = 'lighter';
        g.globalAlpha = (1 - k) * tw;
        g.drawImage(star, p.x - s / 2, p.y - s / 2, s, s);
        if (p.sparkle) {
          const l = 10 * (1 - k);
          g.strokeStyle = 'rgba(220,235,255,0.9)';
          g.lineWidth = 1;
          g.beginPath();
          g.moveTo(p.x - l, p.y); g.lineTo(p.x + l, p.y);
          g.moveTo(p.x, p.y - l); g.lineTo(p.x, p.y + l);
          g.stroke();
        }
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  return { update };
}
