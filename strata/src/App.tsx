import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { activeIndex, scrollToId, startMotion } from './motion';
import { CREDITS, PHOTOS, src, srcSet, type Photo } from './photos';

const BRAND = 'STRATA';
/** full-screen covers on portrait screens need far more pixels than 100vw */
const COVER = '(max-aspect-ratio: 1/1) 150vh, 100vw';

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
  const style = {
    '--pos': photo.pos,
    '--pos-m': photo.posMobile ?? photo.pos,
  } as CSSProperties;
  return (
    <img
      className={`ph ${className}`}
      src={src(photo)}
      srcSet={srcSet(photo)}
      sizes={sizes}
      width={photo.w}
      height={photo.h}
      alt={photo.alt}
      style={style}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={onLoad}
    />
  );
}

/** Lines that rise out of a mask when their block gets `in`. */
function Lines({ lines, step = 0.08, delay = 0 }: { lines: ReactNode[]; step?: number; delay?: number }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="line">
          <span style={{ transitionDelay: `${delay + step * i}s` }}>{l}</span>
        </span>
      ))}
    </>
  );
}

function Logo() {
  return (
    <span className="logo" aria-label={BRAND}>
      <svg viewBox="0 0 22 14" aria-hidden="true">
        <rect y="0" width="22" height="2" />
        <rect y="6" width="16" height="2" />
        <rect y="12" width="10" height="2" />
      </svg>
      <span className="logo-word">{BRAND}</span>
    </span>
  );
}

const NAV = [
  { id: 'surface', label: 'Поверхность' },
  { id: 'services', label: 'Услуги' },
  { id: 'work', label: 'Работы' },
  { id: 'contact', label: 'Контакты' },
];

function go(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId(id);
  };
}

function Header() {
  return (
    <header className="hdr">
      <a href="#top" className="hdr-logo" onClick={go('top')}>
        <Logo />
      </a>
      <nav className="hdr-nav" aria-label="Разделы">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} onClick={go(n.id)}>
            {n.label}
          </a>
        ))}
      </nav>
      <a href="#contact" className="hdr-cta" onClick={go('contact')}>
        Записаться
      </a>
    </header>
  );
}

function Hero() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(t);
  }, []);
  return (
    <section id="top" className={`hero ${ready ? 'ready' : ''}`} data-track>
      <div className="hero-media">
        <Img photo={PHOTOS.hero} sizes={COVER} eager onLoad={() => setReady(true)} className="hero-img" />
        <div className="hero-sheen" aria-hidden="true" />
      </div>
      <div className="hero-shade" aria-hidden="true" />
      <div className="hero-body wrap">
        <p className="kicker hero-kicker">
          <span>Студия детейлинга</span>
          <span>Москва</span>
        </p>
        <h1 className="hero-title">
          <Lines lines={['Поверхность,', 'доведённая', 'до идеала.']} step={0.1} delay={0.35} />
        </h1>
        <div className="hero-foot">
          <p className="hero-sub">
            Полировка, керамика и защитная плёнка.
            <br />
            Одна машина в работе. По записи.
          </p>
          <a href="#work" className="btn btn-light" onClick={go('work')}>
            Смотреть работу
            <i aria-hidden="true">↓</i>
          </a>
        </div>
      </div>
    </section>
  );
}

function Surface() {
  return (
    <section id="surface" className="surface light" data-track>
      <div className="wrap surface-grid">
        <div className="surface-copy" data-reveal>
          <p className="kicker">01 — Поверхность</p>
          <h2 className="h2">
            <Lines lines={['Хорошую работу', 'не видно.', <em key="e">Видно отражение.</em>]} />
          </h2>
          <p className="body">
            Мы работаем с лаком, а не с машиной «в целом»: снимаем риски и голограммы, выравниваем глубину цвета и
            закрываем результат защитой. Тогда отражение лежит на кузове ровно — как на стекле.
          </p>
          <dl className="facts">
            <div>
              <dt>1</dt>
              <dd>машина в боксе одновременно</dd>
            </div>
            <div>
              <dt>3–7</dt>
              <dd>дней на полный цикл</dd>
            </div>
            <div>
              <dt>5</dt>
              <dd>источников света при осмотре</dd>
            </div>
          </dl>
        </div>
        <figure className="surface-fig" data-reveal>
          <div className="mask">
            <Img photo={PHOTOS.surface} sizes="(max-width: 860px) 100vw, 46vw" className="drift" />
          </div>
          <figcaption className="cap">Чёрный металлик после двух этапов полировки</figcaption>
        </figure>
      </div>
    </section>
  );
}

