import { onFrame, reduced } from './anim';
import { arc, el, NS, P, rng, smooth, stroke, swell, taper } from './ink';

// Mood layer: candlelight that follows the cursor, drifting dust, burnt
// holes in the page with eyes watching from inside, candles by the titles,
// handwritten notes and ink blots in the margins.

let mx = innerWidth * 0.5, my = innerHeight * 0.4;
addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

export function candlelight() {
  const light = document.createElement('div');
  light.className = 'candlelight';
  light.setAttribute('aria-hidden', 'true');
  document.body.append(light);
  let x = mx, y = my;
  const fine = matchMedia('(pointer: fine)').matches;
  const r = rng(5);
  // Position follows the cursor at screen rate; only transform changes, so
  // the compositor moves it without repainting the page.
  const move = (now: number) => {
    const t = now / 1000;
    const tx = fine ? mx : innerWidth * (0.5 + Math.sin(t * 0.3) * 0.18);
    const ty = fine ? my : innerHeight * (0.42 + Math.sin(t * 0.23) * 0.12);
    x += (tx - x) * 0.18; y += (ty - y) * 0.18;
    light.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    if (!reduced) requestAnimationFrame(move);
  };
  move(0);
  // Flame flicker stays hand-drawn: 12 fps opacity steps.
  if (!reduced) onFrame((t) => { light.style.opacity = (0.9 + r() * 0.07 + Math.sin(t * 7) * 0.03).toFixed(3); });
}

