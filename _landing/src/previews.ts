// Video previews on the work cards: a short silent loop of the work in use
// (recorded by _ai/portfolio/.work/clips.mjs). Nothing loads until it is needed:
// with a mouse a clip plays while its card is hovered and rewinds on leave; on
// a touch screen the card most in view plays, one at a time. Reduced motion and
// data saver keep the still preview.

const quiet =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

function start(v: HTMLVideoElement) {
  if (!v.src) v.src = v.dataset.src!;
  const shot = v.closest('.shot')!;
  v.onplaying = () => shot.classList.add('playing');
  v.play().catch(() => {});
}
function stop(v: HTMLVideoElement) {
  v.pause();
  v.closest('.shot')?.classList.remove('playing');
  if (v.src) v.currentTime = 0;
}

let io: IntersectionObserver | null = null;
const ratios = new Map<HTMLVideoElement, number>();

/** Call after the cards are (re)rendered. */
export function bindPreviews() {
  if (quiet) return;
  const clips = [...document.querySelectorAll<HTMLVideoElement>('video.clip')];
  if (mouse) {
    clips.forEach((v) => {
      const card = v.closest('.card');
      if (!card || card.hasAttribute('data-clip-bound')) return;
      card.setAttribute('data-clip-bound', '');
      card.addEventListener('mouseenter', () => start(v));
      card.addEventListener('mouseleave', () => stop(v));
    });
    return;
  }
  // touch: the card most in view plays
  io?.disconnect();
  ratios.clear();
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => ratios.set(e.target as HTMLVideoElement, e.isIntersecting ? e.intersectionRatio : 0));
      let best: HTMLVideoElement | null = null;
      let top = 0.6;
      ratios.forEach((r, v) => {
        if (r >= top) {
          top = r;
          best = v;
        }
      });
      ratios.forEach((_, v) => (v === best ? start(v) : stop(v)));
    },
    { threshold: [0, 0.6, 0.8, 1] },
  );
  clips.forEach((v) => io!.observe(v));
}
