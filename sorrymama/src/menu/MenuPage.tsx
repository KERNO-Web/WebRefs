import { useEffect, useState } from 'react';
import { menu, bar, itemPhoto, menuSourceNote, dishesWord, type MenuItem } from '../data/menu';
import { assets } from '../data/assets';
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

/** The bar: no photographs of the drinks exist, so it is set as type on the night palette. */
function Bar() {
  return (
    <section id={bar.id} className="mp-sec mp-bar" aria-labelledby="bar-h">
      <div className="mb-head">
        <h2 id="bar-h" className="mp-h">{bar.category}</h2>
        <p className="mb-note">{bar.note}</p>
      </div>
      {/* mood, not illustration: guest photos of drinks in the hall and on the terrace */}
      <div className="mb-mood" aria-hidden="true">
        <img src={assets.cocktail.src} alt="" loading="lazy" width={1240} height={1500} />
        <img src={assets.drink.src} alt="" loading="lazy" width={580} height={860} />
      </div>
      <div className="mb-list">
        {bar.groups.map((g) => (
          <div key={g.id} className="mb-group">
            <h3 className="mb-gt">{g.title}<span>{g.items[0].sizes.map((z) => z.label).join(' / ')}</span></h3>
            <ul>
              {g.items.map((d) => (
                <li key={d.id} className="mb-row">
                  <span className="mb-name">{d.name}</span>
                  <span className="mb-dots" aria-hidden="true" />
                  <span className="mb-price">{d.sizes.map((z) => <span key={z.label}><i className="mb-size">{z.label}</i>{rub(z.price)}</span>)}</span>
                  <span className="mb-info">{d.info}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The full menu: categories as chapters, square photo cards, the bar as type, booking at hand. */
export function MenuPage() {
  const [active, setActive] = useState(menu[0].id);
  // a link like menu.html#bar: the browser looks for the anchor before React has rendered the sections,
  // so land on it here, and once more after the fonts settle the layout
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id ? document.getElementById(id) : null;
    if (!el) return;
    const go = () => el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    go(); setActive(id);
    document.fonts.ready.then(go);
  }, []);
  useEffect(() => {
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: '-30% 0px -60% 0px' });
    [...menu.map((c) => c.id), bar.id].forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  // keep the active chip in view by scrolling the bar sideways only. (scrollIntoView also scrolled the page:
  // for a sticky bar it aims at the bar's place in the flow, at the top — the page jumped up.)
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>('.mp-cats');
    const chip = bar?.querySelector<HTMLElement>(`a[href="#${active}"]`);
    if (bar && chip) bar.scrollTo({ left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [active]);

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
            <p className="mp-lead">{nb(`${dishesWord(count)} кухни — от брускетт и поке до бешбармака и арабского плова с верблюдом — и барная карта.`)}</p>
            <p className="mp-note">{menuSourceNote}</p>
          </div>
        </section>
        <nav className="mp-cats" aria-label="Разделы меню">
          {[...menu, bar].map((c) => <a key={c.id} href={`#${c.id}`} className={active === c.id ? 'is-active' : undefined} aria-current={active === c.id ? 'true' : undefined}>{c.category}</a>)}
        </nav>
        {menu.map((c) => (
          <section key={c.id} id={c.id} className="mp-sec" aria-labelledby={`${c.id}-h`}>
            <h2 id={`${c.id}-h`} className="mp-h">{c.category}</h2>
            <ul className="mp-grid">{c.items.map((i) => <Card key={i.id} i={i} />)}</ul>
          </section>
        ))}
        <Bar />
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
