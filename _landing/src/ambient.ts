// Idle life for the homepage. Four layers, from always-on to rare:
//   1. three soft light fields drifting behind everything (ambient.css)
//   2. grain and a handful of dust motes in the same back layer
//   3. each project preview's own quiet behaviour, only while it is on screen
//   4. one rare event at a time: a reflection, a warm glow, a light line
// Scrolling pauses layers 3 and 4; hover pauses a card; reduced motion keeps
// only the still picture. The motion is meant to be noticed late, not first.

const root = document.documentElement;

/** Cards whose idle includes a one-shot event, and how long that event runs. */
const EVENTS: Record<string, number> = { sweep: 2600, breathe: 3400, streak: 2400 };

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

  /* ---------- scrolling yields: idles pause, events wait ---------- */

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
  document.querySelectorAll('.shot[data-idle], .hero').forEach((el) => live.observe(el));

  /* ---------- rare events, one at a time, never on a schedule you can feel ---------- */

  let last: Element | null = null;
  const fullyInView = (el: Element) => {
    const r = el.getBoundingClientRect();
    return r.top > 40 && r.bottom < innerHeight - 20;
  };

  const fire = () => {
    const quiet = performance.now() - lastScroll > 800 && !document.hidden;
    if (quiet) {
      const cards = [...document.querySelectorAll<HTMLElement>('.shot.live[data-idle]')].filter(
        (el) => el.dataset.idle! in EVENTS && fullyInView(el) && !el.closest('.card')?.matches(':hover'),
      );
      // the background swell competes with no card, so it gets a turn now and then
      const pool: Element[] = [...cards, ...(cards.length < 2 || Math.random() < 0.25 ? [root] : [])];
      const choices = pool.filter((el) => el !== last);
      const pick = choices[Math.floor(Math.random() * choices.length)];
      if (pick) {
        last = pick;
        const isRoot = pick === root;
        const cls = isRoot ? 'swell' : 'ev';
        const dur = isRoot ? 6000 : EVENTS[(pick as HTMLElement).dataset.idle!];
        pick.classList.add(cls);
        setTimeout(() => pick.classList.remove(cls), dur + 100);
      }
    }
    setTimeout(fire, rand(5000, 10000));
  };
  setTimeout(fire, rand(2500, 4500));
}
