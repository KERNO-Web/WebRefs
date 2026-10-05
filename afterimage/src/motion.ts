// The whole motion system: one rAF loop that writes each section's scroll
// progress into --p (0 when its top meets the bottom of the viewport, 1 when
// its bottom leaves the top) and --pin (progress through a sticky section),
// a smoothed scroll velocity into --v / --va for the afterimage trails, plus a
// one-shot reveal class when an element enters.

export function startMotion() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (reduce) root.classList.add('reduce');

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  const tracked = [...document.querySelectorAll<HTMLElement>('[data-track]')];
  let px = 0;
  let py = 0;
  let tx = 0;
  let ty = 0;
  const onMove = (e: PointerEvent) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let lastY = scrollY;
  let vel = 0;
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const vh = innerHeight;
    for (const el of tracked) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = (vh - r.top) / (vh + r.height);
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
      const span = r.height - vh;
      if (span > 0) el.style.setProperty('--pin', Math.min(1, Math.max(0, -r.top / span)).toFixed(4));
    }
    // scroll velocity, eased, in "viewports per frame"-ish units clamped to ±1
    const dy = scrollY - lastY;
    lastY = scrollY;
    vel += (Math.max(-1, Math.min(1, dy / 60)) - vel) * 0.12;
    if (Math.abs(vel) < 0.001) vel = 0;
    px += (tx - px) * 0.06;
    py += (ty - py) * 0.06;
    root.style.setProperty('--v', reduce ? '0' : vel.toFixed(4));
    root.style.setProperty('--va', reduce ? '0' : Math.abs(vel).toFixed(4));
    root.style.setProperty('--sy', String(scrollY));
    root.style.setProperty('--mx', reduce ? '0' : px.toFixed(4));
    root.style.setProperty('--my', reduce ? '0' : py.toFixed(4));
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener('pointermove', onMove);
  };
}
