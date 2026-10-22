import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, whenVisible } from './anim';
import { POTIONS } from './data';
import { debounce } from './hero';
import './night.css';

gsap.registerPlugin(ScrollTrigger);

// The night half of the site. The grimoire hero stays a page of ink; scrolling
// pours the potion out of the cauldron: a green-rimmed circle grows from the
// liquid until the photo of the bar fills the screen. After that everything is
// large photographs on a dark ground, as in a real bar's site.

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;

let openST: ScrollTrigger | null = null;

// The potion surface: the liquid ellipse in art/cauldron.ts (rx = RIM_RX - 6).
const SURFACE = 'ellipse.potion[rx="244"]';

function buildOpening() {
  const opening = $('[data-opening]');
  const hero = $('.hero', opening);
  const art = $<SVGSVGElement>('.hero-art', hero);
  const copy = $('.hero-copy', hero);
  const margin = $('.hero-margin', hero);
  const view = $('.portal-view');
  const rim = $('.portal-rim');
  const img = $('.portal-img');
  const text = $('.portal-copy');
  const hint = $('.portal-hint');
  const liquid = art.querySelector(SURFACE);
  if (reduced || !liquid) return;
  opening.classList.add('is-live');

  let tl: gsap.core.Timeline | null = null;
  const st = { r: 0 };
  let cx = 0, cy = 0;
  const clip = () => {
    const r = st.r;
    view.style.clipPath = `circle(${r}px at ${cx}px ${cy}px)`;
    rim.style.clipPath = `circle(${r > 0 ? r * 1.05 + 30 * Math.min(1, r / 60) : 0}px at ${cx}px ${cy}px)`;
  };

  const setup = () => {
    if (tl) {
      tl.scrollTrigger?.kill(true);
      tl.kill();
      gsap.set([art, copy, margin, img, text, hint, rim], { clearProps: 'all' });
    }
    // the CSS centres the art with translateX(-50%); GSAP owns that transform from here
    gsap.set(art, { x: 0, xPercent: -50 });
    const o = opening.getBoundingClientRect();
    const a = art.getBoundingClientRect();
    const l = liquid.getBoundingClientRect();
    const s = { x: l.left + l.width / 2, y: l.top + l.height / 2 };
    cx = s.x - o.left;
    cy = s.y - o.top;
    const R = Math.hypot(Math.max(cx, o.width - cx), Math.max(cy, o.height - cy)) + 60;
    st.r = 0;
    clip();
    gsap.set(art, { transformOrigin: `${s.x - a.left}px ${s.y - a.top}px` });
    tl = gsap.timeline({
      defaults: { ease: 'none' },
      // rebuilt after the triggers below it exist, so it must still be measured first
      scrollTrigger: { trigger: opening, start: 'top top', end: () => `+=${Math.round(innerHeight * 1.4)}`, pin: true, scrub: 0.7, anticipatePin: 1, refreshPriority: 1 },
    });
    tl.to([copy, margin], { autoAlpha: 0, y: -40, duration: 0.25 }, 0)
      .to(art, { scale: 1.7, duration: 1, ease: 'power1.in' }, 0)
      .to(st, { r: R, duration: 0.78, ease: 'power2.in', onUpdate: clip }, 0.1)
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 0.9, ease: 'power1.out' }, 0.1)
      .to(rim, { autoAlpha: 0, duration: 0.12 }, 0.84)
      .fromTo(text, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.8)
      .fromTo(hint, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.9);
    openST = tl.scrollTrigger ?? null;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  };
  setup();
  // webfonts can move the hero copy and art; measure again once everything is in
  addEventListener('load', setup);
  // phones fire resize for the address bar; only a real width change rebuilds
  let w = innerWidth;
  addEventListener('resize', debounce(() => { if (innerWidth !== w) { w = innerWidth; setup(); } }, 250));
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
    if (openST) return scrollY >= openST.start + (openST.end - openST.start) * 0.7;
    return portal.getBoundingClientRect().top <= Y;
  };
  const sync = () => top.classList.toggle('dark', dark());
  addEventListener('scroll', sync, { passive: true });
  sync();
}

export function buildNight() {
  buildMenu();
  buildOpening();
  buildGallery();
  buildReveals();
  playVideos();
  darkTop();
  // fonts and lazy photos change heights; let the pins re-measure once everything is in
  addEventListener('load', () => ScrollTrigger.refresh());
}
