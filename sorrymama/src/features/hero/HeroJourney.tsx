import { useRef } from 'react';
import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { nb } from '../../app/nb';
import { useBlossomTimeline } from './useBlossomTimeline';
import type { HeroLayout } from './layout';

const hi = { fetchpriority: 'high' } as Record<string, string>; // React 18 has no camelCase prop for it

export function HeroJourney({ onTone }: { onTone: (night: boolean) => void }) {
  const r = {
    track: useRef<HTMLElement>(null), stage: useRef<HTMLDivElement>(null),
    day: useRef<HTMLImageElement>(null), daySoft: useRef<HTMLImageElement>(null), front: useRef<HTMLImageElement>(null),
    title: useRef<HTMLHeadingElement>(null), masthead: useRef<HTMLDivElement>(null),
    nightSoft: useRef<HTMLImageElement>(null), night: useRef<HTMLImageElement>(null),
    scrim: useRef<HTMLDivElement>(null), chapter: useRef<HTMLDivElement>(null),
  };

  // the section after the hero continues the night photograph pixel for pixel
  const onLayout = (L: HeroLayout) => {
    const s = document.documentElement.style;
    s.setProperty('--night-size', `${L.night.w}px ${L.night.h}px`);
    s.setProperty('--night-x', `${L.night.x}px`);
    s.setProperty('--night-y', `${L.night.y - L.H}px`);
    s.setProperty('--night-tail', `${Math.ceil(L.tail)}px`);
    const tail = document.querySelector<HTMLElement>('.atmo-tail');
    if (tail) tail.style.backgroundImage = `url("${r.night.current?.currentSrc || assets.lounge.src}")`;
  };
  useBlossomTimeline(r, onLayout, onTone);

  return (
    <>
      <section className="journey" ref={r.track} id="top" aria-label="Sorry Mama">
        <div className="stage" ref={r.stage}>
          <img ref={r.day} className="ph day" src={assets.terrace.src}
            srcSet={`${assets.terrace.src} 1440w, ${assets.terrace.src2x} 2880w`} sizes="(max-width: 767px) 185vw, 112vw"
            alt="" aria-hidden="true" {...hi} />
          <h1 ref={r.title} className="wordmark" aria-label="Sorry Mama">
            <span className="wm-a" aria-hidden="true">SORRY</span>
            <span className="wm-b" aria-hidden="true">MAMA</span>
          </h1>
          {/* terrace, wires and tree in front of the wordmark */}
          <img ref={r.front} className="ph front" src={assets.front.src}
            srcSet={`${assets.front.src} 1440w, ${assets.front.src2x} 2880w`} sizes="(max-width: 767px) 185vw, 112vw"
            alt="Летняя терраса Sorry Mama: цветущее дерево, голубые диваны и гирлянды" {...hi} />
          <img ref={r.daySoft} className="ph soft" src={assets.daySoft.src} alt="" aria-hidden="true" />
          <img ref={r.nightSoft} className="ph soft night-soft" src={assets.nightSoft.src} alt="" aria-hidden="true" />
          <img ref={r.night} className="ph night" src={assets.lounge.src} alt="Зал Sorry Mama вечером: цветущее дерево с фонарями, бархатные диваны и бар" />
          <div ref={r.scrim} className="wash scrim" aria-hidden="true" />

          <div ref={r.masthead} className="masthead">
            <p className="mh-index"><b>01</b> / 02</p>
            <p className="mh-place">Казань — рест-лаунж</p>
            <div className="mh-actions">
              <a className="link" href="#menu">Меню</a>
              <a className="btn" href={venue.phone.href}>Забронировать</a>
            </div>
            <span className="mh-cue" aria-hidden="true">Листайте</span>
          </div>

          <div ref={r.chapter} className="chapter">
            <p className="ch-index" aria-hidden="true"><b>02</b> / Вечер</p>
            <h2 className="ch-title"><span>Свет</span><span>{nb('в ветвях')}</span></h2>
            <p className="ch-line">{nb('Днём — летняя терраса, вечером — зал под цветущим деревом с фонарями.')}</p>
            <div className="ch-actions">
              <a className="btn btn-gold" href={venue.phone.href}>Забронировать стол</a>
              <a className="link link-night" href="#menu">Смотреть меню</a>
            </div>
          </div>
        </div>
      </section>

      {/* reduced motion: the night scene as its own still instead of the scrubbed passage */}
      <section className="night-still" aria-hidden="true">
        <img src={assets.lounge.src} alt="" loading="lazy" />
      </section>
    </>
  );
}
