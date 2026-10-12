import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { heroLayout, type Box } from './layout';

export type HeroRefs = {
  track: RefObject<HTMLElement>;
  stage: RefObject<HTMLDivElement>;
  day: RefObject<HTMLImageElement>;
  daySoft: RefObject<HTMLImageElement>;
  front: RefObject<HTMLImageElement>;
  title: RefObject<HTMLHeadingElement>;
  masthead: RefObject<HTMLDivElement>;
  nightSoft: RefObject<HTMLImageElement>;
  night: RefObject<HTMLImageElement>;
  scrim: RefObject<HTMLDivElement>;
  chapter: RefObject<HTMLDivElement>;
};

const put = (el: HTMLElement, b: Box) => {
  el.style.left = `${b.x}px`; el.style.top = `${b.y}px`;
  el.style.width = `${b.w}px`; el.style.height = `${b.h}px`;
};

// how far into the track the reader scrolls before the passage takes over (share of the track = of a screen)
const ARM = 0.12;
const FORWARD = 1.5, BACK = 1.05; // seconds

/**
 * Canopy occlusion match cut, played rather than scrubbed: the reader starts it with a short scroll
 * and it runs to the end on its own, so nobody is left holding a half-blurred frame.
 *   0.00–0.62 the camera travels into the crown; the wordmark lifts and goes
 *   0.32–0.57 the near foliage goes out of focus
 *   0.50–0.72 soft day blossom → soft night blossom (the hidden cut)
 *   0.60–1.45 the camera eases back into the lounge; focus returns at 0.78
 *   1.15–1.55 the chapter heading arrives
 * Scrolling back up past the armed point rewinds it the same way.
 */
