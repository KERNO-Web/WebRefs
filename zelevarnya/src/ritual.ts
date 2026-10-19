import gsap from 'gsap';
import { reduced, whenVisible } from './anim';
import { glyph, rune, RUNE_NAMES } from './art/runes';
import { drawVessel } from './art/vessels';
import { arc, el, NS, P, stroke, swell } from './ink';

// Three medallions: real footage of the brewing and smoking (Mixkit), and the
// colour-changing potion. Each video sits inside an engraved rune ring.
const GLYPH = { brew: 'sun', smoke: 'air', serve: 'mercury' } as const;

export function buildRitual() {
  const medals = Array.from(document.querySelectorAll<HTMLElement>('.medal'));
  medals.forEach((m, k) => {
    const svg = m.querySelector<SVGSVGElement>('.medal-ring')!;
    const C = 200;
    // parchment annulus hides the square video corners
    el('path', { d: `M${C} ${C - 197}a197 197 0 1 0 0.01 0Z M${C} ${C - 150}a150 150 0 1 0 0.01 0Z`, class: 'paper-fill', 'fill-rule': 'evenodd' }, svg);
    stroke(svg, arc(C, C, 196, 196, 0, Math.PI * 2, 90), () => 2.4);
    stroke(svg, arc(C, C, 186, 186, 0, Math.PI * 2, 90), () => 0.8);
    stroke(svg, arc(C, C, 151, 151, 0, Math.PI * 2, 90), () => 2);
    stroke(svg, arc(C, C, 158, 158, 0, Math.PI * 2, 90), () => 0.7);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
      const x = C + Math.cos(a) * 172, y = C + Math.sin(a) * 172;
      if (i === 0) glyph(svg, GLYPH[m.dataset.step as keyof typeof GLYPH], x, y, 24);
      else rune(svg, RUNE_NAMES[(i * 5 + k * 3) % RUNE_NAMES.length], x, y, 18, (a * 180) / Math.PI + 90);
    }
    const v = m.querySelector('video');
    if (v && !reduced) whenVisible(m, () => { v.play().catch(() => undefined); }, () => v.pause(), '10% 0px');
  });

  // Serve: blue → pink potion. Photos if present, the engraved flask otherwise.
  const shift = document.querySelector<HTMLElement>('.medal-shift')!;
  const blue = new Image(), pink = new Image();
  blue.src = 'potions/invis.jpg';
  pink.src = 'potions/invis-pink.jpg';
  blue.alt = 'Зелье невидимости, синее';
  pink.alt = 'То же зелье после капли лимона, розовое';
  pink.className = 'pink';
  shift.append(blue, pink);
  let swap: gsap.core.Timeline | null = null;
  const startSwap = (targets: gsap.TweenTarget, prop: Record<string, unknown>) => {
    if (reduced) return;
    whenVisible(shift, () => {
      if (swap) return;
      swap = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 1.6, delay: 0.8 }).to(targets, { ...prop, duration: 1.6, ease: 'steps(14)' });
    }, () => { swap?.kill(); swap = null; });
  };
  blue.onload = () => startSwap(pink, { opacity: 1 });
  blue.onerror = () => {
    shift.replaceChildren();
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 -10 300 430');
    const defs = el('defs', {}, svg);
    const gr = el('linearGradient', { id: 'pg-rit-shift', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const B = ['#9aa6ff', '#4b55d6', '#24257a'], K = ['#ffc2e0', '#e2559f', '#8e2463'];
    const stops = B.map((c, i) => el('stop', { offset: ['0%', '55%', '100%'][i], 'stop-color': c }, gr));
    drawVessel(svg, 'flask', 'pg-rit-shift');
    shift.append(svg);
    shift.classList.add('drawn');
    const proxy = { k: 0 };
    startSwap(proxy, { k: 1, onUpdate: () => stops.forEach((s, i) => s.setAttribute('stop-color', mix(B[i], K[i], proxy.k))) });
  };

  // Dotted path linking the medallions, inked on scroll.
  const trail = document.querySelector<SVGSVGElement>('.ritual-trail')!;
  const pts: P[] = [];
  for (let i = 0; i <= 120; i++) pts.push([(1200 * i) / 120, 60 + Math.sin((i / 120) * Math.PI * 4) * 30]);
  const tg = el('g', {}, trail);
  for (let i = 0; i < pts.length - 2; i += 3) stroke(tg, [pts[i], pts[i + 1], pts[i + 2]], swell(2.4, 0.4));
  const defs = el('defs', {}, trail);
  const rr = el('rect', { x: 0, y: 0, width: reduced ? 1200 : 0, height: 120 }, el('clipPath', { id: 'trail-clip' }, defs));
  tg.setAttribute('clip-path', 'url(#trail-clip)');
  whenVisible(trail, () => gsap.to(rr, { attr: { width: 1200 }, duration: reduced ? 0 : 1.6, ease: 'steps(14)' }));

  document.querySelectorAll<HTMLElement>('.step-num').forEach((n) => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '-25 -25 50 50');
    glyph(s, n.dataset.glyph!, 0, 0, 40);
    n.append(s);
  });
}

function mix(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
