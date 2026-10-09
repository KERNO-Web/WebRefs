import { Fragment, useEffect, useRef } from 'react';
import { mountLiquid } from '../fx/liquid';
import { reduced, scrollTo, useProgress } from '../fx/motion';
import { useT } from '../i18n';

export const img = (n: string) => `${import.meta.env.BASE_URL}img/${n}.webp`;

export function Split({ text, className }: { text: string; className?: string }) {
  // letters animate one by one, but each word stays unbreakable so a narrow
  // screen wraps between words, never in the middle of one
  let i = 0;
  const words = text.split(' ');
  return (
    <span className={'split ' + (className ?? '')} aria-label={text}>
      {words.map((w, wi) => (
        <Fragment key={wi}>
          <span className="w" aria-hidden="true">
            {[...w].map((ch) => <span key={i} className="ch" style={{ ['--i' as string]: i++ }}>{ch}</span>)}
          </span>
          {wi < words.length - 1 && (i++, ' ')}
        </Fragment>
      ))}
    </span>
  );
}

export function Hero() {
  const { t } = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLElement>(null);
  useProgress(root);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const mobile = matchMedia('(max-width: 760px)').matches;
    const off = mountLiquid(c, img('hero'), mobile ? [0.62, 0.32] : [0.5, 0.3], { still: reduced() || !matchMedia('(hover: hover)').matches });
    if (!off) c.style.display = 'none';
    return () => { off?.(); };
  }, []);

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero-word" aria-hidden="true"><Split text="NOCTIS" /></div>
      <div className="hero-muse">
        <img src={img('hero')} alt="" width="1600" height="2400" />
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-copy">
        <span className="kicker rise" style={{ ['--d' as string]: '0.1s' }}>{t('Eau de Parfum · Campaign N°1')}</span>
        <h1>
          <span className="line"><span className="rise" style={{ ['--d' as string]: '0.2s' }}>{t('The night')}</span></span>
          <span className="line l2"><em className="rise" style={{ ['--d' as string]: '0.36s' }}>{t('has a body.')}</em></span>
        </h1>
        <p className="rise" style={{ ['--d' as string]: '0.55s' }}>{t('A scent of smoke, velvet and warm skin. Made for the hours after the light is gone.')}</p>
        <div className="hero-cta rise" style={{ ['--d' as string]: '0.7s' }}>
          <button className="cta" onClick={() => scrollTo('#muse')} data-cursor="">{t('Enter the campaign')}<i aria-hidden="true" /></button>
          <button className="play" onClick={() => scrollTo('#film')} data-cursor="">
            <span className="play-ring" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M8 5l11 7-11 7z" fill="currentColor" /></svg></span>
            {t('View the film')}
          </button>
        </div>
      </div>
      <div className="hero-foot rise" style={{ ['--d' as string]: '0.9s' }}>
        <span>{t('Paris · Autumn — Winter')}</span>
        <span className="cue" aria-hidden="true">{t('Scroll')}<i /></span>
        <span>N°1 — 75 ml</span>
      </div>
    </section>
  );
}
