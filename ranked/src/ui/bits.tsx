import { useEffect, useRef, useState } from 'react';
import { fromPrice, gameById, tierIndex, type Choice, type GameId, type Service } from '../data';
import { plural, useI18n, type Txt } from '../i18n';
import { navigate } from '../store';

export const img = (name: string) => `${import.meta.env.BASE_URL}img/${name}.webp`;
export const svcImg = (id: string, lg = false) => img(`s/${id}${lg ? '-lg' : ''}`);

const P: Record<string, string> = {
  search: 'M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM15.5 15.5 20 20',
  bag: 'M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
  clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4.5l3 1.8',
  check: 'M5 12.5l4.5 4.5L19 7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  minus: 'M6 12h12',
  plus: 'M12 6v12M6 12h12',
};

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

export function Star({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" className="star" aria-hidden="true"><path d={P.star} /></svg>;
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => <svg key={i} viewBox="0 0 24 24" width="13" height="13" className={i < Math.round(value) ? 'on' : ''} aria-hidden="true"><path d={P.star} /></svg>)}
    </span>
  );
}

export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg viewBox="0 0 30 24" width="30" height="24"><path d="M7 0h23l-7 24H0z" fill="var(--brand)" /><path d="M13 5h7.5a3.6 3.6 0 0 1 0 7.2H11M16 12.2l2.6 6.8M13 5l-3.9 14" fill="none" stroke="#14110a" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="square" /></svg>
    </span>
  );
}

/** Slanted game label, coloured by the game. */
export function GameTag({ game, full }: { game: GameId; full?: boolean }) {
  const g = gameById(game);
  return <span className="gtag" style={{ ['--gc' as string]: g.color }}>{full ? g.name : g.short}</span>;
}

/** Eases a number towards its new value. */
export function useTween(target: number, ms = 380) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); from.current = target; return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      const val = a + (target - a) * e;
      setV(val); from.current = val;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function useSummary() {
  const { tr, t, num, lang } = useI18n();
  return (s: Service, c: Choice): { title: string; detail?: string } => {
    const cfg = s.cfg;
    if (cfg.kind === 'rating') {
      const unit = tr(cfg.unit as Txt | string);
      if (cfg.headline === 'tier') {
        const a = tr(cfg.tiers[tierIndex(cfg, c.from)].label ?? ''), b = tr(cfg.tiers[tierIndex(cfg, c.to)].label ?? '');
        return { title: `${cfg.prefix} ${a} → ${b}`, detail: `${num(c.from)} → ${num(c.to)} ${unit}` };
      }
      const named = cfg.tiers.some((x) => x.label);
      const detail = named ? `${tr(cfg.tiers[tierIndex(cfg, c.from)].label!)} → ${tr(cfg.tiers[tierIndex(cfg, c.to)].label!)}` : undefined;
      if (cfg.prefix) return { title: `${cfg.prefix} ${num(c.from)} → ${num(c.to)}`, detail };
      if (typeof cfg.unit !== 'string' && cfg.unit.ru === 'ур.') return { title: `${t('Уровень')} ${num(c.from)} → ${num(c.to)}`, detail };
      return { title: `${num(c.from)} → ${num(c.to)} ${unit}`, detail };
    }
    if (cfg.kind === 'ladder') return { title: `${tr(cfg.rungs[c.from].label)} → ${tr(cfg.rungs[c.to].label)}` };
    const [one, few, many] = cfg.unit;
    const n = c.qty;
    const word = lang === 'ru' ? tr(plural(n, 'a', 'b', 'c') === 'a' ? one : plural(n, 'a', 'b', 'c') === 'b' ? few : many) : tr(n === 1 ? one : few);
    return { title: `${num(n)} ${word}` };
  };
}

const open = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); navigate(`#/s/${id}`); };

/** Catalog card. */
export function ServiceCard({ s, i = 0 }: { s: Service; i?: number }) {
  const { tr, t, rub, num, days } = useI18n();
  const p = fromPrice(s);
  return (
    <a className="card" href={`#/s/${s.id}`} onClick={open(s.id)} style={{ ['--gc' as string]: gameById(s.game).color, ['--i' as string]: i }}>
      <span className="card-img cut">
        <img src={svcImg(s.id)} alt="" loading="lazy" width="800" height="450" />
        <GameTag game={s.game} />
        {s.sale && <span className="sale">−{Math.round(s.sale * 100)}%</span>}
      </span>
      <span className="card-body">
        <span className="card-title">{tr(s.title)}</span>
        <span className="card-desc">{tr(s.desc)}</span>
        <span className="card-meta"><span className="rate"><Star />{s.rating.toFixed(1)}</span><span>{t('{n} заказов', { n: num(s.orders) })}</span><span className="eta"><Icon name="clock" size={13} />{days(p.days)}</span></span>
        <span className="card-foot">
          <span className="price-from"><small>{t('от')}</small> {rub(p.price)}{s.sale && <s>{rub(p.full)}</s>}</span>
          <span className="card-go">{t('Выбрать')}<Icon name="arrow" size={16} /></span>
        </span>
      </span>
    </a>
  );
}

/** Big poster card for "Популярное". */
export function FeatureCard({ s, image, tagline }: { s: Service; image: string; tagline: Txt }) {
  const { tr, t, rub, num } = useI18n();
  const p = fromPrice(s);
  return (
    <a className="feature cut-lg" href={`#/s/${s.id}`} onClick={open(s.id)} style={{ ['--gc' as string]: gameById(s.game).color }}>
      <img src={img(image)} alt="" loading="lazy" width="1400" height="620" />
      <span className="feature-copy">
        <GameTag game={s.game} full />
        <b>{tr(s.title)}</b>
        <span>{tr(tagline)}</span>
        <span className="feature-foot">
          <span className="price-from big"><small>{t('от')}</small> {rub(p.price)}</span>
          <span className="feature-rate"><Star size={14} />{s.rating.toFixed(1)} · {t('{n} заказов', { n: num(s.orders) })}</span>
        </span>
      </span>
      <span className="feature-go" aria-hidden="true"><Icon name="arrow" /></span>
    </a>
  );
}

/** Compact horizontal card. */
export function MiniCard({ s }: { s: Service }) {
  const { tr, t, rub } = useI18n();
  const p = fromPrice(s);
  return (
    <a className="mini" href={`#/s/${s.id}`} onClick={open(s.id)} style={{ ['--gc' as string]: gameById(s.game).color }}>
      <span className="mini-img cut-sm"><img src={svcImg(s.id)} alt="" loading="lazy" width="800" height="450" /></span>
      <span className="mini-body">
        <GameTag game={s.game} />
        <b>{tr(s.title)}</b>
        <span className="price-from"><small>{t('от')}</small> {rub(p.price)}{s.sale && <em className="sale-inline">−{Math.round(s.sale * 100)}%</em>}</span>
      </span>
    </a>
  );
}
