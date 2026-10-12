import { assets } from '../../data/assets';
import { nb } from '../../app/nb';

/** The night photograph runs on below the hero, then opens onto the lanterns in the crown. */
export function Atmosphere() {
  return (
    <section className="atmo" id="atmosphere" data-tone="night" aria-labelledby="atmo-h">
      <div className="atmo-tail" aria-hidden="true" />
      <div className="atmo-art">
        <figure className="atmo-photo">
          <img src={assets.lanterns.src} srcSet={`${assets.lanterns.src} 1440w, ${assets.lanterns.src2x} 2880w`} sizes="(max-width: 899px) 100vw, 64vw"
            alt="Фонари и гирлянды в кроне дерева в зале Sorry Mama" loading="lazy" width={1440} height={1800} />
        </figure>
        <div className="atmo-text">
          <h2 id="atmo-h" className="subhead">{nb('Бархатные диваны, бар и фонари прямо в кроне')}</h2>
          <p className="body">{nb('Дерево стоит посреди зала: гирлянды в ветвях, красные фонари, вокруг зелёный бархат и кресла. Бар — за кроной.')}</p>
          <p className="track"><span>Зал</span><span>Вечер</span><span>Фото гостей · 2ГИС</span></p>
        </div>
      </div>
    </section>
  );
}
