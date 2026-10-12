import { assets } from '../../data/assets';
import { nb } from '../../app/nb';

/** Continues the night photograph from the hero, then opens onto the room's lanterns. */
export function Atmosphere() {
  return (
    <section className="atmo" id="atmosphere" data-tone="night" aria-labelledby="atmo-h">
      <div className="atmo-tail" aria-hidden="true" />
      <div className="atmo-grid">
        <div className="atmo-text">
          <h2 id="atmo-h" className="display">{nb('Свет в ветвях')}</h2>
          <p className="body">{nb('В зале — большое цветущее дерево с гирляндами и фонарями, бархатные диваны и кресла, бар за кроной.')}</p>
          <a className="link link-night" href="#menu">Смотреть меню</a>
        </div>
        <figure className="atmo-photo">
          <img src={assets.lanterns.src} alt="Фонари и гирлянды в кроне дерева в зале Sorry Mama" loading="lazy" width={1440} height={1800} />
        </figure>
        <figure className="atmo-detail" aria-hidden="true">
          <img src={assets.bloom.src} alt="" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}
