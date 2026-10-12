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

// Share of the track the page moves before the passage takes over, and back before it rewinds:
// 70svh × 0.065 ≈ 4.5% of a screen of page, ≈ 9% of a screen of wheel at DAMP.
const ARM = 0.065;
const FORWARD = 1.5, BACK = 1.05; // seconds for a full run on its own
// however hard the reader scrolls, a full run never takes less than this (seconds)
const MIN_FORWARD = 1.1, MIN_BACK = 0.85;
// wheel and trackpad inside the hero move the page at this share of their usual speed
const DAMP = 0.5;
// layers that leave the frame keep this much opacity: at exactly 0 the browser drops their pixels and
// re-rasterises them when they come back — that was the black flicker on the way up
const GONE = 0.001;

/**
 * Canopy occlusion match cut. A short scroll starts it and it plays on by itself, so nobody is left
 * holding a half-blurred frame; scrolling faster drives it faster, up to a speed limit. Inside the hero the
 * wheel is slowed and smoothed, and the page waits at the end of the track until the night has landed.
 *   0.00–0.62 the camera travels into the crown; the wordmark lifts and goes
 *   0.32–0.57 the near foliage goes out of focus
 *   0.50–0.72 soft day blossom → soft night blossom (the hidden cut)
 *   0.60–1.45 the camera eases back into the lounge; focus returns at 0.78
 *   1.15–1.55 the chapter heading arrives
 * Scrolling back up by the same short distance rewinds it the same way.
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
    // opacity only, never visibility, and never quite 0 (see GONE)
    tl.fromTo(el.daySoft, { opacity: GONE }, { opacity: 1, duration: 0.25, ease: 'sine.in' }, 0.32);
    // the hidden cut, soft blossom into soft blossom
    tl.fromTo(el.nightSoft, { opacity: GONE, ...near() }, { opacity: 1, duration: 0.22, ease: 'sine.inOut' }, 0.5);
    tl.fromTo(el.night, { opacity: GONE, ...near() }, { opacity: GONE, duration: 0.001 }, 0.5);
    tl.set(day, { opacity: GONE }, 0.72);
    tl.to([el.night, el.nightSoft], { x: 0, y: 0, scale: 1, duration: 0.85, ease: 'power3.out' }, 0.6);
    tl.to(el.night, { opacity: 1, duration: 0.35, ease: 'sine.inOut' }, 0.78);
    // one exposure scalar for the passage: dusk, held through the cut, eased once the room is lit
    tl.fromTo(el.scrim, { opacity: 0 }, { opacity: 0.32, duration: 0.3, ease: 'sine.in' }, 0.2);
    tl.to(el.scrim, { opacity: 0.38, duration: 0.2 }, 0.5);
    tl.to(el.scrim, { opacity: 0.18, duration: 0.45, ease: 'sine.out' }, 1.0);
    tl.fromTo(el.chapter, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }, 1.15);

    // ── scroll → progress ──
    // mode: where the passage is heading. from/peak: scroll share when the mode began / furthest since.
    // shown progress = the self-running clock, or the reader's scroll if that is further along, eased per frame.
    const travel = () => Math.max(1, track.offsetHeight - stage.offsetHeight);
    const share = () => Math.min(1, Math.max(0, (window.scrollY - track.offsetTop) / travel()));
    let mode: 'day' | 'night' = 'day', from = 0, peak = 0, shown = 0;
    const clock = { p: 0 };
    let run: gsap.core.Tween | null = null;
    const head = (m: 'day' | 'night', s: number) => {
      mode = m; from = peak = s;
      run?.kill();
      clock.p = shown;
      const to = m === 'night' ? 1 : 0;
      run = gsap.to(clock, { p: to, duration: (m === 'night' ? FORWARD : BACK) * Math.abs(to - shown), ease: 'none' });
    };
    // ── wheel inside the hero: owned from the first event of a gesture (only then does the browser let
    // the rest of it, inertia included, be taken over), slowed, eased, and held at the end of the track
    // until the night has landed. Touch, keys and the scrollbar stay native.
    const trackEnd = () => track.offsetTop + travel();
    let owned = false, lastWheel = 0, goal = 0, pos = 0, gliding = false, mine = -1;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || document.documentElement.classList.contains('menu-open')) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      const now = performance.now(), y = window.scrollY, end = trackEnd();
      // a gesture is a run of events without a pause; decide once, at its start
      if (now - lastWheel > 220) owned = y < end - 1 || (y <= end + 1 && dy < 0);
      lastWheel = now;
      if (!owned) return;
      e.preventDefault();
      if (!gliding) { pos = goal = y; }
      goal += dy * (goal < end ? DAMP : 1);
      goal = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, goal));
      if (shown < 0.98 && goal > end) goal = end; // the stage stays pinned until the night is in
      gliding = true;
    };
    const glide = () => {
      if (!gliding) return;
      // the reader grabbed the scrollbar or pressed a key: let go
      if (mine >= 0 && Math.abs(window.scrollY - mine) > 3) { gliding = false; mine = -1; return; }
      pos += (goal - pos) * 0.14;
      if (Math.abs(goal - pos) < 0.5) { pos = goal; gliding = false; }
      window.scrollTo({ top: pos, behavior: 'instant' as ScrollBehavior });
      mine = gliding ? window.scrollY : -1;
    };
    window.addEventListener('wheel', onWheel, { passive: false });

    let last = performance.now();
    const tick = () => {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      glide();
      const s = share();
      if (mode === 'day') { peak = Math.min(peak, s); if (s >= 1 || s > peak + ARM) head('night', s); }
      else { peak = Math.max(peak, s); if (s <= 0 || s < peak - ARM) head('day', s); }
      const byScroll = mode === 'night' ? (from >= 1 ? 1 : (s - from) / (1 - from)) : (from <= 0 ? 0 : s / from);
      const target = mode === 'night' ? Math.max(clock.p, byScroll) : Math.min(clock.p, byScroll);
      let next = Math.abs(target - shown) < 1e-4 ? target : shown + (target - shown) * 0.2;
      // speed limit: one hard flick cannot skip the passage
      const cap = dt / (next > shown ? MIN_FORWARD : MIN_BACK);
      next = Math.max(shown - cap, Math.min(shown + cap, next));
      if (next !== shown) { shown = next; tl.progress(shown); }
    };
    // a reload or a link that lands below the hero starts in the night
    if (share() >= 1) { mode = 'night'; from = peak = 1; clock.p = shown = 1; tl.progress(1); }
    gsap.ticker.add(tick);

    const ro = new ResizeObserver(() => {
      const p = tl.progress();
      tl.progress(0); apply(); tl.invalidate(); tl.progress(p);
    });
    ro.observe(stage);

    let alive = true;
    Promise.all([el.day.decode(), document.fonts.ready]).catch(() => {}).then(() => {
      if (!alive) return;
      const p = tl.progress(); tl.progress(0); apply(); tl.invalidate(); tl.progress(p);
    });
    // decode the night ahead of time, off the critical path
    const warm = () => { for (const i of [el.night, el.nightSoft, el.daySoft]) i.decode().catch(() => {}); };
    'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 2500 }) : setTimeout(warm, 1200);
    return () => {
      alive = false; ro.disconnect();
      gsap.ticker.remove(tick); run?.kill(); tl.kill();
      window.removeEventListener('wheel', onWheel);
    };
    // refs are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
