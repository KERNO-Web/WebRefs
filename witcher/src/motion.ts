import type { FxLevels } from './fx';

/**
 * One rAF loop drives every scroll-linked effect by writing CSS variables
 * directly (no React state): parallax depth, image zoom, the horizontal pan
 * and per-section atmosphere levels. Reveals use IntersectionObserver.
 */
export function startMotion(reduced: boolean) {
  const root = document.documentElement;
  const fx: FxLevels = { fog: 0.8, ember: 0.7, snow: 0.3 };
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const onMove = (e: PointerEvent) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  };
  if (fine && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  const observe = () => document.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
  observe();
  const mo = new MutationObserver(observe);
  mo.observe(document.body, { childList: true, subtree: true });

  let raf = 0, last = performance.now();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const vh = window.innerHeight, vw = window.innerWidth;

    // pointer depth for the hero layers
    const k = 1 - Math.exp(-dt * 3);
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    root.style.setProperty('--mx', mouse.x.toFixed(4));
    root.style.setProperty('--my', mouse.y.toFixed(4));

    if (!reduced) {
      document.querySelectorAll<HTMLElement>('[data-depth]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        const off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.depth!);
        el.style.setProperty('--py', off.toFixed(1) + 'px');
      });
      document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        el.style.setProperty('--zoom', (1 + (1 - p) * parseFloat(el.dataset.zoom!)).toFixed(4));
      });
    }

    // horizontal pan: vertical scroll through a tall section moves the track sideways
    document.querySelectorAll<HTMLElement>('[data-pan]').forEach((sec) => {
      const track = sec.querySelector<HTMLElement>('[data-track]');
      if (!track) return;
      if (reduced || window.matchMedia('(max-width: 760px)').matches) { track.style.transform = ''; return; }
      const r = sec.getBoundingClientRect();
      const dist = track.scrollWidth - vw;
      if (dist <= 0) { track.style.transform = ''; return; }
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      track.style.transform = `translate3d(${(-p * dist).toFixed(1)}px,0,0)`;
      sec.style.setProperty('--pan', p.toFixed(4));
    });

    // atmosphere: weighted by how close each section is to the viewport centre
    let wsum = 0, fog = 0, ember = 0, snow = 0;
    document.querySelectorAll<HTMLElement>('[data-fx]').forEach((sec) => {
      const r = sec.getBoundingClientRect();
      const overlap = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / vh;
      if (overlap <= 0) return;
      const [f, e, s] = sec.dataset.fx!.split(',').map(Number);
      wsum += overlap; fog += f * overlap; ember += e * overlap; snow += s * overlap;
    });
    if (wsum > 0) { fx.fog = fog / wsum; fx.ember = ember / wsum; fx.snow = snow / wsum; }

    root.classList.toggle('scrolled', window.scrollY > 40);
  };
  raf = requestAnimationFrame(frame);

  return {
    levels: () => fx,
    stop: () => { cancelAnimationFrame(raf); io.disconnect(); mo.disconnect(); window.removeEventListener('pointermove', onMove); },
  };
}

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduced ? 'auto' : 'smooth' });
};
