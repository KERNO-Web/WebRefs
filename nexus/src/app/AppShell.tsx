import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { setLang, useI18n, type Lang } from '../i18n';
import { reducedMotion, takeHandoff, useApp } from '../ctx';
import { ASSETS, BASES, WALLETS, cardAvailable, rateOf, spentThisMonth, valueOf, type Asset, type Base, type Finish, type Wallet } from '../store';
import { TapCard, cardProps } from '../components/Card';
import { AssetMark, Icon, Mark } from '../components/Icon';
import { Private, Seg, Sheet, Switch, Toasts } from '../components/ui';
import {
  Analytics, Balance, CardDetails, ControlRow, Exchange, FINISH, FundSheet, LimitControl, RULE, Simulator, SmartSpend, TxDetailSheet, TxFilters, TxRow, WALLET_NAME, filterTx, type TxFilter,
} from '../components/widgets';

export type Tab = 'home' | 'card' | 'wallets' | 'activity' | 'settings';
export const TABS: Tab[] = ['home', 'card', 'wallets', 'activity', 'settings'];
const MOBILE_TABS: Tab[] = ['home', 'card', 'activity', 'settings'];
const TAB_ICON: Record<Tab, string> = { home: 'home', card: 'card', wallets: 'wallet', activity: 'list', settings: 'sliders' };
const TAB_LABEL: Record<Tab, string> = { home: 'Home', card: 'Card', wallets: 'Wallets', activity: 'Activity', settings: 'Settings' };

type SheetState = { kind: 'fund'; asset?: Asset } | { kind: 'exchange'; from?: Wallet } | { kind: 'pay' } | null;

export function AppShell({ tab, setTab, go }: { tab: Tab; setTab: (t: Tab) => void; go: (route: string) => void }) {
  const { t } = useI18n();
  const { state, dispatch } = useApp();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [tx, setTx] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => { window.scrollTo(0, 0); main.current?.focus({ preventScroll: true }); }, [tab]);
  const privacy = state.settings.privacy;
  const togglePrivacy = () => dispatch({ type: 'setting', key: 'privacy', on: !privacy });
  const nav = (list: Tab[]) => list.map((k) => (
    <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
      <Icon name={TAB_ICON[k]} /><span>{t(TAB_LABEL[k])}</span>
    </button>
  ));
  const open = { fund: (asset?: Asset) => setSheet({ kind: 'fund', asset }), exchange: (from?: Wallet) => setSheet({ kind: 'exchange', from }), pay: () => setSheet({ kind: 'pay' }), tx: setTx };

  return (
    <div className="app">
      <aside className="app-rail">
        <span className="brand"><Mark size={18} />TAPSHIFT</span>
        <nav aria-label={t('App')}>{nav(TABS)}</nav>
        <button className="btn ghost rail-pay" onClick={open.pay}><Icon name="contactless" size={18} /><span>{t('Test payment')}</span></button>
        <div className="rail-foot">
          <span className="rail-who">{state.path === 'demo' ? t('Demo account') : t('Your account')}</span>
          <button className="rail-exit" onClick={() => go('')}><Icon name="exit" size={18} /><span>{t('Back to site')}</span></button>
        </div>
      </aside>

      <header className="app-top">
        <button className="icon-btn" onClick={() => go('')} aria-label={t('Back to site')}><Icon name="back" /></button>
        <span className="brand"><Mark size={16} />TAPSHIFT</span>
        <button className="icon-btn" onClick={togglePrivacy} aria-pressed={privacy} aria-label={privacy ? t('Show balances') : t('Hide balances')}><Icon name={privacy ? 'eyeoff' : 'eye'} /></button>
        <button className="icon-btn accent" onClick={open.pay} aria-label={t('Test payment')}><Icon name="contactless" /></button>
      </header>

      <main className="app-main" ref={main} tabIndex={-1} aria-label={t(TAB_LABEL[tab])}>
        <div className="page-bar">
          <h1>{t(TAB_LABEL[tab])}</h1>
          <div className="page-tools">
            <button className="tool" onClick={togglePrivacy} aria-pressed={privacy}><Icon name={privacy ? 'eyeoff' : 'eye'} size={17} />{privacy ? t('Show balances') : t('Hide balances')}</button>
          </div>
        </div>
        {tab === 'home' && <Home open={open} setTab={setTab} />}
        {tab === 'card' && <CardTab pay={open.pay} />}
        {tab === 'wallets' && <Wallets open={open} />}
        {tab === 'activity' && <ActivityTab openTx={setTx} />}
        {tab === 'settings' && <SettingsTab go={go} />}
      </main>

      <nav className="app-tabbar" aria-label={t('App')}>{nav(MOBILE_TABS)}</nav>

      {sheet?.kind === 'fund' && <FundSheet asset={sheet.asset} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'exchange' && <Sheet title={t('Exchange')} onClose={() => setSheet(null)}><Exchange initialFrom={sheet.from} onDone={() => setSheet(null)} /></Sheet>}
      {sheet?.kind === 'pay' && <Sheet title={t('Test payment')} onClose={() => setSheet(null)}><Simulator /></Sheet>}
      {tx && <TxDetailSheet id={tx} onClose={() => setTx(null)} />}
      <Toasts />
    </div>
  );
}

