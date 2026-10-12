import { useEffect, type RefObject } from 'react';

/** Adds `.in` once the element is well into view: the one scroll-linked reveal outside the hero. */
export function useReveal(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.classList.add('in'); return; }
    el.classList.add('will-reveal');
    // fires when the section's top passes the lower quarter of the screen, whatever its height
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
}
