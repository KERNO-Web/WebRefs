import './styles.css';
import { onFrame, reduced, start, whenVisible } from './anim';
import { glyph, rune, RUNE_NAMES } from './art/runes';
import { Tentacle, TentacleOpts } from './art/tentacle';
import { buildBooking } from './booking';
import { buildHall } from './hall';
import { buildHero, debounce } from './hero';
import { NS } from './ink';
import { buildNight } from './night';
import { POTIONS } from './data';
import { paintPaper } from './paper';
import { candle, candlelight, dust, inkBlot, note } from './atmosphere';

paintPaper();
const cellar = buildHero();
const booking = buildBooking();
buildHall((t) => booking.pick(t), (t) => booking.hint(t));
buildNight(cellar);

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
    t.extend = t.target = prev?.target ?? (reduced ? 1 : 0);
    t.update(0);
    living.push(t);
  };
  layout();
  addEventListener('resize', debounce(layout, 200));
  whenVisible(sec, () => { if (t) t.target = 1; }, () => { if (t) t.target = 0; }, '-20% 0px');
});
onFrame((t, f) => living.forEach((x) => { if (x.g.ownerSVGElement && x.g.ownerSVGElement.getBoundingClientRect().bottom > -200 && x.g.ownerSVGElement.getBoundingClientRect().top < innerHeight + 200) x.step(t, f); }));

// Photo and video credits (CC BY / BY-SA need attribution).
const PHOTOS: [string, string, string, string, string][] = [
  ['Стойка бара', 'Achim Schleuning', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Cocktail-Bar_(Kleines_Phi)_in_Hamburg_2.jpg'],
  ['Тёмный зал', 'Matti Blume', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Wiki_Loves_Cocktails_2017,_Berlin,_20170716_(DSC06538).jpg'],
  ['Огонь над бокалом', 'istolethetv', 'CC BY 2.0', 'by/2.0', 'https://commons.wikimedia.org/wiki/File:Pouring_(3386574550).jpg'],
  ['Склеп', 'Pascal Reusch', 'CC BY 3.0', 'by/3.0', 'https://commons.wikimedia.org/wiki/File:Residence_W%C3%BCrzburg_-_Wine_cellar.JPG'],
  ['Бармен с шейкером', 'Achim Schleuning', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Barkeeper_Shaking.jpg'],
  ['Библиотека', 'Wolfmann', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Grand_Hotel_Terminus_(1928)_whisky_bar_lounge_dining_Bergen_Norway_2017-10-18_a.jpg'],
  ['Свеча на стойке', 'Victorgrigas', 'CC BY-SA 3.0', 'by-sa/3.0', 'https://commons.wikimedia.org/wiki/File:Candle_on_table_in_Wine_cellar-9473.jpg'],
  ['Лаборатория', 'Matti Blume', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Wiki_Loves_Cocktails_2017,_Berlin,_20170716_(DSC06558).jpg'],
  ['Лестница вниз', 'Matti Blume', 'CC BY-SA 4.0', 'by-sa/4.0', 'https://commons.wikimedia.org/wiki/File:Wiki_Loves_Cocktails_2017,_Berlin,_20170716_(DSC06519).jpg'],
];
const credits = document.querySelector('[data-credits]')!;
credits.innerHTML = PHOTOS.map(([what, author, lic, lu, src]) => `<li>${what}: <a href="${src}" target="_blank" rel="noopener">${author}</a>, <a href="https://creativecommons.org/licenses/${lu}/" target="_blank" rel="noopener">${lic}</a>, Wikimedia Commons; кадрировано и тонировано</li>`).join('')
  + POTIONS.map((p) => `<li>${p.name}: <a href="${p.credit.source}" target="_blank" rel="noopener">${p.credit.author}</a>, <a href="${p.credit.licenseUrl}" target="_blank" rel="noopener">${p.credit.license}</a>, Wikimedia Commons; кадрировано и тонировано</li>`).join('')
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
inkBlot(hero, { position: 'absolute', right: '15%', top: '12%' }, 70, 2);
const hall = $('.hall');
note(hall, 'стол XIII не бронировать. Никогда.', { position: 'absolute', left: '50%', top: '103%', transform: 'rotate(-3deg)' }, { dx: 30, dy: -70, bend: -0.3 });
note(hall, 'там кто-то есть', { position: 'absolute', left: '14%', top: '104%', transform: 'rotate(3deg)' }, { dx: 190, dy: -50, bend: 0.25 });

start();
