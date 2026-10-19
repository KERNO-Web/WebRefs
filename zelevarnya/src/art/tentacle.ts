import { el, P, rng, smooth, taper } from '../ink';

// A living engraved tentacle. Geometry is rebuilt each frame from a spine
// whose curvature grows toward the tip, so it curls like an octopus arm.
export interface TentacleOpts {
  x: number; y: number; angle: number; length: number; width: number;
  curl: number; // signed: + curls clockwise
  phase?: number;
}

const N = 64;

export class Tentacle {
  g: SVGGElement;
  private body: SVGPathElement;
  private edgeA: SVGPathElement;
  private edgeB: SVGPathElement;
  private rings: SVGPathElement;
  private suckers: SVGPathElement;
  extend = 0;
  target = 0;
  twitch = 0;
  frame = 0;

  constructor(parent: Element, public o: TentacleOpts) {
    this.g = el('g', { class: 'tentacle' }, parent);
    this.body = el('path', { class: 'paper-fill' }, this.g);
    this.rings = el('path', { class: 'ink' }, this.g);
    this.suckers = el('path', { class: 'ink sucker' }, this.g);
    this.edgeA = el('path', { class: 'ink' }, this.g);
    this.edgeB = el('path', { class: 'ink' }, this.g);
  }

  spine(t: number): { pts: P[]; nrm: P[]; w: number[] } {
    const o = this.o, e = Math.max(0.02, this.extend);
    const L = o.length * e, ds = L / N;
    const pts: P[] = [], nrm: P[] = [], w: number[] = [];
    let a = o.angle, x = o.x, y = o.y;
    const ph = o.phase ?? 0;
    const jit = rng(this.frame * 131 + Math.round(ph * 100));
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([x, y]);
      nrm.push([-Math.sin(a), Math.cos(a)]);
      w.push(o.width * Math.pow(1 - s, 0.85) * (0.6 + 0.4 * e) + 0.6);
      const sway = Math.sin(t * 1.1 + ph - s * 4) * 0.05 * s + this.twitch * Math.sin(t * 9 + s * 6) * 0.04 * s;
      const k = o.curl * (0.004 + Math.pow(s, 4) * (0.5 + (1 - e) * 0.4)) * (64 / N);
      a += k + sway + (jit() - 0.5) * 0.012;
      x += Math.cos(a) * ds;
      y += Math.sin(a) * ds;
    }
    return { pts, nrm, w };
  }

  // Advance one hand-drawn frame: ease toward the target length in visible steps.
  step(t: number, frame: number) {
    this.frame = frame;
    const d = this.target - this.extend;
    this.extend += Math.abs(d) < 0.02 ? d : d * 0.22;
    this.twitch *= 0.8;
    this.update(t);
  }

  update(t: number) {
    const { pts, nrm, w } = this.spine(t);
    const A: P[] = pts.map(([x, y], i) => [x + nrm[i][0] * w[i] / 2, y + nrm[i][1] * w[i] / 2]);
    const B: P[] = pts.map(([x, y], i) => [x - nrm[i][0] * w[i] / 2, y - nrm[i][1] * w[i] / 2]);
    this.body.setAttribute('d', smooth([...A, ...B.slice().reverse()], true));
    this.edgeA.setAttribute('d', taper(A, (s) => 1 + 2.4 * (1 - s)));
    this.edgeB.setAttribute('d', taper(B, (s) => 0.8 + 4.2 * (1 - s)));

    // Cross-contour rings, heavier toward the B (shadow) edge.
    let rd = '';
    for (let i = 2; i < N - 2; i += 2) {
      const [x, y] = pts[i], [nx, ny] = nrm[i], hw = w[i] / 2;
      if (hw < 1.6) break;
      const bow = hw * 0.25;
      const tx = -ny, ty = nx;
      const ring: P[] = [];
      for (let j = 0; j <= 8; j++) {
        const u = -0.85 + (1.75 * j) / 8;
        const b = bow * (1 - u * u);
        ring.push([x + nx * u * hw + tx * b, y + ny * u * hw + ty * b]);
      }
      rd += taper(ring, (s) => 0.15 + s * s * Math.min(2.2, hw * 0.12));
    }
    this.rings.setAttribute('d', rd);

    // Suckers along the A edge.
    let sd = '';
    for (let i = 5; i < N - 6; i += 4) {
      const hw = w[i] / 2;
      if (hw < 2.4) break;
      const r = hw * 0.48;
      const [x, y] = pts[i], [nx, ny] = nrm[i];
      const cx = x + nx * hw * 0.78, cy = y + ny * hw * 0.78;
      sd += ellipse(cx, cy, r, r * 0.7, Math.atan2(ny, nx));
      sd += ellipse(cx, cy, r * 0.45, r * 0.3, Math.atan2(ny, nx));
    }
    this.suckers.setAttribute('d', sd);
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, rot: number): string {
  const c = Math.cos(rot), s = Math.sin(rot);
  const p = (a: number) => {
    const x = Math.cos(a) * ry, y = Math.sin(a) * rx;
    return `${(cx + x * c - y * s).toFixed(1)} ${(cy + x * s + y * c).toFixed(1)}`;
  };
  return `M${p(0)}A${ry.toFixed(1)} ${rx.toFixed(1)} ${((rot * 180) / Math.PI).toFixed(0)} 1 1 ${p(Math.PI)}A${ry.toFixed(1)} ${rx.toFixed(1)} ${((rot * 180) / Math.PI).toFixed(0)} 1 1 ${p(0)}Z`;
}
