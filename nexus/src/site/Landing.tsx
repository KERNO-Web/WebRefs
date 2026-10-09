import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Lines, setLang, useI18n } from '../i18n';
import { reducedMotion, useApp } from '../ctx';
import { MERCHANTS, SHOWCASE_CARD, debitFor, rateOf, type MerchantId } from '../store';
import { TapCard, cardProps } from '../components/Card';
import { Icon, Mark, MerchantMark } from '../components/Icon';
import { StatusPill, useCount } from '../components/ui';

/** "YOU PAY {fiat}." with React nodes in place of the placeholders */
function rich(s: string, map: Record<string, ReactNode>) {
  return s.split(/(\{\w+\})/).map((p, i) => {
    const k = p.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{k && k in map ? map[k] : p}</Fragment>;
  });
}

const jump = (id: string) => (e?: React.MouseEvent) => {
  e?.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
};

export function Landing({ onEnter, dimmed }: { onEnter: () => void; dimmed?: boolean }) {
  const { t, lang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <div className={'site' + (dimmed ? ' dimmed' : '')} aria-hidden={dimmed || undefined}>
      <header className={'nav' + (scrolled ? ' scrolled' : '')}>
        <a href="#" className="brand" onClick={jump('top')}><Mark size={20} />TAPSHIFT</a>
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>{lang === 'en' ? 'RU' : 'EN'}</button>
        <button className="btn primary sm" onClick={onEnter}>{t('Enter TapShift')}</button>
      </header>
      <main id="top">
        <Hero onEnter={onEnter} />
        <Moment onEnter={onEnter} />
      </main>
    </div>
  );
}

function Hero({ onEnter }: { onEnter: () => void }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state } = useApp();
  const card = state.card ?? SHOWCASE_CARD;
  const base = state.card ? state.base : 'EUR';
  const coffee = MERCHANTS.coffee.price[base];
  return (
    <section className="hero grain" aria-labelledby="hero-h">
      <span className="hero-ghost num" aria-hidden="true">{fiat(coffee, base)}</span>
      <div className="hero-copy">
        <span className="eyebrow mono">TAPSHIFT · {t('Virtual crypto card')} · {t('Concept')}</span>
        <h1 id="hero-h"><Lines text={t('SPEND\nCRYPTO.\nLIKE MONEY.')} /></h1>
        <p className="lede">{t('A simulated crypto card with conversion at checkout, real card controls and transaction logic. Step inside and use it.')}</p>
        <div className="cta">
          <button className="btn primary lg" onClick={onEnter}>{t('Enter TapShift')}<Icon name="arrow" size={18} /></button>
          <a className="btn ghost lg" href="#how" onClick={jump('how')}>{t('See how it works')}</a>
        </div>
        <span className="print mono" aria-hidden="true">TAP. WE SHIFT THE REST. — TS/01</span>
      </div>
      <div className="hero-object">
        <TapCard {...cardProps(card)} frozen={state.controls.frozen && !!state.card} pose={[9, -17]} className="hero-card" />
        <div className="hero-receipt" aria-label={t('Example payment')}>
          <MerchantMark id="coffee" size={30} />
          <span className="hr-m"><b>Coffee Corner</b><span className="mono">{rate('USDT', rateOf('USDT', base), base)}</span></span>
          <span className="hr-v num"><b>{fiat(coffee, base)}</b><span>{crypto(-debitFor(coffee, 'USDT', base), 'USDT')}</span></span>
          <StatusPill status="paid" />
        </div>
      </div>
      <div className="hero-foot mono" aria-hidden="true">
        <span>{rate('USDT', rateOf('USDT', base), base)}</span>
        <span>{t('Fee')} {fiat(0, base)}</span>
        <span>{t('Simulated. No real money.')}</span>
      </div>
    </section>
  );
}

const STORY: MerchantId[] = ['coffee', 'spotify', 'nike', 'taxi'];

/** The one explanatory moment: the receipt explains the product. */
function Moment({ onEnter }: { onEnter: () => void }) {
  const { t, amount, symbol, fiat, rate, lang } = useI18n();
  const { state } = useApp();
  const base = state.card ? state.base : 'EUR';
  const [i, setI] = useState(0);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    let id = 0;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(id);
      if (e.isIntersecting) id = window.setInterval(() => setI((n) => (n + 1) % STORY.length), 2800);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(id); };
  }, []);
  const m = MERCHANTS[STORY[i]];
  const price = m.price[base];
  const fv = useCount(price, 600);
  const cv = useCount(debitFor(price, 'USDT', base), 600);
  const cur = symbol(base);
  const fiatNode = <span className="fig">{lang === 'ru' ? <>{amount(fv)}&nbsp;{cur}</> : <>{cur}{amount(fv)}</>}</span>;
  const cryptoNode = <span className="fig c">{amount(cv)}&nbsp;USDT</span>;
  const steps = [
    ['01', t('HOLD'), t('USDT, USDC and ETH in one account.')],
    ['02', t('TAP'), t('Pay wherever cards work: online, contactless, ATM.')],
    ['03', t('SHIFT'), t('TapShift converts at the moment you pay.')],
  ];
  return (
    <section className="moment grain" id="how" ref={ref} aria-labelledby="moment-h">
      <h2 id="moment-h" className="sr-only">{t('How it works')}</h2>
      <div className="moment-main">
        <span className="idx mono">{t('HOW IT WORKS')}</span>
        <p className="moment-line">{rich(t('YOU PAY {fiat}.'), { fiat: fiatNode })}</p>
        <p className="moment-line second">{rich(t('TAPSHIFT USES {crypto}.'), { crypto: cryptoNode })}</p>
        <div className="moment-meta">
          <span className="mm-merchant"><MerchantMark id={m.id} size={28} /><b>{t(m.name)}</b></span>
          <span className="mono">{rate('USDT', rateOf('USDT', base), base)}</span>
          <span>{t('Fee')} {fiat(0, base)}</span>
          <StatusPill status="paid" />
        </div>
        <div className="moment-dots" aria-hidden="true">{STORY.map((s, k) => <i key={s} className={k === i ? 'on' : ''} />)}</div>
      </div>
      <ol className="steps">
        {steps.map(([n, h, d]) => <li key={n}><span className="mono">{n}</span><b>{h}</b><p>{d}</p></li>)}
      </ol>
      <div className="moment-cta">
        <p>{t('Two ways in: a lived-in demo account, or your own card from zero.')}</p>
        <button className="btn primary lg" onClick={onEnter}>{t('Enter TapShift')}<Icon name="arrow" size={18} /></button>
      </div>
      <footer className="foot">
        <span className="brand"><Mark size={16} />TAPSHIFT</span>
        <p className="muted small">{t('Portfolio concept by KERNØ. Simulated balances, rates and payments. No real cards, custody or blockchain transactions.')}</p>
      </footer>
    </section>
  );
}
