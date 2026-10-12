import { useRef } from 'react';
import { assets } from '../../data/assets';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/** Inside the evening room: one framed photograph of the lanterns, the text beside it, never over it. */
export function Atmosphere() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  return (
    <section className="atmo" id="atmosphere" data-tone="night" aria-labelledby="atmo-h" ref={ref}>
      <div className="atmo-text reveal-type">
        <p className="kicker"><b>02</b> / Зал вечером</p>
        <h2 id="atmo-h" className="subhead">{nb('Бархатные диваны, бар и фонари прямо в кроне')}</h2>
        <p className="body">{nb('Дерево стоит посреди зала: гирлянды в ветвях, красные фонари, вокруг зелёный бархат и кресла. Бар — за кроной.')}</p>
        <p className="track"><span>Зал</span><span>Вечер</span><span>Фото гостей · 2ГИС</span></p>
      </div>
      <figure className="atmo-photo reveal-img">
        <img src={assets.lanterns.src} srcSet={`${assets.lanterns.src} 1440w, ${assets.lanterns.src2x} 2880w`} sizes="(max-width: 899px) 100vw, 58vw"
          alt="Фонари и гирлянды в кроне дерева в зале Sorry Mama" loading="lazy" width={1440} height={1800} />
      </figure>
    </section>
  );
}
