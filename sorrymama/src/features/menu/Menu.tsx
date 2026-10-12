import { useRef } from 'react';
import { assets } from '../../data/assets';
import { menu, dishesWord } from '../../data/menu';
import { nb } from '../../app/nb';
import { useReveal } from '../../app/useReveal';

/*
 * The menu gateway, early on the page: heading → one line → the button, with two photographs that are
 * themselves doors into the full menu page (menu.html). The guest photo is labelled only «Кухня»;
 * the plov is the venue's own menu photo, so it may open «Горячее».
 */
const DOORS = [
  { img: assets.kitchen, w: 1080, h: 1350, label: 'Кухня', href: './menu.html', alt: 'Салат с рукколой и гранатом на тарелке в Sorry Mama', cls: 'mc-kitchen' },
  { img: assets.mainsDoor, w: 639, h: 888, label: 'Горячее', href: './menu.html#mains', alt: 'Арабский плов с верблюдом и бараниной', cls: 'mc-mains' },
];

export function Menu() {
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);
  const dishes = menu.reduce((n, c) => n + c.items.length, 0);
  return (
    <section className="menu" id="menu" data-tone="day" aria-labelledby="menu-h" ref={ref}>
      <div className="menu-head reveal-type">
        <div>
          <h2 id="menu-h" className="title-xl menu-title">Меню</h2>
          <p className="menu-lead">{nb(`${dishesWord(dishes)} с составом и ценами — от брускетт и поке до бешбармака.`)}</p>
          <ul className="menu-cats">{menu.map((c) => <li key={c.id}><a href={`./menu.html#${c.id}`}>{c.category}</a></li>)}</ul>
          <a className="btn btn-xl btn-arrow" href="./menu.html">Открыть меню <span aria-hidden="true">→</span></a>
        </div>
        <p className="menu-note">{nb('Цены — по меню заведения, уточняйте у официанта.')}</p>
      </div>
      <div className="menu-doors">
        {DOORS.map((d, i) => (
          <a key={d.label} className={`menu-door reveal-img ${d.cls}${i ? ' reveal-late' : ''}`} href={d.href} data-cursor="view" aria-label={`Меню: ${d.label}`}>
            <img src={d.img.src} srcSet={'src2x' in d.img ? `${d.img.src} 1080w, ${d.img.src2x} 2160w` : undefined}
              sizes="(max-width: 899px) 50vw, 30vw" alt={d.alt} loading="lazy" width={d.w} height={d.h} />
            <span className="md-label" aria-hidden="true">{d.label}<i>→</i></span>
          </a>
        ))}
      </div>
    </section>
  );
}
