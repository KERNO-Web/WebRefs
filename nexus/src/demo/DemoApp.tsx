import { useEffect, useRef, useState } from 'react';
import { setLang, useI18n, type Lang } from '../i18n';
import { useApp } from '../ctx';
import { ASSETS, RATE, spentThisMonth, valueOf, type Base } from '../store';
import { NexusCard } from '../components/Card';
import { AssetMark, Icon, Mark } from '../components/Icon';
import { Seg, Sheet } from '../components/ui';
import {
  Balance, CardDetails, ControlRow, FundSheet, IssueControls, LimitControl, Simulator, SmartSpend, TxDetailSheet, TxFilters, TxRow, filterTx, useDraft, type TxFilter,
} from '../components/widgets';

export type Tab = 'home' | 'card' | 'activity' | 'settings';
export const TABS: Tab[] = ['home', 'card', 'activity', 'settings'];
const TAB_ICON: Record<Tab, string> = { home: 'home', card: 'card', activity: 'list', settings: 'sliders' };
const TAB_LABEL: Record<Tab, string> = { home: 'Home', card: 'Card', activity: 'Activity', settings: 'Settings' };

type SheetName = 'fund' | 'pay' | 'issue' | null;

export function DemoApp({ tab, setTab, onExit }: { tab: Tab; setTab: (t: Tab) => void; onExit: () => void }) {
  const { t } = useI18n();
  const [sheet, setSheet] = useState<SheetName>(null);
  const [tx, setTx] = useState<string | null>(null);
  const main = useRef<HTMLElement>(null);
  useEffect(() => { window.scrollTo(0, 0); main.current?.focus({ preventScroll: true }); }, [tab]);

  return (
    <div className="demo">
      <aside className="demo-rail">
        <span className="brand"><Mark size={18} />NEXUS<small className="mono">{t('DEMO')}</small></span>
        <nav aria-label={t('App')}>
          {TABS.map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              <Icon name={TAB_ICON[k]} />{t(TAB_LABEL[k])}
            </button>
          ))}
        </nav>
        <button className="rail-exit" onClick={onExit}><Icon name="back" size={18} />{t('Back to site')}</button>
      </aside>

      <header className="demo-top">
        <button className="icon-btn" onClick={onExit} aria-label={t('Back to site')}><Icon name="back" /></button>
        <span className="brand"><Mark size={16} />NEXUS</span>
        <span className="demo-badge mono">{t('DEMO')}</span>
      </header>

      <main className="demo-main" ref={main} tabIndex={-1} aria-label={t(TAB_LABEL[tab])}>
        {tab === 'home' && <Home open={setSheet} openTx={setTx} toActivity={() => setTab('activity')} />}
        {tab === 'card' && <CardTab open={setSheet} />}
        {tab === 'activity' && <ActivityTab openTx={setTx} />}
        {tab === 'settings' && <SettingsTab />}
      </main>

      <nav className="demo-tabbar" aria-label={t('App')}>
        {TABS.map((k) => (
          <button key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
            <Icon name={TAB_ICON[k]} />{t(TAB_LABEL[k])}
          </button>
        ))}
      </nav>

      {sheet === 'fund' && <FundSheet onClose={() => setSheet(null)} />}
      {sheet === 'pay' && <Sheet title={t('Test a purchase')} onClose={() => setSheet(null)}><Simulator grid="list" /></Sheet>}
      {sheet === 'issue' && <IssueSheet onClose={() => setSheet(null)} />}
      {tx && <TxDetailSheet id={tx} onClose={() => setTx(null)} />}
    </div>
  );
}

function PageHead({ title, sub }: { title: string; sub?: string }) {
  return <div className="page-head"><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>;
}

