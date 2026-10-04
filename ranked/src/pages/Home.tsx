import { useEffect, useRef, useState } from 'react';
import { GAMES, REVIEWS, SERVICES, TICKER, fromPrice, gameById, gameFrom, serviceById, servicesOf, type Cat, type GameId } from '../data';
import { useI18n, type Txt } from '../i18n';
import { navigate, scrollToId } from '../store';
import { FeatureCard, GameTag, Icon, MiniCard, ServiceCard, Star, Stars, img } from '../ui/bits';

export type CatalogState = { game: GameId | 'all'; cat: Cat | 'all' };

const CATS: [Cat | 'all', string][] = [['all', 'Все'], ['rank', 'Ранг и рейтинг'], ['calib', 'Калибровка'], ['wins', 'Победы'], ['coach', 'Разбор игры'], ['other', 'Другое']];
const r = (ru: string, en: string): Txt => ({ ru, en });

export function Home({ catalog, setCatalog }: { catalog: CatalogState; setCatalog: (c: CatalogState) => void }) {
  return (
    <main className="home">
      <Hero />
      <Ticker />
      <Games onPick={(g) => { setCatalog({ game: g, cat: 'all' }); requestAnimationFrame(() => scrollToId('catalog')); }} />
      <Popular />
      <Promo />
      <Catalog catalog={catalog} setCatalog={setCatalog} />
      <How />
      <Reviews />
    </main>
  );
}

