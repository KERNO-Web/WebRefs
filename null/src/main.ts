import './style.css';
import { Vector2 } from 'three';
import { createScene, type SceneState } from './scene';

type Lang = 'en' | 'ru';
const TEXT: Record<string, [string, string]> = {
  tagline: ['An object that exists only while you are looking at it.', 'Объект, который существует, только пока вы на него смотрите.'],
  hint: ['Move to observe', 'Двигайтесь, чтобы наблюдать'],
  scroll: ['Scroll', 'Листайте'],
  c1: ['Form', 'Форма'],
  c1a: ['It has no fixed shape.', 'У него нет постоянной формы.'],
  c1b: ['The surface continuously rebuilds itself from movement, light and noise.', 'Поверхность непрерывно пересобирает себя из движения, света и шума.'],
  c2: ['Pressure', 'Давление'],
  c2a: ['Matter remembers every force.', 'Материя помнит каждую силу.'],
  c2b: ['Each touch leaves a wave that keeps travelling long after the hand is gone.', 'Каждое касание оставляет волну, которая идёт дальше, когда руки уже нет.'],
  c3: ['Memory', 'Память'],
  c3a: ['Nothing disappears.', 'Ничто не исчезает.'],
  c3b: ['It becomes another state.', 'Оно становится другим состоянием.'],
  c4: ['Fracture', 'Разлом'],
  c4a: ['It opens without breaking.', 'Оно раскрывается, не разрушаясь.'],
  c4b: ['Separation is only the distance light needs to pass through.', 'Разделение — лишь расстояние, которое нужно свету, чтобы пройти.'],
  c5: ['Null', 'Ноль'],
  c5a: ['The object ends when observation ends.', 'Объект заканчивается, когда заканчивается наблюдение.'],
  ended: ['Observation ended.', 'Наблюдение окончено.'],
  again: ['Observe again', 'Наблюдать снова'],
  colophon: ['Real-time WebGL · procedural geometry · no images, no video', 'WebGL в реальном времени · процедурная геометрия · без картинок и видео'],
  chapters: ['Chapters', 'Главы'],
  lang: ['Switch language', 'Переключить язык'],
  nogl: ['This object needs WebGL to exist. Try another browser or enable hardware acceleration.', 'Этому объекту для существования нужен WebGL. Попробуйте другой браузер или включите аппаратное ускорение.'],
};
const NAMES = ['', 'c1', 'c2', 'c3', 'c4', 'c5'];

let lang: Lang = (() => { try { return localStorage.getItem('null-lang') === 'ru' ? 'ru' : 'en'; } catch { return 'en'; } })();
const tr = (k: string) => TEXT[k][lang === 'en' ? 0 : 1];

const app = document.getElementById('app')!;
app.innerHTML = `
<header class="hud-top">
  <a class="logo" href="#top" data-cursor>NULL</a>
  <span class="hud-id mono">0001 / OBJECT</span>
  <div class="hud-right">
    <span class="hud-chapter mono" id="chap" aria-live="polite"></span>
    <button class="lang mono" id="lang" data-cursor data-tl="lang"><span data-l="en">EN</span><span data-l="ru">RU</span></button>
  </div>
</header>
<div class="grid" aria-hidden="true">
  ${Array.from({ length: 7 }, (_, i) => `<span class="gl">${i === 1 ? '<i class="mono" id="gx">X 0.314</i>' : i === 3 ? '<i class="mono" id="gy">Y 0.882</i>' : i === 5 ? '<i class="mono" id="gz">Z 0.041</i>' : ''}</span>`).join('')}
</div>
<nav class="index" data-tl="chapters" aria-label="Chapters">
  ${[1, 2, 3, 4, 5].map((i) => `<button class="mono" data-go="${i}" data-cursor><span class="n">0${i}</span><span class="t" data-t="c${i}"></span></button>`).join('')}
</nav>
<div class="hud-bottom mono" aria-hidden="true">
  <span id="coords">X 0.314 &nbsp;Y 0.882 &nbsp;Z 0.041</span>
  <span class="progress"><span class="bar"><span id="bar"></span></span><span id="pct">000</span></span>
</div>
<main id="top">
  <section class="intro" data-sec="0">
    <div class="sticky">
      <div class="intro-inner">
        <div class="intro-left"><p class="id mono">0001 / OBJECT</p><h1 class="title">NULL</h1></div>
        <p class="tagline" data-t="tagline"></p>
      </div>
      <p class="hint mono"><span data-t="hint"></span><span class="hint-line"></span><span class="hint-scroll" data-t="scroll"></span></p>
    </div>
  </section>
  ${[1, 2, 3, 4, 5].map((i) => `
  <section class="chapter c${i}" data-sec="${i}">
    <div class="sticky">
      <article class="ch-text">
        <span class="num mono">0${i}</span>
        <h2 data-t="c${i}"></h2>
        <p class="lead" data-t="c${i}a"></p>
        ${i < 5 ? `<p class="body" data-t="c${i}b"></p>` : ''}
      </article>
    </div>
  </section>`).join('')}
  <section class="outro" data-sec="6">
    <div class="sticky"><div class="outro-inner">
      <p class="ended" data-t="ended"></p>
      <button class="again mono" id="again" data-cursor><span data-t="again"></span> ↑</button>
      <p class="colophon mono"><span>NULL — 0001 / OBJECT</span><span data-t="colophon"></span></p>
    </div></div>
  </section>
</main>
<div class="nogl"><p class="title">NULL</p><p data-t="nogl"></p></div>
<div class="cursor" aria-hidden="true"><span class="c-dot"></span><span class="c-ring"></span></div>
`;

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const $$ = (s: string) => [...document.querySelectorAll<HTMLElement>(s)];

