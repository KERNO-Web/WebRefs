// The whole motion system: Lenis for the scroll itself, one rAF loop that
// writes each tracked section's scroll progress into --p (0 when its top meets
// the bottom of the viewport, 1 when its bottom leaves the top) and --pin
// (progress through a sticky section), plus a one-shot `in` class for reveals.
import Lenis from 'lenis';

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis: Lenis | null = null;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
}

export function startMotion() {
  const reduce = reduceMotion();
  const root = document.documentElement;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (reduce) root.classList.add('reduce');
  else lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  const tracked = [...document.querySelectorAll<HTMLElement>('[data-track]')];
  let raf = 0;
  const tick = (t: number) => {
    raf = requestAnimationFrame(tick);
    lenis?.raf(t);
    const vh = innerHeight;
    for (const el of tracked) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      const p = (vh - r.top) / (vh + r.height);
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
      const span = r.height - vh;
      if (span > 0) el.style.setProperty('--pin', Math.min(1, Math.max(0, -r.top / span)).toFixed(4));
    }
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    lenis?.destroy();
    lenis = null;
  };
}

/** Index of the item whose box crosses the given line of the viewport (0..1). */
export function activeIndex(items: (HTMLElement | null)[], line = 0.5) {
  const y = innerHeight * line;
  let best = 0;
  items.forEach((el, i) => {
    if (el && el.getBoundingClientRect().top <= y) best = i;
  });
  return best;
}