function Hero() {
  const { t, rub } = useI18n();
  const mosaic = useRef<HTMLDivElement>(null);

  // light depth: tiles drift a few pixels against the pointer
  useEffect(() => {
    const el = mosaic.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const move = (e: PointerEvent) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; };
    const tick = () => {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      el.style.setProperty('--mx', x.toFixed(3));
      el.style.setProperty('--my', y.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);

  const tiles: [GameId, string][] = [['cs2', 't-main'], ['dota', 't-a'], ['val', 't-b'], ['gta', 't-c']];
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="kicker">RANKED <i>/</i> {t('игровые услуги')}</span>
        <h1>{t('Всё для')}<br />{t('твоей игры')}</h1>
        <p>{t('Буст рейтинга, калибровка, обучение, прокачка и помощь в популярных онлайн-играх.')}</p>
        <div className="hero-cta">
          <button className="btn primary lg" onClick={() => scrollToId('games')}>{t('Выбрать игру')}</button>
          <button className="btn ghost lg" onClick={() => scrollToId('catalog')}>{t('Все услуги')}</button>
        </div>
        <ul className="hero-games" aria-label={t('Игры')}>
          {GAMES.map((g) => <li key={g.id} style={{ ['--gc' as string]: g.color }}>{g.short}</li>)}
        </ul>
      </div>
      <div className="mosaic" ref={mosaic}>
        {tiles.map(([g, cls]) => (
          <span key={g} className={'tile cut-lg ' + cls} aria-hidden="true">
            <img src={img(gameById(g).mosaic)} alt="" width="900" height="560" {...(cls === 't-main' ? { fetchpriority: 'high' } : {})} />
            <GameTag game={g} full />
          </span>
        ))}
        <a className="hero-offer cut-sm" href="#/s/cs2-faceit" onClick={(e) => { e.preventDefault(); navigate('#/s/cs2-faceit'); }}>
          <span className="ho-text"><GameTag game="cs2" /><b>{t('Буст FACEIT')}</b></span>
          <span className="price-from"><small>{t('от')}</small> {rub(fromPrice(serviceById('cs2-faceit')!).price)}</span>
          <Icon name="arrow" size={18} />
        </a>
      </div>
    </section>
  );
}

function Ticker() {
  const { t, tr } = useI18n();
  const items = [...TICKER, ...TICKER];
  return (
    <div className="ticker">
      <span className="ticker-label"><i aria-hidden="true" />{t('Сейчас заказывают')}</span>
      <div className="ticker-track">
        <div className="ticker-move">
          {items.map((x, i) => (
            <span key={i} className="tick" aria-hidden={i >= TICKER.length}>
              <b style={{ color: gameById(x.game).color }}>{gameById(x.game).short}</b>{tr(x.text)}<small>{tr(x.ago)}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Games({ onPick }: { onPick: (g: GameId) => void }) {
  const { t, rub } = useI18n();
  return (
    <section className="games" id="games" aria-labelledby="games-h">
      <div className="sec-head"><h2 id="games-h">{t('Во что играем?')}</h2></div>
      <div className="game-rail">
        {GAMES.map((g) => (
          <button key={g.id} className="game cut-lg" style={{ ['--gc' as string]: g.color }} onClick={() => onPick(g.id)}>
            <img src={img(g.tile)} alt="" width="600" height="900" loading="lazy" />
            <span className="game-copy">
              <b>{g.name}</b>
              <span>{t('{n} услуг', { n: servicesOf(g.id).length })} · {t('от')} {rub(gameFrom(g.id))}</span>
            </span>
            <span className="game-go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Popular() {
  const { t } = useI18n();
  const minis = ['val-rank', 'gta-money', 'cs2-premier', 'dota-lp'].map((id) => serviceById(id)!);
  return (
    <section className="popular" aria-labelledby="pop-h">
      <div className="sec-head"><h2 id="pop-h">{t('Популярное сейчас')}</h2></div>
      <div className="pop-grid">
        <FeatureCard s={serviceById('cs2-faceit')!} image="f-cs2" tagline={r('Поднимем ELO до нужного уровня — хоть +100, хоть до десятого', 'Any amount of ELO, from +100 to level 10')} />
        <FeatureCard s={serviceById('dota-mmr')!} image="s/dota-mmr-lg" tagline={r('Считаем по MMR, медаль показываем для ориентира', 'Priced by MMR, the medal is just for reference')} />
      </div>
      <div className="mini-row">{minis.map((s) => <MiniCard key={s.id} s={s} />)}</div>
    </section>
  );
}

const SLIDES: { game: GameId; image: string; big: string; title: Txt; sub: Txt; cta: Txt; to: string }[] = [
  { game: 'val', image: 'p-val', big: '−15%', title: r('на буст ранга в Valorant', 'off Valorant rank boosts'), sub: r('До воскресенья, на любой ранг вплоть до Радианта', 'Until Sunday, any rank up to Radiant'), cta: r('Выбрать ранг', 'Choose rank'), to: 'val-rank' },
  { game: 'dota', image: 'p-dota', big: 'ЛП', title: r('Выход из Low Priority', 'Leave Low Priority'), sub: r('Закроем нужные победы, пока вы заняты своими делами', 'We get the wins while you do something else'), cta: r('Сколько побед осталось?', 'How many wins left?'), to: 'dota-lp' },
  { game: 'gta', image: 'p-gta', big: 'GTA$', title: r('Фарм денег в GTA Online', 'GTA Online money farming'), sub: r('5 млн GTA$ — от 445 ₽. Только обычные игровые активности', '5M GTA$ from 445 ₽. Regular in-game activities only'), cta: r('Посчитать сумму', 'Calculate'), to: 'gta-money' },
];

function Promo() {
  const { t, tr } = useI18n();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setTimeout(() => setI((i + 1) % SLIDES.length), 6500);
    return () => clearTimeout(id);
  }, [i, paused]);
  return (
    <section className="promo" aria-roledescription="carousel" aria-label={t('Акции')} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="promo-stage cut-lg">
        {SLIDES.map((s, k) => (
          <div key={s.to} className={'slide' + (k === i ? ' on' : '')} aria-hidden={k !== i} style={{ ['--gc' as string]: gameById(s.game).color }}>
            <img src={img(s.image)} alt="" width="1600" height="640" loading="lazy" />
            <div className="slide-copy">
              <GameTag game={s.game} full />
              <span className="slide-big">{s.big}</span>
              <b>{tr(s.title)}</b>
              <p>{tr(s.sub)}</p>
              <button className="btn primary" tabIndex={k === i ? 0 : -1} onClick={() => navigate(`#/s/${s.to}`)}>{tr(s.cta)}<Icon name="arrow" size={18} /></button>
            </div>
          </div>
        ))}
        <div className="promo-nav">
          <button className="icon-btn" onClick={() => setI((i + SLIDES.length - 1) % SLIDES.length)} aria-label={t('Назад')}><Icon name="left" /></button>
          {SLIDES.map((s, k) => <button key={s.to} className={'dot' + (k === i ? ' on' : '')} onClick={() => setI(k)} aria-label={`${k + 1}`} aria-current={k === i} />)}
          <button className="icon-btn" onClick={() => setI((i + 1) % SLIDES.length)} aria-label={t('Вперёд')}><Icon name="right" /></button>
        </div>
      </div>
    </section>
  );
}

function Catalog({ catalog, setCatalog }: { catalog: CatalogState; setCatalog: (c: CatalogState) => void }) {
  const { t } = useI18n();
  const list = SERVICES.filter((s) => (catalog.game === 'all' || s.game === catalog.game) && (catalog.cat === 'all' || s.cat === catalog.cat));
  const g = catalog.game === 'all' ? null : gameById(catalog.game);
  return (
    <section className="catalog" id="catalog" aria-labelledby="cat-h" style={g ? { ['--gc' as string]: g.color } : undefined}>
      <div className="sec-head"><h2 id="cat-h">{t('Все услуги')}</h2><span className="count">{list.length}</span></div>
      <div className="filters">
        <div className="game-filter" role="tablist" aria-label={t('Игры')}>
          <button role="tab" aria-selected={catalog.game === 'all'} className={catalog.game === 'all' ? 'on' : ''} onClick={() => setCatalog({ ...catalog, game: 'all' })}>{t('Все игры')}</button>
          {GAMES.map((x) => (
            <button key={x.id} role="tab" aria-selected={catalog.game === x.id} className={catalog.game === x.id ? 'on' : ''} style={{ ['--gc' as string]: x.color }} onClick={() => setCatalog({ ...catalog, game: x.id })}>
              <i aria-hidden="true" />{x.short}
            </button>
          ))}
        </div>
        <div className="tabs" role="tablist" aria-label={t('Категории')}>
          {CATS.map(([c, label]) => (
            <button key={c} role="tab" aria-selected={catalog.cat === c} className={catalog.cat === c ? 'on' : ''} onClick={() => setCatalog({ ...catalog, cat: c })}>{t(label)}</button>
          ))}
        </div>
      </div>
      {list.length ? (
        <div className="grid" key={`${catalog.game}-${catalog.cat}`}>{list.map((s, i) => <ServiceCard key={s.id} s={s} i={i} />)}</div>
      ) : (
        <div className="empty">
          <p>{t('Для {game} в этом разделе пока ничего нет.', { game: g?.short ?? '' })}</p>
          <button className="btn ghost" onClick={() => setCatalog({ game: 'all', cat: catalog.cat })}>{t('Показать для всех игр')}</button>
        </div>
      )}
    </section>
  );
}

function How() {
  const { t } = useI18n();
  const steps: [string, string][] = [
    ['Выберите услугу', 'Укажите, откуда и докуда, отметьте нужные опции — цена посчитается сразу.'],
    ['Оформите заказ', 'Оставьте контакт для связи и выберите способ оплаты.'],
    ['Исполнитель начнёт', 'Подберём игрока под вашу игру и ранг. Его ник появится в заказе.'],
    ['Следите за прогрессом', 'После каждой сессии в заказе обновляется рейтинг или счёт матчей.'],
  ];
  return (
    <section className="how" id="how" aria-labelledby="how-h">
      <div className="sec-head"><h2 id="how-h">{t('Как проходит заказ')}</h2></div>
      <ol className="steps">
        {steps.map(([a, b]) => <li key={a}><b>{t(a)}</b><p>{t(b)}</p></li>)}
      </ol>
    </section>
  );
}

function Reviews() {
  const { t, tr, num } = useI18n();
  return (
    <section className="reviews" id="reviews" aria-labelledby="rev-h">
      <div className="sec-head">
        <h2 id="rev-h">{t('Что пишут игроки')}</h2>
        <span className="rev-sum"><Star size={16} /><b>4,9</b><span className="muted">{t('{n} отзывов', { n: num(6214) })}</span></span>
      </div>
      <div className="rev-row">
        {REVIEWS.map((x) => (
          <article key={x.nick} className="rev" style={{ ['--gc' as string]: gameById(x.game).color }}>
            <header>
              <span className="ava" style={{ background: `hsl(${x.hue} 50% 34%)` }} aria-hidden="true">{x.nick[0].toUpperCase()}</span>
              <span><b>{x.nick}</b><small>{tr(x.when)}</small></span>
              <Stars value={x.stars} />
            </header>
            <span className="rev-result"><GameTag game={x.game} />{tr(x.result)}</span>
            <p>«{tr(x.text)}»</p>
          </article>
        ))}
      </div>
    </section>
  );
}
