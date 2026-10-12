/*
 * ONE BLOOM / TWO WORLDS — one scroll timeline, p = 0…1.
 *
 *   0.00–0.18  day frame settles
 *   0.18–0.40  camera pushes into the crown; it defocuses as it nears the lens
 *   0.40–0.58  defocused blossom fills the frame; behind it the scene becomes the
 *              lounge — fairy lights glow through first, then the night canopy
 *   0.58–0.82  focus racks and the camera pulls back to the night tree
 *   0.82–1.00  the wine plane rises and hands the frame to the next section
 *
 * Every layer is a positioned element moved with transform/opacity only; the
 * blur is baked into separate plates, never animated.
 */

export type Rect = { x: number; y: number; w: number; h: number };

export const SRC = {
  crown: { w: 960, h: 448 },
  far: { w: 512, h: 320 },
  night: { w: 960, h: 1280 },
};
// points inside each plate (source px) the camera travels toward
const CROWN_FOCUS = { x: 560, y: 250 };
const NIGHT_FOCUS = { x: 480, y: 250 };

export type Layout = {
  mobile: boolean;
  far: Rect;
  crown: Rect; crownVeil: Rect;
  night: Rect; nightVeil: Rect;
  tail: number; // px of night photo left below the stage at rest
};

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const seg = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (a: number, b: number, v: number) => { const t = seg(a, b, v); return t * t * (3 - 2 * t); };
const inCubic = (t: number) => t * t * t;
const outCubic = (t: number) => 1 - (1 - t) ** 3;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

/**
 * Scale `r` so source point `f` lands on the frame centre and the plate's opaque
 * part (u0..u1, v0..v1 of the rect, i.e. inside its feathered mask) covers the frame.
 */
function veilOf(r: Rect, src: { w: number; h: number }, f: { x: number; y: number }, W: number, H: number, min: number,
  u0 = 0, u1 = 1, v0 = 0, v1 = 1): Rect {
  const s = r.w / src.w;
  const fx = f.x * s, fy = f.y * s; // focus inside the rect
  const L = fx - u0 * r.w, R = u1 * r.w - fx, T = fy - v0 * r.h, B = v1 * r.h - fy;
  const k = Math.max(min, (W / 2) / L, (W / 2) / R, (H / 2) / T, (H / 2) / B) * 1.1;
  return { x: W / 2 - fx * k, y: H / 2 - fy * k, w: r.w * k, h: r.h * k };
}

function cover(src: { w: number; h: number }, W: number, H: number, ax = 0.5, ay = 0.5): Rect {
  const s = Math.max(W / src.w, H / src.h);
  const w = src.w * s, h = src.h * s;
  return { x: (W - w) * ax, y: (H - h) * ay, w, h };
}

export function layoutFor(W: number, H: number): Layout {
  const mobile = W < 900 && H > W;
  const far = cover(SRC.far, W, H, 0.5, 0.75);
  let crown: Rect, night: Rect;
  if (!mobile) {
    // the crown owns the upper right and breaks the top and right edges
    const cw = Math.max(W, H * 0.84 * SRC.crown.w / SRC.crown.h);
    const ch = cw * SRC.crown.h / SRC.crown.w;
    crown = { x: W * 0.64 - CROWN_FOCUS.x * (cw / SRC.crown.w), y: -ch * 0.05, w: cw, h: ch };
    // night fills the width; its crop starts in the lower canopy so lamps and bar sit in frame
    const s = Math.max(W / SRC.night.w, H / (SRC.night.h - 420));
    night = { x: (W - SRC.night.w * s) / 2, y: -400 * s, w: SRC.night.w * s, h: SRC.night.h * s };
  } else {
    const ch = H * 0.5;
    const cw = ch * SRC.crown.w / SRC.crown.h;
    crown = { x: W * 0.56 - CROWN_FOCUS.x * (cw / SRC.crown.w), y: -ch * 0.03, w: cw, h: ch };
    const s = Math.max(W / SRC.night.w, H / SRC.night.h) * 1.06;
    const nw = SRC.night.w * s;
    night = { x: W * 0.5 - 430 * s, y: -H * 0.04, w: nw, h: SRC.night.h * s };
    night.x = Math.min(0, Math.max(W - nw, night.x));
  }
  return {
    mobile, far, crown, night,
    // the crown's mask feathers its left quarter and lower 40%: only the rest counts as cover
    crownVeil: veilOf(crown, SRC.crown, CROWN_FOCUS, W, H, 2.2, 0.2, 1, 0, 0.62),
    nightVeil: veilOf(night, SRC.night, NIGHT_FOCUS, W, H, 2.1),
    tail: Math.max(0, night.y + night.h - H),
  };
}

export type Els = {
  far: HTMLElement; crown: HTMLElement; crownSoft: HTMLElement; dusk: HTMLElement; scrim: HTMLElement; haze: HTMLElement;
  lights: HTMLElement; nightSoft: HTMLElement; night: HTMLElement; nightGrade: HTMLElement;
  copy: HTMLElement[]; plane: HTMLElement; tagNight: HTMLElement | null;
};

