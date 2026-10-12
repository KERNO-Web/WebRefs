import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroLayout, type Box, type HeroLayout } from './layout';

gsap.registerPlugin(ScrollTrigger);

export type HeroRefs = {
  track: RefObject<HTMLElement>;
  stage: RefObject<HTMLDivElement>;
  day: RefObject<HTMLImageElement>;
  daySoft: RefObject<HTMLImageElement>;
  branch: RefObject<HTMLImageElement>;
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

/**
 * Canopy occlusion match cut — one master timeline, p = 0…1, intact photographs only:
 *   0.00–0.14 the day cover holds
 *   0.14–0.35 slow approach to the tree (≤1.13×, what the 2× master supports)
 *   0.35–0.50 the canopy fills the frame and goes out of focus as it nears the lens;
 *             the near foliage passes over the wordmark
 *   0.50–0.64 concealed cut: soft day blossom → soft night blossom, warmer exposure
 *   0.64–0.84 focus returns and the camera eases back into the lounge
 *   0.84–1.00 the night frame holds; the chapter heading arrives
 * One scrim carries exposure across the whole run and never lets go before the room is lit.
 */
export function useBlossomTimeline(r: HeroRefs, onLayout: (L: HeroLayout) => void, onTone: (night: boolean) => void) {
  useEffect(() => {
    const stage = r.stage.current!, track = r.track.current!;
    const el = {
      day: r.day.current!, daySoft: r.daySoft.current!, branch: r.branch.current!, title: r.title.current!,
      masthead: r.masthead.current!, nightSoft: r.nightSoft.current!, night: r.night.current!,
      scrim: r.scrim.current!, chapter: r.chapter.current!,
    };
    let L = heroLayout(stage.clientWidth, stage.clientHeight);
    const apply = () => {
      L = heroLayout(stage.clientWidth, stage.clientHeight);
      for (const e of [el.day, el.daySoft]) put(e, L.day);
      put(el.branch, L.branch);
      for (const e of [el.night, el.nightSoft]) put(e, L.night);
      // day layers scale about the tree; the branch must keep registration with its photograph
      const f = L.dayFocus;
      for (const e of [el.day, el.daySoft]) gsap.set(e, { transformOrigin: `${f.x - L.day.x}px ${f.y - L.day.y}px` });
      gsap.set(el.branch, { transformOrigin: `${f.x - L.branch.x}px ${f.y - L.branch.y}px` });
      gsap.set([el.night, el.nightSoft], { transformOrigin: '0 0' });
      onLayout(L);
    };
    apply();

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ro = new ResizeObserver(apply);
      ro.observe(stage);
      return () => ro.disconnect();
    }

    // night "near" state expressed as a transform of its rest box
    const near = () => ({ x: L.nightNear.x - L.night.x, y: L.nightNear.y - L.night.y, scale: L.nightNear.w / L.night.w });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onRefreshInit: apply,
          onUpdate: (st) => onTone(st.progress > 0.55),
        },
      });
      const day = [el.day, el.daySoft, el.branch];

      // 0.14–0.35 approach, 0.35–0.52 into the canopy
      // the camera drifts toward the crown, then travels into it until blossom fills the frame
      const dn = () => L.dayNear;
      tl.fromTo(day, { scale: 1, x: 0, y: 0 }, { scale: 1.13, x: () => dn().x * 0.15, y: () => dn().y * 0.15, duration: 0.21, ease: 'sine.inOut' }, 0.14);
      tl.to(day, { scale: () => dn().scale, x: () => dn().x, y: () => dn().y, duration: 0.14, ease: 'power1.in' }, 0.35);
      // focus pulls to the near foliage; it covers the wordmark, which only then lets go
      tl.fromTo(el.daySoft, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1, ease: 'sine.in' }, 0.39);
      tl.to(el.title, { y: -10, scale: 1.02, duration: 0.3, ease: 'sine.in' }, 0.14);
      tl.to(el.title, { autoAlpha: 0, duration: 0.07 }, 0.41);
      tl.to(el.masthead, { autoAlpha: 0, y: 10, duration: 0.08 }, 0.12);

      // 0.50–0.62 the concealed cut, soft blossom into soft blossom
      tl.fromTo(el.nightSoft, { autoAlpha: 0, ...near() }, { autoAlpha: 1, duration: 0.12, ease: 'sine.inOut' }, 0.5);
      tl.set(day, { autoAlpha: 0 }, 0.625);
      // 0.56–0.84 ease back into the room; focus returns once the frame has room to be sharp
      tl.fromTo(el.night, { autoAlpha: 0, ...near() }, { autoAlpha: 0, duration: 0.001 }, 0.5);
      tl.to([el.night, el.nightSoft], { x: 0, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }, 0.56);
      tl.to(el.night, { autoAlpha: 1, duration: 0.12, ease: 'sine.inOut' }, 0.64);

      // one exposure scalar for the whole passage: dusk, held through the cut, eased only once lit
      tl.fromTo(el.scrim, { opacity: 0 }, { opacity: 0.3, duration: 0.2, ease: 'sine.in' }, 0.3);
      tl.to(el.scrim, { opacity: 0.38, duration: 0.1 }, 0.48);
      tl.to(el.scrim, { opacity: 0.38, duration: 0.14 }, 0.58);
      tl.to(el.scrim, { opacity: 0.2, duration: 0.14, ease: 'sine.out' }, 0.72);

      tl.fromTo(el.chapter, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.85);
      tl.set({}, {}, 1);
    }, stage);

    let alive = true;
    Promise.all([el.day.decode(), el.night.decode(), document.fonts.ready]).catch(() => {}).then(() => alive && ScrollTrigger.refresh());
    return () => { alive = false; ctx.revert(); };
    // refs are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