function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-t]').forEach((el) => (el.textContent = tr(el.dataset.t!)));
  $$('[data-tl]').forEach((el) => el.setAttribute('aria-label', tr(el.dataset.tl!)));
  $$('[data-l]').forEach((el) => el.classList.toggle('on', el.dataset.l === lang));
  lastChap = -1;
}
let lastChap = -1;
applyLang();
$('#lang').addEventListener('click', () => {
  lang = lang === 'en' ? 'ru' : 'en';
  try { localStorage.setItem('null-lang', lang); } catch { /* ignore */ }
  applyLang();
});

const mq = (q: string) => window.matchMedia(q).matches;
const reduced = mq('(prefers-reduced-motion: reduce)');
const touch = !mq('(hover: hover) and (pointer: fine)');
const mobile = touch || window.innerWidth < 760;
document.body.classList.toggle('touch', touch);

/* ---------- scroll layout ---------- */
let secs: { start: number; end: number }[] = [];
function measure() {
  const vh = window.innerHeight;
  secs = $$('[data-sec]').map((el) => ({ start: el.offsetTop / vh, end: (el.offsetTop + el.offsetHeight) / vh }));
}
measure();

$$('[data-go]').forEach((b) => b.addEventListener('click', () => {
  const i = +b.dataset.go!;
  window.scrollTo({ top: (secs[i].start + 0.25) * window.innerHeight, behavior: reduced ? 'auto' : 'smooth' });
}));
$('#again').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
$('.logo').addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });

