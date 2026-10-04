import { useState } from 'react';
import { useI18n, setLang } from './i18n';
import { scrollToId } from './motion';

const A = (f: string) => `${import.meta.env.BASE_URL}assets/${f}`;

export function Nav() {
  const { t, lang } = useI18n();
  const links: [string, string][] = [['world', 'World'], ['witcher', 'Witcher'], ['fate', 'Fate'], ['moments', 'Moments'], ['choices', 'Choices']];
  return (
    <header className="nav">
      <a href="#top" className="nav-logo" onClick={(e) => { e.preventDefault(); scrollToId('top'); }} aria-label="The Witcher 3: Wild Hunt">
        <img src={A('logo.webp')} alt="" width="104" height="58" />
      </a>
      <nav aria-label="Sections">
        {links.map(([id, label]) => (
          <a key={id} href={'#' + id} onClick={(e) => { e.preventDefault(); scrollToId(id); }}>{t(label)}</a>
        ))}
      </nav>
      <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>
        <span className={lang === 'en' ? 'on' : ''}>EN</span>
        <span className={lang === 'ru' ? 'on' : ''}>RU</span>
      </button>
    </header>
  );
}

export function Hero() {
  const { t } = useI18n();
  return (
    <section className="hero" id="top" data-fx="0.9,0.9,0.5" aria-labelledby="hero-h">
      <div className="hero-pin">
        <div className="hero-far" aria-hidden="true"><img src={A('mist.webp')} alt="" /></div>
        <div className="hero-art">
          <picture>
            <source media="(max-width: 760px)" srcSet={A('hero-tall.webp')} />
            <img src={A('hero.webp')} alt="Geralt of Rivia with Ciri, Yennefer and Triss before the Wild Hunt" {...{ fetchpriority: 'high' }} />
          </picture>
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow rise" style={{ ['--d' as string]: '0.2s' }}>{t('A visual tribute')}</p>
          <h1 id="hero-h" className="rise" style={{ ['--d' as string]: '0.35s' }}>{t('A world carved by steel, fire and fate.')}</h1>
          <p className="hero-sub rise" style={{ ['--d' as string]: '0.55s' }}>{t('Monsters for coin, kings at war and a daughter hunted by the Wild Hunt. Walk the Continent once more.')}</p>
          <div className="hero-cta rise" style={{ ['--d' as string]: '0.7s' }}>
            <button className="btn ember" onClick={() => scrollToId('world')}>{t('Begin the Hunt')}</button>
            <button className="btn ghost" onClick={() => scrollToId('moments')}>{t('View Gallery')}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

const PLACES = [
  { id: 'velen', name: 'Velen', line: 'Swamps, gallows and hungry crows.', img: 'shot-sunset.webp' },
  { id: 'skellige', name: 'Skellige', line: 'Isles of salt, storm and old gods.', img: 'shot-skellige.webp' },
  { id: 'orchard', name: 'White Orchard', line: 'Where the road home begins.', img: 'shot-moon.webp' },
  { id: 'war', name: 'The Northern War', line: 'Nilfgaard marches. The North burns.', img: 'shot-burning.webp' },
];

export function World() {
  const { t } = useI18n();
  const [place, setPlace] = useState(0);
  return (
    <section className="world" id="world" data-fx="0.55,0.3,0.2" aria-labelledby="world-h">
      <div className="world-head reveal">
        <h2 id="world-h">{t('A land of war, myth and ruin')}</h2>
        <p>{t('Burned villages and drowned gods. Elves who remember, kings who forget. On the Continent, beauty and rot grow from the same soil.')}</p>
      </div>
      <div className="world-frame reveal" data-zoom="0.12">
        {PLACES.map((p, i) => (
          <img key={p.id} src={A(p.img)} alt={t(p.name)} className={i === place ? 'on' : ''} loading="lazy" />
        ))}
      </div>
      <ul className="places reveal" role="tablist" aria-label={t('World')}>
        {PLACES.map((p, i) => (
          <li key={p.id}>
            <button role="tab" aria-selected={i === place} className={i === place ? 'on' : ''}
              onMouseEnter={() => setPlace(i)} onFocus={() => setPlace(i)} onClick={() => setPlace(i)}>
              <span className="place-name">{t(p.name)}</span>
              <span className="place-line">{t(p.line)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Sign silhouettes are extracted pixel-exact from the in-game icons (tools-signs.mjs)
const SIGNS: { name: string; c: string }[] = [
  { name: 'Yrden', c: '#c05cf0' },
  { name: 'Axii', c: '#72d83a' },
  { name: 'Quen', c: '#f4dc18' },
  { name: 'Aard', c: '#2aa8ff' },
  { name: 'Igni', c: '#ff2d3d' },
];

function Sign({ name, c }: { name: string; c: string }) {
  const url = `url(${A(`signs/${name.toLowerCase()}.png`)})`;
  return <span className="sign" aria-hidden="true" style={{ ['--sc' as string]: c, WebkitMaskImage: url, maskImage: url }} />;
}

export function Witcher() {
  const { t } = useI18n();
  const frags: [string, string][] = [
    ['Steel', 'For bandits, soldiers and men who forgot they are men.'],
    ['Silver', 'For wraiths, drowners and everything born of the Conjunction.'],
    ['Contracts', 'A notice board, a fair price, a beast nobody else would face.'],
  ];
  return (
    <section className="witcher" id="witcher" data-fx="0.35,0.55,0.1" aria-labelledby="witcher-h">
      <div className="witcher-art">
        <img src={A('geralt.webp')} alt="Geralt of Rivia, sword drawn" loading="lazy" />
      </div>
      <div className="witcher-copy">
        <h2 id="witcher-h" className="reveal">{t('Neither man nor monster')}</h2>
        <p className="lead reveal">{t('Mutated as a child, trained to kill what others fear to name. Geralt of Rivia takes the contract, keeps the code and pays for both.')}</p>
        <div className="frags">
          {frags.slice(0, 2).map(([h, p]) => (
            <div className="frag reveal" key={h}><h3>{t(h)}</h3><p>{t(p)}</p></div>
          ))}
          <div className="frag signs reveal">
            <h3>{t('Signs')}</h3>
            <ul>{SIGNS.map((g) => <li key={g.name} style={{ ['--sc' as string]: g.c }}><Sign name={g.name} c={g.c} /><span>{g.name}</span></li>)}</ul>
            <p>{t('Five simple gestures. Fire, force, shield, trap, will.')}</p>
          </div>
          {frags.slice(2).map(([h, p]) => (
            <div className="frag reveal" key={h}><h3>{t(h)}</h3><p>{t(p)}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FORCES = [
  { id: 'ciri', name: 'Ciri', title: 'Child of the Elder Blood', line: 'She can step between worlds. She cannot step away from her blood.', themes: ['Destiny', 'Magic'], img: 'ciri.webp', c: '#4fe3ec' },
  { id: 'yen', name: 'Yennefer', title: 'Sorceress of Vengerberg', line: 'Lilac and gooseberries. A wish that bound two lives together.', themes: ['Love', 'Memory'], img: 'yennefer.webp', c: '#9b7bff' },
  { id: 'triss', name: 'Triss', title: 'Merigold the Fearless', line: 'Fire in her hands, Novigrad at her back, and a heart she never hid.', themes: ['War', 'Loss'], img: 'triss.webp', c: '#ff6a2a' },
];

export function Fate() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  return (
    <section className="fate" id="fate" data-fx="0.6,0.45,0.3" aria-labelledby="fate-h">
      <div className="fate-head reveal">
        <h2 id="fate-h">{t('Destiny never walks alone')}</h2>
        <p>{t('Three women shape the path. One he raised, one he loves, one he could have chosen.')}</p>
      </div>
      <div className="forces reveal">
        {FORCES.map((f, i) => (
          <button key={f.id} className={'force' + (i === active ? ' on' : '')} style={{ ['--c' as string]: f.c }}
            onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} aria-expanded={i === active}>
            <span className="force-bg" aria-hidden="true" />
            <img className="force-fig" src={A(f.img)} alt={t(f.name)} loading="lazy" />
            <span className="force-glow" aria-hidden="true" />
            <span className="force-text">
              <span className="force-name">{t(f.name)}</span>
              <span className="force-title">{t(f.title)}</span>
              <span className="force-line">{t(f.line)}</span>
              <span className="force-themes">{f.themes.map((th) => t(th)).join(' / ')}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const SHOTS = [
  { label: 'Hunt', line: 'The riders in the frost are never far behind.', img: 'geralt-wide.webp', size: 'xl', op: '70% 30%' },
  { label: 'Blood', line: 'Every fight is settled at arm’s length.', img: 'shot-fight.webp', size: 'md' },
  { label: 'Frost', line: 'Cold breath of the Wild Hunt.', img: 'shot-wildhunt.webp', size: 'lg' },
  { label: 'Fire', line: 'Where the war has already been.', img: 'shot-fire.webp', size: 'md' },
  { label: 'Destiny', line: 'A girl who outruns her own fate.', img: 'ciri-wide.webp', size: 'xl', op: '0% 25%' },
];

export function Moments() {
  const { t } = useI18n();
  return (
    <section className="moments" id="moments" data-pan data-fx="0.4,0.5,0.35" aria-labelledby="moments-h">
      <div className="moments-sticky">
        <h2 id="moments-h" className="moments-title">{t('Moments that stay')}</h2>
        <div className="moments-track" data-track>
          {SHOTS.map((s) => (
            <figure key={s.label} className={'shot ' + s.size} style={'op' in s ? { ['--op' as string]: s.op } : undefined}>
              <div className="shot-img"><img src={A(s.img)} alt={t(s.line)} loading="lazy" /></div>
              <figcaption><span className="shot-label">{t(s.label)}</span><span>{t(s.line)}</span></figcaption>
            </figure>
          ))}
        </div>
        <div className="moments-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}

export function Choices() {
  const { t } = useI18n();
  const [choice, setChoice] = useState<'spare' | 'kill' | null>(null);
  const blocks: [string, string][] = [
    ['Monster contracts', 'Study the beast, brew the oils, then earn your coin.'],
    ['Moral weight', 'Lesser evils, greater evils, and rarely a good option.'],
    ['Consequence', 'Decisions return hours later, wearing a different face.'],
  ];
  return (
    <section className="choices" id="choices" data-fx="0.25,1,0" aria-labelledby="choices-h">
      <div className="choices-bg" data-depth="0.1" aria-hidden="true"><img src={A('shot-fire.webp')} alt="" loading="lazy" /></div>
      <div className="choices-grid">
        <div className="choices-statement reveal">
          <h2 id="choices-h">{t('Every contract has a price.')}<br /><em>{t('Every choice leaves a ghost.')}</em></h2>
          <p>{t('There are no clean endings here. Mercy can doom a village and cruelty can save one. You decide, then you live with it.')}</p>
        </div>
        <div className="choices-side">
          {blocks.map(([h, p]) => (
            <div key={h} className="theme reveal"><span className="rune" aria-hidden="true" /><h3>{t(h)}</h3><p>{t(p)}</p></div>
          ))}
          <div className={'dilemma reveal' + (choice ? ' chosen' : '')} aria-live="polite">
            <p className="dilemma-q">{t('A cursed creature begs you to spare it.')}</p>
            {choice ? (
              <>
                <p className={'dilemma-a ' + choice}>{choice === 'spare' ? t('It lives. Weeks later, the village it promised to protect is empty.') : t('It dies. The curse passes to the child who found you the contract.')}</p>
                <button className="link" onClick={() => setChoice(null)}>{t('Choose again')}</button>
              </>
            ) : (
              <div className="dilemma-btns">
                <button className="btn ghost" onClick={() => setChoice('spare')}>{t('Spare')}</button>
                <button className="btn ember" onClick={() => setChoice('kill')}>{t('Kill')}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Finale() {
  const { t } = useI18n();
  return (
    <section className="finale" data-fx="0.7,0.95,0.4" aria-labelledby="finale-h">
      <div className="finale-bg" data-zoom="0.1" aria-hidden="true"><img src={A('swords.webp')} alt="" loading="lazy" /></div>
      <div className="finale-copy">
        <h2 id="finale-h" className="reveal">{t('Steel for humans. Silver for monsters.')}</h2>
        <p className="reveal">{t('The path never ends. It only waits for you to walk it again.')}</p>
        <button className="btn ember reveal" onClick={() => scrollToId('top')}>{t('Return to the Continent')}</button>
      </div>
      <footer className="legal">
        <p>{t('Fan-made visual tribute for a portfolio. Not affiliated with CD PROJEKT RED.')}</p>
        <p>{t('The Witcher® is a trademark of CD PROJEKT S.A. Game imagery © CD PROJEKT RED.')}</p>
      </footer>
    </section>
  );
}
