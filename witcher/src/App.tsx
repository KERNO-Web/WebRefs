import { useEffect, useRef } from 'react';
import { startFx } from './fx';
import { startMotion } from './motion';
import { useI18n } from './i18n';
import { Nav, Hero, World, Witcher, Fate, Moments, Choices, Finale } from './Sections';

export default function App() {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const motion = startMotion(reduced);
    const stopFx = canvas.current ? startFx(canvas.current, motion.levels, reduced) : () => {};
    const ready = setTimeout(() => document.documentElement.classList.add('ready'), 60);
    return () => { clearTimeout(ready); motion.stop(); stopFx(); };
  }, []);

  return (
    <>
      <a className="skip" href="#world">{t('Skip to content')}</a>
      <Nav />
      <main>
        <Hero />
        <World />
        <Witcher />
        <Fate />
        <Moments />
        <Choices />
        <Finale />
      </main>
      <canvas ref={canvas} className="fx" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