function Home({ open, openTx, toActivity }: { open: (s: SheetName) => void; openTx: (id: string) => void; toActivity: () => void }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state, dispatch } = useApp();
  const c = state.card;
  const fr = state.controls.frozen;
  const spent = spentThisMonth(state);
  const actions = [
    { id: 'fund', label: t('Fund'), icon: 'plus', run: () => open('fund') },
    { id: 'pay', label: t('Pay'), icon: 'contactless', run: () => open('pay') },
    { id: 'freeze', label: fr ? t('Unfreeze') : t('Freeze'), icon: 'snow', run: () => dispatch({ type: 'control', key: 'frozen', on: !fr }), on: fr },
    { id: 'new', label: t('New card'), icon: 'card', run: () => open('issue') },
  ];
  return (
    <div className="page home">
      <div className="home-hero">
        <div className="home-bal">
          <span className="label">{t('Available to spend')}<i className={'state-dot sm' + (fr ? ' frozen' : '')}>{fr ? t('Frozen') : t('Active')}</i></span>
          <Balance className="home-big" />
          <span className="muted small num">{t('{spent} spent this month', { spent: fiat(spent, state.base) })}</span>
        </div>
        <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={fr} pose={[6, -8]} className="home-card" />
        <div className="actions">
          {actions.map((a) => (
            <button key={a.id} className={'act' + (a.on ? ' on' : '')} onClick={a.run} aria-pressed={a.id === 'freeze' ? fr : undefined}>
              <span className="act-ico"><Icon name={a.icon} /></span>{a.label}
            </button>
          ))}
        </div>
      </div>

      <section className="panel" aria-labelledby="bal-h">
        <h2 id="bal-h" className="panel-h">{t('Balances')}</h2>
        <ul className="assets">
          {ASSETS.map((a) => (
            <li key={a}>
              <AssetMark asset={a} size={36} />
              <span className="as-main"><b className="num">{crypto(state.balances[a], a)}</b><span className="muted small num mono">{rate(a, RATE[state.base][a], state.base)}</span></span>
              <span className="num as-val">{fiat(valueOf(state.balances[a], a, state.base), state.base)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="recent-h">
        <div className="panel-bar"><h2 id="recent-h" className="panel-h">{t('Recent activity')}</h2><button className="text-btn" onClick={toActivity}>{t('See all')}</button></div>
        <ul className="tx-list compact">{state.tx.slice(0, 5).map((x) => <TxRow key={x.id} tx={x} onOpen={openTx} />)}</ul>
      </section>
    </div>
  );
}

function CardTab({ open }: { open: (s: SheetName) => void }) {
  const { t } = useI18n();
  const { state } = useApp();
  const c = state.card;
  return (
    <div className="page cardtab">
      <PageHead title={t('Card')} />
      <div className="cardtab-grid">
        <div className="cardtab-obj">
          <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={state.controls.frozen} pose={[5, -6]} />
          <button className="btn ghost wide" onClick={() => open('issue')}><Icon name="card" size={18} />{t('Issue a new card')}</button>
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

function ActivityTab({ openTx }: { openTx: (id: string) => void }) {
  const { t } = useI18n();
  const { state } = useApp();
  const [filter, setFilter] = useState<TxFilter>('all');
  const list = filterTx(state.tx, filter);
  return (
    <div className="page">
      <PageHead title={t('Activity')} sub={t('{n} operations', { n: state.tx.length })} />
      <TxFilters value={filter} onChange={setFilter} />
      <ul className="tx-list app">
        {list.map((x) => <TxRow key={x.id} tx={x} onOpen={openTx} />)}
        {list.length === 0 && <li className="tx-empty muted">{t('Nothing here yet.')}</li>}
      </ul>
    </div>
  );
}

function SettingsTab() {
  const { t, lang } = useI18n();
  const { state, dispatch } = useApp();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="page settings">
      <PageHead title={t('Settings')} />
      <section className="panel" aria-labelledby="ss-h">
        <h2 id="ss-h" className="panel-h">Smart Spend</h2>
        <SmartSpend />
      </section>
      <section className="panel" aria-labelledby="pref-h">
        <h2 id="pref-h" className="panel-h">{t('Preferences')}</h2>
        <div className="pref">
          <div className="pref-row"><span><b>{t('Base currency')}</b><span className="muted small">{t('Prices, limits and balances are shown in it.')}</span></span>
            <Seg value={state.base} options={['EUR', 'USD'] as Base[]} onChange={(b) => dispatch({ type: 'base', base: b })} label={t('Base currency')} /></div>
          <div className="pref-row"><span><b>{t('Language')}</b></span>
            <Seg value={lang} options={['en', 'ru'] as Lang[]} onChange={setLang} label={t('Language')} render={(l) => (l === 'en' ? 'English' : 'Русский')} /></div>
          <div className="pref-row"><span><b>{t('Reset demo')}</b><span className="muted small">{t('Restores the original balances, card and history.')}</span></span>
            {confirm ? (
              <span className="confirm">
                <button className="btn sm danger" onClick={() => { dispatch({ type: 'reset' }); setConfirm(false); }}>{t('Reset')}</button>
                <button className="btn sm ghost" onClick={() => setConfirm(false)}>{t('Cancel')}</button>
              </span>
            ) : <button className="btn sm ghost" onClick={() => setConfirm(true)}>{t('Reset demo')}</button>}
          </div>
        </div>
      </section>
    </div>
  );
}

function IssueSheet({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { state } = useApp();
  const d = useDraft();
  return (
    <Sheet title={t('Issue a new card')} onClose={onClose} wide>
      <NexusCard finish={d.draft.finish} number={state.card.number} name={d.draft.name.toUpperCase()} kind={d.draft.kind} issuedAt={state.card.issuedAt} draft={d.dirty} stage={false} className="sheet-card" />
      <IssueControls {...d} layout="stack" />
    </Sheet>
  );
}
