import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, whenVisible } from './anim';
import { POTIONS } from './data';
import { DOOR, type Cellar } from './art/cellar';
import { clamp } from './ink';
import { debounce } from './hero';
import './night.css';

gsap.registerPlugin(ScrollTrigger);

// The night half of the site. The grimoire hero stays a page of ink; scrolling
// walks down the cellar stairs into the bar. After that everything is large
// photographs on a dark ground, as in a real bar's site.

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;

let openST: ScrollTrigger | null = null;
/** how far the descent has played, 0..1; the top bar goes dark once the bar is in */
let shown = 0;

// The descent. A short scroll starts it and it plays on by itself (as on Sorry Mama), so
// nobody is left holding a half-open door; scrolling faster drives it faster, up to a
// speed limit. Up to the moment the bar's door fills the screen it is drawn frame by
// frame like the rest of the hero (the doors swing, then each frame is one step down);
// at that moment the photo inside the door is swapped for the same photo in the page,
// pixel for pixel, and it opens out to the whole screen.
const FRAMES = 28;
const VB = { x: 0, y: -60, w: 1000, h: 1080 };
/** share of the pinned track the page moves before the descent takes over, and back before it rewinds */
const ARM = 0.06;
const FORWARD = 1.6, BACK = 1.1; // seconds for a full run on its own
const MIN_FORWARD = 1.15, MIN_BACK = 0.85; // however hard the reader scrolls
const DAMP = 0.5; // wheel inside the opening moves the page at this share of its usual speed
/** the part of the run drawn in frames; after it, the photo opens out smoothly */
const STEPS_END = 0.74;

