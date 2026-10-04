import { useEffect, useRef, useState } from 'react';
import { useI18n, setLang } from './i18n';
import { spentThisMonth, useStore, type Tx } from './store';
import { VirtualCard, Mark } from './components/Card';
import { TopUpSheet, ExchangeSheet, DetailsSheet, Switch, LimitSlider, CARD_NUMBER } from './components/Sheets';
import { Icon, Logo } from './components/Icon';

type SheetName = 'topup' | 'exchange' | 'details' | null;

const go = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: reduced ? 'auto' : 'smooth' });
};

function useCount(target: number) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); from.current = target; return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3);
      const val = a + (target - a) * e;
      setV(val); from.current = val;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

const MERCHANTS = [
  { name: 'Netflix', logo: 'netflix.svg', amount: 15.49, note: 'Movies' },
  { name: 'App Store', logo: 'apple.svg', amount: 4.99, note: 'App Store' },
  { name: 'Steam', logo: 'steam.svg', amount: 59.99, note: 'Games' },
];

export default function App() {
  const { t, lang, money, locale } = useI18n();
  const [state, dispatch] = useStore();
  const [sheet, setSheet] = useState<SheetName>(null);
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [issuing, setIssuing] = useState(false);
  const balance = useCount(state.usd);
  const [whole, cents] = balance.toFixed(2).split('.');

  const pay = (m: (typeof MERCHANTS)[number]) => {
    let reason = '';
    if (state.frozen) reason = 'Declined: card is frozen';
    else if (!state.online) reason = 'Declined: online payments are off';
    else if (spentThisMonth(state) + m.amount > state.limit) reason = 'Declined: over the monthly limit';
    else if (state.usd < m.amount) reason = 'Declined: not enough balance';
    dispatch({ type: 'pay', merchant: m.name, logo: m.logo, amount: m.amount, ok: !reason, note: m.note });
    setResult({ ok: !reason, text: reason ? t(reason) : `${t('Approved')} · ${m.name} −${money(m.amount)}` });
  };

  const issue = () => {
    setIssuing(true);
    setTimeout(() => setIssuing(false), 1400);
    setTimeout(() => setSheet('topup'), 700);
  };

  const dayLabel = (ts: number) => {
    const d = new Date(ts), now = new Date();
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    if (diff === 0) return t('Today');
    if (diff === 1) return t('Yesterday');
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };
  const groups: [string, Tx[]][] = [];
  state.tx.slice(0, 12).forEach((x) => {
    const k = dayLabel(x.at);
    const g = groups[groups.length - 1];
    if (g && g[0] === k) g[1].push(x); else groups.push([k, [x]]);
  });

  const actions: { id: string; label: string; icon: string; run: () => void }[] = [
    { id: 'topup', label: t('Top up'), icon: 'plus', run: () => setSheet('topup') },
    { id: 'exchange', label: t('Exchange'), icon: 'swap', run: () => setSheet('exchange') },
    { id: 'freeze', label: state.frozen ? t('Unfreeze') : t('Freeze'), icon: 'snow', run: () => dispatch({ type: 'freeze', on: !state.frozen }) },
    { id: 'details', label: t('Details'), icon: 'card', run: () => setSheet('details') },
  ];

  return (
    <>
      <header className="nav">
        <a href="#top" className="brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Mark />NEXUS</a>
        <nav aria-label="Sections">
          <a href="#how" onClick={(e) => { e.preventDefault(); go('how'); }}>{t('How it works')}</a>
          <a href="#controls" onClick={(e) => { e.preventDefault(); go('controls'); }}>{t('Controls')}</a>
          <a href="#activity" onClick={(e) => { e.preventDefault(); go('activity'); }}>{t('Activity')}</a>
        </nav>
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>{lang === 'en' ? 'RU' : 'EN'}</button>
      </header>

      <main id="top">
        <section className="hero">
          <svg className="wordmark" viewBox="0 0 1000 190" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
            <text x="500" y="178" textAnchor="middle" textLength="992" lengthAdjust="spacingAndGlyphs">NEXUS</text>
          </svg>
          <div className="hero-copy">
            <h1>{t('Spend crypto')}<br /><span>{t('like money.')}</span></h1>
            <p>{t('Top up with USDT. Use one virtual card for everyday online payments.')}</p>
            <div className="hero-cta">
              <button className="btn primary" onClick={issue}>{t('Get a demo card')}</button>
              <button className="btn ghost" onClick={() => go('how')}>{t('See how it works')}</button>
            </div>
          </div>

          <div className={'hero-card' + (issuing ? ' issuing' : '')}>
            <VirtualCard frozen={state.frozen} number={CARD_NUMBER} reveal={reveal} />
            <div className="wallet">
              <div className="bal">
                <span className="bal-label">{t('Card balance')}<i className={'dot' + (state.frozen ? ' off' : '')} />{state.frozen ? t('Frozen') : t('Active')}</span>
                <span className="bal-val num">${Number(whole).toLocaleString('en-US')}<small>.{cents}</small></span>
                {state.eur > 0 && <span className="bal-sub num">+ {money(state.eur, 'EUR')}</span>}
              </div>
              <div className="actions">
                {actions.map((a) => (
                  <button key={a.id} className={'act' + (a.id === 'freeze' && state.frozen ? ' on' : '')} onClick={a.run} aria-pressed={a.id === 'freeze' ? state.frozen : undefined}>
                    <span className="act-ico"><Icon name={a.icon} /></span>{a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="how" id="how" aria-labelledby="how-h">
          <h2 id="how-h">{t('Crypto in. Card out.')}</h2>
          <ol className="flow">
            <li><span className="flow-ico"><Logo src="tether.svg" size={44} /></span><b>{t('Send USDT')}</b><p>{t('From any wallet or exchange, on TRON, Ethereum or Solana.')}</p></li>
            <li><span className="flow-ico"><Logo src="#$" size={44} /></span><b>{t('Get dollars')}</b><p>{t('Crypto lands as a regular balance on your card. 1 USDT = $1.')}</p></li>
            <li><span className="flow-ico"><span className="logo" style={{ width: 44, height: 44 }}><Icon name="card" size={22} /></span></span><b>{t('Pay anywhere')}</b><p>{t('Use the card online, in apps and subscriptions.')}</p></li>
          </ol>
        </section>

        <section className="controls" id="controls" aria-labelledby="ctl-h">
          <div className="controls-copy">
            <h2 id="ctl-h">{t('Your card, your rules')}</h2>
            <p>{t('Every switch below is live. Try a purchase and see what the card does.')}</p>
            <div className="ctl-list">
              <div className="ctl"><div><b>{t('Freeze card')}</b><p className="muted small">{t('Blocks every payment instantly. Unfreeze any time.')}</p></div><Switch on={state.frozen} onChange={(v) => dispatch({ type: 'freeze', on: v })} label={t('Freeze card')} /></div>
              <div className="ctl"><div><b>{t('Online payments')}</b><p className="muted small">{t('Turn off when you are not shopping.')}</p></div><Switch on={state.online} onChange={(v) => dispatch({ type: 'online', on: v })} label={t('Online payments')} /></div>
              <LimitSlider state={state} dispatch={dispatch} />
            </div>
          </div>
          <div className="trypay">
            <span className="label">{t('Try a payment')}</span>
            <ul>
              {MERCHANTS.map((m) => (
                <li key={m.name}>
                  <button onClick={() => pay(m)}>
                    <Logo src={m.logo} size={40} />
                    <span className="tp-name"><b>{m.name}</b><span className="muted small">{t(m.note)}</span></span>
                    <span className="num tp-amt">{money(m.amount)}</span>
                    <Icon name="arrow" size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <p className={'tp-result' + (result ? (result.ok ? ' ok' : ' no') : '')} aria-live="polite">
              {result ? result.text : t('Pay {amount} to {merchant}', { amount: money(MERCHANTS[0].amount), merchant: MERCHANTS[0].name })}
            </p>
          </div>
        </section>

        <section className="activity" id="activity" aria-labelledby="act-h">
          <h2 id="act-h">{t('Recent activity')}</h2>
          <div className="tx-list">
          {groups.map(([label, items]) => (
            <div key={label} className="tx-group">
              <h3>{label}</h3>
              <ul>
                {items.map((x) => (
                  <li key={x.id} className={'tx ' + x.kind}>
                    <Logo src={x.logo} size={40} />
                    <span className="tx-main"><b>{x.merchant === 'Top up' ? t('Top up') : x.merchant === 'Exchange' ? t('Exchange') : x.merchant}</b><span className="muted small">{x.kind === 'declined' ? t('Declined') : t(x.note)}</span></span>
                    <span className="tx-amt num">{x.kind === 'declined' ? '—' : money(x.amount, x.currency, true)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          </div>
        </section>

        <footer className="foot">
          <span className="brand"><Mark size={18} />NEXUS</span>
          <p className="muted small">{t('A frontend demo for a portfolio. No real cards, wallets or payments.')}</p>
          <button className="text-btn" onClick={() => { dispatch({ type: 'reset' }); setResult(null); setReveal(false); }}>{t('Reset demo')}</button>
        </footer>
      </main>

      <nav className="tabbar" aria-label="App">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><Icon name="home" />{t('Home')}</button>
        <button onClick={() => go('controls')}><Icon name="card" />{t('Card')}</button>
        <button onClick={() => go('activity')}><Icon name="list" />{t('Activity')}</button>
      </nav>

      {sheet === 'topup' && <TopUpSheet state={state} dispatch={dispatch} onClose={() => setSheet(null)} />}
      {sheet === 'exchange' && <ExchangeSheet state={state} dispatch={dispatch} onClose={() => setSheet(null)} />}
      {sheet === 'details' && <DetailsSheet state={state} dispatch={dispatch} onClose={() => setSheet(null)} reveal={reveal} setReveal={setReveal} />}
    </>
  );
}
