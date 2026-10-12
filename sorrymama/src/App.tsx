import { useEffect, useRef, useState } from 'react';
import { applyLayout, frame, crownPlates, layoutFor, lightsOf, type Els, type Layout } from './scene';

// address agrees across Zoon, 2GIS, Restoran.cafe, ТоМесто, kafe6ki (checked 12.10.2026)
const ADDRESS = 'ул. Фатыха Амирхана, 21г, 2 этаж';
const ROUTE = 'https://yandex.ru/maps/43/kazan/?text=' + encodeURIComponent('Sorry Mama, Казань, улица Фатыха Амирхана, 21г');

// keep short Russian words on the line with the word that follows
const nb = (s: string) => s.replace(/\s—/g, '\u00a0—').replace(/(?<=^|[\s(«])([а-яёА-ЯЁ]{1,2}|—)\s/g, '$1\u00a0');

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Header({ onBook, onNav }: { onBook: () => void; onNav: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const go = (id: string) => { setOpen(false); onNav(id); };
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);
  return (
    <header className={'hdr' + (open ? ' is-open' : '')}>
      <a className="hdr-logo" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>Sorry Mama</a>
      <nav className="hdr-nav" aria-label="Разделы">
        <a href="#atmosphere" onClick={(e) => { e.preventDefault(); go('atmosphere'); }}>Атмосфера</a>
        <a href="#menu" onClick={(e) => { e.preventDefault(); go('menu'); }}>Меню</a>
        <a href="#contacts" onClick={(e) => { e.preventDefault(); go('contacts'); }}>Контакты</a>
      </nav>
      <button className="btn btn-sm hdr-book" onClick={onBook}>Забронировать</button>
      <button className="hdr-burger" aria-expanded={open} aria-controls="sheet" aria-label="Меню сайта" onClick={() => setOpen(!open)}><i /><i /></button>
      <nav id="sheet" className="sheet" aria-label="Разделы" hidden={!open}>
        <a href="#atmosphere" onClick={(e) => { e.preventDefault(); go('atmosphere'); }}>Атмосфера</a>
        <a href="#menu" onClick={(e) => { e.preventDefault(); go('menu'); }}>Меню</a>
        <a href="#contacts" onClick={(e) => { e.preventDefault(); go('contacts'); }}>Контакты</a>
      </nav>
    </header>
  );
}

function BookingDialog({ dialog }: { dialog: React.RefObject<HTMLDialogElement> }) {
  return (
    <dialog ref={dialog} className="book" aria-labelledby="book-h" onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
      <div className="book-in">
        <p className="kicker">Демо-концепт</p>
        <h2 id="book-h" className="book-h">Бронирование здесь не&nbsp;подключено</h2>
        <p className="book-p">{nb('Это неофициальный концепт сайта. В рабочей версии кнопка ведёт в настоящий канал заведения — телефон, мессенджер или сервис бронирования. Сейчас никакие данные не отправляются.')}</p>
        <form method="dialog"><button className="btn">Понятно</button></form>
      </div>
    </dialog>
  );
}

export default function App() {
  const scene = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const r = {
    far: useRef<HTMLImageElement>(null),
    haze: useRef<HTMLDivElement>(null),
    crown: useRef<HTMLDivElement>(null),
    crownSoft: useRef<HTMLDivElement>(null),
    dusk: useRef<HTMLDivElement>(null),
    scrim: useRef<HTMLDivElement>(null),
    lights: useRef<HTMLDivElement>(null),
    nightSoft: useRef<HTMLImageElement>(null),
    night: useRef<HTMLImageElement>(null),
    nightGrade: useRef<HTMLDivElement>(null),
    copy: useRef<HTMLDivElement>(null),
    plane: useRef<HTMLDivElement>(null),
    tagNight: useRef<HTMLParagraphElement>(null),
    tail: useRef<HTMLDivElement>(null),
    tag: useRef<HTMLParagraphElement>(null),
  };
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const st = stage.current!, sc = scene.current!;
    const root = document.documentElement;
    const rm = reduced();
    root.classList.toggle('rm', rm);
    const els: Els = {
      far: r.far.current!, crown: r.crown.current!, crownSoft: r.crownSoft.current!, dusk: r.dusk.current!, scrim: r.scrim.current!, haze: r.haze.current!,
      lights: r.lights.current!, nightSoft: r.nightSoft.current!, night: r.night.current!, nightGrade: r.nightGrade.current!,
      copy: [...r.copy.current!.children] as HTMLElement[], plane: r.plane.current!, tagNight: r.tagNight.current,
    };
    let L: Layout | null = null, raf = 0, W = 0, H = 0;

    const layout = () => {
      const w = st.clientWidth, h = st.clientHeight;
      if (!w || !h || (w === W && h === H && L)) return;
      W = w; H = h;
      L = layoutFor(w, h);
      applyLayout(L, els);
      root.classList.toggle('is-mobile', L.mobile);
      // the night photo carries on below the stage, pixel-aligned with its rest frame
      const t = r.tail.current!, n = L.night;
      t.style.height = Math.ceil(L.tail) + 'px';
      t.style.backgroundImage = `url(${r.night.current!.currentSrc})`;
      t.style.backgroundSize = `${n.w}px ${n.h}px`;
      t.style.backgroundPosition = `${n.x}px ${n.y - h}px`;
    };

    const progress = () => {
      const pin = sc.offsetHeight - st.offsetHeight;
      return pin > 0 ? clamp(-sc.getBoundingClientRect().top / pin) : 0;
    };

    const tick = () => {
      raf = 0;
      if (!L) return;
      const raw = progress();
      // reduced motion: two still frames and a crossfade, no camera
      const p = rm ? (raw > 0.5 ? 1 : 0) : raw;
      frame(L, els, p);
      const tag = r.tag.current;
      if (tag) tag.style.opacity = String(0.6 * (1 - clamp(p / 0.2)));
      root.classList.toggle('is-night', p > 0.52);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onResize = () => { layout(); queue(); };

    const crownImg = new Image(); crownImg.src = './img/day.webp';
    const veilImg = new Image(); veilImg.src = './img/night-veil.webp';
    Promise.all([crownImg.decode(), veilImg.decode(), r.night.current!.decode(), r.far.current!.decode()]).then(() => {
      const { sharp, soft } = crownPlates(crownImg);
      r.crown.current!.replaceChildren(sharp);
      r.crownSoft.current!.replaceChildren(soft);
      r.lights.current!.replaceChildren(lightsOf(veilImg));
      layout();
      tick();
      root.classList.add('cut-ready');
    }).catch(() => root.classList.add('cut-ready'));

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const onNav = (id: string) => {
    const behavior: ScrollBehavior = reduced() ? 'auto' : 'smooth';
    if (id === 'top') return window.scrollTo({ top: 0, behavior });
    if (id === 'atmosphere') {
      // land where the night frame has settled and the plane has risen
      const sc = scene.current!, st = stage.current!;
      return window.scrollTo({ top: sc.offsetTop + (sc.offsetHeight - st.offsetHeight), behavior });
    }
    document.getElementById(id)?.scrollIntoView({ behavior });
  };
  const onBook = () => dialog.current?.showModal();
  const toMenu = (e: React.MouseEvent) => { e.preventDefault(); onNav('menu'); };

  return (
    <>
      <a className="skip" href="#main">К содержимому</a>
      <Header onBook={onBook} onNav={onNav} />
      <main id="main">
        <section className="scene" ref={scene} id="top" aria-label="Sorry Mama">
          <div className="stage" ref={stage}>
            {/* day: the far terrace, the crown in front of it */}
            <img ref={r.far} className="layer far" src="./img/terrace-far.webp" alt="" aria-hidden="true" />
            <div ref={r.haze} className="wash haze" aria-hidden="true" />
            <div ref={r.crown} className="layer crown" role="img" aria-label="Цветущее дерево на летней террасе Sorry Mama" />
            <div ref={r.crownSoft} className="layer crown crown-soft" aria-hidden="true" />
            <div ref={r.dusk} className="wash dusk" aria-hidden="true" />
            <div ref={r.scrim} className="wash scrim" aria-hidden="true" />
            {/* night: the lounge tree, first as light through blossom, then in focus */}
            <div ref={r.lights} className="layer lights" aria-hidden="true" />
            <img ref={r.nightSoft} className="layer night-soft" src="./img/night-veil.webp" alt="" aria-hidden="true" />
            <img ref={r.night} className="layer night" src="./img/night.webp" alt="Дерево с гирляндой и фонарями в зале Sorry Mama вечером" />
            <div ref={r.nightGrade} className="wash night-grade" aria-hidden="true" />

            <div className="hero-copy" ref={r.copy}>
              <p className="kicker">Рест-лаунж · Казань</p>
              <h1 className="mark" aria-label="Sorry Mama"><span className="mark-a">Sorry</span><span className="mark-b">Mama</span></h1>
              <div className="actions">
                <button className="btn" onClick={onBook}>Забронировать стол</button>
                <a className="link" href="#menu" onClick={toMenu}>Смотреть меню</a>
              </div>
              <a className="where" href={ROUTE} target="_blank" rel="noopener noreferrer">
                <span>{ADDRESS}</span><span className="where-go">Маршрут <span aria-hidden="true">↗</span></span>
              </a>
              <p className="concept-note">Неофициальный концепт KERNØ</p>
            </div>

            <p className="tag-night" ref={r.tagNight}>Зал, вечером</p>
            <div className="plane plane-top" ref={r.plane} id="atmosphere">
              <p className="kicker">Атмосфера</p>
              <h2 className="h2">{nb('Днём — терраса.')}<br />{nb('Вечером — лаунж.')}</h2>
            </div>
            <p className="concept-tag" ref={r.tag} aria-hidden="true">Неофициальный концепт KERNØ</p>
          </div>
        </section>

        <section className="atmo" aria-label="Терраса и зал">
          <div className="tail" ref={r.tail} aria-hidden="true" />
          <div className="plane plane-col">
            <p className="atmo-p">{nb('Летняя терраса под открытым небом и зал с бархатными креслами, тёплым деревом и фонарями в кроне.')}</p>
            <div className="actions">
              <a className="btn btn-amber" href="#menu" onClick={toMenu}>Смотреть меню</a>
              <button className="link" onClick={onBook}>Забронировать стол</button>
            </div>
          </div>
          <figure className="inset">
            <img src="./img/terrace.webp" alt="Летняя терраса: белые деревянные диваны с голубыми подушками и цветущее дерево" loading="lazy" width={960} height={1010} />
            <figcaption>Терраса, днём</figcaption>
          </figure>
        </section>

        {/* Phase 02: menu (data model in src/menu.ts) and verified contacts */}
        <section className="stub" id="menu" aria-labelledby="menu-h">
          <h2 id="menu-h" className="stub-h">Меню</h2>
          <p>{nb('Следующий этап концепта: переносим настоящее меню заведения — позиции и цены как в оригинале, без выдуманных блюд.')}</p>
        </section>
        <section className="stub" id="contacts" aria-labelledby="contacts-h">
          <h2 id="contacts-h" className="stub-h">Контакты</h2>
          <p>{ADDRESS}, Казань</p>
          <p><a className="link" href={ROUTE} target="_blank" rel="noopener noreferrer">Построить маршрут ↗</a></p>
          <p className="muted">{nb('Телефон и часы работы появятся после сверки с заведением.')}</p>
        </section>
      </main>
      <footer className="foot">
        <p>{nb('Неофициальный концепт сайта от KERNØ. Не является сайтом заведения и не связан с ним. Фотографии использованы для демонстрации концепта.')}</p>
      </footer>
      <BookingDialog dialog={dialog} />
    </>
  );
}
