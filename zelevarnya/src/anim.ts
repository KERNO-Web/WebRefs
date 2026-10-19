import { el, NS } from './ink';

// Hand-drawn animation clock. Drawn things are redrawn "on twos" (12 fps)
// and swap a line-boil filter each frame, like cels drawn by hand.
// Only what is on screen is redrawn: offscreen callbacks and filters sleep.
export const FPS = 12;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

type Tick = (t: number, frame: number) => void;
const ticks: { fn: Tick; gate?: Element }[] = [];
let frame = 0;
const BOILS = 3;

const visible = new WeakSet<Element>();
const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))), { rootMargin: '120px' });
const watched = new WeakSet<Element>();
function watch(node: Element) {
  if (watched.has(node)) return;
  watched.add(node);
  io.observe(node);
}

/** Run fn every hand-drawn frame; with a gate, only while the gate is on screen. */
export function onFrame(fn: Tick, gate?: Element) {
  if (gate) watch(gate);
  ticks.push({ fn, gate });
  if (reduced) fn(0, 0);
}

export function installBoil() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  const defs = el('defs', {}, svg);
  for (let i = 0; i < BOILS; i++) {
    const f = el('filter', { id: `boil-${i}`, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.022, numOctaves: 2, seed: 10 + i * 17, result: 'n' }, f);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3.4, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
  }
  document.body.prepend(svg);
}

let boilList: SVGElement[] = [];
function boil(n: number) {
  if (n % 48 === 1) {
    boilList = Array.from(document.querySelectorAll<SVGElement>('.boil'));
    boilList.forEach(watch);
  }
  const id = `url(#boil-${n % BOILS})`;
  for (const g of boilList) if (visible.has(g)) g.setAttribute('filter', id);
}

function tickOnce(now: number) {
  frame++;
  boil(frame);
  const t = now / 1000;
  for (const k of ticks) if (!k.gate || visible.has(k.gate)) k.fn(t, frame);
}

export function start() {
  installBoil();
  // QA hook: advance n hand-drawn frames without waiting for rAF.
  (window as unknown as { __tick: (n?: number) => void }).__tick = (n = 1) => { for (let i = 0; i < n; i++) tickOnce(performance.now() + i * 83); };
  if (reduced) {
    document.querySelectorAll<SVGElement>('.boil').forEach((g) => g.setAttribute('filter', 'url(#boil-0)'));
    return;
  }
  let last = 0;
  const loop = (now: number) => {
    if (now - last >= 1000 / FPS) {
      last = now;
      tickOnce(now);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// Run fn while the element is on screen.
export function whenVisible(node: Element, onIn: () => void, onOut?: () => void, margin = '0px') {
  const o = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? onIn() : onOut?.())), { rootMargin: margin });
  o.observe(node);
}
