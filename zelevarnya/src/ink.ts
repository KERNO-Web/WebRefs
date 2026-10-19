// Engraving toolkit: every line in the site is a filled, tapering ink stroke,
// so objects read as copper-plate engravings rather than vector clipart.

export type P = [number, number];

export const NS = 'http://www.w3.org/2000/svg';

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(node);
  return node;
}

// Deterministic randomness so the art is identical on every load.
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const f = (n: number) => Math.round(n * 10) / 10;

export function poly(pts: P[], close = false): string {
  if (!pts.length) return '';
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `L${f(pts[i][0])} ${f(pts[i][1])}`;
  return close ? d + 'Z' : d;
}

// Smooth polyline through points (Catmull-Rom → cubic Bézier).
export function smooth(pts: P[], close = false): string {
  if (pts.length < 3) return poly(pts, close);
  const n = pts.length;
  const at = (i: number) => (close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return close ? d + 'Z' : d;
}

// A swelling burin stroke: polyline + width function → closed outline.
export function taper(pts: P[], width: (t: number, i: number) => number): string {
  const n = pts.length;
  if (n < 2) return '';
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const w = Math.max(0.05, width(i / (n - 1), i)) / 2;
    L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return smooth([...L, ...R.reverse()], true);
}

// Classic engraver's swell: thin at both ends, thick in the middle.
export const swell = (max: number, min = 0.15) => (t: number) => min + (max - min) * Math.sin(Math.PI * t);

export function arc(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 40): P[] {
  const out: P[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function clamp(v: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, v));
}

// Add a tapered stroke to a group, tagged for the "printing" reveal.
export function stroke(g: Element, pts: P[], w: number | ((t: number, i: number) => number), cls = 'ink'): SVGPathElement {
  const fn = typeof w === 'number' ? swell(w) : w;
  return el('path', { d: taper(pts, fn), class: cls }, g);
}

// Shared defs: ink roughness filter, potion glow, paper grain.
export function inkDefs(svg: SVGSVGElement, id = 'ink') {
  const defs = el('defs', {}, svg);
  const flt = el('filter', { id: `${id}-rough`, x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, seed: 3, result: 'n' }, flt);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 1.6, xChannelSelector: 'R', yChannelSelector: 'G' }, flt);
  const glow = el('filter', { id: `${id}-glow`, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs);
  el('feGaussianBlur', { stdDeviation: 6, result: 'b' }, glow);
  const m = el('feMerge', {}, glow);
  el('feMergeNode', { in: 'b' }, m);
  el('feMergeNode', { in: 'SourceGraphic' }, m);
  return defs;
}
