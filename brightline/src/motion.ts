// One motion system for the whole page: Lenis for the scroll itself, one rAF
// loop that writes scroll progress into --p on [data-track] elements (0 when
// the top meets the bottom of the viewport, 1 when the bottom leaves the top),
// a one-shot `in` class for reveals, and the header's light/dark state taken
// from whichever [data-theme] section sits under it.
import Lenis from 'lenis';

export const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HEADER_H = 68;

let lenis: Lenis | null = null;

/** Height of the fixed header right now (it is shorter on phones). */
const headerHeight = () => document.querySelector<HTMLElement>('.hdr')?.offsetHeight ?? HEADER_H;

export function scrollToId(id: string, immediate = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = id === 'top' ? 0 : el.getBoundingClientRect().top + scrollY - headerHeight() + 1;
  if (lenis) lenis.scrollTo(top, { duration: 1.2, immediate, force: true });
  else window.scrollTo({ top, behavior: immediate || reduceMotion() ? 'auto' : 'smooth' });
}

/** Anchor navigation: a real history entry, then a smooth scroll that clears the header. */
export function navigateTo(id: string) {
  const hash = id === 'top' ? location.pathname + location.search : `#${id}`;
  if ((id === 'top' && location.hash) || (id !== 'top' && location.hash !== hash)) history.pushState(null, '', hash);
  scrollToId(id);
}

export function lockScroll(lock: boolean) {
  if (lock) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle('locked', lock);
}

export function startMotion(onTheme: (theme: 'dark' | 'light') => void) {
  const reduce = reduceMotion();
  const root = document.documentElement;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (reduce) root.classList.add('reduce');
  else lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });

  // back / forward between anchors scroll the page like a click would
  const onPop = () => scrollToId(location.hash.slice(1) || 'top');
  addEventListener('popstate', onPop);
  if (location.hash) requestAnimationFrame(() => scrollToId(location.hash.slice(1), true));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  const tracked = [...document.querySelectorAll<HTMLElement>('[data-track]')];
  const themed = [...document.querySelectorAll<HTMLElement>('[data-theme]')];
  let theme = '';
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
    }
    const probe = HEADER_H;
    for (const el of themed) {
      const r = el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) {
        const next = el.dataset.theme as 'dark' | 'light';
        if (next !== theme) {
          theme = next;
          onTheme(next);
        }
        break;
      }
    }
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener('popstate', onPop);
    lenis?.destroy();
    lenis = null;
  };
}
