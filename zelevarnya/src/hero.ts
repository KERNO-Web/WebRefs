import { onFrame, reduced, whenVisible } from './anim';
import { drawCauldron, paintFlames } from './art/cauldron';
import { runeRing } from './art/runes';
import { Tentacle, TentacleOpts } from './art/tentacle';
import { arc, el, inkDefs, P, rng, stroke, swell } from './ink';
import { stir } from './stir';

export function potionGradient(defs: Element, id: string, radial = false) {
  const gr = radial
    ? el('radialGradient', { id, cx: '45%', cy: '40%', r: '65%' }, defs)
    : el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: '0%', 'stop-color': '#c4f58f' }, gr);
  el('stop', { offset: '55%', 'stop-color': '#7bd63a' }, gr);
  el('stop', { offset: '100%', 'stop-color': '#3f8a1c' }, gr);
  return gr;
}

const CENTER: P = [500, 560];

export function buildHero() {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const svg = hero.querySelector<SVGSVGElement>('.hero-art')!;
  const defs = inkDefs(svg, 'hero');
  potionGradient(defs, 'pg-hero', true);

  // Title on an arc above the rune ring.
  const arcPath = el('path', { id: 'title-arc', d: `M ${CENTER[0] - 520} ${CENTER[1]} A 520 520 0 0 1 ${CENTER[0] + 520} ${CENTER[1]}`, fill: 'none' }, defs);
  void arcPath;

  const ringG = el('g', { class: 'ring-spin' }, svg);
  runeRing(ringG, CENTER[0], CENTER[1], 420, 40, 3);

  const title = el('text', { class: 'title', 'font-size': 132, 'text-anchor': 'middle' }, svg);
  const tp = el('textPath', { href: '#title-arc', startOffset: '50%' }, title);
  tp.textContent = 'Зельеварня';

  // little stars of the zodiac between title and ring
  const r = rng(2);
  const stars = el('g', { class: 'stars' }, svg);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (1.05 + r() * 0.9), d = 470 + r() * 30;
    star(stars, CENTER[0] + Math.cos(a) * d, CENTER[1] + Math.sin(a) * d, 3 + r() * 5);
  }

  const cg = el('g', { transform: 'translate(100 110)' }, svg);
  const c = drawCauldron(cg, 'pg-hero', 'hero-cauldron-clip');
  c.steam.classList.add('boil');
  c.bubbles.classList.add('boil');

  printIn(cg);

  // Steam: wisps redrawn each frame.
  const wisps = Array.from({ length: 6 }, () => el('path', { class: 'ink' }, c.steam) as SVGPathElement & { ph?: number });
  const bubbles = Array.from({ length: 7 }, () => {
    const b = el('g', {}, c.bubbles);
    const circle = el('circle', { r: 0, class: 'bubble' }, b);
    const glint = el('path', { class: 'ink' }, b);
    return { b, circle, glint, life: Math.floor(Math.random() * 14), x: 0, y: 0, max: 0 };
  });
  const br = rng(9);

  let spin = 0;
  onFrame((t, frame) => {
    spin += 0.08;
    paintFlames(c.flames, t, frame);
    ringG.setAttribute('transform', `rotate(${spin.toFixed(2)} ${CENTER[0]} ${CENTER[1]})`);
    wisps.forEach((w, i) => {
      const pts: P[] = [];
      const x0 = 300 + i * 40 + Math.sin(i * 2.1) * 20;
      const h = 190 + (i % 3) * 50;
      const ph = t * 0.9 + i * 1.7;
      for (let j = 0; j <= 26; j++) {
        const s = j / 26;
        pts.push([x0 + Math.sin(s * 5 + ph) * (8 + s * 26), 370 - s * h - ((frame + i * 3) % 6) * 2]);
      }
      w.setAttribute('d', stroke(c.steam, pts, swell(2.2, 0.1)).getAttribute('d')!);
      c.steam.lastElementChild!.remove();
    });
    bubbles.forEach((b) => {
      if (b.life <= 0) {
        const a = br() * Math.PI * 2, d = Math.sqrt(br());
        b.x = 400 + Math.cos(a) * d * 200; b.y = 384 + Math.sin(a) * d * 34; b.max = 6 + br() * 14; b.life = 8 + Math.floor(br() * 8);
      }
      b.life--;
      const k = Math.min(1, (16 - b.life) / 8);
      const rr = b.life <= 1 ? 0 : b.max * k;
      b.circle.setAttribute('cx', b.x.toFixed(1));
      b.circle.setAttribute('cy', (b.y - rr * 0.6).toFixed(1));
      b.circle.setAttribute('r', rr.toFixed(1));
      if (rr > 4) {
        const g = stroke(c.bubbles, arc(b.x - rr * 0.3, b.y - rr * 0.9, rr * 0.45, rr * 0.45, Math.PI * 1.1, Math.PI * 1.5, 6), swell(1.4));
        b.glint.setAttribute('d', g.getAttribute('d')!);
        g.remove();
      } else b.glint.setAttribute('d', '');
    });
  }, hero);

  // Tentacles creeping in from the page edges.
  const tsvg = hero.querySelector<SVGSVGElement>('.tentacles')!;
  let tentacles: Tentacle[] = [];
  const layout = () => {
    const W = hero.clientWidth, H = hero.clientHeight;
    tsvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    tentacles.forEach((t) => t.g.remove());
    const mob = W < 700;
    const specs: TentacleOpts[] = mob
      ? [
          { x: -18, y: H * 0.5, angle: -0.2, length: W * 0.44, width: 40, curl: 1, phase: 0 },
          { x: W + 18, y: H * 0.27, angle: Math.PI + 0.15, length: W * 0.42, width: 40, curl: -1, phase: 2 },
        ]
      : [
          { x: -30, y: H * 0.2, angle: -0.05, length: Math.min(560, W * 0.36), width: 92, curl: 1, phase: 0 },
          { x: W + 30, y: H * 0.5, angle: Math.PI + 0.12, length: Math.min(500, W * 0.32), width: 96, curl: -1, phase: 2.4 },
        ];
    tentacles = specs.map((o) => {
      const t = new Tentacle(tsvg, o);
      t.target = reduced ? 1 : 0;
      t.extend = reduced ? 1 : 0;
      t.update(0);
      return t;
    });
  };
  layout();
  addEventListener('resize', debounce(layout, 200));
  whenVisible(hero, () => tentacles.forEach((t, i) => setTimeout(() => (t.target = 1), 900 + i * 350)), () => tentacles.forEach((t) => (t.target = 0.15)));
  onFrame((t, frame) => tentacles.forEach((x) => x.step(t, frame)), hero);

  stir(svg, cg as SVGGElement, c, () => tentacles, hero);

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    tentacles.forEach((t) => {
      if (Math.hypot(t.o.x - x, t.o.y - y) < t.o.length * 1.1) t.twitch = 1;
    });
  });
}

