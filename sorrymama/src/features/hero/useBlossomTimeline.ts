import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { heroLayout, type Box, type HeroLayout } from './layout';

gsap.registerPlugin(ScrollTrigger);

export type HeroRefs = {
  track: RefObject<HTMLElement>;
  stage: RefObject<HTMLDivElement>;
  day: RefObject<HTMLImageElement>;
  crown: RefObject<HTMLImageElement>;
  dusk: RefObject<HTMLDivElement>;
  title: RefObject<HTMLHeadingElement>;
  info: RefObject<HTMLDivElement>;
  veil: RefObject<HTMLImageElement>;
  curtain: RefObject<HTMLImageElement>;
  night: RefObject<HTMLImageElement>;
  caption: RefObject<HTMLDivElement>;
};

const put = (el: HTMLElement, b: Box) => {
  el.style.left = `${b.x}px`; el.style.top = `${b.y}px`;
  el.style.width = `${b.w}px`; el.style.height = `${b.h}px`;
};

/**
 * One scroll timeline, p = 0…1 over the pinned track:
 *   0.00–0.18 day settles, camera eases toward the crown
 *   0.18–0.38 lounge blossoms enter as a near foreground and cross the wordmark
 *   0.38–0.58 they close the frame; under full cover the terrace becomes the lounge
 *   0.58–0.80 the curtain clears to the edge, the room settles
 *   0.80–1.00 the night caption arrives; the section below continues the same photograph
 */
export function useBlossomTimeline(r: HeroRefs, onLayout: (L: HeroLayout) => void, onTone: (night: boolean) => void) {
  useEffect(() => {
    const stage = r.stage.current!, track = r.track.current!;
    const el = {
      day: r.day.current!, crown: r.crown.current!, dusk: r.dusk.current!, title: r.title.current!, info: r.info.current!,
      veil: r.veil.current!, curtain: r.curtain.current!, night: r.night.current!, caption: r.caption.current!,
    };
    let L = heroLayout(stage.clientWidth, stage.clientHeight);
    const apply = () => {
      L = heroLayout(stage.clientWidth, stage.clientHeight);
      put(el.day, L.day); put(el.crown, L.crown); put(el.night, L.night); put(el.veil, L.veil);
      el.curtain.style.width = `${L.curtain.w}px`; el.curtain.style.height = `${L.curtain.h}px`;
      // the crown is cut from the day photo: it must scale about the same screen point
      gsap.set(el.day, { transformOrigin: `${L.dayFocus.x - L.day.x}px ${L.dayFocus.y - L.day.y}px` });
      gsap.set(el.crown, { transformOrigin: `${L.dayFocus.x - L.crown.x}px ${L.dayFocus.y - L.crown.y}px` });
      gsap.set(el.night, { transformOrigin: `${L.nightFocus.x - L.night.x}px ${L.nightFocus.y - L.night.y}px` });
      onLayout(L);
    };
    apply();

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ro = new ResizeObserver(apply);
      ro.observe(stage);
      return () => ro.disconnect();
    }

    const W = () => stage.clientWidth, H = () => stage.clientHeight;
    // curtain path: keyframes as fractions of the frame, phones use a taller, nearer sheet
    const cx = (d: number, m: number) => () => (L.mobile ? m : d) * W();
    const cy = (d: number, m: number) => () => (L.mobile ? m : d) * H();

    const ctx = gsap.context(() => {
      gsap.set(el.curtain, { transformOrigin: '0 0' });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track, start: 'top top', end: 'bottom bottom',
          scrub: 0.6, invalidateOnRefresh: true,
          onRefreshInit: apply,
          onUpdate: (st) => onTone(st.progress > 0.5),
        },
      });

      // day camera: a slow approach, nothing more
      tl.fromTo([el.day, el.crown], { scale: 1 }, { scale: 1.1, duration: 0.53, ease: 'power1.in' }, 0);
      tl.fromTo(el.dusk, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32 }, 0.18);
      tl.to(el.info, { autoAlpha: 0, y: -12, duration: 0.1 }, 0.08);
      // the wordmark stays put; it is covered, then (only then) fades
      tl.to(el.title, { y: -12, duration: 0.38 }, 0);
      tl.to(el.title, { autoAlpha: 0, duration: 0.1 }, 0.37);

      tl.fromTo(el.curtain,
        { x: cx(1.02, 1.02), y: cy(0.3, 0.32), scale: 1, autoAlpha: 1 },
        { x: cx(0.6, 0.35), y: cy(0.18, 0.26), scale: 1.06, duration: 0.18, ease: 'power1.in' }, 0);
      tl.to(el.curtain, { x: cx(0.02, -0.55), y: cy(-0.08, 0.04), scale: 1.3, duration: 0.2 }, 0.18);
      tl.to(el.curtain, { x: cx(-0.18, -1.2), y: cy(-0.35, -0.16), scale: 1.75, duration: 0.16 }, 0.38);
      tl.to(el.curtain, { x: cx(-1.15, -3.2), y: cy(-0.7, -0.8), scale: 2.4, duration: 0.24, ease: 'power1.in' }, 0.54);
      tl.to(el.curtain, { autoAlpha: 0, duration: 0.06 }, 0.74);

      // dense canopy behind the curtain closes the remaining gaps around the cut
      tl.fromTo(el.veil, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1.04, duration: 0.1 }, 0.4);
      tl.to(el.veil, { autoAlpha: 0, scale: 1, duration: 0.14 }, 0.56);

      // the cut itself, fully covered
      tl.set([el.day, el.crown, el.dusk], { autoAlpha: 0 }, 0.53);
      tl.fromTo(el.night, { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, duration: 0.03 }, 0.5);
      tl.to(el.night, { scale: 1, duration: 0.47, ease: 'power2.out' }, 0.53);

      tl.fromTo(el.caption, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.84);
      tl.set({}, {}, 1);
    }, stage);

    // measure once the real pixels and the display face are in
    let alive = true;
    Promise.all([el.day.decode(), el.night.decode(), document.fonts.ready]).catch(() => {}).then(() => alive && ScrollTrigger.refresh());

    return () => { alive = false; ctx.revert(); };
    // refs are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
