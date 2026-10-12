import { useEffect, useState } from 'react';
import { menu, itemPhoto, menuSourceNote, dishesWord, type MenuItem } from '../data/menu';
import { venue } from '../data/venue';
import { nb } from '../app/nb';
import { BookingDialog } from '../features/booking/BookingDialog';
import { Cursor } from '../components/Cursor';

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;
const count = menu.reduce((n, c) => n + c.items.length, 0);

function Price({ i }: { i: MenuItem }) {
  if (i.variants) return <span className="mp-price">{i.variants.map((v) => <span key={v.label}>{v.label} <b>{rub(v.price)}</b></span>)}</span>;
  if (i.price === null) return <span className="mp-price mp-ask">цену уточняйте</span>;
  return <span className="mp-price"><b>{rub(i.price)}</b></span>;
}

function Card({ i }: { i: MenuItem }) {
  const src = itemPhoto(i);
  return (
    <li className="mp-card">
      <figure className={'mp-ph' + (src ? '' : ' mp-ph-none')}>
        {src ? <img src={src} alt={i.name} loading="lazy" width={800} height={600} /> : <span aria-hidden="true">Фото<br />появится<br />позже</span>}
        {i.isNew && <b className="mp-new">New</b>}
      </figure>
      <h3 className="mp-name">{nb(i.name)}</h3>
      {i.description && <p className="mp-desc">{i.description}</p>}
      <p className="mp-meta">{i.weight && <span className="mp-weight">{i.weight}</span>}<Price i={i} /></p>
    </li>
  );
}

/** The full menu: categories as chapters, square photo cards, booking at hand. */
export function MenuPage() {
  const [active, setActive] = useState(menu[0].id);
  useEffect(() => {
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: '-30% 0px -60% 0px' });
    menu.forEach((c) => { const el = document.getElementById(c.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  // keep the active chip in view in the horizontally scrolling bar
  useEffect(() => { document.querySelector(`.mp-cats a[href="#${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' }); }, [active]);

  return (
    <>
      <a className="skip" href="#mp-main">К меню</a>
      <header className="mp-hdr">
        <a className="mp-logo" href="./">Sorry Mama</a>
        <a className="mp-home link" href="./">← На главную</a>
        <button className="btn btn-hdr" type="button" data-book><span className="long">Забронировать</span><span className="short">Бронь</span></button>
      </header>
      <main id="mp-main" className="mp">
        <section className="mp-intro" aria-labelledby="mp-h">
          <h1 id="mp-h" className="title-xl mp-title">Меню</h1>
          <div className="mp-intro-side">
            <p className="mp-lead">{nb(`${dishesWord(count)} кухни: от брускетт и поке до бешбармака и арабского плова с верблюдом.`)}</p>
            <p className="mp-note">{menuSourceNote}</p>
          </div>
        </section>
        <nav className="mp-cats" aria-label="Разделы меню">
          {menu.map((c) => <a key={c.id} href={`#${c.id}`} className={active === c.id ? 'is-active' : undefined} aria-current={active === c.id ? 'true' : undefined}>{c.category}</a>)}
        </nav>
        {menu.map((c) => (
          <section key={c.id} id={c.id} className="mp-sec" aria-labelledby={`${c.id}-h`}>
            <h2 id={`${c.id}-h`} className="mp-h">{c.category}<sup>{c.items.length}</sup></h2>
            <ul className="mp-grid">{c.items.map((i) => <Card key={i.id} i={i} />)}</ul>
          </section>
        ))}
        <section className="mp-book" aria-label="Бронь">
          <p className="mp-book-t">{nb('Выбрали? Забронируйте стол — на террасе или в зале под деревом.')}</p>
          <div className="mp-book-a">
            <button className="btn btn-gold btn-xl btn-arrow" type="button" data-book>Забронировать стол <span aria-hidden="true">→</span></button>
            <a className="mp-phone" href={venue.phone.href}>{venue.phone.display}</a>
          </div>
        </section>
      </main>
      <footer className="mp-foot">
        <p>{venue.name} · {venue.city}, {venue.street}, {venue.floor}</p>
        <p className="mp-foot-note">KERNØ · неофициальный концепт сайта. Меню и фото — из карточки заведения в 2ГИС, права не согласованы.</p>
      </footer>
      <BookingDialog />
      <Cursor />
    </>
  );
}