const STAGES = ['Полировка', 'Защита', 'Глубина цвета'];

function Transformation() {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(-1);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - innerHeight;
      const pin = Math.min(1, Math.max(0, -r.top / span));
      const sw = Math.min(1, Math.max(0, (pin - 0.06) / 0.78));
      el.style.setProperty('--sw', sw.toFixed(4));
      setStage(sw <= 0.02 ? -1 : sw < 0.36 ? 0 : sw < 0.7 ? 1 : 2);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="tf" ref={ref} aria-label="Трансформация поверхности">
      <div className="tf-stick">
        <Img photo={PHOTOS.transformDull} sizes={COVER} className="tf-img" />
        <div className="tf-fin">
          <Img photo={PHOTOS.transform} sizes={COVER} className="tf-img" />
        </div>
        <div className="tf-beam" aria-hidden="true">
          <i />
        </div>
        <div className="tf-shade" aria-hidden="true" />
        <div className="wrap tf-copy">
          <p className="kicker">02 — Трансформация</p>
          <h2 className="h2">
            Тот же кузов.
            <br />
            Другой свет.
          </h2>
        </div>
        <ol className="wrap tf-stages">
          {STAGES.map((s, i) => (
            <li key={s} className={stage >= i ? 'on' : ''}>
              <span className="num">0{i + 1}</span>
              <span className="tf-stage-name">{s}</span>
              <span className="tf-bar">
                <i
                  style={
                    { '--from': i / 3, '--to': (i + 1) / 3 } as CSSProperties
                  }
                />
              </span>
            </li>
          ))}
        </ol>
        <p className="tf-hint kicker" aria-hidden="true">
          Прокрутите
        </p>
      </div>
    </section>
  );
}

const SERVICES = [
  {
    name: 'Детейлинг-мойка',
    text: 'Двухфазная мойка, очистка битума и металлических вкраплений, сушка воздухом без касания.',
    time: '4–5 часов',
    price: 'от 9 000 ₽',
    photo: PHOTOS.services.wash,
  },
  {
    name: 'Полировка',
    text: 'Восстанавливающая или лёгкая. Убираем голограммы и риски, возвращаем лаку глубину.',
    time: '2–4 дня',
    price: 'от 38 000 ₽',
    photo: PHOTOS.services.polish,
  },
  {
    name: 'Керамика',
    text: 'Твёрдый слой поверх лака: блеск держится годами, грязь уходит вместе с водой.',
    time: '1–2 дня',
    price: 'от 45 000 ₽',
    photo: PHOTOS.services.ceramic,
  },
  {
    name: 'Защитная плёнка',
    text: 'Полиуретан на зоны сколов или на весь кузов. Глянец или сатин, кромки заворачиваем.',
    time: '3–6 дней',
    price: 'от 60 000 ₽',
    photo: PHOTOS.services.film,
  },
  {
    name: 'Интерьер',
    text: 'Кожа, алькантара, пластик. Чистка, питание и защита — без жирного блеска и запаха.',
    time: '1 день',
    price: 'от 18 000 ₽',
    photo: PHOTOS.services.interior,
  },
];

