// The light contact block: a running line whose speed follows the scroll and
// turns with its direction, and the Telegram handle that copies on click.

export function startContact() {
  startTicker();
  startCopy();
}

function startTicker() {
  const box = document.querySelector<HTMLElement>('.ticker');
  const track = box?.querySelector<HTMLElement>('.ticker-track');
  if (!box || !track) return;
  // two copies side by side, so the line wraps without a seam
  track.innerHTML += track.innerHTML;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const BASE = 55; // px per second at rest
  let x = 0;
  let dir = -1; // −1 runs left (scrolling down), +1 runs right
  let boost = 0;
  let lastY = scrollY;
  let last = 0;
  let raf = 0;

  addEventListener(
    'scroll',
    () => {
      const dy = scrollY - lastY;
      lastY = scrollY;
      if (dy) dir = dy > 0 ? -1 : 1;
      boost = Math.min(boost + Math.abs(dy) * 6, 1600);
    },
    { passive: true },
  );

  const loop = (now: number) => {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    boost *= 0.92;
    x += dir * (BASE + boost) * dt;
    const half = track.scrollWidth / 2;
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(raf);
    last = 0;
    if (e.isIntersecting) raf = requestAnimationFrame(loop);
  }).observe(box);
}

function startCopy() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((b) => {
    const hint = b.querySelector<HTMLElement>('.copy-hint');
    const initial = hint?.textContent ?? '';
    let timer = 0;
    b.addEventListener('click', async () => {
      let ok = true;
      try {
        await navigator.clipboard.writeText(b.dataset.copy!);
      } catch {
        ok = false;
      }
      if (!hint) return;
      hint.textContent = ok ? 'Скопировано' : 'Не вышло, выделите вручную';
      b.classList.toggle('done', ok);
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        hint.textContent = initial;
        b.classList.remove('done');
      }, 2200);
    });
  });
}
