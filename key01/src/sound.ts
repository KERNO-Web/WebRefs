// Keystroke sounds by modal synthesis. A key press is a short contact pulse
// (keycap and stem hitting the plate) exciting the resonances of the case and
// keycap; the release is a second, lighter event when the stem tops out.
// Every profile is rendered into several slightly different variants up
// front, so no two presses sound identical. No audio files, opt-in only.

type Mode = [freq: number, decay: number, amp: number];

interface Hit {
  at: number; // seconds after the event start
  contact: number; // contact pulse length in ms: shorter = harder, brighter
  modes: Mode[];
  noise: number; // broadband share of the pulse
  gain: number;
}

export interface Profile {
  id: string;
  name: string;
  line: string;
  down: Hit[];
  up: Hit[];
  rattle: number; // stabiliser rattle on the space bar
  lowpass: number; // Hz, overall tone
  level: number;
}

export const PROFILES: Profile[] = [
  {
    id: 'thock',
    name: 'Thock',
    line: 'Lubed linears over foam. Deep, round, a little wooden.',
    down: [{ at: 0, contact: 1.1, noise: 0.06, gain: 1, modes: [[170, 0.034, 0.55], [330, 0.028, 1], [610, 0.018, 0.72], [1040, 0.012, 0.42], [1780, 0.007, 0.2], [3100, 0.004, 0.08]] }],
    up: [{ at: 0, contact: 0.8, noise: 0.05, gain: 0.32, modes: [[390, 0.02, 1], [720, 0.014, 0.6], [1250, 0.009, 0.3], [2300, 0.005, 0.12]] }],
    rattle: 0.04,
    lowpass: 5200,
    level: 0.9,
  },
  {
    id: 'clack',
    name: 'Clack',
    line: 'Bare plate, hard caps. Bright, quick and a little loud.',
    down: [
      { at: 0, contact: 0.32, noise: 0.22, gain: 1, modes: [[430, 0.02, 0.32], [990, 0.02, 0.66], [1920, 0.016, 1], [3150, 0.012, 0.74], [4800, 0.009, 0.48], [7300, 0.006, 0.22]] },
      // the spring keeps ringing faintly after the hit
      { at: 0.001, contact: 0.2, noise: 0, gain: 0.05, modes: [[4150, 0.11, 1], [5350, 0.09, 0.7]] },
    ],
    up: [{ at: 0, contact: 0.3, noise: 0.2, gain: 0.58, modes: [[1150, 0.014, 0.7], [2250, 0.012, 1], [3600, 0.009, 0.6], [5600, 0.006, 0.3]] }],
    rattle: 0.18,
    lowpass: 11000,
    level: 0.75,
  },
  {
    id: 'click',
    name: 'Click',
    line: 'A click jacket that snaps on the way down and back up.',
    down: [
      { at: 0, contact: 0.14, noise: 0.35, gain: 1, modes: [[2850, 0.007, 0.55], [4400, 0.006, 1], [6500, 0.004, 0.6]] },
      { at: 0.011, contact: 0.6, noise: 0.1, gain: 0.62, modes: [[310, 0.022, 0.6], [760, 0.018, 0.85], [1520, 0.013, 0.6], [2800, 0.008, 0.32]] },
    ],
    up: [
      { at: 0, contact: 0.14, noise: 0.3, gain: 0.55, modes: [[3000, 0.006, 0.6], [4600, 0.005, 1], [6800, 0.004, 0.5]] },
      { at: 0.004, contact: 0.5, noise: 0.08, gain: 0.25, modes: [[820, 0.012, 1], [1650, 0.009, 0.5]] },
    ],
    rattle: 0.14,
    lowpass: 12000,
    level: 0.7,
  },
  {
    id: 'soft',
    name: 'Soft',
    line: 'Silent switches with dampers. Muted, close, after midnight.',
    down: [{ at: 0, contact: 2.2, noise: 0.02, gain: 1, modes: [[150, 0.022, 1], [300, 0.016, 0.5], [560, 0.01, 0.24], [990, 0.006, 0.1]] }],
    up: [{ at: 0, contact: 1.8, noise: 0.02, gain: 0.14, modes: [[260, 0.012, 1], [520, 0.008, 0.4]] }],
    rattle: 0,
    lowpass: 3200,
    level: 0.85,
  },
];

