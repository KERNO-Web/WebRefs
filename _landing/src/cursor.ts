// The pointer as the brand mark: a ring crossed by a slash, an Ø that trails
// the mouse a little. The slash turns toward where the pointer is heading and
// the ring stretches with speed; when the pointer rests the mark settles back
// into a plain Ø. Over a work it opens into a violet disc that says where the
// click leads; over the light contact block it turns dark.
// Buttons marked data-magnetic lean toward the pointer.
// Mouse and trackpad only; touch screens and reduced motion keep the system cursor.

const REST = -45; // the slash of Ø, bottom-left to top-right

export function startCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const el = document.createElement('div');
  el.className = 'cur';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="cur-dot"></i><i class="cur-ring"><i class="cur-slash"></i><b class="cur-label"></b></i>';
  document.body.appendChild(el);
  const dot = el.querySelector<HTMLElement>('.cur-dot')!;
  const ring = el.querySelector<HTMLElement>('.cur-ring')!;
  const slash = el.querySelector<HTMLElement>('.cur-slash')!;
  const label = el.querySelector<HTMLElement>('.cur-label')!;

  const at = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringAt = { ...at };
  let angle = REST;
  let stretch = 0;
  let seen = false;
  let raf = 0;

  const loop = () => {
    const dx = at.x - ringAt.x;
    const dy = at.y - ringAt.y;
    ringAt.x += dx * 0.2;
    ringAt.y += dy * 0.2;
    const speed = Math.hypot(dx, dy);
    // heading while moving, the Ø's own slash once still
    const target = speed > 2 ? (Math.atan2(dy, dx) * 180) / Math.PI : REST;
    let turn = ((target - angle + 540) % 360) - 180;
    // a line looks the same both ways round: take the shorter half-turn
    if (turn > 90) turn -= 180;
    if (turn < -90) turn += 180;
    angle += turn * (speed > 2 ? 0.18 : 0.08);
    stretch += (Math.min(speed / 60, 0.35) - stretch) * 0.2;

    dot.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`;
    ring.style.transform = `translate3d(${ringAt.x}px, ${ringAt.y}px, 0) rotate(${angle}deg) scale(${1 + stretch}, ${1 - stretch * 0.6})`;
    slash.style.opacity = String(1 - stretch * 1.5);
    // the label must stay upright whatever the ring does
    label.style.transform = `translate(-50%, -50%) scale(${1 / (1 + stretch)}, ${1 / (1 - stretch * 0.6)}) rotate(${-angle}deg)`;

    raf = speed > 0.1 || Math.abs(turn) > 0.2 || stretch > 0.002 ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const state = (t: Element | null) => {
    const card = t?.closest<HTMLAnchorElement>('a.card');
    const ink = Boolean(t?.closest('.contact, [data-cursor-ink]'));
    const magnet = Boolean(t?.closest('[data-magnetic]'));
    const link = !card && !magnet && Boolean(t?.closest('a, button, summary, label, [role="button"]'));
    const text = Boolean(t?.closest('input, textarea, select, [contenteditable="true"]'));
    el.classList.toggle('on-card', Boolean(card));
    el.classList.toggle('on-link', link);
    el.classList.toggle('on-magnet', magnet);
    el.classList.toggle('ink', ink);
    el.classList.toggle('off', text);
    if (card) label.textContent = card.getAttribute('href')?.startsWith('#/case/') ? 'Кейс' : 'Открыть';
  };

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      at.x = e.clientX;
      at.y = e.clientY;
      if (!seen) {
        seen = true;
        ringAt.x = at.x;
        ringAt.y = at.y;
        root.classList.add('has-cursor');
      }
      el.classList.remove('gone');
      state(e.target as Element);
      wake();
    },
    { passive: true },
  );
  // content under a resting pointer changes on scroll: re-read what is beneath it
  addEventListener('scroll', () => seen && state(document.elementFromPoint(at.x, at.y)), { passive: true });
  document.addEventListener('pointerleave', () => el.classList.add('gone'));
  addEventListener('pointerdown', () => el.classList.add('down'));
  addEventListener('pointerup', () => el.classList.remove('down'));

  startMagnets();
}

/** Buttons with data-magnetic drift toward the pointer and spring back when it leaves. */
function startMagnets() {
  const PULL = 0.32;
  document.addEventListener(
    'pointermove',
    (e) => {
      const b = (e.target as Element).closest<HTMLElement>('[data-magnetic]');
      document.querySelectorAll<HTMLElement>('[data-magnetic].pulled').forEach((m) => {
        if (m !== b) release(m);
      });
      if (!b) return;
      const r = b.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * PULL;
      const y = (e.clientY - (r.top + r.height / 2)) * PULL;
      b.classList.add('pulled');
      b.style.setProperty('--mx', `${x.toFixed(1)}px`);
      b.style.setProperty('--my', `${y.toFixed(1)}px`);
    },
    { passive: true },
  );
  const release = (m: HTMLElement) => {
    m.classList.remove('pulled');
    m.style.setProperty('--mx', '0px');
    m.style.setProperty('--my', '0px');
  };
  document.addEventListener('pointerleave', () => document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(release));
}
