// Idle life behind the homepage, from always-on to rare:
//   1. three soft light fields drifting behind everything (ambient.css)
//   2. grain and a handful of dust motes in the same back layer
//   3. now and then the violet field swells for a few seconds
// The cards move on their own (previews.ts). Scrolling holds the swell back;
// reduced motion keeps only the still picture. Meant to be noticed late.

const root = document.documentElement;


const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function startAmbient() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('still');
    return;
  }
  const small = matchMedia('(max-width: 760px)').matches;

  /* ---------- dust: a few motes, each with its own path and pace ---------- */

  const dust = document.querySelector<HTMLElement>('.ambient .dust');
  if (dust && !small) {
    const count = 11;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('i');
      const size = rand(1.6, 3.4);
      m.style.cssText = [
        `left:${rand(4, 96).toFixed(1)}%`,
        `top:${rand(6, 94).toFixed(1)}%`,
        `width:${size.toFixed(1)}px`,
        `height:${size.toFixed(1)}px`,
        `--dx:${rand(-46, 46).toFixed(0)}px`,
        `--dy:${rand(-40, 18).toFixed(0)}px`,
        `--o:${rand(0.35, 0.7).toFixed(2)}`,
        `animation-duration:${rand(14, 30).toFixed(1)}s`,
        `animation-delay:-${rand(0, 30).toFixed(1)}s`,
      ].join(';');
      dust.appendChild(m);
    }
  }

  /* ---------- scrolling yields: the swell waits, covers hold still ---------- */

  let scrollTimer = 0;
  let lastScroll = 0;
  addEventListener(
    'scroll',
    () => {
      lastScroll = performance.now();
      root.classList.add('scrolling');
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => root.classList.remove('scrolling'), 650);
    },
    { passive: true },
  );

  /* ---------- only what is on (or near) screen moves ---------- */

  const live = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('live', e.isIntersecting)),
    { rootMargin: '12% 0px 12% 0px' },
  );
  document.querySelectorAll('.hero').forEach((el) => live.observe(el));

  /* ---------- the rare swell, never on a schedule you can feel ---------- */

  const fire = () => {
    if (performance.now() - lastScroll > 800 && !document.hidden) {
      root.classList.add('swell');
      setTimeout(() => root.classList.remove('swell'), 6100);
    }
    setTimeout(fire, rand(12000, 20000));
  };
  setTimeout(fire, rand(4000, 8000));
}
