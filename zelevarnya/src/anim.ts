import { el, NS } from './ink';

// Hand-drawn animation clock. Everything alive on the page is redrawn
// "on twos" (12 fps) and every frame swaps the line-boil filter, so lines
// shiver like a cartoon drawn frame by frame.
export const FPS = 12;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

type Tick = (t: number, frame: number) => void;
const ticks = new Set<Tick>();
let frame = 0;
const BOILS = 3;

export function onFrame(fn: Tick) {
  ticks.add(fn);
  if (reduced) fn(0, 0);
  return () => ticks.delete(fn);
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

function boil(n: number) {
  const id = `url(#boil-${n % BOILS})`;
  document.querySelectorAll<SVGElement>('.boil').forEach((g) => g.setAttribute('filter', id));
}

function tickOnce(now: number) {
  frame++;
  boil(frame);
  ticks.forEach((fn) => fn(now / 1000, frame));
}

export function start() {
  installBoil();
  // QA hook: advance n hand-drawn frames without waiting for rAF.
  (window as unknown as { __tick: (n?: number) => void }).__tick = (n = 1) => { for (let i = 0; i < n; i++) tickOnce(performance.now() + i * 83); };
  if (reduced) { boil(0); return; }
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
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? onIn() : onOut?.())), { rootMargin: margin });
  io.observe(node);
}