export function dust() {
  if (reduced) return;
  const c = document.createElement('canvas');
  c.className = 'dust';
  c.setAttribute('aria-hidden', 'true');
  document.body.append(c);
  const ctx = c.getContext('2d')!;
  const size = () => { c.width = innerWidth; c.height = innerHeight; };
  size();
  addEventListener('resize', size);
  const r = rng(77);
  const motes = Array.from({ length: 46 }, () => ({ x: r() * innerWidth, y: r() * innerHeight, s: 0.6 + r() * 1.8, v: 0.2 + r() * 0.6, ph: r() * 6, green: r() > 0.82 }));
  onFrame((t) => {
    ctx.clearRect(0, 0, c.width, c.height);
    for (const m of motes) {
      m.y -= m.v * 3;
      m.x += Math.sin(t * 0.8 + m.ph) * 0.9;
      if (m.y < -10) { m.y = c.height + 10; m.x = r() * c.width; }
      const a = 0.25 + 0.35 * Math.abs(Math.sin(t * 1.3 + m.ph));
      ctx.fillStyle = m.green ? `rgba(160,240,90,${a})` : `rgba(255,214,150,${a * 0.8})`;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.s, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// A charred hole in the parchment; two green eyes look out of it and
// follow the cursor. They blink, and shut tight if you come too close.
export function burntHole(host: HTMLElement, css: Partial<CSSStyleDeclaration>, size = 120, seed = 1) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-60 -60 120 120');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('hole');
  Object.assign(svg.style, css, { width: `${size}px`, height: `${size}px` });
  host.append(svg);
  const r = rng(seed * 31 + 7);
  const outline = (rad: number, jag: number): P[] => Array.from({ length: 28 }, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    const rr = rad * (1 + (r() - 0.5) * jag + 0.08 * Math.sin(a * 3 + seed));
    return [Math.cos(a) * rr, Math.sin(a) * rr * 0.72];
  });
  const id = `char-${seed}`;
  const defs = el('defs', {}, svg);
  const g = el('radialGradient', { id }, defs);
  el('stop', { offset: '55%', 'stop-color': '#2a1606', 'stop-opacity': 0.9 }, g);
  el('stop', { offset: '80%', 'stop-color': '#7a4614', 'stop-opacity': 0.45 }, g);
  el('stop', { offset: '100%', 'stop-color': '#9a6224', 'stop-opacity': 0 }, g);
  el('path', { d: smooth(outline(56, 0.35), true), fill: `url(#${id})` }, svg);
  el('path', { d: smooth(outline(38, 0.3), true), fill: '#0b0603' }, svg);
  stroke(svg, outline(39, 0.3).concat([outline(39, 0.3)[0]]), () => 1.2, 'char-edge');

  const eyes = el('g', { class: 'eyes' }, svg);
  const pair = [-13, 13].map((dx) => {
    const eg = el('g', { transform: `translate(${dx} 0)` }, eyes);
    const white = el('ellipse', { cx: 0, cy: 0, rx: 9, ry: 5.5, class: 'eye-iris' }, eg);
    const pupil = el('ellipse', { cx: 0, cy: 0, rx: 1.4, ry: 4.6, class: 'eye-pupil' }, eg);
    const lid = el('path', { class: 'eye-lid' }, eg);
    return { eg, white, pupil, lid, dx };
  });
  let open = 0, target = 1, blinkAt = 3 + r() * 4;
  const setLids = (k: number) => pair.forEach(({ white, pupil, lid }) => {
    white.setAttribute('ry', (5.5 * k).toFixed(2));
    pupil.setAttribute('ry', (4.6 * k).toFixed(2));
    lid.setAttribute('d', taper(arc(0, 0, 10, 5.5 * k + 0.6, Math.PI, Math.PI * 2, 12), swell(1.6, 0.4)));
  });
  setLids(reduced ? 1 : 0);
  if (reduced) return;
  let seen = false;
  new IntersectionObserver((es) => { seen = es[0].isIntersecting; }).observe(svg);
  onFrame((t) => {
    if (!seen) { open = 0; setLids(0); return; }
    const b = svg.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const dist = Math.hypot(mx - cx, my - cy);
    target = dist < size * 0.9 ? 0 : 1;
    if (t > blinkAt) { target = 0; if (t > blinkAt + 0.25) blinkAt = t + 2.5 + r() * 5; }
    open += (target - open) * 0.55;
    if (Math.abs(target - open) < 0.05) open = target;
    setLids(open);
    const ang = Math.atan2(my - cy, mx - cx);
    const k = Math.min(1, dist / 300) * 4.5;
    pair.forEach(({ pupil }) => {
      pupil.setAttribute('cx', (Math.cos(ang) * k).toFixed(2));
      pupil.setAttribute('cy', (Math.sin(ang) * k * 0.5).toFixed(2));
    });
  });
}

// Engraved candle with a living green-cored flame.
export function candle(host: Element, cls: string, h = 120, seed = 1) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-40 -90 80 200');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('candle', cls);
  host.append(svg);
  const r = rng(seed * 13);
  const w = 14, top = 0, bottom = 100 - h * 0.1;
  el('rect', { x: -w, y: top, width: w * 2, height: bottom, class: 'paper-fill' }, svg);
  for (let i = 0; i < 9; i++) {
    const u = -0.2 + (i / 8) * 1.1, x = u * w;
    stroke(svg, [[x, top + 6], [x, bottom - 2]], (t) => (0.15 + Math.max(0, u) * 1.4) * Math.sin(Math.PI * Math.min(1, t * 1.2)));
  }
  stroke(svg, [[-w, top], [-w, bottom]], () => 1.4);
  stroke(svg, [[w, top], [w, bottom]], () => 2.6);
  stroke(svg, arc(0, top, w, 3.5, 0, Math.PI * 2, 24), () => 1.2);
  // drips
  for (let i = 0; i < 3; i++) {
    const x = -w + 4 + r() * (w * 2 - 8), len = 10 + r() * 26;
    el('path', { d: taper([[x, top + 1], [x + 0.5, top + len * 0.6], [x, top + len]], (t) => 4 * (1 - t * 0.5)), class: 'paper-fill' }, svg);
    stroke(svg, [[x + 2, top + 2], [x + 2.2, top + len]], swell(1));
    el('circle', { cx: x, cy: top + len, r: 2.4, class: 'paper-fill', stroke: 'var(--ink)', 'stroke-width': 0.8 }, svg);
  }
  // holder dish
  stroke(svg, arc(0, bottom, 28, 6, 0, Math.PI, 20), swell(2.6));
  stroke(svg, arc(0, bottom, 28, 6, Math.PI, Math.PI * 2, 20), swell(1));
  stroke(svg, [[0, top], [1, top - 9]], () => 1.6);
  const glow = el('circle', { cx: 0, cy: -28, r: 30, class: 'candle-glow' }, svg);
  const flame = el('path', { class: 'candle-flame' }, svg);
  const core = el('path', { class: 'candle-core' }, svg);
  const outline = el('path', { class: 'ink' }, svg);
  const paint = (t: number, f: number) => {
    const rr = rng(f * 7 + seed);
    const sway = Math.sin(t * 5 + seed) * 2.5 + (rr() - 0.5) * 2;
    const H = 30 + (rr() - 0.5) * 6;
    const sp: P[] = [];
    for (let j = 0; j <= 10; j++) { const s = j / 10; sp.push([sway * s * s, -8 - H * s]); }
    const wf = (s: number) => 9 * Math.sin(Math.PI * Math.min(1, 0.15 + s)) * (1 - s * 0.85);
    flame.setAttribute('d', taper(sp, wf));
    core.setAttribute('d', taper(sp.slice(0, 6), (s) => 4.5 * Math.sin(Math.PI * (0.1 + s * 0.9))));
    outline.setAttribute('d', taper(sp.map(([x, y], i) => [x - wf(i / 10) / 2, y] as P), (s) => 1.2 * (1 - s)) + taper(sp.map(([x, y], i) => [x + wf(i / 10) / 2, y] as P), (s) => 1.4 * (1 - s)));
    glow.setAttribute('r', (28 + (rr() - 0.5) * 6).toFixed(1));
  };
  paint(0, 0);
  if (!reduced) { svg.classList.add('boil'); onFrame(paint, svg); }
  return svg;
}

export function inkBlot(host: HTMLElement, css: Partial<CSSStyleDeclaration>, size = 60, seed = 1) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '-50 -50 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('blot');
  Object.assign(svg.style, css, { width: `${size}px`, height: `${size}px` });
  host.append(svg);
  const r = rng(seed * 17 + 3);
  const main: P[] = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2, rr = 20 * (0.8 + r() * 0.45);
    return [Math.cos(a) * rr, Math.sin(a) * rr];
  });
  el('path', { d: smooth(main, true), class: 'ink blot-ink' }, svg);
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = 26 + r() * 20, s = 1 + r() * 4;
    el('circle', { cx: Math.cos(a) * d, cy: Math.sin(a) * d, r: s, class: 'ink blot-ink' }, svg);
    if (r() > 0.5) stroke(svg, [[Math.cos(a) * 18, Math.sin(a) * 18], [Math.cos(a) * (d - s), Math.sin(a) * (d - s)]], (t) => 3.5 * (1 - t) + 0.3, 'ink blot-ink');
  }
}

