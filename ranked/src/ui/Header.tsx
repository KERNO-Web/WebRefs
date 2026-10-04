import { useEffect, useRef, useState } from 'react';
import { GAMES, SERVICES, fromPrice, gameById, servicesOf, type GameId } from '../data';
import { setLang, useI18n } from '../i18n';
import { navigate, useOrders, useRoute } from '../store';
import { Icon, Logo, img, svcImg } from './bits';

export type NavTarget = { anchor: string; game?: GameId };

export function Header({ onNav }: { onNav: (n: NavTarget) => void }) {
  const { t, tr, rub, lang } = useI18n();
  const orders = useOrders();
  const route = useRoute();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mSearch, setMSearch] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const games = words.length ? GAMES.filter((g) => words.every((w) => `${g.name} ${g.short} ${g.id === 'dota' ? 'дота' : ''} ${g.id === 'val' ? 'валорант' : ''} ${g.id === 'lol' ? 'лол лига' : ''} ${g.id === 'gta' ? 'гта' : ''} ${g.id === 'cs2' ? 'кс контра' : ''}`.toLowerCase().includes(w))) : [];
  const results = words.length
    ? SERVICES.filter((s) => {
        const g = gameById(s.game);
        const hay = [s.title.ru, s.title.en, s.desc.ru, s.desc.en, g.name, g.short].join(' ').toLowerCase();
        return words.every((w) => hay.includes(w));
      }).slice(0, games.length ? 4 : 6)
    : [];

  useEffect(() => {
    const off = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, []);
  useEffect(() => { setMenu(false); setOpen(false); setMSearch(false); setQ(''); }, [route]);
  useEffect(() => { if (mSearch) input.current?.focus(); }, [mSearch]);

  const reset = () => { setOpen(false); setQ(''); setMSearch(false); };
  const goService = (id: string) => { reset(); navigate(`#/s/${id}`); };
  const goGame = (g: GameId) => { reset(); onNav({ anchor: 'catalog', game: g }); };

  const nav: [string, NavTarget][] = [
    [t('Игры'), { anchor: 'games' }],
    [t('Услуги'), { anchor: 'catalog' }],
    [t('Отзывы'), { anchor: 'reviews' }],
    [t('Как это работает'), { anchor: 'how' }],
  ];

  return (
    <header className={'hdr' + (menu ? ' menu-open' : '') + (mSearch ? ' search-open' : '')}>
      <div className="hdr-row">
        <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); navigate('#/'); }}><Logo />RANKED</a>
        <nav className="hdr-nav" aria-label={t('Разделы')}>
          {nav.map(([label, n]) => <button key={label} onClick={() => onNav(n)}>{label}</button>)}
        </nav>
        <div className="search" ref={box}>
          <Icon name="search" size={18} />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { if (games[0]) goGame(games[0].id); else if (results[0]) goService(results[0].id); }
              if (e.key === 'Escape') { setOpen(false); input.current?.blur(); }
            }}
            placeholder={t('Найти игру или услугу')}
            aria-label={t('Найти игру или услугу')}
          />
          {open && words.length > 0 && (
            <div className="search-pop">
              {games.map((g) => (
                <button key={g.id} className="sr-game" onClick={() => goGame(g.id)}>
                  <img src={img(g.tile)} alt="" width="40" height="60" />
                  <span><b>{g.name}</b><small>{t('{n} услуг', { n: servicesOf(g.id).length })}</small></span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
              {results.map((s) => (
                <button key={s.id} onClick={() => goService(s.id)}>
                  <img src={svcImg(s.id)} alt="" width="64" height="36" />
                  <span><b>{tr(s.title)}</b><small>{gameById(s.game).name}</small></span>
                  <em>{t('от')} {rub(fromPrice(s).price)}</em>
                </button>
              ))}
              {!games.length && !results.length && <p className="search-empty">{t('Ничего не нашли. Попробуйте «FACEIT», «MMR» или «калибровка».')}</p>}
            </div>
          )}
        </div>
        <div className="hdr-tools">
          <button className="icon-btn m-search" onClick={() => setMSearch(!mSearch)} aria-label={t('Найти игру или услугу')}><Icon name={mSearch ? 'close' : 'search'} /></button>
          <a className="orders-btn" href="#/orders" onClick={(e) => { e.preventDefault(); navigate('#/orders'); }}>
            <Icon name="bag" /><span className="d-only">{t('Мои заказы')}</span>{orders.length > 0 && <i>{orders.length}</i>}
          </a>
          <button className="lang" onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} aria-label="Language">{lang === 'ru' ? 'EN' : 'RU'}</button>
          <button className="icon-btn m-menu-btn" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={t('Меню')}><Icon name={menu ? 'close' : 'menu'} /></button>
        </div>
      </div>
      {menu && (
        <nav className="m-menu" aria-label={t('Разделы')}>
          {nav.map(([label, n]) => <button key={label} onClick={() => { setMenu(false); onNav(n); }}>{label}<Icon name="arrow" size={18} /></button>)}
          <button onClick={() => { setMenu(false); navigate('#/orders'); }}>{t('Мои заказы')}<Icon name="arrow" size={18} /></button>
        </nav>
      )}
    </header>
  );
}
