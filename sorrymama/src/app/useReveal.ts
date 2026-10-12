import { useEffect, type RefObject } from 'react';

/** Adds `.in` once the element is a third into view: the one scroll-linked reveal outside the hero. */
export function useReveal(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('in'); return; }
    el.classList.add('will-reveal');
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.28 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
