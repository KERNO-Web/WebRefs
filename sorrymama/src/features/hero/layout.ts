import { assets } from '../../data/assets';

export type Box = { x: number; y: number; w: number; h: number };
export type HeroLayout = {
  W: number; H: number; mobile: boolean;
  day: Box; dayFocus: { x: number; y: number };
  dayNear: { x: number; y: number; scale: number }; // camera inside the crown: crown centred, frame filled
  branch: Box;            // the one real branch allowed in front of a letter
  night: Box;             // night photo at rest
  nightNear: Box;         // the same photo deep in its canopy, where the cut happens
  tail: number;
};

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

function place(src: { w: number; h: number; focus: { x: number; y: number } }, s: number, W: number, H: number, fx: number, fy: number): Box {
  const w = src.w * s, h = src.h * s;
  return { x: clamp(fx * W - src.focus.x * s, W - w, 0), y: clamp(fy * H - src.focus.y * s, H - h, 0), w, h };
}

export function heroLayout(W: number, H: number): HeroLayout {
  const mobile = W < 768 || (W < 1024 && H > W * 1.15);
  const T = assets.terrace, N = assets.lounge, B = assets.branch;

  // Day: the 2× master lets the desktop crop run 12% larger than native, so the tree can sit right
  // of the wordmark with sky above the roofline. Phones show the whole portrait, downscaled.
  const ds = mobile ? Math.max(W / T.w, (H * 1.08) / T.h) : Math.max(W / T.w, H / 900) * 1.12;
  const day = mobile ? place(T, ds, W, H, 0.6, 0.36) : place(T, ds, W, H, 0.66, 0.5);
  const branch = { x: day.x + B.x * ds, y: day.y + B.y * ds, w: B.w * ds, h: B.h * ds };

  const ns = mobile ? Math.max(W / N.w, (H * 1.04) / N.h) : Math.max(W / N.w, H / 900);
  const night = mobile ? place(N, ns, W, H, 0.5, 0.42) : place(N, ns, W, H, 0.52, 0.5);
  // deep in the night canopy: 2.1× with the densest blossom at frame centre
  const k = 2.1, c = N.canopy;
  const nightNear = { x: W / 2 - c.x * ns * k, y: H / 2 - c.y * ns * k, w: night.w * k, h: night.h * k };

  const dayFocus = { x: day.x + T.focus.x * ds, y: day.y + T.focus.y * ds };
  const cw = T.crown.w * ds, ch = T.crown.h * ds;
  const dayNear = { x: W / 2 - dayFocus.x, y: H / 2 - dayFocus.y, scale: Math.max(W / cw, H / ch) * 1.12 };

  return {
    W, H, mobile, day, branch, night, nightNear, dayFocus, dayNear,
    tail: Math.max(0, night.y + night.h - H),
  };
}
