import { onFrame, reduced } from './anim';
import { burntHole } from './atmosphere';
import { paintFlames } from './art/cauldron';
import { glyph, rune, runeRing } from './art/runes';
import { TABLES, Table } from './data';
import { arc, el, inkDefs, P, rng, smooth, stroke, swell } from './ink';

// The hall as an old engraved dungeon map: flagstone floor, hatched walls,
// a fireplace that burns, library, alchemist's bench, a crypt room,
// cellar stairs with something living down there, and table XIII.
const W = { x0: 30, y0: 46, x1: 970, y1: 672, t: 18 };

export function buildHall(onPick: (t: Table) => void, onHint: (t: Table | null) => void) {
  const svg = document.querySelector<SVGSVGElement>('.plan')!;
  svg.setAttribute('viewBox', '0 0 1000 700');
  const defs = inkDefs(svg, 'plan');
  const hatch = el('pattern', { id: 'wall-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('rect', { width: 8, height: 8, class: 'paper-fill' }, hatch);
  el('rect', { width: 2.6, height: 8, class: 'ink' }, hatch);
  const dense = el('pattern', { id: 'dense-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-35)' }, defs);
  el('rect', { width: 2, height: 5, fill: 'rgba(30,24,18,.55)' }, dense);

  flagstones(svg);
  walls(svg);
  rooms(svg);

  // Rug of runes under the cauldron table
  const rug = el('g', { class: 'rug' }, svg);
  runeRing(rug, 500, 330, 128, 17, 5);

  for (const t of TABLES) drawTable(svg, t);

  // Cellar: something lives down there.
  const host = svg.parentElement as HTMLElement;
  burntHole(host, { position: 'absolute', left: `${(480 / 1000) * 100}%`, top: `${(612 / 700) * 100}%`, transform: 'translate(-50%,-50%)' }, 86, 9);

  const all = Array.from(svg.querySelectorAll<SVGGElement>('.tbl'));
  const select = (id: string) => {
    const t = TABLES.find((x) => x.id === id)!;
    if (t.cursed) { onHint(t); shake(svg.querySelector(`.tbl[data-id="${id}"]`)!); return; }
    all.forEach((g) => { g.classList.toggle('sel', g.dataset.id === id); g.setAttribute('aria-pressed', String(g.dataset.id === id)); });
    onPick(t);
  };
  all.forEach((g) => {
    const t = TABLES.find((x) => x.id === g.dataset.id)!;
    g.addEventListener('mouseenter', () => onHint(t));
    g.addEventListener('mouseleave', () => onHint(null));
    g.addEventListener('click', () => select(t.id));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(t.id); } });
  });
  const wrap = svg.parentElement!;
  requestAnimationFrame(() => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; });
  return { select };
}

function shake(g: Element) {
  g.classList.remove('shake');
  void (g as SVGGElement).getBBox();
  g.classList.add('shake');
}

function flagstones(svg: SVGSVGElement) {
  const g = el('g', { class: 'floor' }, svg);
  const r = rng(42);
  let d = '';
  for (let y = W.y0; y < W.y1; y += 46) {
    let x = W.x0 + (Math.floor((y - W.y0) / 46) % 2) * 30;
    while (x < W.x1) {
      const w = 50 + r() * 40;
      const j = () => (r() - 0.5) * 5;
      const pts: P[] = [[x + 3 + j(), y + 3 + j()], [Math.min(W.x1, x + w) - 3 + j(), y + 3 + j()], [Math.min(W.x1, x + w) - 3 + j(), y + 43 + j()], [x + 3 + j(), y + 43 + j()]];
      d += smooth(pts, true);
      x += w;
    }
  }
  el('path', { d, class: 'floor-stones' }, g);
}

function wall(svg: Element, x: number, y: number, w: number, h: number) {
  el('rect', { x, y, width: w, height: h, fill: 'url(#wall-hatch)' }, svg);
  stroke(svg, [[x, y], [x + w, y]], () => 2.4);
  stroke(svg, [[x, y + h], [x + w, y + h]], () => 2.4);
  stroke(svg, [[x, y], [x, y + h]], () => 2.4);
  stroke(svg, [[x + w, y], [x + w, y + h]], () => 2.4);
}