type Open = { fund: (a?: Asset) => void; exchange: (w?: Wallet) => void; pay: () => void; tx: (id: string) => void };

/** The dashboard card flies in from wherever the visitor last saw it. */
function useHandoff() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const from = takeHandoff();
    const el = ref.current;
    if (!from || !el || reducedMotion()) return;
    const to = el.getBoundingClientRect();
    if (!to.width) return;
    el.animate(
      [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width})` }, { transform: 'none' }],
      { duration: 820, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    );
  }, []);
  return ref;
}

function Home({ open, setTab }: { open: Open; setTab: (t: Tab) => void }) {
  const { t, fiat, crypto } = useI18n();
  const { state, dispatch } = useApp();
  const card = state.card!;
  const fr = state.controls.frozen;
  const ref = useHandoff();
  const actions = [
    { id: 'fund', label: t('Fund'), icon: 'plus', run: () => open.fund() },
    { id: 'exchange', label: t('Exchange'), icon: 'exchange', run: () => open.exchange() },
    { id: 'pay', label: t('Test payment'), icon: 'contactless', run: open.pay, primary: true },
    { id: 'freeze', label: fr ? t('Unfreeze') : t('Freeze'), icon: 'snow', run: () => dispatch({ type: 'control', key: 'frozen', on: !fr }), on: fr },
  ];
  return (
    <div className="page home">
      <section className="home-hero">
        <div className="home-bal">
          <span className="label">{t('Total balance')}<i className={'state-dot sm' + (fr ? ' frozen' : '')}>{fr ? t('Frozen') : t('Active')}</i></span>
          <Balance className="home-big" />
          <dl className="home-sub">
            <div><dt>{t('Card can spend')}</dt><dd className="num"><Private>{fiat(cardAvailable(state), state.base)}</Private></dd></div>
            <div><dt>{t('Euro pocket')}</dt><dd className="num"><Private>{crypto(state.balances.EUR, 'EUR')}</Private></dd></div>
            <div><dt>{t('This month')}</dt><dd className="num">{fiat(spentThisMonth(state), state.base)}</dd></div>
          </dl>
          <button className="smart-chip" onClick={() => setTab('wallets')}><Icon name="route" size={15} /><span>Smart Spend · {t(RULE[state.rule].title)}</span><Icon name="arrow" size={14} /></button>
        </div>
        <TapCard ref={ref} {...cardProps(card)} frozen={fr} pose={[6, -9]} className="home-card" />
        <div className="actions">
          {actions.map((a) => (
            <button key={a.id} className={'act' + (a.on ? ' on' : '') + (a.primary ? ' primary' : '')} onClick={a.run} aria-pressed={a.id === 'freeze' ? fr : undefined}>
              <span className="act-ico"><Icon name={a.icon} size={18} /></span>{a.label}
            </button>
          ))}
        </div>
      </section>

      <div className="home-grid">
        <section className="panel" aria-labelledby="w-h">
          <div className="panel-bar"><h2 id="w-h" className="panel-h">{t('Wallets')}</h2><button className="text-btn" onClick={() => setTab('wallets')}>{t('All wallets')}</button></div>
          <ul className="assets">
            {WALLETS.map((w) => (
              <li key={w}>
                <AssetMark asset={w} size={36} />
                <span className="as-main"><b className="num"><Private>{crypto(state.balances[w], w)}</Private></b><span className="muted small">{t(WALLET_NAME[w])}</span></span>
                <span className="num as-val"><Private>{fiat(valueOf(state.balances[w], w, state.base), state.base)}</Private></span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="r-h">
          <div className="panel-bar"><h2 id="r-h" className="panel-h">{t('Recent activity')}</h2><button className="text-btn" onClick={() => setTab('activity')}>{t('See all')}</button></div>
          <ul className="tx-list compact">{state.tx.slice(0, 5).map((x) => <TxRow key={x.id} tx={x} onOpen={open.tx} />)}</ul>
          {state.tx.every((x) => x.kind !== 'purchase') && (
            <button className="hint" onClick={open.pay}><Icon name="contactless" size={18} /><span>{t('Your card is ready. Make a test payment.')}</span><Icon name="arrow" size={16} /></button>
          )}
        </section>
      </div>
    </div>
  );
}

function CardTab({ pay }: { pay: () => void }) {
  const { t } = useI18n();
  const { state, dispatch } = useApp();
  const card = state.card!;
  return (
    <div className="page cardtab">
      <div className="cardtab-grid">
        <div className="cardtab-obj">
          <TapCard {...cardProps(card)} frozen={state.controls.frozen} pose={[5, -6]} className="cardtab-card" />
          <div className="field">
            <span className="label">{t('Finish')}</span>
            <Seg value={card.finish} options={['graphite', 'titanium', 'ice'] as Finish[]} onChange={(f) => dispatch({ type: 'finish', finish: f })} label={t('Finish')}
              render={(f) => <><i className={'swatch f-' + f} />{t(FINISH[f].name)}</>} />
          </div>
          <button className="btn ghost wide" onClick={pay}><Icon name="contactless" size={18} />{t('Test a payment with these settings')}</button>
        </div>
        <div className="cardtab-ctl">
          <section className="panel" aria-labelledby="ctl-h">
            <h2 id="ctl-h" className="panel-h">{t('Controls')}</h2>
            <div className="ctl-list">
              <ControlRow k="frozen" />
              <ControlRow k="online" />
              <ControlRow k="contactless" />
              <ControlRow k="atm" />
              <ControlRow k="intl" />
              <LimitControl />
            </div>
          </section>
          <section className="panel" aria-labelledby="det-h">
            <h2 id="det-h" className="panel-h">{t('Card details')}</h2>
            <CardDetails />
          </section>
        </div>
      </div>
    </div>
  );
}

function Wallets({ open }: { open: Open }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state } = useApp();
  return (
    <div className="page wallets">
      <div className="wallets-top">
        <div className="wallets-total">
          <span className="label">{t('Total balance')}</span>
          <Balance className="wallets-big" />
          <span className="muted small">{t('Card spends USDT, USDC and ETH. The Euro pocket holds cash you exchanged.')}</span>
        </div>
      </div>
      <ul className="wallet-list">
        {WALLETS.map((w) => {
          const crypto_ = ASSETS.includes(w as Asset);
          return (
            <li key={w} className={'wallet-row w-' + w.toLowerCase()}>
              <AssetMark asset={w} size={44} />
              <span className="wr-main">
                <b className="num"><Private>{crypto(state.balances[w], w)}</Private></b>
                <span className="muted small">{t(WALLET_NAME[w])} · <span className="mono">{w === 'EUR' ? (state.base === 'EUR' ? t('Not used by the card') : rate('EUR', rateOf('EUR', state.base), state.base)) : rate(w, rateOf(w, state.base), state.base)}</span></span>
              </span>
              <span className="wr-val num"><Private>{fiat(valueOf(state.balances[w], w, state.base), state.base)}</Private></span>
              <span className="wr-act">
                {crypto_ && <button className="btn ghost sm" onClick={() => open.fund(w as Asset)}><Icon name="plus" size={16} />{t('Fund')}</button>}
                {w !== 'ETH' && <button className="btn ghost sm" onClick={() => open.exchange(w)}><Icon name="exchange" size={16} />{t('Exchange')}</button>}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="wallets-grid">
        <section className="panel" aria-labelledby="x-h">
          <h2 id="x-h" className="panel-h">{t('Exchange')}</h2>
          <Exchange />
        </section>
        <section className="panel" aria-labelledby="ss-h">
          <h2 id="ss-h" className="panel-h">Smart Spend</h2>
          <SmartSpend />
        </section>
      </div>
    </div>
  );
}

function ActivityTab({ openTx }: { openTx: (id: string) => void }) {
  const { t } = useI18n();
  const { state } = useApp();
  const [filter, setFilter] = useState<TxFilter>('all');
  const list = filterTx(state.tx, filter);
  return (
    <div className="page activity">
      <Analytics />
      <section className="panel" aria-labelledby="h-h">
        <div className="panel-bar"><h2 id="h-h" className="panel-h">{t('History')}</h2><span className="muted small">{t('{n} operations', { n: state.tx.length })}</span></div>
        <TxFilters value={filter} onChange={setFilter} />
        <ul className="tx-list full">
          {list.map((x) => <TxRow key={x.id} tx={x} onOpen={openTx} />)}
          {list.length === 0 && <li className="tx-empty muted">{t('Nothing here yet.')}</li>}
        </ul>
      </section>
    </div>
  );
}

function SettingsTab({ go }: { go: (r: string) => void }) {
  const { t, lang } = useI18n();
  const { state, dispatch, toast } = useApp();
  const [confirm, setConfirm] = useState(false);
  const s = state.settings;
  const row = (icon: string, title: string, desc: string, control: React.ReactNode) => (
    <div className="pref-row"><span className="ctl-ico"><Icon name={icon} size={18} /></span><span className="pref-txt"><b>{title}</b><span className="muted small">{desc}</span></span>{control}</div>
  );
  return (
    <div className="page settings">
      <section className="panel" aria-labelledby="p-h">
        <h2 id="p-h" className="panel-h">{t('Preferences')}</h2>
        <div className="pref">
          {row('globe', t('Language'), t('Interface and number formats.'),
            <Seg value={lang} options={['en', 'ru'] as Lang[]} onChange={setLang} label={t('Language')} render={(l) => (l === 'en' ? 'English' : 'Русский')} />)}
          {row('bolt', t('Base currency'), t('Prices, limits and balances are shown in it.'),
            <Seg value={state.base} options={BASES} onChange={(b: Base) => dispatch({ type: 'base', base: b })} label={t('Base currency')} />)}
        </div>
      </section>
      <section className="panel" aria-labelledby="sec-h">
        <h2 id="sec-h" className="panel-h">{t('Privacy & security')}</h2>
        <div className="pref">
          {row(s.privacy ? 'eyeoff' : 'eye', t('Hide balances'), t('Masks every balance until you show it again.'),
            <Switch on={s.privacy} onChange={(v) => dispatch({ type: 'setting', key: 'privacy', on: v })} label={t('Hide balances')} />)}
          {row('finger', t('Biometric lock'), t('Asks for a (simulated) scan before revealing card number or CVV.'),
            <Switch on={s.biometric} onChange={(v) => dispatch({ type: 'setting', key: 'biometric', on: v })} label={t('Biometric lock')} />)}
          {row('bell', t('Payment notifications'), t('A short alert after every test payment.'),
            <Switch on={s.notifications} onChange={(v) => { dispatch({ type: 'setting', key: 'notifications', on: v }); if (v) toast(t('Notifications on'), 'info'); }} label={t('Payment notifications')} />)}
        </div>
      </section>
      <section className="panel" aria-labelledby="ss2-h">
        <h2 id="ss2-h" className="panel-h">Smart Spend</h2>
        <SmartSpend compact />
      </section>
      <section className="panel" aria-labelledby="acc-h">
        <h2 id="acc-h" className="panel-h">{t('Account')}</h2>
        <div className="pref">
          {row('user', state.path === 'demo' ? t('Demo account') : t('Your account'), t('Try the other path any time. Each starts from its own clean state.'),
            <span className="pref-btns">
              <button className="btn ghost sm" onClick={() => { dispatch({ type: 'enter-demo' }); toast(t('Demo account loaded'), 'info'); go('app'); }}>{t('Load demo account')}</button>
              <button className="btn ghost sm" onClick={() => { dispatch({ type: 'start-fresh' }); go('start'); }}>{t('Start from zero')}</button>
            </span>)}
          {row('refund', t('Reset demo'), t('Clears everything and returns to the start.'),
            confirm ? (
              <span className="pref-btns">
                <button className="btn sm danger" onClick={() => { dispatch({ type: 'reset' }); go(''); }}>{t('Reset')}</button>
                <button className="btn sm ghost" onClick={() => setConfirm(false)}>{t('Cancel')}</button>
              </span>
            ) : <button className="btn ghost sm" onClick={() => setConfirm(true)}>{t('Reset demo')}</button>)}
        </div>
      </section>
    </div>
  );
}