function Services() {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const hovering = useRef(false);
  useEffect(() => {
    const onScroll = () => {
      if (!hovering.current) setActive(activeIndex(rows.current, 0.55));
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section id="services" className="services light">
      <div className="wrap">
        <header className="sec-head" data-reveal>
          <p className="kicker">03 — Услуги</p>
          <h2 className="h2">
            <Lines lines={['Пять работ,', 'которые мы делаем', 'каждый день.']} />
          </h2>
        </header>
        <div className="svc-grid">
          <ol
            className="svc-list"
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') hovering.current = true;
            }}
            onPointerLeave={() => {
              hovering.current = false;
            }}
          >
            {SERVICES.map((s, i) => (
              <li
                key={s.name}
                ref={(el) => {
                  rows.current[i] = el;
                }}
                className={`svc ${active === i ? 'on' : ''}`}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setActive(i);
                }}
              >
                <div className="svc-media-m">
                  <Img photo={s.photo} sizes="100vw" />
                </div>
                <span className="num">0{i + 1}</span>
                <h3 className="svc-name">{s.name}</h3>
                <div className="svc-more">
                  <div>
                    <p className="body">{s.text}</p>
                    <p className="svc-meta">
                      <span>{s.time}</span>
                      <span>{s.price}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="svc-stage" aria-hidden="true">
            <div className="svc-frame">
              {SERVICES.map((s, i) => (
                <div key={s.name} className={`svc-shot ${active === i ? 'on' : ''} ${i < active ? 'past' : ''}`}>
                  <Img photo={s.photo} sizes="40vw" />
                </div>
              ))}
              <span className="svc-count kicker">
                0{active + 1} / 0{SERVICES.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const MATERIAL = [
  {
    word: 'Поверхность.',
    label: 'Лак',
    note: 'Толщину замеряем на каждой панели до и после. Снимаем микроны, а не миллиметры.',
    photo: PHOTOS.material.paint,
    cls: 'mat-a',
  },
  {
    word: 'Свет.',
    label: 'Оптика',
    note: 'Фары полируем и закрываем плёнкой: мутный пластик — первое, что старит машину.',
    photo: PHOTOS.material.light,
    cls: 'mat-b',
  },
  {
    word: 'Материал.',
    label: 'Диски',
    note: 'Снимаем колёса, моем каждую спицу и суппорт, покрываем керамикой от тормозной пыли.',
    photo: PHOTOS.material.wheel,
    cls: 'mat-c',
  },
];

function Material() {
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const onScroll = () => setActive(activeIndex(items.current, 0.6));
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  const words = [...MATERIAL.map((m) => m.word), 'Контроль.'];
  return (
    <section className="material dark">
      <div className="wrap mat-grid">
        <div className="mat-words">
          <p className="kicker">04 — Детали</p>
          <ul>
            {words.map((w, i) => (
              <li key={w} className={i === active ? 'on' : i < active ? 'past' : ''}>
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="mat-items">
          {MATERIAL.map((m, i) => (
            <figure
              key={m.label}
              className={`mat ${m.cls}`}
              ref={(el) => {
                items.current[i] = el;
              }}
              data-reveal
            >
              <div className="mask sheen-hover">
                <Img photo={m.photo} sizes="(max-width: 860px) 100vw, 56vw" />
              </div>
              <figcaption>
                <span className="kicker">
                  0{i + 1} · {m.label}
                </span>
                <span className="mat-note">{m.note}</span>
              </figcaption>
            </figure>
          ))}
          <div
            className="mat-end"
            ref={(el) => {
              items.current[3] = el;
            }}
            data-reveal
          >
            <p className="kicker">04 · Контроль</p>
            <p className="mat-end-text">
              Каждую панель смотрим под пятью источниками света разной температуры. Машину отдаём с отчётом:
              замеры, фото до и после, что и чем покрыто.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Frame({
  photo,
  index,
  car,
  work,
  className = '',
  sizes,
}: {
  photo: Photo;
  index: string;
  car: string;
  work: string;
  className?: string;
  sizes: string;
}) {
  return (
    <figure className={`frame ${className}`} data-track data-reveal>
      <div className="mask">
        <Img photo={photo} sizes={sizes} className="drift" />
      </div>
      <figcaption className="frame-cap">
        <span className="num">{index}</span>
        <span className="frame-car">{car}</span>
        <span className="frame-work">{work}</span>
      </figcaption>
    </figure>
  );
}

function Showcase() {
  const W = PHOTOS.work;
  return (
    <section id="work" className="work">
      <div className="work-dark dark">
        <header className="wrap sec-head" data-reveal>
          <p className="kicker">05 — Работы</p>
          <h2 className="h2">
            <Lines lines={['Из последних', 'выдач.']} />
          </h2>
        </header>
        <Frame
          photo={W.silver}
          index="01"
          car="Porsche 911 Carrera · GT Silver"
          work="Восстанавливающая полировка, керамика в два слоя · 6 дней"
          className="frame-full"
          sizes="(max-width: 860px) 270vw, 100vw"
        />
      </div>
      <div className="work-light light">
        <div className="wrap work-studio">
          <Frame
            photo={W.studio}
            index="02"
            car="Porsche 911 Turbo (996) · Arctic Silver"
            work="Полиуретан на весь кузов, диски в керамике · 9 дней"
            className="frame-studio"
            sizes="(max-width: 860px) 100vw, 70vw"
          />
          <p className="work-quote" data-reveal>
            Светлый бокс не прощает ничего. Поэтому мы сдаём машины именно в нём.
          </p>
        </div>
      </div>
      <div className="work-dark dark">
        <div className="wrap work-pair">
          <Frame
            photo={W.front}
            index="03"
            car="Porsche 911 GT3 · Silver"
            work="Полировка оптики, плёнка на переднюю часть · 3 дня"
            className="frame-tall"
            sizes="(max-width: 860px) 100vw, 40vw"
          />
          <Frame
            photo={W.night}
            index="04"
            car="Porsche 911 GT2 RS · Carbon"
            work="Сатиновая плёнка, керамика на карбон · 7 дней"
            className="frame-offset"
            sizes="(max-width: 860px) 100vw, 46vw"
          />
        </div>
        <Frame
          photo={W.garage}
          index="05"
          car="Audi R8 V10 · Mythos Black"
          work="Полировка в три этапа, керамика, интерьер · 7 дней"
          className="frame-poster"
          sizes="100vw"
        />
      </div>
    </section>
  );
}

function Final() {
  const [note, setNote] = useState(false);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(false), 3600);
    return () => clearTimeout(t);
  }, [note]);
  return (
    <section id="contact" className="final dark">
      <div className="final-media" data-track>
        <Img photo={PHOTOS.final} sizes={COVER} className="final-img" />
        <div className="final-shade" aria-hidden="true" />
        <div className="wrap final-body">
          <h2 className="final-title" data-reveal>
            <Lines lines={['Оставьте', 'его таким.']} step={0.12} />
          </h2>
          <div className="final-side" data-reveal>
            <p className="body">
              Осмотр бесплатный и занимает сорок минут. Покажем лак под светом и скажем, что ему действительно нужно —
              иногда это просто мойка.
            </p>
            <button type="button" className="btn btn-light" onClick={() => setNote(true)}>
              Записаться на осмотр
              <i aria-hidden="true">→</i>
            </button>
            <p className={`final-note ${note ? 'on' : ''}`} role="status">
              {note ? 'Это концепт: запись здесь не подключена.' : ''}
            </p>
          </div>
        </div>
      </div>
      <footer className="foot wrap">
        <dl className="foot-info">
          <div>
            <dt className="kicker">Телефон</dt>
            <dd>+7 495 000-00-00</dd>
          </div>
          <div>
            <dt className="kicker">Telegram</dt>
            <dd>@strata.studio</dd>
          </div>
          <div>
            <dt className="kicker">Адрес</dt>
            <dd>Москва, бокс по записи</dd>
          </div>
          <div>
            <dt className="kicker">Часы</dt>
            <dd>Ежедневно, 10:00–21:00</dd>
          </div>
        </dl>
        <p className="foot-word" aria-hidden="true">
          {BRAND}
        </p>
        <div className="foot-legal">
          <span>© 2026 {BRAND} — концепт для портфолио. Студия, телефон и работы вымышлены.</span>
          <details>
            <summary>Фото: Unsplash</summary>
            <p>{CREDITS.join(', ')}.</p>
          </details>
          <a href="../">← Все работы</a>
        </div>
      </footer>
    </section>
  );
}

export default function App() {
  useEffect(() => startMotion(), []);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Surface />
        <Transformation />
        <Services />
        <Material />
        <Showcase />
        <Final />
      </main>
    </>
  );
}