export function useBlossomTimeline(r: HeroRefs, onTone: (night: boolean) => void) {
  useEffect(() => {
    const stage = r.stage.current!, track = r.track.current!;
    const el = {
      day: r.day.current!, daySoft: r.daySoft.current!, front: r.front.current!, title: r.title.current!,
      masthead: r.masthead.current!, nightSoft: r.nightSoft.current!, night: r.night.current!,
      scrim: r.scrim.current!, chapter: r.chapter.current!,
    };
    let L = heroLayout(stage.clientWidth, stage.clientHeight);
    const apply = () => {
      L = heroLayout(stage.clientWidth, stage.clientHeight);
      for (const e of [el.day, el.front, el.daySoft]) put(e, L.day);
      const t = el.title.style;
      if (L.wordmark) { t.left = `${L.wordmark.x}px`; t.top = `${L.wordmark.y}px`; t.fontSize = `${L.wordmark.size}px`; }
      else { t.left = t.top = t.fontSize = ''; }
      for (const e of [el.night, el.nightSoft]) put(e, L.night);
      // the sky, the cut-out front and the soft plate share one box and scale about the tree together
      const f = L.dayFocus;
      for (const e of [el.day, el.front, el.daySoft]) gsap.set(e, { transformOrigin: `${f.x - L.day.x}px ${f.y - L.day.y}px` });
      gsap.set([el.night, el.nightSoft], { transformOrigin: '0 0' });
    };
    apply();

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ro = new ResizeObserver(apply);
      ro.observe(stage);
      return () => ro.disconnect();
    }

    // night "near" state expressed as a transform of its rest box
    const near = () => ({ x: L.nightNear.x - L.night.x, y: L.nightNear.y - L.night.y, scale: L.nightNear.w / L.night.w });
    const dn = () => L.dayNear;
    const day = [el.day, el.front, el.daySoft];

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' }, onUpdate: () => onTone(tl.progress() > 0.45) });
    tl.to(el.masthead, { autoAlpha: 0, y: 10, duration: 0.25 }, 0);
    tl.fromTo(day, { scale: 1, x: 0, y: 0 }, { scale: () => dn().scale, x: () => dn().x, y: () => dn().y, duration: 0.62, ease: 'power2.in' }, 0);
    tl.fromTo(el.title, { y: 0, scale: 1 }, { y: -12, scale: 1.04, duration: 0.4, ease: 'sine.in' }, 0);
    tl.to(el.title, { autoAlpha: 0, duration: 0.18 }, 0.22);
    tl.fromTo(el.daySoft, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: 'sine.in' }, 0.32);
    // the hidden cut, soft blossom into soft blossom
    tl.fromTo(el.nightSoft, { autoAlpha: 0, ...near() }, { autoAlpha: 1, duration: 0.22, ease: 'sine.inOut' }, 0.5);
    tl.fromTo(el.night, { autoAlpha: 0, ...near() }, { autoAlpha: 0, duration: 0.001 }, 0.5);
    tl.set(day, { autoAlpha: 0 }, 0.72);
    tl.to([el.night, el.nightSoft], { x: 0, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' }, 0.6);
    tl.to(el.night, { autoAlpha: 1, duration: 0.35, ease: 'sine.inOut' }, 0.78);
    // one exposure scalar for the passage: dusk, held through the cut, eased once the room is lit
    tl.fromTo(el.scrim, { opacity: 0 }, { opacity: 0.32, duration: 0.3, ease: 'sine.in' }, 0.2);
    tl.to(el.scrim, { opacity: 0.38, duration: 0.2 }, 0.5);
    tl.to(el.scrim, { opacity: 0.18, duration: 0.45, ease: 'sine.out' }, 1.0);
    tl.fromTo(el.chapter, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.15);

    // ── scroll control ──
    const root = document.documentElement;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const travel = () => track.offsetHeight - stage.offsetHeight;
    const local = () => window.scrollY - track.offsetTop;
    let night = false, busy = false, jumping = false;
    const playing: gsap.core.Tween[] = [];

    const block = (e: Event) => { if (busy) e.preventDefault(); };
    const KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
    const blockKeys = (e: KeyboardEvent) => { if (busy && KEYS.has(e.key)) e.preventDefault(); };
    const instant = (y: number) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });

    const go = (toNight: boolean) => {
      busy = true; night = toNight;
      if (coarse) root.classList.add('hero-busy'); // stops touch momentum fighting the glide
      const dur = toNight ? FORWARD : BACK;
      const glide = { y: window.scrollY };
      const target = track.offsetTop + (toNight ? travel() : 0);
      playing.push(
        gsap.to(tl, { progress: toNight ? 1 : 0, duration: dur, ease: 'none' }),
        gsap.to(glide, {
          y: target, duration: dur * 0.85, ease: 'power2.inOut', onUpdate: () => instant(glide.y),
          onComplete: () => { busy = false; playing.length = 0; root.classList.remove('hero-busy'); },
        }),
      );
    };
    // snap without animation: anchors, reloads mid-page, resizes
    const settle = () => {
      const y = local(), t = travel();
      night = y >= t * 0.5;
      tl.progress(night ? 1 : 0);
    };
    const onScroll = () => {
      if (busy || jumping) return;
      const y = local(), t = travel();
      if (!night && y >= t) { settle(); return; }          // arrived from far below or by a jump
      if (!night && y > t * ARM) go(true);
      else if (night && y >= 0 && y < t * (1 - ARM)) go(false);
    };
    // in-page links pass straight through the hero in the state they are heading for
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const dest = document.querySelector(a.getAttribute('href')!) as HTMLElement | null;
      if (!dest) return;
      playing.forEach((p) => p.kill()); playing.length = 0; busy = false; root.classList.remove('hero-busy');
      jumping = true;
      night = dest.offsetTop >= track.offsetTop + travel();
      tl.progress(night ? 1 : 0);
      const done = () => { jumping = false; window.removeEventListener('scrollend', done); };
      window.addEventListener('scrollend', done);
      setTimeout(done, 1400);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    window.addEventListener('keydown', blockKeys);
    document.addEventListener('click', onClick);

    const ro = new ResizeObserver(() => {
      const p = tl.progress();
      tl.progress(0); apply(); tl.invalidate(); tl.progress(p);
    });
    ro.observe(stage);
    settle();

    let alive = true;
    Promise.all([el.day.decode(), document.fonts.ready]).catch(() => {}).then(() => { if (alive && !busy) { apply(); tl.invalidate(); settle(); } });
    return () => {
      alive = false; ro.disconnect();
      playing.forEach((p) => p.kill()); tl.kill(); root.classList.remove('hero-busy');
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
      window.removeEventListener('keydown', blockKeys);
      document.removeEventListener('click', onClick);
    };
    // refs are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