const place = (el: HTMLElement, r: Rect) => {
  el.style.left = r.x + 'px'; el.style.top = r.y + 'px';
  el.style.width = r.w + 'px'; el.style.height = r.h + 'px';
};
/** Move an element positioned at `base` so it occupies `to`. */
const move = (el: HTMLElement, base: Rect, to: Rect) => {
  const k = to.w / base.w;
  el.style.transform = `translate3d(${to.x - base.x}px, ${to.y - base.y}px, 0) scale(${k})`;
};
const op = (el: HTMLElement, v: number) => {
  el.style.opacity = v.toFixed(3);
  el.style.visibility = v < 0.002 ? 'hidden' : 'visible';
};

export function applyLayout(L: Layout, e: Els) {
  place(e.far, L.far);
  place(e.crown, L.crown); place(e.crownSoft, L.crown);
  place(e.night, L.night); place(e.nightSoft, L.night); place(e.lights, L.night);
  for (const el of [e.far, e.crown, e.crownSoft, e.night, e.nightSoft, e.lights]) el.style.transformOrigin = '0 0';
}

/** Render one moment of the timeline. */
export function frame(L: Layout, e: Els, p: number) {
  // camera into the crown; slow start, then committed
  const push = inCubic(seg(0.04, 0.5, p));
  const crownR = lerpRect(L.crown, L.crownVeil, push);
  move(e.crown, L.crown, crownR);
  move(e.crownSoft, L.crown, crownR);
  const defocus = smooth(0.2, 0.42, p);
  op(e.crown, 1 - defocus);
  op(e.crownSoft, defocus);
  // the far terrace drifts less: depth, not a flat zoom
  const fk = 1 + 0.16 * push;
  move(e.far, L.far, { x: L.far.x - (L.far.w * (fk - 1)) / 2, y: L.far.y - (L.far.h * (fk - 1)) * 0.6, w: L.far.w * fk, h: L.far.h * fk });
  // late-day warms toward rose dusk as the blossom closes in
  op(e.dusk, smooth(0.12, 0.46, p));
  op(e.scrim, 1 - smooth(0.24, 0.4, p)); // holds until the copy has left

  // night: starts deep in its own canopy, pulls back to the room
  const pull = inOut(seg(0.42, 0.8, p));
  const nightR = lerpRect(L.nightVeil, L.night, pull);
  move(e.night, L.night, nightR);
  move(e.nightSoft, L.night, nightR);
  move(e.lights, L.night, nightR);
  op(e.lights, smooth(0.32, 0.46, p) * (1 - smooth(0.62, 0.78, p)));
  op(e.nightSoft, smooth(0.42, 0.56, p));
  op(e.night, smooth(0.58, 0.78, p));
  op(e.nightGrade, smooth(0.5, 0.8, p));
  // the day layers are fully covered from here on
  const dayGone = p >= 0.565;
  // (far and haze have no opacity of their own, so they must be restored here on the way back up)
  for (const el of [e.far, e.haze]) el.style.visibility = dayGone ? 'hidden' : 'visible';
  if (dayGone) for (const el of [e.crown, e.crownSoft, e.dusk, e.scrim]) el.style.visibility = 'hidden';

  // hero copy leaves on a stagger, top line first
  e.copy.forEach((el, i) => {
    const t = smooth(0.15 + i * 0.03, 0.3 + i * 0.03, p);
    el.style.opacity = (1 - t).toFixed(3);
    el.style.transform = `translate3d(0, ${-36 * t}px, 0)`;
    el.style.visibility = t > 0.995 ? 'hidden' : 'visible';
  });

  // the wine plane takes over the frame and carries on into the section below
  const rise = outCubic(seg(0.76, 0.96, p));
  e.plane.style.transform = `translate3d(0, ${(1 - rise) * 100}%, 0)`;
  e.plane.style.visibility = rise < 0.002 ? 'hidden' : 'visible';
  if (e.tagNight) op(e.tagNight, smooth(0.84, 0.98, p));
}

/** The crown as drawn, plus its defocused twin for the moment it nears the lens. */
export function crownPlates(img: HTMLImageElement): { sharp: HTMLCanvasElement; soft: HTMLCanvasElement } {
  const w = img.naturalWidth, h = img.naturalHeight;
  const sharp = document.createElement('canvas');
  sharp.width = w; sharp.height = h;
  sharp.getContext('2d')!.drawImage(img, 0, 0);
  // cheap optical blur by down- then up-sampling; it is only ever seen hugely enlarged
  const mid = document.createElement('canvas');
  mid.width = 60; mid.height = Math.round(60 * h / w);
  const mg = mid.getContext('2d')!;
  mg.imageSmoothingQuality = 'high';
  mg.drawImage(sharp, 0, 0, mid.width, mid.height);
  const soft = document.createElement('canvas');
  soft.width = 240; soft.height = Math.round(240 * h / w);
  const sg = soft.getContext('2d')!;
  sg.imageSmoothingQuality = 'high';
  sg.drawImage(mid, 0, 0, soft.width, soft.height);
  return { sharp, soft };
}

/** Only the brightest points of the defocused night plate: fairy lights as bokeh. */
export function lightsOf(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15) / 255;
    const k = smooth(0.62, 0.92, lum);
    d[i] *= k; d[i + 1] *= k * 0.92; d[i + 2] *= k * 0.78;
  }
  g.putImageData(id, 0, 0);
  return c;
}
