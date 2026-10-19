import type { VesselKind } from '../data';
import { arc, clamp, el, lerp, P, rng, smooth, stroke, swell, taper } from '../ink';

// Lathe engraving: every vessel is a profile r(y) spun around x = CX.
// Potion colour is a wash under the ink, like a hand-tinted plate.
const CX = 150;
type Prof = (y: number) => number;

interface LatheOpts { top: number; bottom: number; liquid?: number; liquidBottom?: number; glass?: boolean; grad?: string; hatch?: number }

let uid = 0;

function lathe(g: Element, r: Prof, o: LatheOpts) {
  const step = 3;
  const L: P[] = [], R: P[] = [];
  for (let y = o.top; y <= o.bottom; y += step) { L.push([CX - r(y), y]); R.push([CX + r(y), y]); }
  const silhouette = [...L, ...[...R].reverse()];
  el('path', { d: smooth(silhouette, true), class: o.glass ? 'glass-fill' : 'paper-fill' }, g);

  const id = `v-clip-${uid++}`;
  const cp = el('clipPath', { id }, g);
  el('path', { d: smooth(silhouette, true) }, cp);
  const lg = el('g', { 'clip-path': `url(#${id})` }, g);
  const sh = el('g', { 'clip-path': `url(#${id})` }, g);
  if (o.liquid !== undefined && o.grad) {
    const lq: P[] = [];
    const inset = o.glass ? 5 : 0;
    const lb = o.liquidBottom ?? o.bottom - 4;
    for (let y = o.liquid; y <= lb; y += step) lq.push([CX + Math.max(0, r(y) - inset), y]);
    for (let y = lb; y >= o.liquid; y -= step) lq.push([CX - Math.max(0, r(y) - inset), y]);
    el('path', { d: smooth(lq, true), class: 'potion', fill: `url(#${o.grad})` }, lg);
    const rl = Math.max(0, r(o.liquid) - inset);
    el('ellipse', { cx: CX, cy: o.liquid, rx: rl, ry: rl * 0.16, class: 'potion surface', fill: `url(#${o.grad})` }, lg);
    stroke(lg, arc(CX, o.liquid, rl, rl * 0.16, 0, Math.PI * 2, 40), () => 0.9);
  }

  // Vertical form lines on the shadow side, heavier toward the edge.
  const density = o.hatch ?? (o.glass ? 7 : 12);
  for (let i = 0; i < density; i++) {
    const u = lerp(0.3, 0.97, i / (density - 1));
    const pts: P[] = [];
    for (let y = o.top; y <= o.bottom; y += 6) pts.push([CX + r(y) * u, y]);
    stroke(sh, pts, (t) => (0.2 + u * u * (o.glass ? 1.3 : 2.4)) * Math.sin(Math.PI * clamp(t * 1.1)));
  }
  // Cross-contours following the turned form, heavier on the shadow side.
  for (let y = o.top + 10; y < o.bottom - 4; y += o.glass ? 11 : 8) {
    const rr = r(y);
    if (rr < 14) continue;
    const pts = arc(CX, y, rr, rr * 0.14, 0, Math.PI, 26);
    stroke(sh, pts, (t) => (o.glass ? 0.12 + 0.9 : 0.2 + 1.8) * Math.pow(1 - t, 2.2) + 0.12);
  }
  // Left rim of shadow (reflected light leaves a thin dark line).
  const lp: P[] = [];
  for (let y = o.top; y <= o.bottom; y += 6) lp.push([CX - r(y) * 0.9, y]);
  stroke(sh, lp, swell(0.8));

  if (o.glass) {
    const inner: P[] = [];
    for (let y = o.top + 6; y <= o.bottom - 6; y += step) inner.push([CX + Math.max(0, r(y) - 5), y]);
    stroke(g, inner, swell(0.7));
  }
  stroke(g, L, (t) => 1.4 + 1.2 * Math.sin(Math.PI * t));
  stroke(g, R, (t) => 2 + 2.6 * Math.sin(Math.PI * t));
}

function contour(g: Element, y: number, r: number, w = 1.6, back = true) {
  stroke(g, arc(CX, y, r, r * 0.16, 0, Math.PI, 30), swell(w, 0.3));
  if (back) stroke(g, arc(CX, y, r, r * 0.16, Math.PI, Math.PI * 2, 30), swell(w * 0.5, 0.2));
}

function wisps(g: Element, x: number, y: number, h: number, seed: number, n = 5, spread = 40) {
  const r = rng(seed);
  const s = el('g', { class: 'wisps' }, g);
  for (let i = 0; i < n; i++) {
    const pts: P[] = [];
    const x0 = x + (r() - 0.5) * spread, amp = 6 + r() * 12, ph = r() * 6;
    for (let j = 0; j <= 24; j++) {
      const t = j / 24;
      pts.push([x0 + Math.sin(t * 6 + ph) * amp * (0.4 + t), y - t * h]);
    }
    stroke(s, pts, swell(1.6, 0.1));
  }
  return s;
}

