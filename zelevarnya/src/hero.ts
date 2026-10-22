import { onFrame, reduced, whenVisible } from './anim';
import { drawCellar } from './art/cellar';
import { Tentacle, TentacleOpts } from './art/tentacle';
import { el, inkDefs, P, rng, stroke, swell } from './ink';

const CENTER: P = [500, 560];

export function buildHero() {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const svg = hero.querySelector<SVGSVGElement>('.hero-art')!;
  const defs = inkDefs(svg, 'hero');

  // Title on an arc above the arch.
  const arcPath = el('path', { id: 'title-arc', d: `M ${CENTER[0] - 520} ${CENTER[1]} A 520 520 0 0 1 ${CENTER[0] + 520} ${CENTER[1]}`, fill: 'none' }, defs);
  void arcPath;


  const title = el('text', { class: 'title', 'font-size': 132, 'text-anchor': 'middle' }, svg);
  const tp = el('textPath', { href: '#title-arc', startOffset: '50%' }, title);
  tp.textContent = 'Зельеварня';

  // little stars of the zodiac between title and arch
  const r = rng(2);
  const stars = el('g', { class: 'stars' }, svg);
  for (let i = 0; i < 26; i++) {
    const a = Math.PI * (1.05 + r() * 0.9), d = 470 + r() * 30;
    star(stars, CENTER[0] + Math.cos(a) * d, CENTER[1] + Math.sin(a) * d, 3 + r() * 5);
  }

  // the way down: an arch with carved runes, plank doors and the stairs to the bar
  const cellar = drawCellar(svg, defs);
  // one rune of the arch glows at a time, walking round the vault
  onFrame((_t, frame) => {
    if (frame % 3 === 0) cellar.runes.forEach((g, i) => g.classList.toggle('lit', i === Math.floor(frame / 3) % cellar.runes.length));
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

  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    tentacles.forEach((t) => {
      if (Math.hypot(t.o.x - x, t.o.y - y) < t.o.length * 1.1) t.twitch = 1;
    });
  });
  return cellar;
}

function star(g: Element, x: number, y: number, s: number) {
  stroke(g, [[x - s, y], [x + s, y]], swell(s * 0.35));
  stroke(g, [[x, y - s * 1.4], [x, y + s * 1.4]], swell(s * 0.35));
}

export function debounce<T extends (...a: never[]) => void>(fn: T, ms: number) {
  let id = 0;
  return (...a: Parameters<T>) => { clearTimeout(id); id = window.setTimeout(() => fn(...a), ms); };
}
