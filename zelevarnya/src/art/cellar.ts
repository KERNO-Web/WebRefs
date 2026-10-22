import { glyph, rune, RUNE_NAMES } from './runes';
import { arc, el, P, poly, rng, stroke, swell } from '../ink';

// The way down to the bar: a stone arch with carved runes, two plank doors,
// a short vaulted stairway and the lit door of the bar at the bottom. All in the hero art's user space
// (viewBox 0 -60 1000 1080).

export const ARCH = { x: 500, spring: 430, ri: 230, ro: 312, floor: 1020 };
/** the doorway runs on below the art's edge, so a tall phone screen never sees parchment under the stairs */
const BOT = 1700;
/** vanishing point of the vault, at eye level */
export const VP: P = [500, 540];
/** how deep the end wall stands: the corridor is short, the bar's door large */
const END = 0.5;
/** the bar's door in the end wall: centre of the doorway, half width, height */
export const DOOR = { x: 500, bottom: 855, hw: 96, h: 262 }; // bottom = floorAt(END)

const depth = (p: P, s: number): P => [VP[0] + (p[0] - VP[0]) * s, VP[1] + (p[1] - VP[1]) * s];
/** floor under a receding arch: lower the further down the stairs */
const floorAt = (s: number) => VP[1] + (ARCH.floor - VP[1]) * s + 150 * (1 - s);

function archOutline(r: number, floor: number): P[] {
  const { x, spring } = ARCH;
  return [[x - r, floor], ...arc(x, spring, r, r, Math.PI, Math.PI * 2, 36), [x + r, floor]];
}

