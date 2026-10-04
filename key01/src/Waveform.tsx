import { useEffect, useRef } from 'react';
import { synth } from './sound';

const W = 1200;
const H = 260;
const N = 240;

/** A live waveform: every keystroke (real or demo) kicks it, then it settles. */
export default function Waveform() {
  const main = useRef<SVGPathElement>(null);
  const echo = useRef<SVGPathElement>(null);

  useEffect(() => {
    let energy = 0.55;
    let raf = 0;
    const kick = () => (energy = Math.min(1.4, energy + 0.75));
    addEventListener('key01:press', kick);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const build = (time: number, amp: number, phase: number) => {
      const p = synth.profile;
      const sharp = 0.035 / p.decay; // crisp profiles ring shorter and tighter
      const freq = 6 + p.click / 420;
      let d = '';
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        // repeating bursts across the line, like a run of keystrokes
        const local = (t * 4 + phase) % 1;
        const env = Math.exp(-local * 5 * sharp) * (1 - Math.exp(-local * 60));
        const body = Math.sin(local * Math.PI * 2 * (p.body / 60)) * p.bodyGain;
        const click = Math.sin(local * Math.PI * 2 * freq * 3 + time * 3) * p.clickGain;
        const y = H / 2 - (body + click) * env * amp * (H * 0.42);
        d += `${i ? 'L' : 'M'}${((t * W) | 0)} ${y.toFixed(1)}`;
      }
      return d;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      energy += (0.5 - energy) * 0.05;
      const time = reduce ? 0 : now / 1000;
      main.current?.setAttribute('d', build(time, energy, reduce ? 0 : time * 0.12));
      echo.current?.setAttribute('d', build(time + 0.4, energy * 0.6, reduce ? 0.05 : time * 0.12 + 0.03));
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
      <path ref={echo} className="echo" />
      <path ref={main} className="main" />
    </svg>
  );
}