const VARIANTS = 8;

/** Tiny deterministic PRNG so variants are stable between renders. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * Render one stroke. `pitch` shifts every mode (wide keys sit lower), `seed`
 * nudges each mode's tuning and level so every variant is its own press.
 */
function render(hits: Hit[], sr: number, seed: number, pitch: number, rattle: number, lowpass: number) {
  const rand = rng(seed);
  const len = Math.floor(sr * 0.22);
  const out = new Float32Array(len);
  const all = [...hits];
  if (rattle > 0) {
    // stabiliser wire tapping its housings a few ms after the bottom-out
    for (const dt of [0.003 + rand() * 0.002, 0.008 + rand() * 0.004]) {
      all.push({ at: dt, contact: 0.18, noise: 0.5, gain: rattle, modes: [[2600, 0.006, 1], [3900, 0.005, 0.7], [5800, 0.003, 0.4]] });
    }
  }
  for (const hit of all) {
    const start = Math.floor((hit.at + rand() * 0.0006) * sr);
    // contact pulse: a half-sine (Hertzian contact) plus a little noise
    const pulseLen = Math.max(2, Math.floor((hit.contact / 1000) * sr * (0.85 + rand() * 0.3)));
    const pulse = new Float32Array(pulseLen);
    for (let n = 0; n < pulseLen; n++) {
      pulse[n] = Math.sin((Math.PI * n) / pulseLen) * (1 - hit.noise) + (rand() * 2 - 1) * hit.noise;
    }
    for (const [f0, decay, amp0] of hit.modes) {
      const f = f0 * pitch * (0.96 + rand() * 0.08);
      if (f > sr * 0.45) continue;
      const amp = amp0 * (0.75 + rand() * 0.5) * hit.gain;
      const w = (2 * Math.PI * f) / sr;
      const r = Math.exp(-1 / (decay * (0.85 + rand() * 0.3) * sr));
      const a1 = 2 * r * Math.cos(w);
      const a2 = -r * r;
      // b0 = amp·sin(w) keeps a unit impulse at roughly `amp` peak
      const b0 = amp * Math.sin(w);
      let y1 = 0;
      let y2 = 0;
      for (let n = 0; n + start < len; n++) {
        const x = n < pulseLen ? pulse[n] : 0;
        const y = b0 * x + a1 * y1 + a2 * y2;
        y2 = y1;
        y1 = y;
        out[n + start] += y;
        if (n > pulseLen && Math.abs(y) < 1e-6 && Math.abs(y2) < 1e-6) break;
      }
    }
    // the bare contact click on top, high-passed
    let prev = 0;
    for (let n = 0; n < pulseLen && n + start < len; n++) {
      out[n + start] += (pulse[n] - prev) * hit.noise * hit.gain * 0.6;
      prev = pulse[n];
    }
  }
  // overall tone: one-pole low-pass, then normalise
  const k = 1 - Math.exp((-2 * Math.PI * lowpass) / sr);
  let lp = 0;
  let peak = 0;
  for (let n = 0; n < len; n++) {
    lp += (out[n] - lp) * k;
    out[n] = lp;
    peak = Math.max(peak, Math.abs(lp));
  }
  if (peak > 0) for (let n = 0; n < len; n++) out[n] /= peak;
  // short fade so buffers never end on a click
  const fade = Math.floor(sr * 0.01);
  for (let n = 0; n < fade; n++) out[len - 1 - n] *= n / fade;
  return out;
}

interface Bank {
  down: Float32Array[];
  up: Float32Array[];
  spaceDown: Float32Array[];
  spaceUp: Float32Array[];
}

export interface StrokeOpts {
  /** -1 (left edge) … 1 (right edge) */
  x?: number;
  wide?: boolean;
}

