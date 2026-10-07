import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { lockScroll, navigateTo, startMotion } from './motion';
import { CREDITS, PHOTOS, src, srcSet, type Photo } from './photos';

const STUDIO = {
  phone: '+7 391 200-40-40',
  phoneHref: 'tel:+73912004040',
  telegram: '@brightline_krsk',
  address: 'Красноярск, ул. Северное шоссе, 7, бокс 3',
  hours: 'Ежедневно, 9:00–21:00',
  rating: 'Яндекс Карты',
  reviews: '312 отзывов',
};

/** The next free slot, phrased the way an administrator would say it. */
function nextSlot() {
  const now = new Date();
  return now.getHours() < 15 ? 'Сегодня, 18:00' : 'Завтра, 10:00';
}

function Img({
  photo,
  sizes = '100vw',
  className = '',
  eager = false,
  onLoad,
}: {
  photo: Photo;
  sizes?: string;
  className?: string;
  eager?: boolean;
  onLoad?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`ph ${loaded ? 'ok' : ''} ${className}`}
      src={src(photo)}
      srcSet={srcSet(photo)}
      sizes={sizes}
      width={photo.w}
      height={photo.h}
      alt={photo.alt}
      style={{ '--pos': photo.pos, '--pos-m': photo.posM ?? photo.pos } as CSSProperties}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => {
        setLoaded(true);
        onLoad?.();
      }}
    />
  );
}

/** Lines that rise out of a mask when their block gets `in`. */
function Lines({ lines, delay = 0 }: { lines: ReactNode[]; delay?: number }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="ln">
          <span style={{ transitionDelay: `${delay + i * 0.08}s` }}>{l}</span>
        </span>
      ))}
    </>
  );
}

function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true" />
      <span className="logo-text">
        <b>BRIGHTLINE</b>
        <small>DETAILING STUDIO</small>
      </span>
    </span>
  );
}

const NAV = [
  { id: 'services', label: 'Услуги' },
  { id: 'works', label: 'Работы' },
  { id: 'process', label: 'О студии' },
  { id: 'contact', label: 'Контакты' },
];

function Header({ theme, onBook }: { theme: 'dark' | 'light'; onBook: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => lockScroll(open), [open]);
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // release the scroll lock before scrolling, not after the next render
    lockScroll(false);
    setOpen(false);
    navigateTo(id);
  };
  return (
    <header className={`hdr ${theme} ${open ? 'open' : ''}`}>
      <div className="hdr-bar wrap">
        <a href="#top" className="hdr-logo" onClick={go('top')} aria-label="BRIGHTLINE, наверх">
          <Logo />
        </a>
        <nav className="hdr-nav" aria-label="Разделы">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>
              {n.label}
            </a>
          ))}
        </nav>
        <button type="button" className="btn btn-accent btn-sm hdr-cta" onClick={onBook}>
          Записаться
        </button>
        <button
          type="button"
          className="hdr-burger"
          aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <i />
          <i />
        </button>
      </div>
      <div className="hdr-sheet" aria-hidden={!open}>
        <nav className="wrap">
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} onClick={go(n.id)} tabIndex={open ? 0 : -1}>
              <span className="idx">0{i + 1}</span>
              {n.label}
            </a>
          ))}
          <a href="#contact" className="btn btn-accent" onClick={go('contact')} tabIndex={open ? 0 : -1}>
            Записаться
          </a>
          <p className="hdr-sheet-meta">
            {STUDIO.phone}
            <br />
            {STUDIO.hours}
          </p>
        </nav>
      </div>
    </header>
  );
}

