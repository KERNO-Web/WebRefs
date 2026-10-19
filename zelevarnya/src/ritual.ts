import gsap from 'gsap';
import { onFrame, reduced, whenVisible } from './anim';
import { drawCauldron, paintFlames } from './art/cauldron';
import { glyph, rune, RUNE_NAMES } from './art/runes';
import { drawVessel } from './art/vessels';
import { potionGradient } from './hero';
import { arc, el, inkDefs, P, stroke, swell } from './ink';

// Three alchemical medallions joined by a dotted path that inks itself on scroll.
export function buildRitual() {
  const svg = document.querySelector<SVGSVGElement>('.ritual-art')!;
  const defs = inkDefs(svg, 'rit');
  potionGradient(defs, 'pg-rit', true);
  potionGradient(defs, 'pg-rit-l');
  const shift = el('linearGradient', { id: 'pg-rit-shift', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const stops = ['#9aa6ff', '#4b55d6', '#24257a'].map((c, i) => el('stop', { offset: ['0%', '55%', '100%'][i], 'stop-color': c }, shift));

  const centers: P[] = [[200, 250], [600, 270], [1000, 250]];

  // Path between medallions
  const path: P[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = 200 + (800 * i) / 120;
    path.push([x, 470 + Math.sin((i / 120) * Math.PI * 4) * 18]);
  }
  const trail = el('g', { class: 'trail' }, svg);
  for (let i = 0; i < path.length - 2; i += 3) stroke(trail, [path[i], path[i + 1], path[i + 2]], swell(2.2, 0.4));
  const reveal = el('clipPath', { id: 'trail-clip' }, defs);
  const rr = el('rect', { x: 0, y: 0, width: reduced ? 1200 : 0, height: 520 }, reveal);
  trail.setAttribute('clip-path', 'url(#trail-clip)');

  centers.forEach(([cx, cy], k) => {
    const g = el('g', { class: 'medallion' }, svg);
    el('circle', { cx, cy, r: 186, class: 'paper-fill' }, g);
    stroke(g, arc(cx, cy, 186, 186, 0, Math.PI * 2, 90), () => 2.4);
    stroke(g, arc(cx, cy, 177, 177, 0, Math.PI * 2, 90), () => 0.8);
    stroke(g, arc(cx, cy, 144, 144, 0, Math.PI * 2, 90), () => 0.8);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * 160, y = cy + Math.sin(a) * 160;
      if (i === 0) glyph(g, ['sun', 'air', 'mercury'][k], x, y, 26);
      else rune(g, RUNE_NAMES[(i * 5 + k * 3) % RUNE_NAMES.length], x, y, 20, (a * 180) / Math.PI + 90);
    }
    const art = el('g', {}, g);
    if (k === 0) {
      art.setAttribute('transform', `translate(${cx - 400 * 0.34} ${cy - 470 * 0.34}) scale(0.34)`);
      const c = drawCauldron(art, 'pg-rit', 'rit-cauldron-clip');
      onFrame((t, f) => paintFlames(c.flames, t, f));
    } else if (k === 1) {
      art.setAttribute('transform', `translate(${cx - 150 * 0.62} ${cy - 220 * 0.62}) scale(0.62)`);
      drawVessel(art, 'cloche', 'pg-rit-l');
      art.querySelectorAll('.wisps').forEach((w) => w.classList.add('boil'));
    } else {
      art.setAttribute('transform', `translate(${cx - 150 * 0.62} ${cy - 225 * 0.62}) scale(0.62)`);
      drawVessel(art, 'flask', 'pg-rit-shift');
    }
  });

  // The third flask cycles blue → pink → blue while the section is visible.
  let tl: gsap.core.Timeline | null = null;
  whenVisible(svg, () => {
    gsap.to(rr, { attr: { width: 1200 }, duration: reduced ? 0 : 1.6, ease: 'steps(14)' });
    if (reduced || tl) return;
    const blue = ['#9aa6ff', '#4b55d6', '#24257a'], pink = ['#ffc2e0', '#e2559f', '#8e2463'];
    const proxy = { k: 0 };
    tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 1.4, delay: 1 }).to(proxy, {
      k: 1, duration: 1.8, ease: 'steps(18)',
      onUpdate: () => stops.forEach((s, i) => s.setAttribute('stop-color', mixHex(blue[i], pink[i], proxy.k))),
    });
  }, () => { tl?.kill(); tl = null; });

  document.querySelectorAll<HTMLElement>('.step-num').forEach((n) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '-25 -25 50 50');
    glyph(s, n.dataset.glyph!, 0, 0, 40);
    n.append(s);
  });
}

function mixHex(a: string, b: string, k: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
