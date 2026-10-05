import { useEffect, useRef } from 'react';
import { synth } from './sound';

const W = 1200;
const H = 260;
const COLS = 300;

/**
 * The actual waveform of the selected voice: a few keystrokes (press and
 * release) drawn like an audio editor. Every press kicks it, then it settles.
 */
export default function Waveform() {
  const main = useRef<SVGPathElement>(null);

  useEffect(() => {
    let energy = 0.6;
    let raf = 0;
    const kick = () => (energy = Math.min(1.3, energy + 0.5));
    addEventListener('key01:press', kick);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // one strip = four strokes spaced like relaxed typing, built per voice
    const strips = new Map<string, Float32Array>();
    const strip = () => {
      const p = synth.profile;
      let cols = strips.get(p.id);
      if (cols) return cols;
      const stroke = synth.preview(p);
      const spacing = Math.floor(stroke.length * 1.25);
      const total = spacing * 4;
      cols = new Float32Array(COLS);
      for (let c = 0; c < COLS; c++) {
        const a = Math.floor((c / COLS) * total);
        const b = Math.floor(((c + 1) / COLS) * total);
        let peak = 0;
        for (let n = a; n < b; n++) {
          const v = Math.abs(stroke[n % spacing] ?? 0);
          if (v > peak) peak = v;
        }
        cols[c] = peak;
      }
      strips.set(p.id, cols);
      return cols;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      energy += (0.6 - energy) * 0.06;
      const cols = strip();
      const shift = reduce ? 0 : Math.floor(now / 40) % COLS;
      const amp = (H / 2 - 6) * energy;
      let d = '';
      for (let c = 0; c < COLS; c++) {
        const v = cols[(c + shift) % COLS];
        const x = ((c + 0.5) / COLS) * W;
        const h = Math.max(0.6, v * amp);
        d += `M${x.toFixed(1)} ${(H / 2 - h).toFixed(1)}V${(H / 2 + h).toFixed(1)}`;
      }
      main.current?.setAttribute('d', d);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('key01:press', kick);
    };
  }, []);

  return (
    <svg className="wave" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} className="axis" />
      <path ref={main} className="main" />
    </svg>
  );
}