function Hero({ onBook }: { onBook: () => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <section id="top" className={`hero ${ready ? 'ready' : ''}`} data-theme="dark" data-track>
      <div className="hero-media">
        <div className="hero-img">
          <Img
            photo={PHOTOS.hero}
            sizes="(max-width: 860px) 100vw, 60vw"
            eager
            onLoad={() => setReady(true)}
          />
        </div>
      </div>
      <div className="hero-body wrap">
        <div className="hero-proof">
          <div className="proof-rating">
            <span className="proof-score">4,9</span>
            <span className="proof-stars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} viewBox="0 0 12 12">
                  <path d="M6 .6 7.6 4l3.7.4-2.8 2.5.8 3.7L6 8.7 2.7 10.6l.8-3.7L.7 4.4 4.4 4z" />
                </svg>
              ))}
            </span>
            <span className="proof-src">
              {STUDIO.rating}
              <br />
              {STUDIO.reviews}
            </span>
          </div>
          <button type="button" className="proof-slot" onClick={onBook}>
            <span className="proof-label">Ближайшее окно</span>
            <span className="proof-time">
              <i aria-hidden="true" />
              {nextSlot()}
            </span>
          </button>
        </div>
        <div className="hero-main">
        <p className="hero-meta">
          <span>Красноярск</span>
          <span className="dot" aria-hidden="true" />
          <span>ежедневно</span>
        </p>
        <h1 className="display hero-title">
          <Lines lines={['Блеск,', 'который видно', 'сразу.']} delay={0.25} />
        </h1>
        <p className="hero-sub">Полировка, защитные покрытия, плёнка и уход за салоном.</p>
        <div className="hero-ctas">
          <a
            href="#works"
            className="btn btn-accent"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('works');
            }}
          >
            Смотреть работы
          </a>
          <button type="button" className="btn btn-ghost" onClick={onBook}>
            Записаться
          </button>
        </div>
        </div>
      </div>
    </section>
  );
}

