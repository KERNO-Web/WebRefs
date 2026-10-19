import { arc, el, P, stroke, swell } from '../ink';

// Elder Futhark, drawn stroke by stroke in a 0.7 × 1 box.
const RUNES: Record<string, P[][]> = {
  fehu: [[[0, 0], [0, 1]], [[0, 0.28], [0.5, 0.02]], [[0, 0.55], [0.5, 0.28]]],
  uruz: [[[0, 0], [0, 1]], [[0, 0], [0.5, 0.32], [0.5, 1]]],
  thurisaz: [[[0, 0], [0, 1]], [[0, 0.25], [0.45, 0.5], [0, 0.75]]],
  ansuz: [[[0, 0], [0, 1]], [[0, 0], [0.5, 0.25]], [[0, 0.3], [0.5, 0.55]]],
  raido: [[[0, 0], [0, 1]], [[0, 0], [0.45, 0.22], [0, 0.45], [0.5, 1]]],
  kenaz: [[[0.5, 0.12], [0.02, 0.45], [0.5, 0.78]]],
  gebo: [[[0, 0.05], [0.6, 0.95]], [[0.6, 0.05], [0, 0.95]]],
  wunjo: [[[0, 0], [0, 1]], [[0, 0], [0.45, 0.2], [0, 0.42]]],
  hagalaz: [[[0, 0], [0, 1]], [[0.5, 0], [0.5, 1]], [[0, 0.35], [0.5, 0.62]]],
  naudiz: [[[0.28, 0], [0.28, 1]], [[0, 0.35], [0.56, 0.6]]],
  isa: [[[0.25, 0], [0.25, 1]]],
  jera: [[[0.32, 0.05], [0.02, 0.3], [0.32, 0.55]], [[0.28, 0.45], [0.58, 0.7], [0.28, 0.95]]],
  eihwaz: [[[0.25, 0], [0.25, 1]], [[0.25, 0], [0.52, 0.18]], [[0.25, 1], [-0.02, 0.82]]],
  perth: [[[0, 0], [0, 1]], [[0, 0], [0.42, 0.22], [0.42, 0.34]], [[0, 1], [0.42, 0.78], [0.42, 0.66]]],
  algiz: [[[0.3, 0], [0.3, 1]], [[0.3, 0.42], [0, 0.05]], [[0.3, 0.42], [0.6, 0.05]]],
  sowilo: [[[0.48, 0], [0.06, 0.36], [0.5, 0.64], [0.1, 1]]],
  tiwaz: [[[0.3, 0], [0.3, 1]], [[0, 0.32], [0.3, 0], [0.6, 0.32]]],
  berkanan: [[[0, 0], [0, 1]], [[0, 0], [0.45, 0.25], [0, 0.5], [0.45, 0.75], [0, 1]]],
  ehwaz: [[[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0], [0.3, 0.35], [0.6, 0]]],
  mannaz: [[[0, 0], [0, 1]], [[0.6, 0], [0.6, 1]], [[0, 0], [0.6, 0.45]], [[0.6, 0], [0, 0.45]]],
  laguz: [[[0, 0], [0, 1]], [[0, 0], [0.45, 0.3]]],
  ingwaz: [[[0.3, 0.05], [0.6, 0.5], [0.3, 0.95], [0, 0.5], [0.3, 0.05]]],
  dagaz: [[[0, 0], [0, 1]], [[0.7, 0], [0.7, 1]], [[0, 0], [0.7, 1]], [[0.7, 0], [0, 1]]],
  othala: [[[0.3, 0], [0.6, 0.32], [0, 0.82]], [[0.3, 0], [0, 0.32], [0.6, 0.82]]],
};

export const RUNE_NAMES = Object.keys(RUNES);

export function rune(parent: Element, name: string, x: number, y: number, size: number, rot = 0, cls = 'ink') {
  const g = el('g', { transform: `translate(${x} ${y}) rotate(${rot}) translate(${-size * 0.3} ${-size / 2})`, class: 'rune' }, parent);
  for (const seg of RUNES[name] ?? RUNES.isa) {
    const pts = densify(seg.map(([a, b]) => [a * size, b * size] as P), 6);
    stroke(g, pts, swell(size * 0.11, size * 0.03), cls);
  }
  return g;
}

