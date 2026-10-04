// Keystroke sounds synthesised on the fly: a short body tone for the "thock"
// plus a filtered noise click for the top-out. No audio files, opt-in only.

export interface Profile {
  id: string;
  name: string;
  line: string;
  body: number; // Hz of the low body tone
  bodyGain: number;
  click: number; // filter frequency of the click
  clickQ: number;
  clickGain: number;
  decay: number; // seconds
}

export const PROFILES: Profile[] = [
  { id: 'thock', name: 'Thock', line: 'Deep, round, a little wooden. The sound people chase.', body: 150, bodyGain: 0.55, click: 1300, clickQ: 0.8, clickGain: 0.35, decay: 0.075 },
  { id: 'crisp', name: 'Crisp', line: 'Bright and quick, like a clean pencil line.', body: 260, bodyGain: 0.18, click: 4200, clickQ: 1.4, clickGain: 0.5, decay: 0.035 },
  { id: 'soft', name: 'Soft', line: 'Muted and close. For the hours after midnight.', body: 120, bodyGain: 0.28, click: 700, clickQ: 0.6, clickGain: 0.16, decay: 0.09 },
  { id: 'snap', name: 'Snap', line: 'A tactile bump, then a clean, decisive return.', body: 210, bodyGain: 0.32, click: 2600, clickQ: 2.2, clickGain: 0.55, decay: 0.05 },
];

class Synth {
  enabled = false;
  profile: Profile = PROFILES[0];
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private listeners = new Set<() => void>();

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((f) => f());
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on && !this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const len = Math.floor(this.ctx.sampleRate * 0.2);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    this.ctx?.resume();
    this.emit();
  }

  setProfile(p: Profile) {
    this.profile = p;
    this.emit();
  }

  play(variation = Math.random()) {
    if (!this.enabled || !this.ctx || !this.noise) return;
    const ctx = this.ctx;
    const p = this.profile;
    const t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.5;
    out.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const f = p.body * (0.94 + variation * 0.12);
    osc.frequency.setValueAtTime(f * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.02);
    const og = ctx.createGain();
    og.gain.setValueAtTime(p.bodyGain, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + p.decay * 1.4);
    osc.connect(og).connect(out);
    osc.start(t);
    osc.stop(t + p.decay * 1.6);

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = p.click * (0.9 + variation * 0.2);
    bp.Q.value = p.clickQ;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(p.clickGain, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
    src.connect(bp).connect(ng).connect(out);
    src.start(t);
    src.stop(t + p.decay * 1.2);
  }
}

export const synth = new Synth();