function walls(svg: SVGSVGElement) {
  const g = el('g', {}, svg);
  const winXs = [150, 260, 370];
  let cur = W.x0 - W.t;
  for (const wx of winXs) { wall(g, cur, W.y0 - W.t, wx - cur, W.t); cur = wx + 80; }
  wall(g, cur, W.y0 - W.t, W.x1 + W.t - cur, W.t);
  for (const wx of winXs) for (const k of [-3, 3]) stroke(g, [[wx, W.y0 - W.t / 2 + k], [wx + 80, W.y0 - W.t / 2 + k]], () => 1);
  wall(g, W.x0 - W.t, W.y0, W.t, W.y1 - W.y0 + W.t);
  wall(g, W.x1, W.y0, W.t, W.y1 - W.y0 + W.t);
  wall(g, W.x0, W.y1, 780, W.t);
  // entrance door
  stroke(g, arc(810, W.y1, 120, 120, -Math.PI / 2, 0, 30), swell(1.3, 0.3));
  stroke(g, [[810, W.y1], [810, W.y1 - 120]], () => 2.4);
  label(g, 'Вход', 890, 696, 26);
  // crypt walls (private room, bottom-left) with an arched doorway
  wall(g, W.x0, 512, 230, 14);
  wall(g, 300, 512, 14, 46);
  wall(g, 300, 616, 14, W.y1 - 616);
  stroke(g, arc(307, 587, 30, 30, -Math.PI / 2, Math.PI / 2, 16), swell(1.2, 0.3));
  label(g, 'Склеп', 120, 545, 24);
}

function rooms(svg: SVGSVGElement) {
  const g = el('g', {}, svg);
  const r = rng(8);
  // Bar counter with back shelf of bottles and barrels
  const counter: P[] = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30; counter.push([560 + t * 390, 96 + Math.sin(t * Math.PI) * 18]); }
  const inner = counter.map(([x, y]): P => [x, y + 26]);
  el('path', { d: smooth([...counter, ...inner.slice().reverse()], true), fill: 'url(#wall-hatch)' }, g);
  stroke(g, counter, () => 2);
  stroke(g, inner, () => 2.8);
  for (let x = 575; x < 940; x += 17) {
    const h = 8 + r() * 6;
    stroke(g, arc(x, 64, 5, h / 2, 0, Math.PI * 2, 12), () => 0.9);
  }
  label(g, 'Стойка', 640, 92, 24);
  for (const [bx, by] of [[930, 640], [905, 612], [935, 588]]) {
    el('circle', { cx: bx, cy: by, r: 16, class: 'paper-fill' }, g);
    for (const rr of [16, 11]) stroke(g, arc(bx, by, rr, rr, 0, Math.PI * 2, 24), () => (rr === 16 ? 1.8 : 0.8));
  }
  // Fireplace on the left wall, flames alive
  wall(g, W.x0, 170, 44, 120);
  el('rect', { x: W.x0 + 6, y: 190, width: 32, height: 80, fill: '#1a1009' }, g);
  const fire = el('g', { class: 'boil hearth', transform: `translate(${W.x0 + 22} 230) rotate(90) scale(0.12) translate(-400 -660)` }, g);
  paintFlames(fire, 0, 0);
  if (!reduced) onFrame((t, f) => paintFlames(fire, t, f));
  label(g, 'Камин', 120, 182, 22);
  // Library shelves along the left wall
  for (let y = 330; y < 490; y += 4) stroke(g, [[W.x0 + 2, y], [W.x0 + 26, y]], () => (r() > 0.7 ? 2.4 : 1.2));
  stroke(g, [[W.x0 + 28, 326], [W.x0 + 28, 494]], () => 2.2);
  label(g, 'Библиотека', 165, 474, 22);
  // Alchemist's bench at the bottom wall
  el('rect', { x: 600, y: 622, width: 170, height: 40, fill: 'url(#wall-hatch)' }, g);
  stroke(g, [[600, 622], [770, 622]], () => 2.2);
  for (let x = 618; x < 760; x += 26) {
    stroke(g, arc(x, 642, 8, 8, 0, Math.PI * 2, 16), () => 1.2);
    stroke(g, [[x, 634], [x, 626]], () => 1.4);
  }
  label(g, 'Перегонный куб', 690, 610, 22);
  // Cellar stairs
  for (let i = 0; i < 8; i++) stroke(g, [[420, 572 + i * 12], [540, 572 + i * 12]], () => 1.3);
  stroke(g, [[420, 568], [420, 672]], () => 2.2);
  stroke(g, [[540, 568], [540, 672]], () => 2.2);
  el('rect', { x: 421, y: 640, width: 118, height: 32, fill: 'url(#dense-hatch)' }, g);
  label(g, 'Погреб', 480, 558, 24);
  // Cobwebs in corners
  for (const [cx, cy, a0] of [[W.x0, W.y0, 0], [W.x1, W.y1, Math.PI]] as const) {
    for (let k = 0; k < 6; k++) { const a = a0 + (k / 5) * (Math.PI / 2); stroke(g, [[cx, cy], [cx + Math.cos(a) * 70, cy + Math.sin(a) * 70]], () => 0.6); }
    for (const rr of [18, 34, 52]) stroke(g, arc(cx, cy, rr, rr, a0 + 0.05, a0 + Math.PI / 2 - 0.05, 12).map(([x, y], i) => [x + Math.sin(i * 2) * 1.6, y] as P), () => 0.6);
  }
  // Compass rose
  compass(g, 640, 250);
  // dotted path from the door to the cauldron
  const path: P[] = [];
  for (let i = 0; i <= 60; i++) { const t = i / 60; path.push([800 - t * 260 + Math.sin(t * 6) * 18, 640 - t * 230]); }
  for (let i = 0; i < path.length - 1; i += 3) stroke(g, [path[i], path[i + 1]], () => 1.4);
}