function buildOpening(cellar: Cellar) {
  const opening = $('[data-opening]');
  const hero = $('.hero', opening);
  const art = $<SVGSVGElement>('.hero-art', hero);
  const view = $('.portal-view');
  const img = $('.portal-img');
  const text = $('.portal-copy');
  const hint = $('.portal-hint');
  if (reduced) { cellar.open(1.4); cellar.light(1); return; }
  opening.classList.add('is-live');

  // the zoom closes in on the straight part of the doorway and brings it to the screen's centre,
  // and stops the moment the door's picture covers the screen
  const D = { x: DOOR.x, y: DOOR.bottom - (DOOR.h - DOOR.hw) / 2 };
  const PH = { x: DOOR.x - DOOR.hw * 2.2, y: DOOR.bottom - DOOR.h - 10, w: DOOR.hw * 4.4, h: DOOR.h + 20 };
  let box = { left: 0, top: 0 }, k = 1, cover = 10, p0 = { x: 0, y: 0 };
  const measure = () => {
    const a = art.getBoundingClientRect();
    box = { left: a.left, top: a.top };
    k = a.width / VB.w;
    p0 = { x: a.left + (D.x - VB.x) * k, y: a.top + (D.y - VB.y) * k };
    cover = Math.max(innerWidth / 2 / (DOOR.hw * k), innerHeight / 2 / (((DOOR.h - DOOR.hw) / 2) * k)) * 1.03;
  };
  measure();

  const fades = () => Array.from(hero.children).filter((n) => n !== art) as HTMLElement[];
  const ease = (t: number) => 1 - (1 - t) ** 2;
  // where the door's picture lands on screen at zoom S with the door centre at screen point P
  const photoAt = (S: number, P: { x: number; y: number }) => ({
    x: P.x + (PH.x - D.x) * k * S, y: P.y + (PH.y - D.y) * k * S, w: PH.w * k * S, h: PH.h * k * S,
  });
  const centre = () => ({ x: innerWidth / 2, y: innerHeight / 2 });

  let last = -1;
  const render = (u: number) => {
    // frames until the door covers the screen, smooth after
    const q = u < STEPS_END ? Math.round((u / STEPS_END) * FRAMES) / FRAMES * STEPS_END : u;
    if (q === last) return;
    last = q;
    const o = clamp(q / 0.24);
    cellar.open(0.85 + 0.67 * ease(o));
    cellar.light(o);
    const z = clamp((q - 0.16) / (STEPS_END - 0.16));
    const S = Math.pow(cover, Math.pow(z, 1.25));
    const c = centre();
    const P = { x: p0.x + (c.x - p0.x) * ease(z), y: p0.y + (c.y - p0.y) * ease(z) };
    // a step down every other frame: the view dips and comes back
    const bob = z > 0 && z < 1 && Math.round((q / STEPS_END) * FRAMES) % 2 ? 6 : 0;
    const vx = D.x - (P.x - box.left) / (k * S), vy = D.y - (P.y + bob - box.top) / (k * S);
    art.setAttribute('viewBox', `${vx.toFixed(2)} ${vy.toFixed(2)} ${(VB.w / S).toFixed(2)} ${(VB.h / S).toFixed(2)}`);
    fades().forEach((n) => (n.style.opacity = (1 - clamp(q / 0.14)).toFixed(2)));
    hero.classList.toggle('descending', q > 0.06);
    // through the door: the page's copy of the photo takes the door's place and opens out
    const r = clamp((q - STEPS_END) / (1 - STEPS_END - 0.06));
    const inside = q >= STEPS_END;
    view.style.opacity = inside ? '1' : '0';
    if (inside) {
      const from = photoAt(cover, c), e = ease(r);
      Object.assign(img.style, {
        left: `${(from.x * (1 - e)).toFixed(1)}px`, top: `${(from.y * (1 - e)).toFixed(1)}px`,
        width: `${(from.w + (innerWidth - from.w) * e).toFixed(1)}px`, height: `${(from.h + (innerHeight - from.h) * e).toFixed(1)}px`,
      });
    }
    const t = clamp((q - 0.86) / 0.12);
    text.style.opacity = t.toFixed(2);
    text.style.transform = `translateY(${((1 - t) * 40).toFixed(1)}px)`;
    hint.style.opacity = text.style.opacity;
  };

  openST = ScrollTrigger.create({ trigger: opening, start: 'top top', end: () => `+=${Math.round(innerHeight * 1.2)}`, pin: true, anticipatePin: 1, refreshPriority: 1 });
  const st = openST;
  const travel = () => Math.max(1, st.end - st.start);
  const share = () => clamp((scrollY - st.start) / travel());

  // scroll → progress: a self-running clock, or the reader's scroll if that is further along
  let mode: 'out' | 'in' = 'out', from = 0, peak = 0;
  const clock = { p: 0 };
  let run: gsap.core.Tween | null = null;
  const head = (m: 'out' | 'in', s: number) => {
    mode = m; from = peak = s;
    run?.kill();
    clock.p = shown;
    const to = m === 'in' ? 1 : 0;
    run = gsap.to(clock, { p: to, duration: (m === 'in' ? FORWARD : BACK) * Math.abs(to - shown), ease: 'none' });
  };

  // the wheel inside the opening: owned from the first event of a gesture, slowed, eased, and held
  // at the end of the track until the bar is in. Touch, keys and the scrollbar stay native.
  let owned = false, lastWheel = 0, goal = 0, pos = 0, gliding = false, mine = -1;
  addEventListener('wheel', (e: WheelEvent) => {
    if (e.ctrlKey) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    const now = performance.now(), y = scrollY, end = st.end;
    if (now - lastWheel > 220) owned = y < end - 1 || (y <= end + 1 && dy < 0);
    lastWheel = now;
    if (!owned) return;
    e.preventDefault();
    if (!gliding) pos = goal = y;
    goal += dy * (goal < end ? DAMP : 1);
    goal = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, goal));
    if (shown < 0.98 && goal > end) goal = end;
    gliding = true;
  }, { passive: false });
  const glide = () => {
    if (!gliding) return;
    if (mine >= 0 && Math.abs(scrollY - mine) > 3) { gliding = false; mine = -1; return; }
    pos += (goal - pos) * 0.16;
    if (Math.abs(goal - pos) < 0.5) { pos = goal; gliding = false; }
    scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
    mine = gliding ? scrollY : -1;
  };

  let lastT = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    glide();
    const s = share();
    if (mode === 'out') { peak = Math.min(peak, s); if (s >= 1 || s > peak + ARM) head('in', s); }
    else { peak = Math.max(peak, s); if (s <= 0 || s < peak - ARM) head('out', s); }
    const byScroll = mode === 'in' ? (from >= 1 ? 1 : (s - from) / (1 - from)) : (from <= 0 ? 0 : s / from);
    const target = mode === 'in' ? Math.max(clock.p, byScroll) : Math.min(clock.p, byScroll);
    let next = Math.abs(target - shown) < 1e-4 ? target : shown + (target - shown) * 0.25;
    const cap = dt / (next > shown ? MIN_FORWARD : MIN_BACK);
    next = Math.max(shown - cap, Math.min(shown + cap, next));
    if (next !== shown) { shown = next; render(shown); }
  });
  // a reload or a link that lands below the opening starts in the bar
  if (share() >= 1) { mode = 'in'; from = peak = 1; clock.p = shown = 1; }
  render(shown);

  // phones fire resize for the address bar; only a real width change re-measures
  let wdt = innerWidth;
  addEventListener('resize', debounce(() => { if (innerWidth !== wdt) { wdt = innerWidth; measure(); last = -1; render(shown); } }, 250));
}

