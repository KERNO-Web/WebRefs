import Lenis from 'lenis';
import { useEffect, type RefObject } from 'react';

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

let lenis: Lenis | null = null;

type Speed = { kind: 'speed'; probe: HTMLElement; target: HTMLElement; speed: number };
type Progress = { kind: 'progress'; el: HTMLElement; on?: (p: number) => void; last: number };
const items = new Set<Speed | Progress>();
let started = false;

function frame(t: number) {
  lenis?.raf(t);
  const vh = innerHeight;
  for (const it of items) {
    if (it.kind === 'speed') {
      const r = it.probe.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      const off = r.top + r.height / 2 - vh / 2;
      it.target.style.transform = `translate3d(0, ${(off * it.speed).toFixed(1)}px, 0)`;
    } else {
      const r = it.el.getBoundingClientRect();
      const span = r.height - vh;
      const p = span > 0 ? clamp(-r.top / span) : clamp((vh - r.top) / (vh + r.height));
      if (Math.abs(p - it.last) < 0.0005) continue;
      it.last = p;
      it.el.style.setProperty('--p', p.toFixed(4));
      it.on?.(p);
    }
  }
  requestAnimationFrame(frame);
}

export function startMotion() {
  if (started) return;
  started = true;
  if (!reduced()) lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
  requestAnimationFrame(frame);
}

export const scrollTo = (target: string | number) => {
  if (lenis) lenis.scrollTo(target as never, { duration: 1.6, easing: (x: number) => 1 - Math.pow(1 - x, 4) });
  else if (typeof target === 'number') window.scrollTo({ top: target });
  else document.querySelector(target)?.scrollIntoView();
};
export const lockScroll = (on: boolean) => { if (on) lenis?.stop(); else lenis?.start(); document.documentElement.classList.toggle('locked', on); };

/** Drift an element against the scroll. The probe is measured, the target moves (so movement never feeds back into measurement). */
export function useSpeed(probe: RefObject<HTMLElement>, target: RefObject<HTMLElement>, speed: number) {
  useEffect(() => {
    if (!probe.current || !target.current || reduced()) return;
    const it: Speed = { kind: 'speed', probe: probe.current, target: target.current, speed };
    items.add(it);
    return () => { items.delete(it); };
  }, [probe, target, speed]);
}

/** Writes --p (0..1) on the element: progress through a tall section, or through the viewport for short ones. */
export function useProgress(ref: RefObject<HTMLElement>, on?: (p: number) => void) {
  useEffect(() => {
    if (!ref.current) return;
    const it: Progress = { kind: 'progress', el: ref.current, on, last: -1 };
    items.add(it);
    return () => { items.delete(it); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

/** Marks [data-in] once an element enters the viewport (an attribute, so React re-renders never wipe it). */
export function useReveal(root: RefObject<HTMLElement>, selector = '[data-reveal]') {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const targets = el.querySelectorAll<HTMLElement>(selector);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute('data-in', ''); io.unobserve(e.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [root, selector]);
}