export function drawVessel(parent: Element, kind: VesselKind, grad: string): SVGGElement {
  const g = el('g', { class: `vessel vessel-${kind}` }, parent);
  // Shared table shadow
  el('ellipse', { cx: CX, cy: 398, rx: 120, ry: 12, class: 'cast' }, g);
  switch (kind) {
    case 'flask': {
      const R = 112, cy = 282;
      const prof: Prof = (y) => (y < 172 ? (y < 34 ? 25 : 18) : Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)));
      lathe(g, prof, { top: 22, bottom: 394, liquid: 236, glass: true, grad });
      contour(g, 22, 25, 2.4);
      contour(g, 34, 22, 1.2, false);
      // cork stand ring
      stroke(g, arc(CX, 386, 70, 14, 0, Math.PI, 30), swell(3.4));
      break;
    }
    case 'tumbler': {
      const prof: Prof = (y) => lerp(74, 66, (y - 196) / 200);
      lathe(g, prof, { top: 196, bottom: 396, liquid: 262, glass: true, grad });
      contour(g, 196, 74, 2.2);
      contour(g, 376, 67, 1, false);
      // Smoke bubble resting on the rim.
      const b = el('g', { class: 'smoke-bubble' }, g);
      el('circle', { cx: CX, cy: 128, r: 70, class: 'glass-fill' }, b);
      wisps(b, CX, 186, 110, 4, 7, 70);
      stroke(b, arc(CX, 128, 70, 70, 0, Math.PI * 2, 60), (t) => 0.6 + 1.6 * Math.abs(Math.sin(Math.PI * t + 0.6)));
      stroke(b, arc(CX - 18, 108, 40, 40, Math.PI * 1.05, Math.PI * 1.45, 14), swell(2.4), 'paper');
      break;
    }
    case 'cloche': {
      // coupe
      const coupe: Prof = (y) => (y < 302 ? 88 * Math.sqrt(Math.max(0, 1 - ((y - 250) / 52) ** 2)) + 4 : y < 368 ? 5 : lerp(16, 52, (y - 368) / 26));
      lathe(g, coupe, { top: 252, bottom: 394, liquid: 262, liquidBottom: 298, grad });
      contour(g, 252, 92, 2);
      // bell jar
      const dome: Prof = (y) => (y < 58 ? 11 : y < 160 ? 108 * Math.sqrt(Math.max(0, 1 - ((y - 160) / 102) ** 2)) + 4 : 112);
      const jar = el('g', { class: 'jar' }, g);
      wisps(jar, CX, 250, 170, 9, 8, 150);
      lathe(jar, dome, { top: 40, bottom: 392, glass: true, hatch: 5 });
      contour(jar, 392, 112, 1.6);
      break;
    }
    case 'vial': {
      const prof: Prof = (y) => (y < 84 ? (y < 40 ? 16 : 12) : 78 * Math.pow(Math.sin((Math.PI * (y - 84)) / 316), 0.75) + 12 * (1 - (y - 84) / 316));
      lathe(g, prof, { top: 26, bottom: 396, liquid: 150, glass: true, grad });
      contour(g, 26, 16, 2);
      // pearl swirl
      const sw: P[] = [];
      for (let i = 0; i <= 80; i++) {
        const t = i / 80, a = t * Math.PI * 6;
        sw.push([CX + Math.cos(a) * (10 + t * 46), 330 - t * 150 + Math.sin(a) * 8]);
      }
      stroke(g, sw, swell(1.6, 0.1), 'pearl');
      break;
    }
    case 'goblet': {
      const prof: Prof = (y) => (y < 268 ? 84 * Math.sqrt(Math.max(0, 1 - ((y - 118) / 150) ** 2)) + 6 : y < 352 ? (Math.abs(y - 306) < 12 ? 17 - Math.abs(y - 306) * 0.6 : 8) : lerp(18, 74, (y - 352) / 42));
      lathe(g, prof, { top: 120, bottom: 394, liquid: 150, liquidBottom: 264, grad });
      contour(g, 120, 90, 2.4);
      // Mandrake root on a skewer: a little man-shaped root poking out of the cup.
      const rid = `root-clip-${uid++}`;
      el('rect', { x: -100, y: -200, width: 500, height: 324 }, el('clipPath', { id: rid }, g));
      const rg = el('g', { 'clip-path': `url(#${rid})` }, g);
      stroke(rg, [[CX + 58, -20], [CX - 6, 200]], () => 2.4);
      const root: P[] = [];
      for (let i = 0; i <= 16; i++) { const t = i / 16; root.push([CX + 46 - t * 34 + Math.sin(t * 5) * 4, 10 + t * 120]); }
      const rw = (t: number) => 34 * Math.sin(Math.PI * (0.12 + 0.88 * t)) * (1 - t * 0.55) + 2;
      el('path', { d: taper(root, rw), class: 'paper-fill' }, rg);
      stroke(rg, root, (t) => 0.6 + 2.4 * Math.sin(Math.PI * t));
      for (let i = 2; i < 15; i++) {
        const [x, y] = root[i], w = rw(i / 16) / 2;
        stroke(rg, [[x - w * 0.9, y - 2], [x, y + 3], [x + w * 0.9, y - 1]], (t) => 0.2 + 1.3 * t);
      }
      // arms and legs
      for (const [p0, p1] of [[root[7], [CX - 22, 60]], [root[8], [CX + 50, 84]], [root[15], [CX - 14, 196]], [root[15], [CX + 22, 196]]] as P[][])
        stroke(rg, [p0, [lerp(p0[0], p1[0], 0.5) + 3, lerp(p0[1], p1[1], 0.5) - 3], p1], swell(3.4, 0.6));
      // leaves on top
      for (const [dx, dy] of [[-30, -34], [6, -44], [34, -26]]) {
        const base = root[0], tip: P = [base[0] + dx, base[1] + dy];
        const leaf: P[] = [base, [lerp(base[0], tip[0], 0.5) + dy * 0.15, lerp(base[1], tip[1], 0.5)], tip];
        el('path', { d: taper(leaf, (t) => 12 * Math.sin(Math.PI * t)), class: 'paper-fill' }, rg);
        stroke(rg, leaf, swell(1.6, 0.3));
        stroke(rg, leaf.slice(0, 2), swell(0.6));
      }
      // two dot eyes
      el('circle', { cx: root[3][0] - 6, cy: root[3][1], r: 2.2, class: 'ink' }, rg);
      el('circle', { cx: root[3][0] + 6, cy: root[3][1] + 1, r: 2.2, class: 'ink' }, rg);
      break;
    }
    case 'erlenmeyer': {
      const prof: Prof = (y) => (y < 140 ? (y < 52 ? 26 : 20) : y < 372 ? lerp(20, 118, (y - 140) / 232) : 118 - (y - 372) * 0.5);
      lathe(g, prof, { top: 40, bottom: 396, liquid: 290, glass: true, grad });
      contour(g, 40, 26, 2.2);
      // Burning cinnamon stick.
      el('path', { d: taper([[CX - 4, 300], [CX + 22, 20]], () => 14), class: 'paper-fill' }, g);
      stroke(g, [[CX - 11, 300], [CX + 15, 20]], swell(1.6));
      stroke(g, [[CX + 3, 300], [CX + 29, 20]], swell(2.2));
      for (let k = 0; k < 12; k++) {
        const t = k / 12, x = lerp(CX - 4, CX + 22, 1 - t), y = lerp(300, 20, 1 - t);
        stroke(g, [[x - 6, y], [x + 7, y - 2]], swell(0.7));
      }
      el('ellipse', { cx: CX + 22, cy: 18, rx: 8, ry: 5, class: 'ember' }, g);
      wisps(g, CX + 24, 14, 90, 21, 3, 20);
      break;
    }
    case 'bottle': {
      const prof: Prof = (y) => (y < 62 ? 19 : y < 140 ? 20 : y < 192 ? lerp(20, 78, Math.sin(((y - 140) / 52) * Math.PI / 2)) : 78);
      lathe(g, prof, { top: 62, bottom: 396, liquid: 212, glass: true, grad });
      // cork
      lathe(g, () => 19, { top: 18, bottom: 64, hatch: 6 });
      contour(g, 18, 19, 1.6);
      // label
      el('rect', { x: CX - 52, y: 262, width: 104, height: 84, class: 'paper-fill label' }, g);
      stroke(g, [[CX - 52, 262], [CX + 52, 262], [CX + 52, 346], [CX - 52, 346], [CX - 52, 262]], () => 1.4);
      const m = el('g', { transform: `translate(${CX} 304)` }, g);
      const o = arc(0, 0, 24, 24, Math.PI * 0.35, Math.PI * 1.65, 30), i2 = arc(10, 0, 19, 22, Math.PI * 1.55, Math.PI * 0.45, 30);
      el('path', { d: smooth([...o, ...i2], true), class: 'ink' }, m);
      break;
    }
    case 'highball': {
      const prof: Prof = () => 54;
      lathe(g, prof, { top: 124, bottom: 396, liquid: 170, glass: true, grad });
      contour(g, 124, 54, 2);
      contour(g, 372, 54, 1, false);
      // Rosemary sprig.
      const stem: P[] = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; stem.push([CX + 20 - t * 46 + Math.sin(t * 3) * 6, 250 - t * 210]); }
      stroke(g, stem, (t) => 3 - t * 2);
      for (let i = 2; i < 20; i++) {
        const [x, y] = stem[i];
        for (const s of [-1, 1]) {
          const len = 18 - i * 0.5;
          const leaf: P[] = [[x, y], [x + s * len * 0.7, y - len * 0.5], [x + s * len, y - len * 0.9]];
          el('path', { d: taper(leaf, (t) => 4.6 * Math.sin(Math.PI * t)), class: 'paper-fill' }, g);
          stroke(g, leaf, swell(1.4, 0.2));
        }
      }
      // Bubbles of soda.
      const r = rng(5);
      for (let i = 0; i < 14; i++) {
        const x = CX + (r() - 0.5) * 80, y = 190 + r() * 180, rr = 2 + r() * 4;
        stroke(g, arc(x, y, rr, rr, 0, Math.PI * 2, 12), () => 0.8);
      }
      break;
    }
  }
  return g;
}
