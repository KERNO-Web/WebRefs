import { useEffect, useRef } from 'react';
import { mountDust } from '../fx/dust';
import { reduced, scrollTo, useProgress, useReveal } from '../fx/motion';
import { useT } from '../i18n';
import { Split, img } from './Hero';

const SHOTS: [string, string][] = [
  ['film-1', 'She arrives after midnight.'],
  ['film-2', 'Blue hour stays on her skin.'],
  ['film-3', 'Glass remembers the heat.'],
  ['film-4', 'And then — only the scent.'],
];
const LENGTH = 48;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/* ---------------- V. The film: scroll is the playhead ---------------- */

export function Film() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(HTMLParagraphElement | null)[]>([]);
  const code = useRef<HTMLSpanElement>(null);

  useProgress(root, (p) => {
    const n = SHOTS.length;
    // the last shot gets a little extra time before the section lets go
    const f = clamp(p * 1.08) * n;
    shots.current.forEach((el, i) => {
      if (!el) return;
      const enter = i === 0 ? 1 : clamp((f - i) * 3.2);
      const local = clamp((f - i + 0.3) / 1.3);
      el.style.setProperty('--e', enter.toFixed(4));
      el.style.setProperty('--k', local.toFixed(4));
    });
    const cur = Math.min(n - 1, Math.floor(f));
    lines.current.forEach((el, i) => { if (!el) return; if (i === cur) el.setAttribute('data-on', ''); else el.removeAttribute('data-on'); });
    if (code.current) {
      const s = Math.round(p * LENGTH);
      code.current.textContent = `00:${String(s).padStart(2, '0')}`;
    }
  });

  return (
    <section className="film" id="film" ref={root}>
      <div className="film-stage">
        {SHOTS.map(([image], i) => (
          <div key={image} className={'shot s' + (i + 1)} ref={(el) => { shots.current[i] = el; }}>
            <img src={img(image)} alt="" loading="lazy" />
          </div>
        ))}
        <div className="film-bars" aria-hidden="true"><i /><i /></div>
        <div className="film-head">
          <span className="kicker">{t('V — The Film')}</span>
          <span className="rec" aria-hidden="true"><i />NOCTIS — N°1</span>
        </div>
        <div className="film-lines">
          {SHOTS.map(([image, line], i) => (
            <p key={image} ref={(el) => { lines.current[i] = el; }} data-on={i === 0 ? '' : undefined}><Split text={t(line)} /></p>
          ))}
        </div>
        <div className="film-time" aria-hidden="true">
          <span ref={code}>00:00</span>
          <span className="film-track"><i /></span>
          <span>00:{LENGTH}</span>
        </div>
      </div>
    </section>
  );
}

/* ---------------- VI. Closing scene ---------------- */

export function Closing() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  const dust = useRef<HTMLCanvasElement>(null);
  useReveal(root);
  useProgress(root);
  useEffect(() => {
    if (!dust.current || reduced()) return;
    return mountDust(dust.current, matchMedia('(max-width: 760px)').matches ? 40 : 80);
  }, []);
  return (
    <section className="closing" id="end" ref={root}>
      <img className="closing-figure" src={img('close')} alt="" loading="lazy" />
      <canvas className="dust" ref={dust} aria-hidden="true" />
      <div className="closing-copy">
        <p className="closing-line" data-reveal=""><em>{t('The night leaves a trace.')}</em></p>
        <span className="closing-sub" data-reveal="">{t('Wear the night.')}</span>
        <button className="cta" data-reveal="" data-cursor="" onClick={() => scrollTo(0)}>{t('Back to the beginning')}<i aria-hidden="true" /></button>
      </div>
      <div className="closing-word" aria-hidden="true">NOCTIS</div>
      <p className="colophon">{t('NOCTIS is a fictional campaign made as a portfolio piece. Photography from Unsplash.')}</p>
    </section>
  );
}
