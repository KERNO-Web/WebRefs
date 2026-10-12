import { assets } from '../../data/assets';

export type Box = { x: number; y: number; w: number; h: number };
export type HeroLayout = {
  W: number; H: number;
  mobile: boolean;
  day: Box; crown: Box; dayFocus: { x: number; y: number };
  night: Box; nightFocus: { x: number; y: number }; tail: number;
  curtain: { w: number; h: number };
  veil: Box; // the opaque canopy behind the curtain at the hidden cut
};

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/** Place a photo so its focus point sits at (fx, fy) of the frame, never leaving a gap. */
function place(src: { w: number; h: number; focus: { x: number; y: number } }, s: number, W: number, H: number, fx: number, fy: number): Box {
  const w = src.w * s, h = src.h * s;
  return { x: clamp(fx * W - src.focus.x * s, W - w, 0), y: clamp(fy * H - src.focus.y * s, H - h, 0), w, h };
}

export function heroLayout(W: number, H: number): HeroLayout {
  const mobile = W < 768 || (W < 1024 && H > W * 1.15);
  const T = assets.terrace, N = assets.lounge, C = assets.crown;

  // Day: on desktop the photo is shown at its native width (a 900px band of the portrait original),
  // on phones the whole portrait is visible and downscaled.
  const ds = mobile ? Math.max(W / T.w, (H * 1.08) / T.h) : Math.max(W / T.w, H / 900);
  // desktop keeps sky above the roofline for the wordmark; the slatted wall is too dark to carry ink
  const day = mobile ? place(T, ds, W, H, 0.6, 0.36) : place(T, ds, W, H, 0.62, 0.42);
  const crown = { x: day.x + C.x * ds, y: day.y + C.y * ds, w: C.w * ds, h: C.h * ds };

  const ns = mobile ? Math.max(W / N.w, (H * 1.04) / N.h) : Math.max(W / N.w, H / 900);
  const night = mobile ? place(N, ns, W, H, 0.5, 0.42) : place(N, ns, W, H, 0.52, 0.5);

  // curtain scaled to the frame width; on phones taller than wide, to the height
  const cs = mobile ? (H * 0.95) / assets.curtain.h : W / assets.curtain.w;
  // veil: only the dense upper canopy of the bloom photo (rows ~380–1100), never its trunk
  const vs = Math.max(W / assets.bloom.w, H / 720);
  const veil = { x: (W - assets.bloom.w * vs) / 2, y: -380 * vs, w: assets.bloom.w * vs, h: assets.bloom.h * vs };

  return {
    W, H, mobile, day, crown,
    dayFocus: { x: day.x + T.focus.x * ds, y: day.y + T.focus.y * ds },
    night, nightFocus: { x: night.x + N.focus.x * ns, y: night.y + N.focus.y * ns },
    tail: Math.max(0, night.y + night.h - H),
    curtain: { w: assets.curtain.w * cs, h: assets.curtain.h * cs },
    veil,
  };
}