/* ---------- helpers ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const bump = (v: number, a: number, b: number, c: number, d: number) => ss(a, b, v) * (1 - ss(c, d, v));
const lerpKeys = (v: number, keys: [number, number][]) => {
  if (v <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (v <= keys[i][0]) {
      const [x0, y0] = keys[i - 1], [x1, y1] = keys[i];
      const t = ss(0, 1, (v - x0) / (x1 - x0));
      return y0 + (y1 - y0) * t;
    }
  }
  return keys[keys.length - 1][1];
};

/* ---------- cursor & pointer ---------- */
const mouse = new Vector2(0, 0), mouseT = new Vector2(0, 0);
let mouseStr = 0, moved = 0;
const cursor = $('.cursor'), ring = $('.c-ring'), dot = $('.c-dot');
const cpos = { x: innerWidth / 2, y: innerHeight / 2 }, rpos = { x: cpos.x, y: cpos.y };
if (!touch) {
  window.addEventListener('pointermove', (e) => {
    cpos.x = e.clientX; cpos.y = e.clientY;
    mouseT.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    moved = 1;
    cursor.classList.add('on');
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('on'));
  document.addEventListener('pointerover', (e) => {
    const t = (e.target as HTMLElement).closest('a, button, [data-cursor]');
    cursor.classList.toggle('hover', !!t);
  });
  window.addEventListener('pointerdown', () => cursor.classList.add('down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('down'));
}

/* ---------- scene ---------- */
let scene: ReturnType<typeof createScene> | null = null;
try {
  scene = createScene($('#gl') as unknown as HTMLCanvasElement, { mobile, reduced });
} catch {
  document.body.classList.add('no-gl');
}

let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = window.setTimeout(() => { measure(); scene?.resize(); }, 120);
});

const state: SceneState = {
  stretch: 0, pressure: 0, cobalt: 0, ghost: 0, fracture: 0, amber: 0, white: 0,
  dissolve: 1, light: 0, offsetX: 0, offsetY: 0, scale: 1, mouse, mouseStr: 0,
};

const t0 = performance.now();
let last = t0;
let sS = window.scrollY / innerHeight;
let frame = 0;
const chapEl = $('#chap'), pctEl = $('#pct'), barEl = $('#bar'), coordsEl = $('#coords');
const gx = $('#gx'), gy = $('#gy'), gz = $('#gz');
const texts = $$('[data-sec]').map((el) => el.querySelector<HTMLElement>('.ch-text, .intro-inner, .outro-inner'));
const hint = $('.hint');
const navBtns = $$('[data-go]');
document.body.classList.add('ready');

function tick(now: number) {
  const dt = clamp((now - last) / 1000, 0.001, 0.05);
  last = now;
  const t = (now - t0) / 1000;
  const vh = innerHeight;
  const target = window.scrollY / vh;
  sS = reduced || !Number.isFinite(sS) ? target : sS + (target - sS) * (1 - Math.exp(-dt * 5));
  const s = sS;

  // pointer: real on desktop, slow autonomous drift on touch
  if (touch) {
    mouseT.set(Math.sin(t * 0.21) * 0.55, Math.sin(t * 0.17 + 1.3) * 0.4);
    mouseStr += (0.45 - mouseStr) * dt;
  } else {
    mouseStr += ((moved ? 1 : 0) - mouseStr) * (1 - Math.exp(-dt * (moved ? 3 : 0.6)));
    moved *= Math.exp(-dt * 0.8);
  }
  mouse.lerp(mouseT, 1 - Math.exp(-dt * (reduced ? 20 : 2.4)));

  // opening: object comes out of darkness
  const intro = ss(0.5, 3.4, t);
  const introDis = 1 - ss(0.9, 3.6, t);
  const wide = innerWidth >= 900;
  state.stretch = bump(s, 0.45, 1.2, 1.8, 2.45);
  state.pressure = bump(s, 1.9, 2.5, 3.1, 3.75);
  state.cobalt = ss(3.0, 3.8, s) * (1 - ss(5.8, 6.5, s));
  state.ghost = bump(s, 3.15, 3.8, 4.4, 4.95) * 0.9;
  state.fracture = bump(s, 4.45, 5.05, 5.45, 6.0);
  state.amber = bump(s, 4.3, 4.95, 5.55, 6.2);
  state.white = ss(5.8, 6.45, s);
  state.dissolve = Math.max(introDis, ss(6.45, 6.95, s) * 1.02);
  state.light = intro;
  state.offsetX = wide ? lerpKeys(s, [[0.4, 0], [1.0, 0.85], [1.9, 0.85], [2.4, -0.85], [3.1, -0.85], [3.6, 0.85], [5.6, 0.85], [6.1, 0], [7, 0]]) : 0;
  const portrait = innerHeight > innerWidth * 1.2;
  state.offsetY = lerpKeys(s, [[5.6, 0], [6.2, 0.3], [7, 0.3]]) + (portrait ? 0.62 : 0);
  state.scale = lerpKeys(s, [[5.6, 1], [6.3, 0.82], [7, 0.82]]);
  state.mouseStr = mouseStr;

  scene?.render(t, dt, state);

  // text reveal per section
  secs.forEach((sec, i) => {
    const el = texts[i];
    if (!el) return;
    let o: number;
    if (i === 0) o = (1 - ss(0.2, 0.6, s)) * ss(0.8, 2.2, t);
    else if (i === 6) o = ss(sec.start - 0.6, sec.start - 0.25, s);
    else {
      const outEnd = i === 5 ? sec.end - 0.62 : sec.end - 0.3;
      o = ss(sec.start - 0.4, sec.start - 0.15, s) * (1 - ss(outEnd - 0.25, outEnd, s));
    }
    el.style.opacity = o.toFixed(3);
    el.style.transform = `translate3d(0, ${((1 - o) * 18).toFixed(1)}px, 0)`;
    el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  });
  hint.style.opacity = ((1 - ss(0.05, 0.35, s)) * ss(2.6, 3.6, t)).toFixed(3);

  // HUD
  let chap = 0;
  secs.forEach((sec, i) => { if (i > 0 && i < 6 && s >= sec.start - 0.5) chap = i; });
  if (s >= secs[6].start - 0.4) chap = 6;
  if (chap !== lastChap) {
    lastChap = chap;
    chapEl.textContent = chap > 0 && chap < 6 ? `0${chap} / 05 — ${tr(NAMES[chap]).toUpperCase()}` : chap === 6 ? '— / 05' : '00 / 05';
    navBtns.forEach((b, i) => b.classList.toggle('on', i + 1 === chap));
  }
  const maxS = Math.max(0.001, (document.documentElement.scrollHeight - vh) / vh);
  const p = clamp(s / maxS);
  if (frame++ % 4 === 0) {
    pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
    barEl.style.transform = `scaleX(${p.toFixed(3)})`;
    const x = ((mouse.x + 1) / 2).toFixed(3), y = ((mouse.y + 1) / 2).toFixed(3);
    const z = (state.fracture * 0.6 + state.pressure * 0.3 + state.stretch * 0.1 + 0.041 * (1 - state.fracture)).toFixed(3);
    coordsEl.innerHTML = `X ${x} &nbsp;Y ${y} &nbsp;Z ${z}`;
    gx.textContent = `X ${x}`; gy.textContent = `Y ${y}`; gz.textContent = `Z ${z}`;
  }

  // cursor
  if (!touch) {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 12);
    rpos.x += (cpos.x - rpos.x) * k;
    rpos.y += (cpos.y - rpos.y) * k;
    dot.style.transform = `translate3d(${cpos.x}px, ${cpos.y}px, 0)`;
    ring.style.transform = `translate3d(${rpos.x}px, ${rpos.y}px, 0)`;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