function Compare() {
  const box = useRef<HTMLDivElement>(null);
  const sec = useRef<HTMLElement>(null);
  const touched = useRef(false);
  const [x, setX] = useState(0.86);

  // until the visitor takes the line, the scroll walks it to the middle
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (touched.current || !sec.current) return;
      const r = sec.current.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (innerHeight * 0.95 - r.top) / (innerHeight * 0.75)));
      const e = 1 - Math.pow(1 - t, 3);
      setX(0.86 - 0.36 * e);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fromEvent = useCallback((clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setX(Math.min(0.98, Math.max(0.02, (clientX - r.left) / r.width)));
  }, []);

  return (
    <section className="cmp light" data-theme="light" ref={sec} aria-labelledby="cmp-title">
      <div className="wrap cmp-grid">
        <header className="cmp-copy" data-reveal>
          <p className="kicker">
            <span className="idx">02</span>Результат
          </p>
          <h2 className="display h2" id="cmp-title">
            <Lines lines={['Разница', 'видна сразу.']} />
          </h2>
          <p className="lead">Корректируем лак, возвращаем глубину цвета и защищаем результат.</p>
          <dl className="cmp-facts">
            <div>
              <dt>Автомобиль</dt>
              <dd>Mercedes-Benz, чёрный металлик</dd>
            </div>
            <div>
              <dt>Работа</dt>
              <dd>Полировка в два этапа и керамика</dd>
            </div>
          </dl>
          <p className="cmp-hint">
            <span aria-hidden="true">←→</span> Потяните линию
          </p>
        </header>
        <div className="cmp-stage" data-reveal>
          <div
            className="cmp-box"
            ref={box}
            style={{ '--x': `${x * 100}%` } as CSSProperties}
            onPointerDown={(e) => {
              touched.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              fromEvent(e.clientX);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) fromEvent(e.clientX);
            }}
          >
            <Img photo={PHOTOS.after} sizes="(max-width: 860px) 100vw, 70vw" className="cmp-after" />
            <div className="cmp-before">
              <Img photo={PHOTOS.before} sizes="(max-width: 860px) 100vw, 70vw" />
            </div>
            <span className="cmp-tag cmp-tag-l">До</span>
            <span className="cmp-tag cmp-tag-r">После</span>
            <div className="cmp-line" aria-hidden="true">
              <span className="cmp-handle">
                <svg viewBox="0 0 24 12" aria-hidden="true">
                  <path d="M6 1 1 6l5 5M18 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </span>
            </div>
            <input
              className="cmp-range"
              type="range"
              min={2}
              max={98}
              value={Math.round(x * 100)}
              aria-label="Сравнение до и после: положение линии"
              onChange={(e) => {
                touched.current = true;
                setX(Number(e.target.value) / 100);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const SERVICES = [
  {
    name: 'Полировка кузова',
    price: 'от 12 000 ₽',
    line: 'Убираем мелкие дефекты и возвращаем глубину лака.',
    time: '1–2 дня',
    points: ['Замер толщины лака по всему кузову', 'Абразивная и финишная полировка', 'Проверка под разным светом'],
    photo: PHOTOS.services.polish,
  },
  {
    name: 'Защитные покрытия',
    price: 'от 18 000 ₽',
    line: 'Керамика и составы для защиты поверхности.',
    time: '1 день',
    points: ['Мойка, обезжиривание, подготовка', 'Керамика в один или два слоя', 'Сушка под ИК-лампами'],
    photo: PHOTOS.services.coat,
  },
  {
    name: 'Антигравийная плёнка',
    price: 'от 55 000 ₽',
    line: 'Защищаем зоны, которые больше всего страдают на дороге.',
    time: '1–3 дня',
    points: ['Капот, бампер, фары, зеркала', 'Глянцевая или матовая плёнка', 'Кромки заворачиваем внутрь'],
    photo: PHOTOS.services.film,
  },
  {
    name: 'Детейлинг салона',
    price: 'от 9 000 ₽',
    line: 'Глубокая очистка и восстановление интерьера.',
    time: '1 день',
    points: ['Химчистка сидений, потолка и ковров', 'Очистка и уход за кожей', 'Пластик, стёкла, дефлекторы'],
    photo: PHOTOS.services.interior,
  },
];

function Services({ onBook }: { onBook: () => void }) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(0);
  const pick = (i: number) => {
    if (i === active) return;
    setPrev(active);
    setActive(i);
  };
  const s = SERVICES[active];
  return (
    <section id="services" className="svc dark" data-theme="dark" aria-labelledby="svc-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <p className="kicker">
            <span className="idx">03</span>Услуги
          </p>
          <h2 className="display h2" id="svc-title">
            <Lines lines={['Что мы делаем']} />
          </h2>
          <p className="sec-note">Цены указаны для седана среднего класса. Точную стоимость назовём после осмотра.</p>
        </header>
        <div className="svc-grid">
          <ol className="svc-list" data-reveal>
            {SERVICES.map((it, i) => (
              <li key={it.name} className={`svc-row ${active === i ? 'on' : ''}`}>
                <button
                  type="button"
                  className="svc-btn"
                  aria-expanded={active === i}
                  aria-controls={`svc-panel-${i}`}
                  onClick={() => pick(i)}
                >
                  <span className="idx">0{i + 1}</span>
                  <span className="svc-name">{it.name}</span>
                  <span className="svc-price">{it.price}</span>
                </button>
                <div className="svc-more" id={`svc-panel-${i}`}>
                  <div>
                    <div className="svc-media-m">
                      <Img photo={it.photo} sizes="100vw" />
                    </div>
                    <p className="svc-line">{it.line}</p>
                    <ul className="svc-points">
                      {it.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                    <p className="svc-foot">
                      <span>Срок: {it.time}</span>
                      <button type="button" className="link" onClick={onBook}>
                        Записаться на осмотр →
                      </button>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="svc-stage" data-reveal aria-live="polite">
            <div className="svc-frame">
              {SERVICES.map((it, i) => (
                <div
                  key={it.name}
                  className={`svc-shot ${i === active ? 'on' : ''} ${i === prev && i !== active ? 'was' : ''}`}
                  aria-hidden={i !== active}
                >
                  <Img photo={it.photo} sizes="(max-width: 860px) 100vw, 56vw" />
                </div>
              ))}
              <div className="svc-cap" key={active}>
                <span className="svc-cap-name">{s.name}</span>
                <span className="svc-cap-price">{s.price}</span>
                <span className="svc-cap-time">{s.time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { name: 'Осмотр', line: 'Замеряем толщину лака и смотрим кузов под разным светом.', photo: PHOTOS.process.inspect },
  { name: 'Коррекция', line: 'Полируем только там, где это действительно нужно.', photo: PHOTOS.process.correct },
  { name: 'Защита', line: 'Закрываем результат керамикой или плёнкой.', photo: PHOTOS.process.protect },
];

function Process() {
  return (
    <section id="process" className="proc light" data-theme="light" data-track aria-labelledby="proc-title">
      <div className="wrap">
        <header className="sec-head proc-head" data-reveal>
          <p className="kicker">
            <span className="idx">04</span>О студии
          </p>
          <h2 className="display h2" id="proc-title">
            <Lines lines={['Как мы работаем']} />
          </h2>
          <p className="lead">Сначала оцениваем состояние. Потом делаем только то, что действительно нужно.</p>
        </header>
        <span className="grid-h proc-rule" aria-hidden="true" />
        <ol className="proc-grid">
          {STEPS.map((st, i) => (
            <li key={st.name} className={`step step-${i + 1}`} data-reveal>
              <div className="mask">
                <Img photo={st.photo} sizes={i === 0 ? '(max-width: 860px) 100vw, 56vw' : '(max-width: 860px) 100vw, 40vw'} />
              </div>
              <div className="step-cap">
                <span className="idx">0{i + 1}</span>
                <h3>{st.name}</h3>
                <p>{st.line}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

interface Case {
  car: string;
  works: string;
  time: string;
  note: string;
  main: Photo;
  details: Photo[];
  layout: 'a' | 'b' | 'c';
}

const CASES: Case[] = [
  {
    car: 'BMW M5',
    works: 'Полировка кузова · керамика',
    time: '2 дня',
    note: 'Приехала с голограммами после автомоек. Полировка в два этапа, затем керамика в два слоя.',
    main: PHOTOS.works.bmw,
    details: [PHOTOS.works.bmwDetail],
    layout: 'a',
  },
  {
    car: 'Mercedes-Benz GLE',
    works: 'Сатиновая плёнка на весь кузов',
    time: '4 дня',
    note: 'Новый автомобиль. Глянцевый лак стал матовым и закрыт от сколов; плёнку можно снять без следа.',
    main: PHOTOS.works.gle,
    details: [PHOTOS.works.gleDetail, PHOTOS.works.gleRear],
    layout: 'b',
  },
  {
    car: 'Audi RS6 Avant',
    works: 'Полировка · защита кузова',
    time: '2 дня',
    note: 'Мелкие риски по всему кузову и следы от щёток. Отполировали и закрыли керамикой.',
    main: PHOTOS.works.rs6,
    details: [PHOTOS.works.rs6Detail],
    layout: 'c',
  },
];

function CaseBlock({ c, i }: { c: Case; i: number }) {
  return (
    <article className={`case case-${c.layout}`} data-reveal>
      <span className="grid-h case-rule" aria-hidden="true" />
      <figure className="case-main mask">
        <Img photo={c.main} sizes="(max-width: 860px) 100vw, 62vw" />
      </figure>
      <div className="case-info">
        <span className="idx">Кейс 0{i + 1}</span>
        <h3 className="case-car">{c.car}</h3>
        <dl className="case-dl">
          <div>
            <dt>Работы</dt>
            <dd>{c.works}</dd>
          </div>
          <div>
            <dt>Срок</dt>
            <dd className="case-time">{c.time}</dd>
          </div>
        </dl>
        <p className="case-note">{c.note}</p>
      </div>
      <div className={`case-details n${c.details.length}`}>
        {c.details.map((d) => (
          <figure key={d.name} className="mask">
            <Img photo={d} sizes="(max-width: 860px) 50vw, 28vw" />
          </figure>
        ))}
      </div>
    </article>
  );
}

function Works() {
  return (
    <section id="works" className="works dark" data-theme="dark" aria-labelledby="works-title">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <p className="kicker">
            <span className="idx">05</span>Работы
          </p>
          <h2 className="display h2" id="works-title">
            <Lines lines={['Последние выдачи']} />
          </h2>
          <p className="sec-note">Фото в нашем боксе, сразу после работ. Без ретуши лака.</p>
        </header>
        <div className="cases">
          {CASES.map((c, i) => (
            <CaseBlock key={c.car} c={c} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ onBook }: { onBook: () => void }) {
  return (
    <section id="contact" className="cta light" data-theme="light" aria-labelledby="cta-title">
      <div className="cta-grid">
        <div className="cta-body wrap" data-reveal>
          <p className="kicker">
            <span className="idx">06</span>Контакты
          </p>
          <h2 className="display h2" id="cta-title">
            <Lines lines={['Записаться', 'на осмотр']} />
          </h2>
          <p className="lead">
            Осмотр занимает около 15 минут. Посмотрим состояние автомобиля и скажем, какие работы действительно имеют
            смысл.
          </p>
          <button type="button" className="btn btn-accent btn-lg" onClick={onBook}>
            Записаться
          </button>
          <dl className="cta-dl">
            <div>
              <dt>Телефон</dt>
              <dd>
                <a href={STUDIO.phoneHref}>{STUDIO.phone}</a>
              </dd>
            </div>
            <div>
              <dt>Telegram</dt>
              <dd>{STUDIO.telegram}</dd>
            </div>
            <div>
              <dt>Адрес</dt>
              <dd>{STUDIO.address}</dd>
            </div>
            <div>
              <dt>Часы работы</dt>
              <dd>{STUDIO.hours}</dd>
            </div>
          </dl>
        </div>
        <figure className="cta-media mask" data-reveal>
          <Img photo={PHOTOS.cta} sizes="(max-width: 860px) 100vw, 50vw" />
        </figure>
      </div>
      <footer className="foot wrap">
        <span>© 2026 BRIGHTLINE — концепт для портфолио. Студия, адрес, телефон и рейтинг вымышлены.</span>
        <details>
          <summary>Фото: Unsplash</summary>
          <p>{CREDITS.join(', ')}.</p>
        </details>
        <a href="../">← Все работы</a>
      </footer>
    </section>
  );
}

function BookDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    lockScroll(open);
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="book"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="book-title"
    >
      <div className="book-in">
        <button type="button" className="book-x" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
        <p className="kicker">
          <span className="idx">BRIGHTLINE</span>Запись на осмотр
        </p>
        <h2 className="display book-title" id="book-title">
          Удобнее позвонить
          <br />
          или написать
        </h2>
        <p className="book-text">Подберём время в ближайшие дни. Осмотр бесплатный, около 15 минут.</p>
        <div className="book-actions">
          <a className="btn btn-accent" href={STUDIO.phoneHref}>
            Позвонить · {STUDIO.phone}
          </a>
          <a className="btn btn-line" href="#contact" onClick={onClose}>
            Telegram · {STUDIO.telegram}
          </a>
        </div>
        <p className="book-note">Это концепт: телефон и Telegram вымышлены.</p>
      </div>
    </dialog>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [book, setBook] = useState(false);
  useEffect(() => startMotion(setTheme), []);
  const onBook = () => setBook(true);
  return (
    <>
      <Header theme={theme} onBook={onBook} />
      <main>
        <Hero onBook={onBook} />
        <Compare />
        <Services onBook={onBook} />
        <Process />
        <Works />
        <Contact onBook={onBook} />
      </main>
      <BookDialog open={book} onClose={() => setBook(false)} />
    </>
  );
}
