import { arc, clamp, el, lerp, P, rng, smooth, stroke, swell, taper } from '../ink';

// Engraved cauldron on burning logs. Local box ≈ 800 × 760, bowl centre (400, 450).
export interface Cauldron {
  root: SVGGElement;
  bubbles: SVGGElement;
  steam: SVGGElement;
  flames: SVGGElement;
  liquid: SVGEllipseElement;
}

const CX = 400, CY = 450, RX = 265, RY = 210, RIM_Y = 380, RIM_RX = 250;

export function drawCauldron(parent: Element, gradId: string, clipId = 'cauldron-clip'): Cauldron {
  const root = el('g', { class: 'cauldron' }, parent);
  const r = rng(11);

  const flames = el('g', { class: 'fire boil' }, root);
  paintFlames(flames, 0, 0);
  fire(root, r);

  // Legs (behind the bowl)
  for (const [x0, x1, y1] of [[262, 236, 700], [538, 564, 700], [400, 400, 712]] as const) {
    const pts: P[] = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push([lerp(x0, x1, t) + Math.sin(t * Math.PI) * (x1 < x0 ? -6 : x1 > x0 ? 6 : 0), lerp(600, y1, t)]);
    }
    stroke(root, pts, (t) => lerp(30, 16, t), 'ink');
    for (let k = 1; k < 6; k++) {
      const y = lerp(625, y1 - 8, k / 6);
      const x = lerp(x0, x1, (y - 600) / (y1 - 600));
      stroke(root, [[x - 8, y], [x, y + 2], [x + 8, y]], swell(1.4), 'paper');
    }
    // claw toes
    for (const dx of [-14, 0, 14]) stroke(root, arc(x1 + dx, y1 + 4, 7, 5, Math.PI, Math.PI * 2, 8), swell(3.5), 'ink');
  }

  // Bowl body: parchment fill, then contour engraving, then outline.
  const bowl = arc(CX, CY, RX, RY, -0.34, Math.PI + 0.34, 90);
  el('path', { d: smooth(bowl, true), class: 'paper-fill' }, root);
  const clip = el('clipPath', { id: clipId }, root);
  el('path', { d: smooth(bowl, true) }, clip);
  const shade = el('g', { 'clip-path': `url(#${clipId})`, class: 'shade' }, root);

  // Latitude contours: the burin follows the sphere; heavier on the shadow (right, lower) side.
  for (let y = RIM_Y + 14; y < CY + RY; y += 7.5) {
    const k = (y - CY) / RY;
    const hw = RX * Math.sqrt(Math.max(0, 1 - k * k));
    if (hw < 8) continue;
    const pts: P[] = [];
    const sag = hw * 0.16;
    for (let i = 0; i <= 50; i++) {
      const u = -1 + (2 * i) / 50;
      pts.push([CX + u * hw, y + sag * Math.sqrt(1 - u * u)]);
    }
    const low = clamp((y - RIM_Y) / (RY + CY - RIM_Y));
    stroke(shade, pts, (t) => {
      const right = clamp((t - 0.42) / 0.58);
      const left = clamp((0.12 - t) / 0.12);
      const hilite = Math.exp(-((t - 0.27) ** 2) / 0.006) * clamp(1 - low * 1.6);
      return Math.max(0.12, 0.35 + right * right * 3.6 + left * 1.6 + low * 1.4 - hilite * 2.2);
    });
  }
  // Meridians on the shadow side for cross-hatching.
  for (let i = 0; i < 16; i++) {
    const phi = lerp(0.12, 1.25, i / 15);
    const pts: P[] = [];
    for (let j = 0; j <= 30; j++) {
      const th = lerp(-0.34, Math.PI / 2, j / 30);
      pts.push([CX + Math.cos(th) * RX * Math.sin(phi + 0.3) * 0.98, CY + Math.sin(th) * RY]);
    }
    stroke(shade, pts, (t) => 0.2 + t * 1.6 * (i / 15));
  }
  // A potion drip escaping over the rim.
  const drip: P[] = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    drip.push([CX - 96 + Math.sin(t * 5) * 3, RIM_Y + 40 + t * 120]);
  }
  el('path', { d: taper(drip, (t) => lerp(16, 6, t) + Math.sin(t * 9) * 2), class: 'potion', fill: `url(#${gradId})` }, root);
  el('ellipse', { cx: CX - 96, cy: RIM_Y + 164, rx: 8, ry: 10, class: 'potion', fill: `url(#${gradId})` }, root);

  stroke(root, bowl, (t) => 2.5 + 3.5 * Math.sin(Math.PI * t) + (t > 0.5 ? 1.5 : 0));

  // Handles (lugs + rings)
  for (const s of [-1, 1]) {
    const x = CX + s * 262, y = 432;
    stroke(root, arc(x, y - 10, 18, 12, Math.PI, Math.PI * 2, 12), swell(5), 'ink');
    const ringPts = arc(x + s * 12, y + 26, 24, 34, -Math.PI / 2, Math.PI * 1.5, 40);
    stroke(root, ringPts, (t) => 2 + 3 * Math.abs(Math.sin(Math.PI * t + (s > 0 ? 0.6 : -0.6))));
    stroke(root, arc(x + s * 12, y + 26, 19, 28, 0.3, 1.6, 14), swell(1), 'ink');
  }

  // Rim: thick torus, hatched underside.
  el('ellipse', { cx: CX, cy: RIM_Y, rx: RIM_RX + 14, ry: 56, class: 'paper-fill' }, root);
  const front = arc(CX, RIM_Y, RIM_RX + 14, 56, 0, Math.PI, 70);
  for (let i = 3; i < 68; i += 2) {
    const [x, y] = front[i];
    const t = i / 70;
    stroke(root, [[x, y - 14 + Math.abs(t - 0.5) * 6], [x, y - 2]], swell(0.4 + (t < 0.5 ? 1.6 : 0.7) * Math.sin(Math.PI * t)));
  }
  stroke(root, arc(CX, RIM_Y, RIM_RX + 14, 56, -0.02, Math.PI + 0.02, 70), (t) => 2 + 2.6 * Math.sin(Math.PI * t));
  stroke(root, arc(CX, RIM_Y, RIM_RX + 14, 56, Math.PI, Math.PI * 2, 70), swell(2.6, 1));

  // Liquid surface
  const liquid = el('ellipse', { cx: CX, cy: RIM_Y + 4, rx: RIM_RX - 6, ry: 44, class: 'potion', fill: `url(#${gradId})` }, root);
  // Inner lip
  stroke(root, arc(CX, RIM_Y + 2, RIM_RX - 4, 46, Math.PI * 1.02, Math.PI * 1.98, 60), swell(2.2, 0.6));
  stroke(root, arc(CX, RIM_Y + 2, RIM_RX - 4, 46, 0.05, Math.PI - 0.05, 60), swell(1.2, 0.3));
  // Surface ripples
  for (let i = 1; i <= 3; i++) {
    stroke(root, arc(CX + 30, RIM_Y + 6, 60 * i, 11 * i, Math.PI * 1.1, Math.PI * 1.7, 20), swell(0.9), 'ripple');
  }

  const bubbles = el('g', { class: 'bubbles' }, root);
  const steam = el('g', { class: 'steam' }, root);
  return { root, bubbles, steam, flames, liquid };
}