class Synth {
  enabled = false;
  profile: Profile = PROFILES[0];
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private banks = new Map<string, Bank>();
  private listeners = new Set<() => void>();
  private previews = new Map<string, Float32Array>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((f) => f());
  }

  private bank(p: Profile): Bank {
    let b = this.banks.get(p.id);
    if (b || !this.ctx) return b!;
    const sr = this.ctx.sampleRate;
    const seedBase = p.id.length * 7919;
    const make = (hits: Hit[], i: number, pitch: number, rattle: number) => render(hits, sr, seedBase + i * 104729, pitch, rattle, p.lowpass);
    b = {
      down: Array.from({ length: VARIANTS }, (_, i) => make(p.down, i, 1, 0)),
      up: Array.from({ length: VARIANTS }, (_, i) => make(p.up, i + 50, 1, 0)),
      spaceDown: Array.from({ length: 3 }, (_, i) => make(p.down, i + 100, 0.76, p.rattle)),
      spaceUp: Array.from({ length: 3 }, (_, i) => make(p.up, i + 150, 0.8, p.rattle * 0.6)),
    };
    this.banks.set(p.id, b);
    return b;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on && !this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      this.ctx = ctx;
      // a small, soft room: the desk and the wall behind it
      const ir = ctx.createBuffer(2, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let n = 0; n < d.length; n++) d[n] = (Math.random() * 2 - 1) * Math.exp(-n / (ctx.sampleRate * 0.055));
      }
      const verb = ctx.createConvolver();
      verb.buffer = ir;
      const wet = ctx.createGain();
      wet.gain.value = 0.16;
      this.out = ctx.createGain();
      this.out.gain.value = 0.55;
      this.out.connect(ctx.destination);
      this.out.connect(verb).connect(wet).connect(ctx.destination);
    }
    this.ctx?.resume();
    if (on) this.bank(this.profile);
    this.emit();
  }

  setProfile(p: Profile) {
    this.profile = p;
    if (this.ctx) this.bank(p);
    this.emit();
  }

  private play(buf: Float32Array, opts: StrokeOpts, level: number) {
    if (!this.enabled || !this.ctx || !this.out) return;
    const ctx = this.ctx;
    const ab = ctx.createBuffer(1, buf.length, ctx.sampleRate);
    ab.copyToChannel(buf as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = ab;
    src.playbackRate.value = 0.985 + Math.random() * 0.03;
    const g = ctx.createGain();
    g.gain.value = level * this.profile.level * (0.82 + Math.random() * 0.3);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-1, Math.min(1, (opts.x ?? 0) * 0.45));
    src.connect(g).connect(pan).connect(this.out);
    src.start();
  }

  down(opts: StrokeOpts = {}) {
    const b = this.bank(this.profile);
    if (!b) return;
    const set = opts.wide ? b.spaceDown : b.down;
    this.play(set[Math.floor(Math.random() * set.length)], opts, 1);
  }

  up(opts: StrokeOpts = {}) {
    const b = this.bank(this.profile);
    if (!b) return;
    const set = opts.wide ? b.spaceUp : b.up;
    this.play(set[Math.floor(Math.random() * set.length)], opts, 1);
  }

  /** A full press for taps and demos: down, then up a human beat later. */
  tap(opts: StrokeOpts = {}, hold = 0.08 + Math.random() * 0.05) {
    this.down(opts);
    setTimeout(() => this.up(opts), hold * 1000);
  }

  /** One keystroke (down + release) rendered for the waveform display. */
  preview(p: Profile) {
    let w = this.previews.get(p.id);
    if (w) return w;
    const sr = 22050;
    const down = render(p.down, sr, 11, 1, 0, p.lowpass);
    const up = render(p.up, sr, 12, 1, 0, p.lowpass);
    const gap = Math.floor(sr * 0.11);
    w = new Float32Array(gap + up.length);
    w.set(down.subarray(0, Math.min(down.length, w.length)));
    const upGain = p.up[0].gain;
    for (let n = 0; n < up.length; n++) w[gap + n] += up[n] * upGain;
    this.previews.set(p.id, w);
    return w;
  }
}

export const synth = new Synth();
