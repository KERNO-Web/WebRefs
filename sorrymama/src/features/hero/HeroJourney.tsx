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
    day: useRef<HTMLImageElement>(null), crown: useRef<HTMLImageElement>(null), dusk: useRef<HTMLDivElement>(null),
    title: useRef<HTMLHeadingElement>(null), info: useRef<HTMLDivElement>(null),
    veil: useRef<HTMLImageElement>(null), curtain: useRef<HTMLImageElement>(null),
    night: useRef<HTMLImageElement>(null), caption: useRef<HTMLDivElement>(null),
  };

  // the section after the hero continues the night photograph pixel for pixel
  const onLayout = (L: HeroLayout) => {
    const s = document.documentElement.style;
    s.setProperty('--night-size', `${L.night.w}px ${L.night.h}px`);
    s.setProperty('--night-x', `${L.night.x}px`);
    s.setProperty('--night-y', `${L.night.y - L.H}px`); // offset to where the stage ends
    s.setProperty('--night-tail', `${Math.ceil(L.tail)}px`);
    // set inline so the URL resolves against the document, not the built stylesheet
    const tail = document.querySelector<HTMLElement>('.atmo-tail');
    if (tail) tail.style.backgroundImage = `url("${r.night.current?.currentSrc || assets.lounge.src}")`;
  };
  useBlossomTimeline(r, onLayout, onTone);

  return (
    <>
      <section className="journey" ref={r.track} id="top" aria-label="Sorry Mama">
        <div className="stage" ref={r.stage}>
          <img ref={r.day} className="ph day" src={assets.terrace.src} alt="Летняя терраса Sorry Mama: цветущее дерево, голубые диваны и гирлянды" {...hi} />
          <div ref={r.dusk} className="wash dusk" aria-hidden="true" />
          <img ref={r.night} className="ph night" src={assets.lounge.src} alt="Зал Sorry Mama вечером: цветущее дерево с фонарями, бархатные диваны и бар" />

          <h1 ref={r.title} className="wordmark" aria-label="Sorry Mama">
            <span className="wm-a" aria-hidden="true">SORRY</span>
            <span className="wm-b" aria-hidden="true">MAMA</span>
          </h1>

          {/* the crown of the same terrace tree, in front of the letters */}
          <img ref={r.crown} className="ph crown" src={assets.crown.src} alt="" aria-hidden="true" />
          <img ref={r.veil} className="ph veil" src={assets.bloom.src} alt="" aria-hidden="true" />
          <img ref={r.curtain} className="curtain" src={assets.curtain.src} alt="" aria-hidden="true" />

          <div ref={r.info} className="hero-info">
            <div className="hero-fact">
              <p className="label">{venue.kind} · {venue.city}</p>
              <p className="hero-line">{nb('Днём — терраса. Вечером — лаунж.')}</p>
            </div>
            <div className="hero-actions">
              <a className="btn" href={venue.phone.href}>Забронировать стол</a>
              <a className="link" href="#menu">Смотреть меню</a>
            </div>
          </div>

          <div ref={r.caption} className="night-caption">
            <p className="label">Вечером</p>
            <p className="night-line">{nb('Лаунж под цветущим деревом')}</p>
            <a className="link" href={venue.phone.href}>Забронировать стол</a>
          </div>
        </div>
      </section>

      {/* reduced motion: the night scene as its own still instead of the scrubbed cut */}
      <section className="night-still" aria-hidden="true">
        <img src={assets.lounge.src} alt="" loading="lazy" />
      </section>
    </>
  );
}
