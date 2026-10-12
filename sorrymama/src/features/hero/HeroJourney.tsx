import { useRef } from 'react';
import { assets } from '../../data/assets';
import { nb } from '../../app/nb';
import { useBlossomTimeline } from './useBlossomTimeline';

const hi = { fetchpriority: 'high' } as Record<string, string>; // React 18 has no camelCase prop for it

export function HeroJourney({ onTone }: { onTone: (night: boolean) => void }) {
  const r = {
    track: useRef<HTMLElement>(null), stage: useRef<HTMLDivElement>(null),
    back: useRef<HTMLCanvasElement>(null), front: useRef<HTMLCanvasElement>(null),
    day: useRef<HTMLImageElement>(null), dayFront: useRef<HTMLImageElement>(null), daySoft: useRef<HTMLImageElement>(null),
    title: useRef<HTMLHeadingElement>(null), masthead: useRef<HTMLDivElement>(null),
    nightSoft: useRef<HTMLImageElement>(null), night: useRef<HTMLImageElement>(null),
    scrim: useRef<HTMLDivElement>(null), chapter: useRef<HTMLDivElement>(null),
  };

  useBlossomTimeline(r, onTone);

  return (
    <>
      <section className="journey" ref={r.track} id="top" aria-label="Sorry Mama">
        <div className="stage" ref={r.stage}>
          {/* The photographs are drawn into two canvases (see useBlossomTimeline): sky behind the wordmark,
              everything else in front of it. The <img> elements only load and decode them. */}
          <canvas ref={r.back} className="cv cv-back" aria-hidden="true" />
          <h1 ref={r.title} className="wordmark" aria-label="Sorry Mama">
            <span className="wm-a" aria-hidden="true">SORRY</span>
            <span className="wm-b" aria-hidden="true">MAMA</span>
          </h1>
          <canvas ref={r.front} className="cv cv-front" role="img" aria-label="Летняя терраса Sorry Mama: цветущее дерево, голубые диваны и гирлянды; вечером — зал под деревом с фонарями" />
          <div className="pool" aria-hidden="true">
            <img ref={r.day} src={assets.terrace.src} alt=""
              srcSet={`${assets.terrace.src} 1440w, ${assets.terrace.src15x} 2160w, ${assets.terrace.src2x} 2880w`} sizes="(max-width: 767px) 185vw, 112vw" {...hi} />
            <img ref={r.dayFront} src={assets.front.src} alt=""
              srcSet={`${assets.front.src} 1440w, ${assets.front.src15x} 2160w, ${assets.front.src2x} 2880w`} sizes="(max-width: 767px) 185vw, 112vw" {...hi} />
            <img ref={r.daySoft} src={assets.daySoft.src} alt="" />
            <img ref={r.nightSoft} src={assets.nightSoft.src} alt="" />
            <img ref={r.night} src={assets.lounge.src} alt=""
              srcSet={`${assets.lounge.src} 1440w, ${assets.lounge.src15x} 2160w, ${assets.lounge.src2x} 2880w`} sizes="(max-width: 767px) 110vw, 134vw" />
          </div>
          <div ref={r.scrim} className="wash scrim" aria-hidden="true" />

          <div ref={r.masthead} className="masthead">
            <p className="mh-place">Казань — рест-лаунж</p>
            <div className="mh-actions">
              <a className="btn btn-arrow" href="#menu">Смотреть меню <span aria-hidden="true">↓</span></a>
              <button className="btn btn-ghost" type="button" data-book>Забронировать</button>
            </div>
            <span className="mh-cue" aria-hidden="true">Листайте</span>
          </div>

          <div ref={r.chapter} className="chapter">
            <h2 className="ch-title"><span>Свет</span><span>{nb('в ветвях')}</span></h2>
            <p className="ch-line">{nb('Днём — летняя терраса, вечером — зал под цветущим деревом с фонарями.')}</p>
            <div className="ch-actions">
              <a className="btn btn-gold btn-arrow" href="#menu">Смотреть меню <span aria-hidden="true">↓</span></a>
              <button className="link link-night" type="button" data-book>Забронировать стол</button>
            </div>
          </div>
        </div>
      </section>

      {/* reduced motion: the night scene as its own still instead of the passage */}
      <section className="night-still" aria-hidden="true">
        <img src={assets.lounge.src} alt="" loading="lazy" />
      </section>
    </>
  );
}
