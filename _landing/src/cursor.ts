// The pointer as the brand mark: a small Ø that sits exactly under the mouse.
// It never stretches or turns. Over a work it opens into a small light disc
// that says «Открыть»; over the light contact block it turns dark.
// Mouse and trackpad only; touch screens and reduced motion keep the system cursor.

export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const el = document.createElement('div');
  el.className = 'cur';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="cur-ring"><i class="cur-slash"></i><b class="cur-label">Открыть</b></i>';
  document.body.appendChild(el);

  const at = { x: 0, y: 0 };
  let seen = false;
  let raf = 0;
  const place = () => {
    raf = 0;
    el.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
  };

  const state = (t: Element | null) => {
    const card = t?.closest<HTMLAnchorElement>('a.card');
    const ink = Boolean(t?.closest('.contact, [data-cursor-ink]'));
    const link = !card && Boolean(t?.closest('a, button, summary, label, [role="button"]'));
    const text = Boolean(t?.closest('input, textarea, select, [contenteditable="true"]'));
    el.classList.toggle('on-card', Boolean(card));
    el.classList.toggle('on-link', link);
    el.classList.toggle('ink', ink);
    el.classList.toggle('off', text);
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      at.x = e.clientX;
      at.y = e.clientY;
      if (!seen) {
        seen = true;
        root.classList.add('has-cursor');
      }
      el.classList.remove('gone');
      state(e.target as Element);
      raf ||= requestAnimationFrame(place);
    },
    { passive: true },
  );
  // content under a resting pointer changes on scroll: re-read what is beneath it
  addEventListener('scroll', () => seen && state(document.elementFromPoint(at.x, at.y)), { passive: true });
  document.addEventListener('pointerleave', () => el.classList.add('gone'));
  addEventListener('pointerdown', () => el.classList.add('down'));
  addEventListener('pointerup', () => el.classList.remove('down'));
}
