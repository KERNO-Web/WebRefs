import { glyph, rune } from './art/runes';
import { TABLES, Table } from './data';
import { arc, el, inkDefs, P, rng, smooth, stroke, swell } from './ink';

// Floor plan engraved like a dungeon map. Tables are focusable buttons.
export function buildHall(onPick: (t: Table) => void) {
  const svg = document.querySelector<SVGSVGElement>('.plan')!;
  const card = document.querySelector<HTMLElement>('[data-table-card]')!;
  const defs = inkDefs(svg, 'plan');
  const hatch = el('pattern', { id: 'wall-hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
  el('rect', { width: 9, height: 9, class: 'paper-fill' }, hatch);
  el('rect', { width: 2.2, height: 9, class: 'ink' }, hatch);
  const floor = el('pattern', { id: 'floor-hatch', width: 40, height: 40, patternUnits: 'userSpaceOnUse' }, defs);
  el('path', { d: 'M0 0H40M0 20H40', stroke: 'rgba(30,24,18,.10)', 'stroke-width': 1 }, floor);
  el('path', { d: 'M0 0V20M20 20V40', stroke: 'rgba(30,24,18,.10)', 'stroke-width': 1 }, floor);

  // Walls: outer room with door gap bottom-right.
  const W = { x0: 40, y0: 60, x1: 960, y1: 610, t: 18 };
  el('rect', { x: W.x0, y: W.y0, width: W.x1 - W.x0, height: W.y1 - W.y0, fill: 'url(#floor-hatch)' }, svg);
  const walls = el('g', {}, svg);
  const wall = (x: number, y: number, w: number, h: number) => {
    el('rect', { x, y, width: w, height: h, fill: 'url(#wall-hatch)' }, walls);
    stroke(walls, [[x, y], [x + w, y]], () => 2.2);
    stroke(walls, [[x, y + h], [x + w, y + h]], () => 2.2);
    stroke(walls, [[x, y], [x, y + h]], () => 2.2);
    stroke(walls, [[x + w, y], [x + w, y + h]], () => 2.2);
  };
  // top wall with three windows
  const winXs = [180, 400, 620];
  let cursor = W.x0 - W.t;
  for (const wx of winXs) { wall(cursor, W.y0 - W.t, wx - cursor, W.t); cursor = wx + 90; }
  wall(cursor, W.y0 - W.t, W.x1 + W.t - cursor, W.t);
  for (const wx of winXs) {
    stroke(svg, [[wx, W.y0 - W.t / 2 - 3], [wx + 90, W.y0 - W.t / 2 - 3]], () => 1);
    stroke(svg, [[wx, W.y0 - W.t / 2 + 3], [wx + 90, W.y0 - W.t / 2 + 3]], () => 1);
  }
  wall(W.x0 - W.t, W.y0, W.t, W.y1 - W.y0 + W.t);
  wall(W.x1, W.y0, W.t, W.y1 - W.y0 + W.t);
  wall(W.x0, W.y1, 760, W.t);
  // door swing
  stroke(svg, arc(800, W.y1, 110, 110, -Math.PI / 2, 0, 30), swell(1.2, 0.3));
  stroke(svg, [[800, W.y1], [800, W.y1 - 110]], () => 2);
  label(svg, 'Вход', 880, 650, 22);

  // Bar counter (top right), curved, with stools.
  const counter: P[] = [];
  for (let i = 0; i <= 30; i++) { const t = i / 30; counter.push([600 + t * 340, 92 + Math.sin(t * Math.PI) * 26]); }
  const inner = counter.map(([x, y]): P => [x, y + 30]);
  el('path', { d: smooth([...counter, ...inner.slice().reverse()], true), fill: 'url(#wall-hatch)' }, svg);
  stroke(svg, counter, () => 2);
  stroke(svg, inner, () => 2.6);
  label(svg, 'Стойка', 870, 104, 20);
  // Shelves of bottles along the right wall.
  const r = rng(3);
  for (let y = 150; y < 380; y += 22) {
    const h = 10 + r() * 8;
    stroke(svg, arc(944 - h / 2, y, h / 2, 6, 0, Math.PI * 2, 14), () => 1);
  }

  // Stair to the cellar
  for (let i = 0; i < 7; i++) stroke(svg, [[430, 520 + i * 12], [570, 520 + i * 12]], () => 1.4);
  stroke(svg, [[430, 520], [430, 604]], () => 2); stroke(svg, [[570, 520], [570, 604]], () => 2);
  stroke(svg, [[500, 600], [500, 530], [490, 545], [500, 530], [510, 545]], () => 1.2);
  label(svg, 'Погреб', 500, 506, 20);

  // Compass rose
  compass(svg, 112, 150);

  // Tables
  for (const t of TABLES) drawTable(svg, t);

  const all = Array.from(svg.querySelectorAll<SVGGElement>('.tbl'));
  const show = (t: Table, picked = false) => {
    card.innerHTML = `<span class="tc-label">${t.label}</span><span class="tc-meta">до ${t.seats} гостей${picked ? ' · выбран' : ''}</span>${picked ? '<a class="btn btn-potion btn-sm" href="#booking">Дальше, к записке</a>' : ''}`;
  };
  const select = (id: string) => {
    const t = TABLES.find((x) => x.id === id)!;
    all.forEach((g) => g.classList.toggle('sel', g.dataset.id === id));
    all.forEach((g) => g.setAttribute('aria-pressed', String(g.dataset.id === id)));
    show(t, true);
    onPick(t);
  };
  all.forEach((g) => {
    const t = TABLES.find((x) => x.id === g.dataset.id)!;
    g.addEventListener('mouseenter', () => { if (!g.classList.contains('sel')) show(t); });
    g.addEventListener('click', () => select(t.id));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(t.id); } });
  });
  const wrap = svg.parentElement!;
  requestAnimationFrame(() => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) / 2; });
  return { select };
}