// Handwritten marginal note with a hand-drawn arrow.
export function note(host: HTMLElement, text: string, css: Partial<CSSStyleDeclaration>, arrow?: { dx: number; dy: number; bend?: number }) {
  const n = document.createElement('p');
  n.className = 'marginal';
  n.textContent = text;
  Object.assign(n.style, css);
  host.append(n);
  if (arrow) {
    const svg = document.createElementNS(NS, 'svg');
    svg.classList.add('marginal-arrow');
    const W = Math.abs(arrow.dx) + 30, H = Math.abs(arrow.dy) + 30;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.width = `${W}px`; svg.style.height = `${H}px`;
    const x0 = arrow.dx < 0 ? W - 15 : 15, y0 = arrow.dy < 0 ? H - 15 : 15;
    const x1 = x0 + arrow.dx, y1 = y0 + arrow.dy;
    const b = arrow.bend ?? 0.3;
    const mxp = (x0 + x1) / 2 - (y1 - y0) * b, myp = (y0 + y1) / 2 + (x1 - x0) * b;
    const pts: P[] = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mxp + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * myp + t * t * y1]); }
    stroke(svg, pts, swell(2, 0.5));
    const [px, py] = pts[14], ang = Math.atan2(y1 - py, x1 - px);
    for (const s of [-1, 1]) stroke(svg, [[x1, y1], [x1 - Math.cos(ang + s * 0.5) * 12, y1 - Math.sin(ang + s * 0.5) * 12]], swell(2, 0.5));
    n.append(svg);
    Object.assign(svg.style, { left: arrow.dx < 0 ? `${-W + 30}px` : '20px', top: arrow.dy < 0 ? `${-H + 8}px` : '100%' });
  }
  return n;
}
