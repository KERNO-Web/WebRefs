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

// The descent, drawn frame by frame like the rest of the hero (12 fps, on twos):
// scroll picks a frame, and only a new frame redraws. The doors swing open,
// the light comes up, then each frame is one step down the stairs: the view
// closes in on the bar's door until the door is the whole screen and the
// photograph of the bar takes over.
const FRAMES = 36;
const VB = { x: 0, y: -60, w: 1000, h: 1080 };

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

  // the door's centre stays put on screen while the view closes in on it
  const D = [DOOR.x, DOOR.bottom - DOOR.h / 2];
  let k = 1, end = 20;
  const measure = () => {
    const a = art.getBoundingClientRect();
    k = a.width / VB.w;
    const dx = a.left + (D[0] - VB.x) * k, dy = a.top + (D[1] - VB.y) * k;
    end = Math.max(Math.max(dx, innerWidth - dx) / (DOOR.hw * k), Math.max(dy, innerHeight - dy) / ((DOOR.h / 2) * k)) * 1.6;
  };
  measure();

  const fades = () => Array.from(hero.children).filter((n) => n !== art) as HTMLElement[];
  const ease = (t: number) => 1 - (1 - t) ** 2;
  let last = -1;
  const render = (f: number) => {
    if (f === last) return;
    last = f;
    const u = f / FRAMES;
    const o = clamp(u / 0.3);
    cellar.open(0.85 + 0.67 * ease(o));
    cellar.light(o);
    const z = clamp((u - 0.2) / 0.64);
    const S = Math.pow(end, Math.pow(z, 1.4));
    // a step down every other frame: the view dips and comes back
    const bob = z > 0 && z < 1 && f % 2 ? 7 / (k * S) : 0;
    const w = VB.w / S, h = VB.h / S;
    art.setAttribute('viewBox', `${(D[0] - (D[0] - VB.x) / S).toFixed(2)} ${(D[1] - (D[1] - VB.y) / S + bob).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    const away = (1 - clamp(u / 0.16)).toFixed(2);
    fades().forEach((n) => (n.style.opacity = away));
    // the page's fold and corner shading belong to the parchment, not to the stairwell
    hero.classList.toggle('descending', u > 0.1);
    // through the door: a beat of darkness while the eyes adjust, then the room
    const p = clamp((u - 0.88) / 0.08);
    view.style.opacity = u >= 0.85 ? '1' : '0';
    img.style.opacity = p.toFixed(2);
    img.style.transform = `scale(${(1.1 - 0.1 * p).toFixed(3)})`;
    text.style.opacity = clamp((u - 0.93) / 0.07).toFixed(2);
    text.style.transform = `translateY(${((1 - clamp((u - 0.93) / 0.07)) * 40).toFixed(1)}px)`;
    hint.style.opacity = text.style.opacity;
  };
  render(0);

  openST = ScrollTrigger.create({
    trigger: opening, start: 'top top', end: () => `+=${Math.round(innerHeight * 2)}`,
    pin: true, anticipatePin: 1, refreshPriority: 1,
    onUpdate: (self) => render(Math.round(self.progress * FRAMES)),
  });
  // phones fire resize for the address bar; only a real width change re-measures
  let wdt = innerWidth;
  addEventListener('resize', debounce(() => { if (innerWidth !== wdt) { wdt = innerWidth; measure(); last = -1; render(Math.round((openST?.progress ?? 0) * FRAMES)); } }, 250));
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
    if (openST) return scrollY >= openST.start + (openST.end - openST.start) * 0.9;
    return portal.getBoundingClientRect().top <= Y;
  };
  const sync = () => top.classList.toggle('dark', dark());
  addEventListener('scroll', sync, { passive: true });
  sync();
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