function label(svg: Element, text: string, x: number, y: number, size: number) {
  const t = el('text', { x, y, 'font-size': size, 'text-anchor': 'middle', class: 'plan-label' }, svg);
  t.textContent = text;
}

function chair(g: Element, x: number, y: number, a: number) {
  el('circle', { cx: x, cy: y, r: 11, class: 'paper-fill' }, g);
  stroke(g, arc(x, y, 11, 11, 0, Math.PI * 2, 24), (s) => 1 + 1.6 * Math.max(0, Math.sin(Math.PI * 2 * s + a)));
  stroke(g, arc(x, y, 6, 6, a - 1, a + 1, 8), swell(1.2));
}

function drawTable(svg: Element, t: Table) {
  const g = el('g', { class: 'tbl', 'data-id': t.id, tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': `${t.label}, до ${t.seats} гостей` }, svg);
  if (t.shape === 'round') {
    const R = t.seats > 2 ? 64 : 30;
    for (let i = 0; i < t.seats; i++) {
      const a = (i / t.seats) * Math.PI * 2 + (t.seats === 2 ? 0 : Math.PI / t.seats);
      chair(g, t.x + Math.cos(a) * (R + 16), t.y + Math.sin(a) * (R + 16), a);
    }
    el('circle', { cx: t.x, cy: t.y, r: R + 30, class: 'hit' }, g);
    el('circle', { cx: t.x, cy: t.y, r: R, class: 'top-fill' }, g);
    stroke(g, arc(t.x, t.y, R, R, 0, Math.PI * 2, 50), (s) => 1.4 + 1.6 * Math.max(0, Math.sin(Math.PI * 2 * s)));
    if (t.seats > 2) {
      // cauldron in the middle of the big table
      stroke(g, arc(t.x, t.y, 26, 26, 0, Math.PI * 2, 30), () => 2.4);
      for (let k = 0; k < 6; k++) stroke(g, arc(t.x, t.y, 6 + k * 3.4, 6 + k * 3.4, 0.4, 2.4, 10), swell(0.9));
      rune(g, t.rune, t.x, t.y - R + 18, 16);
    } else rune(g, t.rune, t.x, t.y, 22);
  } else if (t.shape === 'booth') {
    const w = 120, h = 56;
    el('rect', { x: t.x - w / 2 - 24, y: t.y - h / 2 - 20, width: w + 48, height: h + 40, class: 'hit' }, g);
    // U-bench
    stroke(g, [[t.x - w / 2 - 22, t.y - h / 2 - 16], [t.x - w / 2 - 22, t.y + h / 2 + 16]], () => 8);
    stroke(g, [[t.x - w / 2 - 22, t.y - h / 2 - 16], [t.x + w / 2, t.y - h / 2 - 16]], () => 8);
    stroke(g, [[t.x - w / 2 - 22, t.y + h / 2 + 16], [t.x + w / 2, t.y + h / 2 + 16]], () => 8);
    el('rect', { x: t.x - w / 2, y: t.y - h / 2, width: w, height: h, class: 'top-fill' }, g);
    rect(g, t.x - w / 2, t.y - h / 2, w, h);
    rune(g, t.rune, t.x + 8, t.y, 24);
  } else {
    const w = 250, h = 62;
    el('rect', { x: t.x - w / 2 - 20, y: t.y - h / 2 - 30, width: w + 40, height: h + 60, class: 'hit' }, g);
    for (let i = 0; i < 4; i++) {
      const x = t.x - w / 2 + 34 + i * ((w - 68) / 3);
      chair(g, x, t.y - h / 2 - 14, -Math.PI / 2);
      chair(g, x, t.y + h / 2 + 14, Math.PI / 2);
    }
    el('rect', { x: t.x - w / 2, y: t.y - h / 2, width: w, height: h, class: 'top-fill' }, g);
    rect(g, t.x - w / 2, t.y - h / 2, w, h);
    for (let x = t.x - w / 2 + 8; x < t.x + w / 2 - 6; x += 12) stroke(g, [[x, t.y + h / 2 - 2], [x + 6, t.y + h / 2 - 12]], swell(0.8));
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
  stroke(g, arc(cx, cy, 38, 38, 0, Math.PI * 2, 40), () => 1.2);
  stroke(g, arc(cx, cy, 30, 30, 0, Math.PI * 2, 40), () => 0.6);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 - Math.PI / 2;
    const tip: P = [cx + Math.cos(a) * 50, cy + Math.sin(a) * 50];
    const l: P = [cx + Math.cos(a + 0.5) * 9, cy + Math.sin(a + 0.5) * 9];
    const r: P = [cx + Math.cos(a - 0.5) * 9, cy + Math.sin(a - 0.5) * 9];
    el('path', { d: `M${cx} ${cy}L${l[0]} ${l[1]}L${tip[0]} ${tip[1]}Z`, class: 'ink' }, g);
    el('path', { d: `M${cx} ${cy}L${r[0]} ${r[1]}L${tip[0]} ${tip[1]}Z`, class: 'paper-fill', stroke: 'var(--ink)', 'stroke-width': 1 }, g);
  }
  glyph(g, 'sun', cx, cy, 10);
  const n = el('text', { x: cx, y: cy - 56, 'font-size': 18, 'text-anchor': 'middle', class: 'plan-label' }, g);
  n.textContent = 'С';
}
