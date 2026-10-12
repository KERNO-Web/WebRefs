import { useRef } from 'react';
import { assets } from '../../data/assets';
import { venue } from '../../data/venue';
import { menu } from '../../data/menu';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/*
 * The menu gateway, early on the page: heading → one line → the button, with two photographs that are
 * themselves doors into the menu. Points at the live 2GIS menu until src/data/menu.ts is filled;
 * the photos are labelled «Кухня» / «Бар», never with dish names.
 */
const DOORS = [
  { img: assets.kitchen, w: 1080, h: 1350, label: 'Кухня', alt: 'Салат с рукколой и гранатом на тарелке в Sorry Mama', cls: 'mc-kitchen' },
  { img: assets.cocktail, w: 1240, h: 1500, label: 'Бар', alt: 'Коктейли на столе в зале, за ними цветущее дерево', cls: 'mc-bar' },
];

export function Menu() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const ready = menu.length > 0;
  const ext = { href: venue.menuSource, target: '_blank', rel: 'noopener noreferrer' };
  return (
    <section className="menu" id="menu" data-tone="day" aria-labelledby="menu-h" ref={ref}>
      <div className="menu-head reveal-type">
        <div>
          <p className="kicker"><b>03</b> / Кухня и бар</p>
          <h2 id="menu-h" className="title-xl menu-title">Меню</h2>
          <p className="menu-lead">{nb('Блюда кухни, коктейли и напитки бара — с актуальными ценами.')}</p>
          {ready && <ul className="menu-cats">{menu.map((c) => <li key={c.id}>{c.category}</li>)}</ul>}
          <a className="btn btn-xl btn-arrow" {...ext}>Открыть меню <span aria-hidden="true">↗</span></a>
        </div>
        <p className="menu-note">{nb('Меню открывается в карточке заведения в 2ГИС.')}</p>
      </div>
      <div className="menu-doors">
        {DOORS.map((d, i) => (
          <a key={d.label} className={`menu-door reveal-img ${d.cls}${i ? ' reveal-late' : ''}`} {...ext} data-cursor="view" aria-label={`Меню: ${d.label}`}>
            <img src={d.img.src} srcSet={'src2x' in d.img ? `${d.img.src} 1080w, ${d.img.src2x} 2160w` : undefined}
              sizes="(max-width: 899px) 50vw, 30vw" alt={d.alt} loading="lazy" width={d.w} height={d.h} />
            <span className="md-label" aria-hidden="true">{d.label}<i>↗</i></span>
          </a>
        ))}
      </div>
    </section>
  );
}
