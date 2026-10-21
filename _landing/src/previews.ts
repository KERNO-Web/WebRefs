// Moving previews on the work cards, the way uxart does it: a work you can
// operate plays its 5 s cover loop (clips.ts says which and where they come
// from) whenever its card is on screen, on any device; a visual work has a living
// cover that drifts slowly with a sheen passing over it now and then
// (styles.css). Off screen everything stops, and a clip loads only when its card
// first comes into view. Reduced motion and data saver keep the still preview.

const quiet =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

function play(v: HTMLVideoElement) {
  if (!v.src) v.src = v.dataset.src!;
  const shot = v.closest('.shot')!;
  v.onplaying = () => shot.classList.add('playing');
  v.play().catch(() => {});
}

let io: IntersectionObserver | null = null;

/** Call after the cards are (re)rendered. */
export function bindPreviews() {
  if (quiet) return;
  io?.disconnect();
  io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const shot = e.target as HTMLElement;
        // .live drives the cover's drift and sheen (styles.css)
        shot.classList.toggle('live', e.isIntersecting);
        const v = shot.querySelector<HTMLVideoElement>('video.clip');
        if (!v) return;
        if (e.isIntersecting) play(v);
        else v.pause();
      }),
    { threshold: 0.25 },
  );
  document.querySelectorAll<HTMLElement>('.shot').forEach((s) => io!.observe(s));

  if (!mouse) return;
  // with a mouse, living covers also lean a little after the pointer (--px/--py)
  document.querySelectorAll<HTMLElement>('.shot.cover').forEach((shot) => {
    const card = shot.closest('.card');
    if (!card || card.hasAttribute('data-lean-bound')) return;
    card.setAttribute('data-lean-bound', '');
    card.addEventListener('mousemove', (e) => {
      const r = shot.getBoundingClientRect();
      const x = ((e as MouseEvent).clientX - r.left) / r.width - 0.5;
      const y = ((e as MouseEvent).clientY - r.top) / r.height - 0.5;
      shot.style.setProperty('--px', `${(-x * 20).toFixed(1)}px`);
      shot.style.setProperty('--py', `${(-y * 14).toFixed(1)}px`);
    });
    card.addEventListener('mouseleave', () => {
      shot.style.setProperty('--px', '0px');
      shot.style.setProperty('--py', '0px');
    });
  });
}
