import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { menu } from '../../data/menu';
import { nb } from '../../app/nb';

/**
 * Real menu when src/data/menu.ts is filled; until then an honest pointer to the live listing.
 * No invented dishes, no invented prices.
 */
export function Menu() {
  const ready = menu.length > 0;
  return (
    <section className="menu" id="menu" data-tone="day" aria-labelledby="menu-h">
      <h2 id="menu-h" className="menu-title">Меню</h2>
      <figure className="menu-photo">
        <img src={assets.cocktail.src} alt="Коктейль на столе в зале Sorry Mama, за ним цветущее дерево" loading="lazy" width={1240} height={1500} />
      </figure>
      <div className="menu-body">
        {ready ? (
          <ul className="menu-cats">{menu.map((c) => <li key={c.id}>{c.category}</li>)}</ul>
        ) : (
          <p className="body">{nb('Актуальное меню с ценами — в карточке заведения в 2ГИС.')}</p>
        )}
        <a className="btn" href={venue.menuSource} target="_blank" rel="noopener noreferrer">Смотреть меню в 2ГИС</a>
      </div>
    </section>
  );
}