function buildMenu() {
  const grid = $('[data-menu]');
  grid.innerHTML = POTIONS.map((p, i) => `
    <article class="dish${i === 0 ? ' dish-hero' : ''} reveal" tabindex="0">
      <div class="dish-ph">
        <img src="potions/${p.id}.jpg" alt="${p.name}: ${p.base}" loading="lazy" width="800" height="1000" />
        ${p.shifts ? `<img class="pink" src="potions/${p.id}-pink.jpg" alt="" loading="lazy" width="800" height="1000" />` : ''}
      </div>
      <div class="dish-top"><span class="dish-num">${p.num}</span>${p.zero ? '<span class="dish-zero">без алкоголя</span>' : ''}${p.shifts ? '<span class="dish-zero">меняет цвет</span>' : ''}</div>
      <div class="dish-body">
        <h3>${p.name}</h3>
        <p class="dish-base">${p.base}</p>
        <div class="dish-more"><div><p>${p.serve}</p><p class="dish-effect">Эффект: ${p.effect}</p></div></div>
        <span class="dish-price">${p.price}&nbsp;₽</span>
      </div>
      <a class="dish-credit" href="${p.credit.source}" target="_blank" rel="noopener">Фото: ${p.credit.author}, ${p.credit.license}</a>
    </article>`).join('');
}

// Interior: on a wide screen the section holds still and the photos drive past
// sideways; on a phone it is a plain swipe strip.
function buildGallery() {
  const sec = $('[data-gal]');
  const pin = $('.gal-pin', sec);
  const track = $('[data-gal-track]', sec);
  if (reduced) return;
  gsap.matchMedia().add('(min-width: 900px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - track.clientWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
    });
  });
}

function buildReveals() {
  if (reduced) return;
  gsap.utils.toArray<HTMLElement>('.reveal').forEach((n) => {
    gsap.from(n, { autoAlpha: 0, y: 70, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: n, start: 'top 88%', once: true } });
  });
  // photos drift slower than the page
  gsap.utils.toArray<HTMLElement>('.night-photo img, .rit-card img, .rit-card video').forEach((n) => {
    gsap.fromTo(n, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: n.parentElement!, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function playVideos() {
  document.querySelectorAll<HTMLVideoElement>('.rit-card video').forEach((v) => {
    if (reduced) return;
    whenVisible(v, () => { v.play().catch(() => undefined); }, () => v.pause(), '10% 0px');
  });
}

// The bar at the top is parchment over the grimoire pages and goes dark over the night sections.
function darkTop() {
  const top = $('.top');
  const portal = $('[data-portal]');
  const hall = $('#hall');
  const Y = 60;
  const dark = () => {
    if (hall.getBoundingClientRect().top <= Y) return false;
    if (openST) return scrollY >= openST.start && shown >= 0.8;
    return portal.getBoundingClientRect().top <= Y;
  };
  // the descent plays on after the scroll stops, so this follows the ticker, not scroll events
  gsap.ticker.add(() => { top.classList.toggle('dark', dark()); });
}

export function buildNight(cellar: Cellar) {
  buildMenu();
  buildOpening(cellar);
  buildGallery();
  buildReveals();
  playVideos();
  darkTop();
  // fonts and lazy photos change heights; let the pins re-measure once everything is in
  addEventListener('load', () => ScrollTrigger.refresh());
}
