import './styles.css';
import { onFrame, reduced, start, whenVisible } from './anim';
import { glyph, rune, RUNE_NAMES } from './art/runes';
import { Tentacle, TentacleOpts } from './art/tentacle';
import { buildBook } from './book';
import { buildBooking } from './booking';
import { buildHall } from './hall';
import { buildHero, debounce } from './hero';
import { NS } from './ink';
import { buildRitual } from './ritual';
import { POTIONS } from './data';
import { paintPaper } from './paper';
import { burntHole, candle, candlelight, dust, inkBlot, note } from './atmosphere';

paintPaper();
buildHero();
buildBook();
buildRitual();
const booking = buildBooking();
buildHall((t) => booking.pick(t), (t) => booking.hint(t));

// Header mark
const mark = document.querySelector('.mark-glyph')!;
const ms = document.createElementNS(NS, 'svg');
ms.setAttribute('viewBox', '-20 -20 40 40');
ms.setAttribute('width', '26');
ms.setAttribute('height', '26');
glyph(ms, 'mercury', 0, 0, 34);
mark.append(ms);

// Section heads: three runes that flare green when the page turns into view.
document.querySelectorAll<SVGSVGElement>('.sec-runes').forEach((s) => {
  s.setAttribute('viewBox', '0 0 150 44');
  const names = (s.dataset.runes ?? '').split(',');
  const gs = names.map((n, i) => rune(s, n, 30 + i * 45, 22, 34));
  whenVisible(s, () => {
    if (reduced) return;
    gs.forEach((g, i) => {
      setTimeout(() => g.classList.add('lit'), 150 + i * 160);
      setTimeout(() => g.classList.remove('lit'), 1300 + i * 160);
    });
  }, undefined, '-15% 0px');
});

// Footer rune strip
const strip = document.querySelector<SVGSVGElement>('.rune-strip')!;
const drawStrip = () => {
  strip.replaceChildren();
  const w = strip.clientWidth || 1200;
  strip.setAttribute('viewBox', `0 0 ${w} 44`);
  const n = Math.floor(w / 34);
  for (let i = 0; i < n; i++) rune(strip, RUNE_NAMES[i % RUNE_NAMES.length], 17 + i * 34, 22, 26);
};
drawStrip();
addEventListener('resize', debounce(drawStrip, 200));

// Tentacles creeping from behind section edges.
interface Edge { sel: string; spec: (W: number, H: number) => TentacleOpts }
const EDGES: Edge[] = [
  { sel: '.book-sec', spec: (W, H) => ({ x: -30, y: H * 0.8, angle: -0.55, length: Math.min(340, W * 0.3), width: 74, curl: -1, phase: 1 }) },
  { sel: '.ritual-sec', spec: (W, H) => ({ x: W + 30, y: H * 0.14, angle: Math.PI - 0.1, length: Math.min(300, W * 0.3), width: 64, curl: -1, phase: 3 }) },
  { sel: '.hall-sec', spec: (W, H) => ({ x: -30, y: H * 0.55, angle: 0.1, length: Math.min(260, W * 0.24), width: 66, curl: 1, phase: 5 }) },
  { sel: '.booking-sec', spec: (W, H) => ({ x: W + 30, y: H * 0.78, angle: Math.PI + 0.35, length: Math.min(320, W * 0.28), width: 80, curl: 1, phase: 2 }) },
];
const living: Tentacle[] = [];
EDGES.forEach(({ sel, spec }) => {
  const sec = document.querySelector<HTMLElement>(sel);
  if (!sec) return;
  const svg = document.createElementNS(NS, 'svg');
  svg.classList.add('edge-tentacle');
  svg.setAttribute('aria-hidden', 'true');
  sec.prepend(svg);
  let t: Tentacle | null = null;
  const layout = () => {
    const W = sec.clientWidth, H = sec.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const o = spec(W, H);
    if (W < 700) { o.length *= 0.7; o.width *= 0.6; }
    const prev = t;
    if (prev) { prev.g.remove(); living.splice(living.indexOf(prev), 1); }
    t = new Tentacle(svg, o);
    t.g.classList.add('boil');
    t.extend = t.target = prev?.target ?? (reduced ? 1 : 0);
    t.update(0);
    living.push(t);
  };
  layout();
  addEventListener('resize', debounce(layout, 200));
  whenVisible(sec, () => { if (t) t.target = 1; }, () => { if (t) t.target = 0; }, '-20% 0px');
});
onFrame((t, f) => living.forEach((x) => x.step(t, f)));

// Photo and video credits (CC BY / BY-SA need attribution).
const credits = document.querySelector('[data-credits]')!;
credits.innerHTML = POTIONS.map((p) => `<li>${p.name}: <a href="${p.credit.source}" target="_blank" rel="noopener">${p.credit.author}</a>, <a href="${p.credit.licenseUrl}" target="_blank" rel="noopener">${p.credit.license}</a>, Wikimedia Commons; кадрировано и тонировано</li>`).join('')
  + '<li>Видео ритуала: <a href="https://mixkit.co/free-stock-video/bartender-makes-an-experimental-cocktail-4172/" target="_blank" rel="noopener">Mixkit 4172</a> и <a href="https://mixkit.co/free-stock-video/experimental-cocktail-in-the-bar-4416/" target="_blank" rel="noopener">Mixkit 4416</a>, Mixkit Free License</li>';

// ---------- mood: light, dust, watchers, candles, marginalia ----------
candlelight();
dust();
const $ = (sel: string) => document.querySelector<HTMLElement>(sel)!;
document.querySelectorAll<HTMLElement>('.sec-head').forEach((h, i) => {
  candle(h, 'candle-l', 120, i * 2 + 1);
  candle(h, 'candle-r', 120, i * 2 + 2);
});
const hero = $('.hero');
burntHole(hero, { position: 'absolute', right: '7%', top: '20%' }, 130, 1);
inkBlot(hero, { position: 'absolute', right: '15%', top: '12%' }, 70, 2);
note(hero, 'мешать только против часовой!', { position: 'absolute', left: '6%', top: '41%', transform: 'rotate(-5deg)' }, { dx: 230, dy: 36, bend: -0.25 });
const book = $('.book-sec');
note($('.book'), 'VII проверено на себе. Помню всё.', { position: 'absolute', right: '9%', bottom: '128px', transform: 'rotate(-4deg)' });
burntHole(book, { position: 'absolute', left: '2.2%', top: '30%' }, 96, 3);
inkBlot(book, { position: 'absolute', right: '3%', bottom: '8%' }, 54, 4);
const ritual = $('.ritual-sec');
note(ritual, 'дым не вдыхать (шутка)', { position: 'absolute', left: '3%', top: '310px', transform: 'rotate(-6deg)' });
inkBlot(ritual, { position: 'absolute', right: '8%', top: '120px' }, 64, 5);
burntHole(ritual, { position: 'absolute', right: '3%', bottom: '10%' }, 100, 6);
const hall = $('.hall');
note(hall, 'стол XIII не бронировать. Никогда.', { position: 'absolute', left: '50%', top: '103%', transform: 'rotate(-3deg)' }, { dx: 30, dy: -70, bend: -0.3 });
note(hall, 'там кто-то есть', { position: 'absolute', left: '14%', top: '104%', transform: 'rotate(3deg)' }, { dx: 190, dy: -50, bend: 0.25 });
const foot = $('.foot');
burntHole(foot, { position: 'absolute', right: '4%', top: '-30px' }, 90, 8);

start();