// plank colour from lit parchment-oak to the shadow of the stairwell
const shade = (k: number) => {
  const a = [196, 173, 130], b = [58, 42, 26];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k * 0.85)).join(',')})`;
};

export interface Cellar {
  /** two door leaves, redrawn by open() */
  open: (theta: number) => void;
  /** 0..1, light from the bar */
  light: (k: number) => void;
  /** carved runes in the arch, lit one by one */
  runes: SVGGElement[];
}

export function drawCellar(svg: SVGSVGElement, defs: Element): Cellar {
  const { x: AX, spring: SY, ri: RI, ro: RO, floor: FL } = ARCH;
  const r = rng(21);

  // --- gradients and clips
  const dark = el('radialGradient', { id: 'cellar-dark', gradientUnits: 'userSpaceOnUse', cx: DOOR.x, cy: DOOR.bottom - DOOR.h / 2, r: 520 }, defs);
  [[0, '#f3c46e', 0.55], [0.16, '#7a5228', 0.78], [0.5, '#1e1812', 0.94], [1, '#120e0a', 0.98]].forEach(([o, c, a]) =>
    el('stop', { offset: String(o), 'stop-color': String(c), 'stop-opacity': String(a) }, dark));
  const warm = el('radialGradient', { id: 'cellar-warm' }, defs);
  el('stop', { offset: '0%', 'stop-color': '#ffd98a', 'stop-opacity': 0.9 }, warm);
  el('stop', { offset: '100%', 'stop-color': '#ffb04a', 'stop-opacity': 0 }, warm);
  const inner = poly(archOutline(RI, BOT), true);
  el('path', { d: inner }, el('clipPath', { id: 'cellar-clip' }, defs));
  const doorPts: P[] = [[DOOR.x - DOOR.hw, DOOR.bottom], ...arc(DOOR.x, DOOR.bottom - DOOR.h + DOOR.hw, DOOR.hw, DOOR.hw, Math.PI, Math.PI * 2, 24), [DOOR.x + DOOR.hw, DOOR.bottom]];
  el('path', { d: poly(doorPts, true) }, el('clipPath', { id: 'door-clip' }, defs));

  const root = el('g', { class: 'cellar' }, svg);
  const tunnel = el('g', { 'clip-path': 'url(#cellar-clip)' }, root);
  el('path', { d: inner, fill: '#140f0b' }, tunnel);
  el('path', { d: inner, fill: 'url(#cellar-dark)' }, tunnel);

  // --- the vault: receding arches and the lines of the walls running to the door
  const lines = el('g', { class: 'cellar-ink' }, tunnel);
  const S = [0.83, 0.68, 0.57];
  S.forEach((s, k) => stroke(lines, archOutline(RI, FL).slice(1, -1).map((p) => depth(p, s)).concat(), swell(2.6 - k * 0.35, 0.3)));
  for (const side of [-1, 1]) {
    for (let y = SY + 10; y < FL; y += 34) {
      const a: P = [AX + side * RI, y], b = depth(a, END);
      b[1] = Math.min(b[1], floorAt(END));
      stroke(lines, [a, b], swell(0.9, 0.1));
    }
    // jambs of the receding arches down to their stair
    S.forEach((s) => {
      const top = depth([AX + side * RI, SY], s);
      stroke(lines, [top, [top[0], floorAt(s)]], swell(1.6, 0.4));
    });
  }
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const p: P = [AX + Math.cos(a) * RI, SY + Math.sin(a) * RI];
    stroke(lines, [p, depth(p, END)], swell(0.8, 0.1));
  }

  // --- the stairs: treads closing in towards the door
  const stairs = el('g', { class: 'cellar-steps' }, tunnel);
  for (let i = -8; i < 16; i++) {
    const s = Math.pow(0.9, i) * 1.02;
    if (s < END) break;
    const y = floorAt(s), hw = RI * s;
    stroke(stairs, [[AX - hw, y], [AX + hw, y]], swell(2.4 * s + 0.6, 0.4));
    // the riser's shadow under each nosing
    if (i % 1 === 0) stroke(stairs, [[AX - hw * 0.96, y + 7 * s], [AX + hw * 0.96, y + 7 * s]], swell(0.8 * s + 0.2, 0.1), 'cellar-shade');
  }

  // --- the end wall: dressed stone, lit by the open door
  const wallPts = archOutline(RI, FL).map((p) => depth(p, END));
  wallPts[0][1] = wallPts[wallPts.length - 1][1] = floorAt(END);
  const wall = el('g', { class: 'cellar-wall' }, tunnel);
  el('path', { d: poly(wallPts, true), class: 'end-wall' }, wall);
  stroke(wall, wallPts, swell(2.2, 0.6), 'cellar-ink');
  for (let y = DOOR.bottom - 44, row = 0; y > wallPts[18][1] + 10; y -= 44, row++) {
    stroke(wall, [[AX - RI * END, y], [AX + RI * END, y]], swell(0.9, 0.2), 'cellar-ink');
    for (let x = AX - RI * END + (row % 2 ? 40 : 0); x < AX + RI * END; x += 80) stroke(wall, [[x, y], [x, y + 44]], swell(0.8, 0.2), 'cellar-ink');
  }

  // --- light from the bar
  const lightG = el('g', { class: 'cellar-light' }, tunnel);
  el('ellipse', { cx: DOOR.x, cy: DOOR.bottom - DOOR.h * 0.45, rx: 300, ry: 260, fill: 'url(#cellar-warm)' }, lightG);

  // --- the bar's door: the real photo seen through it
  const door = el('g', { class: 'cellar-door' }, tunnel);
  el('image', { href: 'photos/bar.jpg', x: DOOR.x - DOOR.hw * 2.2, y: DOOR.bottom - DOOR.h - 10, width: DOOR.hw * 4.4, height: DOOR.h + 20, preserveAspectRatio: 'xMidYMid slice', 'clip-path': 'url(#door-clip)' }, door);
  stroke(door, doorPts, () => 2.4);
  stroke(door, [[DOOR.x - DOOR.hw - 12, DOOR.bottom], ...arc(DOOR.x, DOOR.bottom - DOOR.h + DOOR.hw, DOOR.hw + 12, DOOR.hw + 12, Math.PI, Math.PI * 2, 24), [DOOR.x + DOOR.hw + 12, DOOR.bottom]], () => 1.2, 'cellar-ink');

  // --- the doors: plank leaves hinged on the jambs
  const leaves = el('g', { class: 'leaves' }, tunnel);
  const leafPaths = [0, 1].map(() => ({ fill: el('path', { class: 'leaf-wood' }, leaves), ink: el('path', { class: 'ink' }, leaves) }));
  const closedLeaf: P[] = archOutline(RI, BOT);
  const mapLeaf = (side: number, theta: number) => (p: P): P => {
    // u: 0 at the hinge, 1 at the meeting edge
    const u = side < 0 ? (p[0] - (AX - RI)) / RI : ((AX + RI) - p[0]) / RI;
    const x = side < 0 ? AX - RI + u * RI * Math.cos(theta) : AX + RI - u * RI * Math.cos(theta);
    const d = 1 - 0.42 * u * Math.sin(theta);
    return [VP[0] + (x - VP[0]) * d, VP[1] + (p[1] - VP[1]) * d];
  };
  const halfLeaf = (side: number): P[] => {
    const pts = closedLeaf.filter((p) => (side < 0 ? p[0] <= AX : p[0] >= AX));
    return side < 0 ? [...pts, [AX, pts[pts.length - 1][1]], [AX, BOT]] : [[AX, BOT], [AX, pts[0][1]], ...pts];
  };
  const leafShapes = [halfLeaf(-1), halfLeaf(1)];
  const open = (theta: number) => {
    [-1, 1].forEach((side, i) => {
      const m = mapLeaf(side, theta);
      const outline = leafShapes[i].map(m);
      leafPaths[i].fill.setAttribute('d', poly(outline, true));
      leafPaths[i].fill.style.fill = shade(Math.sin(theta));
      let d = stroke(leaves, outline.concat([outline[0]]), () => 2.2).getAttribute('d')!;
      leaves.lastElementChild!.remove();
      // planks, two iron straps, the ring
      const topAt = (x: number) => SY - Math.sqrt(Math.max(0, RI * RI - (x - AX) ** 2));
      for (let k = 1; k < 5; k++) {
        const x = side < 0 ? AX - RI + (k / 5) * RI : AX + RI - (k / 5) * RI;
        d += stroke(leaves, ([[x, topAt(x) + 4], [x, BOT]] as P[]).map(m), swell(1.1, 0.4)).getAttribute('d')!;
        leaves.lastElementChild!.remove();
      }
      for (const y of [620, 900]) {
        const a: P = [side < 0 ? AX - RI : AX + RI, y], b: P = [AX, y];
        d += stroke(leaves, [a, b].map(m), swell(4, 2.6)).getAttribute('d')!;
        leaves.lastElementChild!.remove();
      }
      const c = m([AX + side * -26, 780]);
      const s = 1 - 0.42 * Math.sin(theta);
      d += stroke(leaves, arc(c[0], c[1] + 10 * s, 13 * s * Math.max(0.25, Math.cos(theta)), 13 * s, 0, Math.PI * 2, 18), () => 1.8).getAttribute('d')!;
      leaves.lastElementChild!.remove();
      leafPaths[i].ink.setAttribute('d', d);
    });
  };

  // --- the arch: jamb blocks and voussoirs, a rune cut in every stone
  const stone = el('g', { class: 'arch' }, root);
  const voussoir = (a0: number, a1: number) => {
    const pts: P[] = [...arc(AX, SY, RO, RO, a0, a1, 8), ...arc(AX, SY, RI, RI, a1, a0, 8)];
    el('path', { d: poly(pts, true), class: 'paper-fill' }, stone);
    stroke(stone, pts.concat([pts[0]]), () => 1.8);
    for (let k = 0; k < 4; k++) {
      const a = a0 + (a1 - a0) * (0.2 + r() * 0.6), rr = RI + 8 + r() * (RO - RI - 16);
      stroke(stone, [[AX + Math.cos(a) * rr, SY + Math.sin(a) * rr], [AX + Math.cos(a) * (rr + 9), SY + Math.sin(a) * (rr + 9)]], swell(0.8, 0.1));
    }
  };
  const N = 13;
  const runes: SVGGElement[] = [];
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + (i / N) * Math.PI, a1 = Math.PI + ((i + 1) / N) * Math.PI;
    voussoir(a0, a1);
    const am = (a0 + a1) / 2, x = AX + Math.cos(am) * (RI + RO) / 2, y = SY + Math.sin(am) * (RI + RO) / 2;
    const g = i === (N - 1) / 2 ? glyph(stone, 'mercury', x, y, 40) : rune(stone, RUNE_NAMES[(i * 5) % RUNE_NAMES.length], x, y, 32, (am * 180) / Math.PI + 90);
    runes.push(g as SVGGElement);
  }
  for (const side of [-1, 1]) {
    let y = SY;
    let row = 0;
    while (y < BOT) {
      const h = 62 + r() * 18, x0 = AX + side * RI, w = (RO - RI) + (row % 2 ? 14 : -6);
      const pts: P[] = [[x0, y], [x0 + side * w, y], [x0 + side * w, Math.min(BOT, y + h)], [x0, Math.min(BOT, y + h)]];
      el('path', { d: poly(pts, true), class: 'paper-fill' }, stone);
      stroke(stone, pts.concat([pts[0]]), () => 1.6);
      for (let k = 0; k < 3; k++) {
        const hx = x0 + side * (8 + r() * (w - 20)), hy = y + 10 + r() * (h - 20);
        stroke(stone, [[hx, hy], [hx + side * 10, hy + 6]], swell(0.8, 0.1));
      }
      y += h; row++;
    }
  }
  // the springing line, one heavy stroke across each jamb's top
  for (const side of [-1, 1]) stroke(stone, [[AX + side * RI, SY], [AX + side * (RO + 8), SY]], () => 2.6);

  const light = (k: number) => lightG.setAttribute('opacity', (0.35 + k * 0.65).toFixed(2));
  open(0.85);
  light(0);
  return { open, light, runes };
}