function star(g: Element, x: number, y: number, s: number) {
  stroke(g, [[x - s, y], [x + s, y]], swell(s * 0.35));
  stroke(g, [[x, y - s * 1.4], [x, y + s * 1.4]], swell(s * 0.35));
}

// Engraving "prints" itself: strokes appear in random order, frame by frame.
function printIn(g: Element) {
  if (reduced) return;
  const parts = Array.from(g.querySelectorAll<SVGElement>('path, ellipse')).filter((p) => !p.closest('.bubbles, .steam'));
  const r = rng(4);
  const order = parts.map((p) => ({ p, k: r() * 0.7 + (Number(p.getBoundingClientRect().top) > 0 ? 0 : 0) }));
  order.forEach(({ p }) => (p.style.opacity = '0'));
  const frames = 16;
  for (let f = 0; f <= frames; f++) {
    setTimeout(() => order.forEach(({ p, k }) => { if (k <= f / frames + 0.02) p.style.opacity = ''; }), 200 + f * (1000 / 12));
  }
  setTimeout(() => order.forEach(({ p }) => (p.style.opacity = '')), 200 + (frames + 2) * (1000 / 12));
}

export function debounce<T extends (...a: never[]) => void>(fn: T, ms: number) {
  let id = 0;
  return (...a: Parameters<T>) => { clearTimeout(id); id = window.setTimeout(() => fn(...a), ms); };
}