function label(svg: Element, text: string, x: number, y: number, size: number) {
  const t = el('text', { x, y, 'font-size': size, 'text-anchor': 'middle', class: 'plan-hand' }, svg);
  t.textContent = text;
}

function chair(g: Element, x: number, y: number, a: number) {
  el('circle', { cx: x, cy: y, r: 11, class: 'paper-fill' }, g);
  stroke(g, arc(x, y, 11, 11, 0, Math.PI * 2, 24), (s) => 1 + 1.6 * Math.max(0, Math.sin(Math.PI * 2 * s + a)));
}

function drawTable(svg: Element, t: Table) {
  const g = el('g', {
    class: `tbl${t.cursed ? ' cursed' : ''}`, 'data-id': t.id, tabindex: 0, role: 'button', 'aria-pressed': 'false',
    'aria-label': t.cursed ? 'Стол XIII, не бронируется' : `${t.label}, до ${t.seats} гостей`,
  }, svg);
  if (t.shape === 'round') {
    const R = t.seats >= 8 ? 66 : t.seats >= 4 ? 40 : 26;
    for (let i = 0; i < t.seats; i++) {
      const a = (i / t.seats) * Math.PI * 2 + (t.seats === 2 ? 0 : Math.PI / t.seats);
      chair(g, t.x + Math.cos(a) * (R + 16), t.y + Math.sin(a) * (R + 16), a);
    }
    el('circle', { cx: t.x, cy: t.y, r: R + 30, class: 'hit' }, g);
    el('circle', { cx: t.x, cy: t.y, r: R, class: 'top-fill' }, g);
    stroke(g, arc(t.x, t.y, R, R, 0, Math.PI * 2, 50), (s) => 1.4 + 1.6 * Math.max(0, Math.sin(Math.PI * 2 * s)));
    if (t.seats >= 8) {
      stroke(g, arc(t.x, t.y, 26, 26, 0, Math.PI * 2, 30), () => 2.4);
      for (let k = 0; k < 6; k++) stroke(g, arc(t.x, t.y, 6 + k * 3.4, 6 + k * 3.4, 0.4, 2.4, 10), swell(0.9));
      rune(g, t.rune, t.x, t.y - R + 18, 16);
    } else rune(g, t.rune, t.x, t.y, R > 30 ? 26 : 20);
    if (t.cursed) {
      stroke(g, [[t.x - R - 8, t.y - R - 8], [t.x + R + 8, t.y + R + 8]], swell(3.4, 0.8));
      stroke(g, [[t.x + R + 8, t.y - R - 8], [t.x - R - 8, t.y + R + 8]], swell(3.4, 0.8));
      const l = el('text', { x: t.x, y: t.y + R + 42, 'font-size': 22, 'text-anchor': 'middle', class: 'plan-hand' }, g);
      l.textContent = 'XIII';
    }
  } else if (t.shape === 'booth') {
    const w = 100, h = 52;
    el('rect', { x: t.x - w / 2 - 24, y: t.y - h / 2 - 22, width: w + 48, height: h + 44, class: 'hit' }, g);
    for (const pts of [[[t.x + w / 2 + 18, t.y - h / 2 - 16], [t.x + w / 2 + 18, t.y + h / 2 + 16]], [[t.x - w / 2, t.y - h / 2 - 16], [t.x + w / 2 + 18, t.y - h / 2 - 16]], [[t.x - w / 2, t.y + h / 2 + 16], [t.x + w / 2 + 18, t.y + h / 2 + 16]]] as P[][]) {
      el('path', { d: `M${pts[0][0]} ${pts[0][1]}L${pts[1][0]} ${pts[1][1]}`, class: 'bench' }, g);
      stroke(g, pts, () => 1.4);
    }
    el('rect', { x: t.x - w / 2, y: t.y - h / 2, width: w, height: h, class: 'top-fill' }, g);
    rect(g, t.x - w / 2, t.y - h / 2, w, h);
    rune(g, t.rune, t.x - 4, t.y, 24);
  } else if (t.shape === 'bar') {
    el('rect', { x: t.x - 110, y: t.y - 26, width: 220, height: 52, class: 'hit' }, g);
    for (let i = 0; i < 4; i++) {
      const x = t.x - 75 + i * 50;
      el('circle', { cx: x, cy: t.y, r: 14, class: 'top-fill' }, g);
      stroke(g, arc(x, t.y, 14, 14, 0, Math.PI * 2, 24), () => 1.8);
      stroke(g, arc(x, t.y, 6, 6, 0, Math.PI * 2, 16), () => 0.8);
    }
    rune(g, t.rune, t.x + 120, t.y, 18);
  } else {
    const w = 210, h = 54;
    el('rect', { x: t.x - w / 2 - 20, y: t.y - h / 2 - 30, width: w + 40, height: h + 60, class: 'hit' }, g);
    for (let i = 0; i < 5; i++) {
      const x = t.x - w / 2 + 25 + i * ((w - 50) / 4);
      chair(g, x, t.y - h / 2 - 14, -Math.PI / 2);
      chair(g, x, t.y + h / 2 + 14, Math.PI / 2);
    }
    el('rect', { x: t.x - w / 2, y: t.y - h / 2, width: w, height: h, class: 'top-fill' }, g);
    rect(g, t.x - w / 2, t.y - h / 2, w, h);
    for (const dx of [-70, 70]) { stroke(g, [[t.x + dx, t.y - 10], [t.x + dx, t.y + 6]], () => 2); el('circle', { cx: t.x + dx, cy: t.y - 13, r: 3.5, class: 'potion' , fill: '#9be35c' }, g); }
    rune(g, t.rune, t.x, t.y, 24);
  }
}