function densify(pts: P[], per: number): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < per; k++) {
      const t = k / per;
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// Alchemical glyphs (ingredients, numerals of the ritual), unit size s.
type Glyph = (g: Element, s: number, w: number, cls: string) => void;
const ring = (g: Element, cx: number, cy: number, r: number, w: number, cls: string) =>
  stroke(g, arc(cx, cy, r, r, 0, Math.PI * 2, 48), () => w, cls);
const line = (g: Element, a: P, b: P, w: number, cls: string) => stroke(g, densify([a, b], 4), swell(w, w * 0.4), cls);

export const GLYPHS: Record<string, Glyph> = {
  sun: (g, s, w, c) => { ring(g, 0, 0, s * 0.42, w, c); el('circle', { cx: 0, cy: 0, r: s * 0.07, class: c }, g); },
  moon: (g, s, w, c) => {
    const o = arc(0, 0, s * 0.42, s * 0.42, Math.PI * 0.35, Math.PI * 1.65, 30);
    const i = arc(s * 0.16, 0, s * 0.32, s * 0.36, Math.PI * 1.55, Math.PI * 0.45, 30);
    stroke(g, [...o, ...i], () => w * 0.9, c);
  },
  mercury: (g, s, w, c) => {
    ring(g, 0, -s * 0.05, s * 0.2, w, c);
    stroke(g, arc(0, -s * 0.38, s * 0.2, s * 0.14, Math.PI * 0.05, Math.PI * 0.95, 16), swell(w), c);
    line(g, [0, s * 0.15], [0, s * 0.5], w, c);
    line(g, [-s * 0.15, s * 0.33], [s * 0.15, s * 0.33], w, c);
  },
  sulfur: (g, s, w, c) => {
    line(g, [-s * 0.3, s * 0.02], [s * 0.3, s * 0.02], w, c);
    line(g, [-s * 0.3, s * 0.02], [0, -s * 0.45], w, c);
    line(g, [s * 0.3, s * 0.02], [0, -s * 0.45], w, c);
    line(g, [0, s * 0.02], [0, s * 0.5], w, c);
    line(g, [-s * 0.18, s * 0.28], [s * 0.18, s * 0.28], w, c);
  },
  salt: (g, s, w, c) => { ring(g, 0, 0, s * 0.4, w, c); line(g, [-s * 0.4, 0], [s * 0.4, 0], w, c); },
  fire: (g, s, w, c) => { tri(g, s, w, c, false); },
  water: (g, s, w, c) => { tri(g, s, w, c, true); },
  air: (g, s, w, c) => { tri(g, s, w, c, false); line(g, [-s * 0.32, s * 0.02], [s * 0.32, s * 0.02], w, c); },
  earth: (g, s, w, c) => { tri(g, s, w, c, true); line(g, [-s * 0.32, -s * 0.02], [s * 0.32, -s * 0.02], w, c); },
  copper: (g, s, w, c) => { ring(g, 0, -s * 0.15, s * 0.26, w, c); line(g, [0, s * 0.11], [0, s * 0.5], w, c); line(g, [-s * 0.16, s * 0.32], [s * 0.16, s * 0.32], w, c); },
  iron: (g, s, w, c) => { ring(g, -s * 0.08, s * 0.08, s * 0.28, w, c); line(g, [s * 0.12, -s * 0.12], [s * 0.42, -s * 0.42], w, c); line(g, [s * 0.2, -s * 0.42], [s * 0.42, -s * 0.42], w, c); line(g, [s * 0.42, -s * 0.2], [s * 0.42, -s * 0.42], w, c); },
  antimony: (g, s, w, c) => { ring(g, 0, s * 0.12, s * 0.28, w, c); line(g, [0, -s * 0.16], [0, -s * 0.5], w, c); line(g, [-s * 0.15, -s * 0.34], [s * 0.15, -s * 0.34], w, c); },
};

function tri(g: Element, s: number, w: number, c: string, down: boolean) {
  const k = down ? -1 : 1;
  const a: P = [-s * 0.36, s * 0.3 * k], b: P = [s * 0.36, s * 0.3 * k], t: P = [0, -s * 0.42 * k];
  line(g, a, b, w, c); line(g, b, t, w, c); line(g, t, a, w, c);
}

export function glyph(parent: Element, name: string, x: number, y: number, s: number, cls = 'ink') {
  const g = el('g', { transform: `translate(${x} ${y})`, class: 'glyph' }, parent);
  GLYPHS[name](g, s, Math.max(1.2, s * 0.07), cls);
  return g;
}

// A circle of runes between two ruled rings.
export function runeRing(parent: Element, cx: number, cy: number, r: number, size: number, seedOffset = 0) {
  const g = el('g', { class: 'rune-ring' }, parent);
  ring(g, cx, cy, r + size * 0.85, 2.2, 'ink');
  ring(g, cx, cy, r + size * 0.7, 0.8, 'ink');
  ring(g, cx, cy, r - size * 0.7, 0.8, 'ink');
  ring(g, cx, cy, r - size * 0.85, 2.2, 'ink');
  const count = Math.round((Math.PI * 2 * r) / (size * 1.25));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2;
    const name = RUNE_NAMES[(i * 7 + seedOffset) % RUNE_NAMES.length];
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i % 6 === 3) {
      const keys = Object.keys(GLYPHS);
      const gl = glyph(g, keys[(i + seedOffset) % keys.length], x, y, size * 0.95);
      gl.setAttribute('transform', `translate(${x} ${y}) rotate(${(a * 180) / Math.PI + 90})`);
    } else {
      rune(g, name, x, y, size * 0.8, (a * 180) / Math.PI + 90);
    }
  }
  return g;
}
