import { useEffect, useRef } from 'react';

/**
 * Fine-pointer desktops only. A dot that sits exactly on the pointer and a ring that follows on a
 * short spring. Links widen the ring, gallery photos show «Смотреть», external links ↗.
 * Off for touch, reduced motion and keyboard use; the native cursor returns whenever it is off.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const root = document.documentElement, d = dot.current!, r = ring.current!;
    let x = -100, y = -100, rx = x, ry = y, raf = 0, live = false;
    const tick = () => {
      rx += (x - rx) * 0.22; ry += (y - ry) * 0.22;
      d.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    // the mode follows whatever is under the pointer — also when the page scrolls beneath a still mouse
    const mode = () => {
      const t = document.elementFromPoint(x, y);
      const a = t?.closest('a, button, [data-cursor]') as HTMLElement | null;
      r.dataset.mode = !a ? '' : a.dataset.cursor === 'view' ? 'view' : a.getAttribute('target') === '_blank' ? 'ext' : 'link';
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      // dialogs live in the top layer above the cursor: give the native one back while one is open
      if (document.querySelector('dialog[open]')) { off(); return; }
      if (!live) { live = true; rx = x; ry = y; root.classList.add('has-cursor'); }
      mode();
    };
    const onScroll = () => { if (live) mode(); };
    const off = () => { live = false; root.classList.remove('has-cursor'); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Tab') off(); };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerleave', off);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf); off();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerleave', off);
    };
  }, []);
  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor-ring"><span className="cr-view">Смотреть</span><span className="cr-ext">↗</span></div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
