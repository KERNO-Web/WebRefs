import { onFrame, reduced } from './anim';
import type { Cauldron } from './art/cauldron';
import type { Tentacle } from './art/tentacle';
import { arc, el, P, swell, taper } from './ink';

// A ladle stands in the cauldron. Grab it (or the brew) and stir:
// counter-clockwise turns the potion through its colours, clockwise
// angers the cauldron: the brew goes black-red and the tentacles twitch.
const CX = 400, CY = 386, RX = 150, RY = 26;

const PALETTE = [
  ['#c4f58f', '#7bd63a', '#3f8a1c'],
  ['#a6f5e6', '#2fc4b2', '#127a6e'],
  ['#d9b8ff', '#9a5bf0', '#4e2394'],
  ['#ffe2a1', '#f3a531', '#9a5a10'],
  ['#ffc2e0', '#e2559f', '#8e2463'],
];
const BLOOD = ['#c0393f', '#5c0b12', '#1d0306'];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
};

export function stir(svg: SVGSVGElement, cg: SVGGElement, c: Cauldron, tentacles: () => Tentacle[], hero: HTMLElement) {
  const stops = Array.from(svg.querySelectorAll<SVGStopElement>('#pg-hero stop'));
  const swirl = el('g', { class: 'swirl' }, c.root);
  c.liquid.after(swirl);
  const spoon = el('g', { class: 'spoon', tabindex: 0, role: 'slider', 'aria-label': 'Ложка в котле: мешайте отвар стрелками или мышью', 'aria-valuemin': 0, 'aria-valuemax': 4, 'aria-valuenow': 0 }, c.root);
  swirl.after(spoon);
  const ripple = el('path', { class: 'ink' }, spoon);
  const handleFill = el('path', { class: 'spoon-wood' }, spoon);
  const handleInk = el('path', { class: 'ink' }, spoon);
  const grain = el('path', { class: 'ink' }, spoon);
  const hit = el('path', { class: 'spoon-hit' }, spoon);

  let ang = -0.6, hue = 0, anger = 0, speed = 0, spin = 0, dragging = false, stirred = false;

  const draw = () => {
    const base: P = [CX + Math.cos(ang) * RX, CY + Math.sin(ang) * RY];
    const out = Math.cos(ang);
    const top: P = [base[0] + out * 70 + 30, base[1] - 300];
    const pts: P[] = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([base[0] + (top[0] - base[0]) * t, base[1] + (top[1] - base[1]) * t]); }
    const w = (t: number) => 24 - t * 8 + (t > 0.92 ? (t - 0.92) * 90 : 0);
    handleFill.setAttribute('d', taper(pts, w));
    const L: P[] = [], R: P[] = [];
    const dx = top[0] - base[0], dy = top[1] - base[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    pts.forEach(([x, y], i) => { const hw = w(i / 20) / 2; L.push([x + nx * hw, y + ny * hw]); R.push([x - nx * hw, y - ny * hw]); });
    handleInk.setAttribute('d', taper(L, () => 1.4) + taper(R, () => 2.6) + taper(arc(top[0], top[1], w(1) / 2, 4, 0, Math.PI * 2, 16), () => 1.4));
    let gd = '';
    for (let k = 0; k < 3; k++) {
      const off = (k - 1) * 3;
      gd += taper(pts.slice(2 + k * 3, 12 + k * 2).map(([x, y]) => [x + nx * off, y + ny * off] as P), swell(0.8, 0.1));
    }
    grain.setAttribute('d', gd);
    hit.setAttribute('d', `M${base[0]} ${base[1]}L${top[0]} ${top[1]}`);
    ripple.setAttribute('d', taper(arc(base[0], base[1] + 2, 26, 6, Math.PI * 0.05, Math.PI * 0.95, 14), swell(1.6, 0.2)) + taper(arc(base[0], base[1] + 2, 40, 9, Math.PI * 0.15, Math.PI * 0.85, 14), swell(1, 0.1)));
  };

  const paint = () => {
    const n = PALETTE.length;
    const pos = ((hue % n) + n) % n;
    const i0 = Math.floor(pos), k = pos - i0, i1 = (i0 + 1) % n;
    const a = Math.min(1, anger);
    const cols = [0, 1, 2].map((j) => mix(mix(PALETTE[i0][j], PALETTE[i1][j], k), BLOOD[j], a));
    stops.forEach((s, j) => s.setAttribute('stop-color', cols[j]));
    const [r, g, b] = hex(cols[1]);
    svg.style.setProperty('--potion-glow', `rgba(${r},${g},${b},0.5)`);
    svg.style.setProperty('--bubble', cols[0]);
    spoon.setAttribute('aria-valuenow', String(i0));
    c.root.style.transform = a > 0.35 && !reduced ? `translate(${((Math.random() - 0.5) * 6 * a).toFixed(1)}px, ${((Math.random() - 0.5) * 3 * a).toFixed(1)}px)` : '';
  };

  const turn = (d: number) => {
    ang += d;
    if (d < 0) hue += -d / (Math.PI * 2) * 1.2;
    else anger += d * 0.5;
    speed = Math.min(1, speed + Math.abs(d) * 1.6);
    spin += d;
    if (!stirred) { stirred = true; hint?.classList.add('gone'); }
    if (anger > 0.5) {
      tentacles().forEach((t) => (t.twitch = 1));
      warn();
    }
    draw();
    paint();
  };

  // Pointer → angle on the brew's ellipse, in cauldron coordinates.
  const angleAt = (e: PointerEvent) => {
    const m = cg.getScreenCTM();
    if (!m) return ang;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return Math.atan2((p.y - CY) / RY, (p.x - CX) / RX);
  };
  let prev = 0;
  const start = (e: PointerEvent) => {
    dragging = true;
    prev = angleAt(e);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    spoon.classList.add('grab');
    e.preventDefault();
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const a = angleAt(e);
    let d = a - prev;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    prev = a;
    turn(d);
  };
  const end = () => { dragging = false; spoon.classList.remove('grab'); };
  for (const target of [spoon, c.liquid, swirl]) {
    target.addEventListener('pointerdown', start as EventListener);
    target.addEventListener('pointermove', move as EventListener);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
  }
  c.liquid.classList.add('brew');
  spoon.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); turn(-0.35); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); turn(0.35); }
  });

  // Swirl lines on the surface and calm-down, on hand-drawn frames.
  onFrame(() => {
    if (!dragging) {
      speed *= 0.82;
      if (anger > 0) { anger = Math.max(0, anger * 0.9 - 0.01); paint(); }
    }
    let d = '';
    if (speed > 0.04) {
      for (let k = 0; k < 3; k++) {
        const r0 = 0.25 + k * 0.25, a0 = spin * 1.5 + k * 2.1;
        const pts = arc(CX, CY + 4, RX * r0, RY * r0 * 1.1, a0, a0 + 1.6 + speed, 18);
        d += taper(pts, swell(1.6 * speed + 0.3, 0.1));
      }
    }
    swirl.replaceChildren();
    if (d) el('path', { d, class: 'swirl-ink' }, swirl);
  }, hero);

  // Hint for the first visit and an angry note for clockwise stirring.
  const hint = hero.querySelector<HTMLElement>('.stir-hint');
  let warned = 0;
  const warn = () => {
    const now = performance.now();
    if (now - warned < 2600) return;
    warned = now;
    const n = document.createElement('p');
    n.className = 'marginal angry';
    n.textContent = 'я же просил: против часовой…';
    hero.append(n);
    setTimeout(() => n.remove(), 2400);
  };

  draw();
  paint();
}