function fire(g: Element, r: () => number) {
  const f = el('g', { class: 'logs' }, g);
  // Logs: two crossed, end-grain rings.
  for (const [x0, y0, x1, y1] of [[200, 742, 600, 712], [230, 708, 590, 748]] as const) {
    const n = 30, pts: P[] = [];
    for (let i = 0; i <= n; i++) pts.push([lerp(x0, x1, i / n), lerp(y0, y1, i / n)]);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const off = (d: number): P[] => pts.map(([x, y]) => [x - Math.sin(ang) * d, y + Math.cos(ang) * d]);
    el('path', { d: smooth([...off(-16), ...off(16).reverse()], true), class: 'paper-fill' }, f);
    stroke(f, off(-16), swell(2.6, 1));
    stroke(f, off(16), swell(3.6, 1.4));
    for (let k = 0; k < 9; k++) {
      const s = 0.06 + k * 0.1 + r() * 0.04;
      const base = off(-14)[Math.floor(s * n)];
      stroke(f, [base, [base[0] + 30 + r() * 20, base[1] + 4 + r() * 6]], swell(0.9));
    }
    for (const rr of [16, 11, 6]) stroke(f, arc(x1, y1, rr * 0.7, rr, 0, Math.PI * 2, 24), () => 0.9);
  }
}

// Flames are redrawn every animation frame: S-shaped tongues with hooked tips,
// hatched along their flow, flickering like hand-drawn cels.
export function paintFlames(f: Element, t: number, frame: number) {
  f.replaceChildren();
  const r = rng(77 + (frame % 5) * 13);
  const tongues = 10;
  for (let i = 0; i < tongues; i++) {
    const u = -1 + (2 * i) / (tongues - 1);
    const flick = Math.sin(t * 6 + i * 1.9) * 0.1 + (r() - 0.5) * 0.12;
    const bx = 400 + u * 215 + (r() - 0.5) * 12;
    const h = (95 + u * u * 150) * (1 + flick);
    const side = u === 0 ? (frame % 2 ? 1 : -1) : Math.sign(u);
    const ph = i * 1.7 + t * 4;
    const tongue = (scale: number, cls: string, ink: number) => {
      const spine: P[] = [];
      for (let j = 0; j <= 20; j++) {
        const s = j / 20;
        const sway = Math.sin(s * Math.PI * 2.4 + ph) * 13 * Math.sin(Math.PI * s);
        const hook = Math.pow(s, 3) * 14 * side;
        spine.push([bx + u * 40 * s * s + sway + hook, 732 - h * scale * s]);
      }
      const width = (s: number) => 44 * scale * Math.pow(1 - s, 0.9) * (0.7 + 0.3 * Math.sin(Math.PI * Math.min(1, s * 1.6)));
      el('path', { d: taper(spine, width), class: cls }, f);
      if (!ink) return;
      const L: P[] = [], R: P[] = [];
      spine.forEach(([x, y], j) => {
        const a = spine[Math.max(0, j - 1)], b = spine[Math.min(20, j + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0];
        const len = Math.hypot(nx, ny) || 1; nx /= len; ny /= len;
        const w = width(j / 20) / 2;
        L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]);
      });
      stroke(f, L, (s) => 0.5 + ink * (1 - s));
      stroke(f, R, (s) => 0.5 + ink * 1.5 * (1 - s));
      const mid = spine.map((_p, j): P => [lerp(L[j][0], R[j][0], 0.7), lerp(L[j][1], R[j][1], 0.7)]).slice(2, 14);
      stroke(f, mid, swell(1.2));
    };
    tongue(1, 'flame', 2.6);
    tongue(0.55, 'flame-core', 1.2);
  }
}
