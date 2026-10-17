import { assets } from '../../data/assets';

export type Box = { x: number; y: number; w: number; h: number };
export type HeroLayout = {
  W: number; H: number; mobile: boolean;
  day: Box; dayFocus: { x: number; y: number };
  dayNear: { x: number; y: number; scale: number }; // camera inside the crown: crown centred, frame filled
  wordmark: { x: number; y: number; size: number } | null; // locked to the photo where the crossing is exact
  night: Box;             // night photo at rest
  nightNear: Box;         // the same photo deep in its canopy, where the cut happens
};

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function place(src: { w: number; h: number; focus: { x: number; y: number } }, s: number, W: number, H: number, fx: number, fy: number): Box {
  const w = src.w * s, h = src.h * s;
  return { x: clamp(fx * W - src.focus.x * s, W - w, 0), y: clamp(fy * H - src.focus.y * s, H - h, 0), w, h };
}

export function heroLayout(W: number, H: number): HeroLayout {
  const mobile = W < 768 || (W < 1024 && H > W * 1.15);
  const T = assets.terrace, N = assets.lounge;

  // Day: the 2× master lets the desktop crop run 12% larger than native, so the tree can sit right
  // of the wordmark with sky above the roofline. Phones show the whole portrait, downscaled.
  const ds = mobile ? Math.max(W / T.w, (H * 1.08) / T.h) : Math.max(W / T.w, H / 900) * 1.12;
  const day = mobile ? place(T, ds, W, H, 0.6, 0.36) : place(T, ds, W, H, 0.66, 0.5);

  const ns = mobile ? Math.max(W / N.w, (H * 1.04) / N.h) : Math.max(W / N.w, H / 900);
  const night = mobile ? place(N, ns, W, H, 0.5, 0.42) : place(N, ns, W, H, 0.52, 0.5);
  // deep in the night canopy: 2.1× with the densest blossom at frame centre
  const k = 2.1, c = N.canopy;
  const nightNear = { x: W / 2 - c.x * ns * k, y: H / 2 - c.y * ns * k, w: night.w * k, h: night.h * k };

  const dayFocus = { x: day.x + T.focus.x * ds, y: day.y + T.focus.y * ds };
  const cw = T.crown.w * ds, ch = T.crown.h * ds;
  const dayNear = { x: W / 2 - dayFocus.x, y: H / 2 - dayFocus.y, scale: Math.max(W / cw, H / ch) * 1.12 };

  // On wide screens the wordmark is placed in the photograph's own coordinates, so it meets the crown
  // and the wires at the same points everywhere; narrower layouts fall back to CSS.
  const WM = T.wordmark;
  let wordmark = !mobile && W >= 1180 ? { x: day.x + WM.x * ds, y: day.y + WM.y * ds, size: WM.size * ds } : null;
  // The crop pushes the photo left, so on every desktop width the word started off-screen («ORRY MAMA»).
  // Keep its right edge where it meets the crown and shrink it to start at the page gutter instead.
  const WM_RATIO = 4.07; // rendered width of «MAMA» line ≈ 4.07 × font-size (Commissioner 800)
  const gutter = Math.max(40, W * 0.04);
  if (wordmark && wordmark.x < gutter) {
    const right = wordmark.x + wordmark.size * WM_RATIO;
    wordmark = { ...wordmark, x: gutter, size: (right - gutter) / WM_RATIO };
  }

  return {
    W, H, mobile, day, wordmark, night, nightNear, dayFocus, dayNear,
  };
}