function rect(g: Element, x: number, y: number, w: number, h: number) {
  stroke(g, [[x, y], [x + w, y]], () => 1.6);
  stroke(g, [[x + w, y], [x + w, y + h]], () => 2.8);
  stroke(g, [[x + w, y + h], [x, y + h]], () => 2.8);
  stroke(g, [[x, y + h], [x, y]], () => 1.6);
}

function compass(svg: Element, cx: number, cy: number) {
  const g = el('g', {}, svg);
  stroke(g, arc(cx, cy, 34, 34, 0, Math.PI * 2, 40), () => 1.2);
  stroke(g, arc(cx, cy, 27, 27, 0, Math.PI * 2, 40), () => 0.6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    const tip: P = [cx + Math.cos(a) * 46, cy + Math.sin(a) * 46];
    const l: P = [cx + Math.cos(a + 0.5) * 8, cy + Math.sin(a + 0.5) * 8];
    const r: P = [cx + Math.cos(a - 0.5) * 8, cy + Math.sin(a - 0.5) * 8];
    el('path', { d: `M${cx} ${cy}L${l[0]} ${l[1]}L${tip[0]} ${tip[1]}Z`, class: 'ink' }, g);
    el('path', { d: `M${cx} ${cy}L${r[0]} ${r[1]}L${tip[0]} ${tip[1]}Z`, class: 'paper-fill', stroke: 'var(--ink)', 'stroke-width': 1 }, g);
  }
  glyph(g, 'sun', cx, cy, 9);
  const n = el('text', { x: cx, y: cy - 52, 'font-size': 20, 'text-anchor': 'middle', class: 'plan-hand' }, g);
  n.textContent = 'С';
}
