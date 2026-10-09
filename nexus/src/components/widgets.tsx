import { useEffect, useRef, useState } from 'react';
import { useI18n, type T } from '../i18n';
import { useApp } from '../ctx';
import {
  ASSETS, MERCHANTS, NETWORKS, RATE, SIMULATOR, available, cvvOf, debitFor, expiryOf, networkFee, pickSource, priority, refundable, spentThisMonth, valueOf,
  type Asset, type Auth, type Base, type CardKind, type Category, type Finish, type MerchantId, type Network, type Reason, type Rule, type Tx,
} from '../store';
import { AssetMark, CHANNEL_ICON, Icon, MerchantMark } from './Icon';
import { Seg, Sheet, StatusPill, Switch, useCount } from './ui';

// ---------- labels ----------

export const CATEGORY: Record<Category, string> = {
  coffee: 'Coffee', subscription: 'Subscription', shopping: 'Shopping', cash: 'Cash', transport: 'Transport', travel: 'Travel', groceries: 'Groceries', deposit: 'Top up',
};
export const CHANNEL: Record<Tx['channel'], string> = { contactless: 'Contactless', online: 'Online', atm: 'ATM withdrawal', deposit: 'Deposit' };
export const REASON: Record<Reason, string> = {
  frozen: 'Card is frozen',
  online: 'Online payments are off',
  contactless: 'Contactless is off',
  atm: 'ATM withdrawals are off',
  intl: 'International payments are off',
  limit: 'Over the monthly limit',
  funds: 'No balance covers this payment',
};
export const RULE: Record<Rule, { title: string; desc: string }> = {
  stable: { title: 'Stablecoins first', desc: 'Spends USDT or USDC before anything that moves in price.' },
  best: { title: 'Best available balance', desc: 'Picks the balance with the lowest conversion spread.' },
  manual: { title: 'Manual priority', desc: 'Your order. NEXUS falls through it until a balance covers the payment.' },
};
export const FINISH: Record<Finish, string> = { graphite: 'Graphite', titanium: 'Titanium', ice: 'Ice' };
export const KIND: Record<CardKind, string> = { multi: 'Multi-use', single: 'Single-use' };

export const merchantName = (t: T, tx: Pick<Tx, 'merchant' | 'asset'>) => (tx.merchant === 'deposit' ? t('Top up') : t(MERCHANTS[tx.merchant].name));
const categoryOf = (tx: Tx): Category => (tx.merchant === 'deposit' ? 'deposit' : MERCHANTS[tx.merchant].category);

// ---------- issue ----------

export interface Draft { finish: Finish; name: string; kind: CardKind; base: Base }

export function useDraft() {
  const { state } = useApp();
  const fromState = (): Draft => ({ finish: state.card.finish, name: state.card.name, kind: state.card.kind, base: state.base });
  const [draft, setDraft] = useState<Draft>(fromState);
  const dirty = draft.finish !== state.card.finish || draft.kind !== state.card.kind || draft.base !== state.base || draft.name.trim().toUpperCase() !== state.card.name;
  // follow the stored card when it changes elsewhere (demo app, reset)
  const key = `${state.card.number}|${state.card.finish}|${state.card.kind}|${state.base}|${state.card.name}`;
  const last = useRef(key);
  useEffect(() => { if (last.current !== key) { last.current = key; setDraft(fromState()); } });
  return { draft, setDraft, dirty };
}

export function IssueControls({ draft, setDraft, dirty, layout = 'bar' }: { draft: Draft; setDraft: (d: Draft) => void; dirty: boolean; layout?: 'bar' | 'stack' }) {
  const { t } = useI18n();
  const { state, issue } = useApp();
  const [phase, setPhase] = useState<'idle' | 'busy' | 'done'>('idle');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const create = () => {
    setPhase('busy');
    timers.current.push(window.setTimeout(() => { issue(draft); setPhase('done'); }, 900));
    timers.current.push(window.setTimeout(() => setPhase('idle'), 3600));
  };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setDraft({ ...draft, [k]: v }); if (phase === 'done') setPhase('idle'); };
  return (
    <div className={'issue-controls ' + layout}>
      <div className="ic-field">
        <span className="label">{t('Finish')}</span>
        <Seg className="finishes" value={draft.finish} options={['graphite', 'titanium', 'ice'] as Finish[]} onChange={(v) => set('finish', v)} label={t('Finish')}
          render={(f) => <><i className={'swatch f-' + f} />{t(FINISH[f])}</>} />
      </div>
      <label className="ic-field ic-name">
        <span className="label">{t('Name on card')}</span>
        <input value={draft.name} maxLength={22} onChange={(e) => set('name', e.target.value.replace(/[^\p{L} .'-]/gu, ''))} autoComplete="off" spellCheck={false} />
      </label>
      <div className="ic-field">
        <span className="label">{t('Base currency')}</span>
        <Seg value={draft.base} options={['EUR', 'USD'] as Base[]} onChange={(v) => set('base', v)} label={t('Base currency')} />
      </div>
      <div className="ic-field">
        <span className="label">{t('Card type')}</span>
        <Seg value={draft.kind} options={['multi', 'single'] as CardKind[]} onChange={(v) => set('kind', v)} label={t('Card type')} render={(k) => t(KIND[k])} />
      </div>
      <div className="ic-go">
        <button className="btn primary" onClick={create} disabled={phase === 'busy'}>
          {phase === 'busy' ? t('Issuing…') : phase === 'done' && !dirty ? <><Icon name="check" size={18} />{t('Active')} · {state.card.number.slice(-4)}</> : t('Create card')}
        </button>
        <span className="fine muted" aria-live="polite">
          {phase === 'done' && !dirty ? t('New number issued. Old one is closed.') : draft.kind === 'single' ? t('Single-use: the number changes after every approved purchase.') : dirty ? t('Preview only until you create it.') : t('Creating again issues a fresh number.')}
        </span>
      </div>
    </div>
  );
}

// ---------- fund ----------

export function useFund() {
  const { state, fund } = useApp();
  const [asset, setAssetRaw] = useState<Asset>('USDT');
  const [network, setNetwork] = useState<Network>('TRON');
  const [amount, setAmount] = useState('250');
  const [phase, setPhase] = useState<'form' | 'busy' | 'done'>('form');
  const [credited, setCredited] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const n = parseFloat(amount.replace(',', '.')) || 0;
  const fee = networkFee(asset, network);
  const credit = Math.max(0, n - fee);
  const have = state.wallet[asset];
  const over = n > have + 1e-9;
  const valid = n > 0 && credit > 0 && !over;
  const before = available(state);
  const after = available({ base: state.base, balances: { ...state.balances, [asset]: state.balances[asset] + credit } });
  const setAsset = (a: Asset) => {
    setAssetRaw(a);
    if (!NETWORKS[a].includes(network)) setNetwork(NETWORKS[a][0]);
    setAmount(a === 'ETH' ? '0.05' : '250');
    setPhase('form');
  };
  const submit = () => {
    if (!valid || phase === 'busy') return;
    setPhase('busy');
    timer.current = window.setTimeout(() => { fund(asset, network, n); setCredited(credit); setPhase('done'); }, 1200);
  };
  return { state, asset, setAsset, network, setNetwork, amount, setAmount: (v: string) => { setAmount(v.replace(/[^0-9.,]/g, '')); if (phase === 'done') setPhase('form'); }, n, fee, credit, have, over, valid, before, after, phase, setPhase, credited, submit };
}
export type FundApi = ReturnType<typeof useFund>;

export function FundFields({ f }: { f: FundApi }) {
  const { t, crypto } = useI18n();
  return (
    <>
      <div className="field">
        <span className="label">{t('Asset')}</span>
        <Seg value={f.asset} options={ASSETS} onChange={f.setAsset} label={t('Asset')} render={(a) => <><AssetMark asset={a} size={20} />{a}</>} />
      </div>
      <div className="field">
        <span className="label">{t('Network')}</span>
        <Seg value={f.network} options={NETWORKS[f.asset]} onChange={(v) => { f.setNetwork(v); f.setPhase('form'); }} label={t('Network')}
          render={(nw) => <>{nw}<small>{crypto(networkFee(f.asset, nw), f.asset).replace(/([.,]\d*?)0+(?= )/, '$1').replace(/[.,](?= )/, '')}</small></>} />
      </div>
      <label className="field">
        <span className="label">{t('Amount')}</span>
        <span className={'amount-input' + (f.over ? ' bad' : '')}>
          <input className="num" inputMode="decimal" value={f.amount} onChange={(e) => f.setAmount(e.target.value)} aria-describedby="fund-have" />
          <span>{f.asset}</span>
        </span>
        <span id="fund-have" className={'small ' + (f.over ? 'neg' : 'muted')}>
          {f.over ? t('More than your wallet holds') : `${t('In wallet')}: ${crypto(f.have, f.asset)}`}
        </span>
      </label>
      <div className="quick">
        {(f.asset === 'ETH' ? [0.02, 0.05, 0.1] : [100, 250, 500]).map((v) => (
          <button key={v} className={String(v) === f.amount ? 'on' : ''} onClick={() => f.setAmount(String(v))}>{v}</button>
        ))}
        <button onClick={() => f.setAmount(String(f.have))}>{t('Max')}</button>
      </div>
    </>
  );
}

export function FundSummary({ f }: { f: FundApi }) {
  const { t, fiat, crypto, rate } = useI18n();
  const base = f.state.base;
  return (
    <dl className="summary">
      <div><dt>{t('Rate')}</dt><dd className="num mono">{rate(f.asset, RATE[base][f.asset], base)}</dd></div>
      <div><dt>{t('Network fee')}</dt><dd className="num">{crypto(f.fee, f.asset)}</dd></div>
      <div><dt>{t('Lands on card')}</dt><dd className="num">{crypto(f.credit, f.asset)}</dd></div>
      <div className="strong"><dt>{t('Card balance after')}</dt><dd className="num">{fiat(f.after, base)}</dd></div>
    </dl>
  );
}

export function FundSheet({ onClose }: { onClose: () => void }) {
  const { t, crypto, fiat } = useI18n();
  const f = useFund();
  return (
    <Sheet title={t('Fund card')} onClose={onClose}>
      {f.phase === 'done' ? (
        <div className="done">
          <span className="done-mark"><Icon name="check" size={28} /></span>
          <p className="done-amt num">+{crypto(f.credited, f.asset)}</p>
          <p className="muted">{t('Card balance')} · {fiat(available(f.state), f.state.base)}</p>
          <button className="btn primary wide" onClick={onClose}>{t('Done')}</button>
        </div>
      ) : (
        <>
          <FundFields f={f} />
          <FundSummary f={f} />
          <button className="btn primary wide" disabled={!f.valid || f.phase === 'busy'} onClick={f.submit}>{f.phase === 'busy' ? t('Confirming on network…') : t('Fund card')}</button>
          <p className="fine muted">{t('Simulated. No real crypto moves.')}</p>
        </>
      )}
    </Sheet>
  );
}

// ---------- smart spend ----------

export function SmartSpend({ amounts }: { amounts?: number[] }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state, dispatch } = useApp();
  const base = state.base;
  const presets = amounts ?? (base === 'EUR' ? [8.4, 89, 250] : [8.9, 95, 270]);
  const [amt, setAmt] = useState(presets[1]);
  useEffect(() => { if (!presets.includes(amt)) setAmt(presets[1]); }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  const order = priority(state);
  const pick = pickSource(state, amt);
  const move = (a: Asset, d: -1 | 1) => {
    const o = [...state.order];
    const i = o.indexOf(a), j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    dispatch({ type: 'order', order: o });
  };
  return (
    <div className="smart">
      <div className="smart-rules" role="radiogroup" aria-label={t('Smart Spend rule')}>
        {(['stable', 'best', 'manual'] as Rule[]).map((r, i) => (
          <button key={r} role="radio" aria-checked={state.rule === r} className={'rule' + (state.rule === r ? ' on' : '')} onClick={() => dispatch({ type: 'rule', rule: r })}>
            <span className="rule-n mono">0{i + 1}</span>
            <span className="rule-txt"><b>{t(RULE[r].title)}</b><span>{t(RULE[r].desc)}</span></span>
            <span className="rule-dot" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="smart-stack">
        <div className="smart-head">
          <span className="label">{t('Balances, in the order NEXUS tries them')}</span>
        </div>
        <ol className="balances">
          {order.map((a, i) => {
            const v = valueOf(state.balances[a], a, base);
            const used = pick?.asset === a;
            const covers = state.balances[a] + 1e-9 >= debitFor(amt, a, base);
            return (
              <li key={a} className={(used ? 'used' : '') + (covers ? '' : ' short')}>
                <span className="b-pos mono">{i + 1}</span>
                <AssetMark asset={a} size={34} />
                <span className="b-main">
                  <b className="num">{crypto(state.balances[a], a)}</b>
                  <span className="muted small num">{fiat(v, base)} · {rate(a, RATE[base][a], base)}</span>
                </span>
                {state.rule === 'manual' ? (
                  <span className="b-move">
                    <button className="icon-btn sm" onClick={() => move(a, -1)} disabled={i === 0} aria-label={t('Move {asset} up', { asset: a })}><Icon name="up" size={16} /></button>
                    <button className="icon-btn sm" onClick={() => move(a, 1)} disabled={i === order.length - 1} aria-label={t('Move {asset} down', { asset: a })}><Icon name="down" size={16} /></button>
                  </span>
                ) : <span className="b-tag small">{used ? t('Used') : covers ? '' : t('Too low')}</span>}
              </li>
            );
          })}
        </ol>
        <div className="smart-preview">
          <span className="label">{t('Next payment')}</span>
          <div className="seg mini" role="radiogroup" aria-label={t('Next payment')}>
            {presets.map((p) => <button key={p} role="radio" aria-checked={amt === p} className={amt === p ? 'on' : ''} onClick={() => setAmt(p)}>{fiat(p, base)}</button>)}
          </div>
          <p className="smart-result" aria-live="polite">
            {pick
              ? <><span className="num">{t('Uses')} <b>{crypto(pick.crypto, pick.asset)}</b></span><span className="muted"> · {t(RULE[state.rule].title)}</span></>
              : <span className="neg">{t('No single balance covers {amount}', { amount: fiat(amt, base) })}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- controls ----------

export type ControlKey = 'frozen' | 'online' | 'contactless' | 'atm' | 'intl';
export const CONTROL: Record<ControlKey, { title: string; desc: string; icon: string }> = {
  frozen: { title: 'Freeze card', desc: 'Every payment declines until you unfreeze.', icon: 'snow' },
  online: { title: 'Online payments', desc: 'Shops, apps and subscriptions.', icon: 'online' },
  contactless: { title: 'Contactless', desc: 'Tap to pay with your phone.', icon: 'contactless' },
  atm: { title: 'ATM withdrawals', desc: 'Cash, with a flat €1.50 fee.', icon: 'atm' },
  intl: { title: 'International payments', desc: 'Merchants outside your home region.', icon: 'globe' },
};

export function ControlRow({ k }: { k: ControlKey }) {
  const { t, symbol } = useI18n();
  const { state, dispatch } = useApp();
  const on = state.controls[k];
  const c = CONTROL[k];
  return (
    <div className={'ctl k-' + k + (on ? ' is-on' : '')}>
      <span className="ctl-ico"><Icon name={c.icon} size={18} /></span>
      <span className="ctl-txt"><b>{t(c.title)}</b><span>{t(c.desc).replace('€', symbol(state.base))}</span></span>
      <Switch on={on} onChange={(v) => dispatch({ type: 'control', key: k, on: v })} label={t(c.title)} tone={k === 'frozen' ? 'ice' : undefined} />
    </div>
  );
}

export function LimitControl() {
  const { t, fiat } = useI18n();
  const { state, dispatch } = useApp();
  const spent = spentThisMonth(state);
  const lim = state.controls.limit;
  const p = Math.min(100, (spent / lim) * 100);
  return (
    <div className="limit">
      <div className="limit-top">
        <span className="ctl-ico"><Icon name="limit" size={18} /></span>
        <b>{t('Monthly limit')}</b>
        <b className="num limit-val">{fiat(lim, state.base, { whole: true })}</b>
      </div>
      <input type="range" min={250} max={5000} step={50} value={lim} onChange={(e) => dispatch({ type: 'limit', value: +e.target.value })} aria-label={t('Monthly limit')}
        aria-valuetext={fiat(lim, state.base, { whole: true })} style={{ ['--p' as string]: `${((lim - 250) / 4750) * 100}%` }} />
      <div className="limit-used" aria-hidden="true"><i style={{ width: p + '%' }} className={p > 85 ? 'hot' : ''} /></div>
      <span className="muted small num">{t('{spent} of {limit} spent this month', { spent: fiat(spent, state.base), limit: fiat(lim, state.base, { whole: true }) })}</span>
    </div>
  );
}

// ---------- purchase simulator ----------

export function Receipt({ auth, compact }: { auth: Auth; compact?: boolean }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state } = useApp();
  const base = state.base;
  const m = auth.merchant;
  return (
    <div className={'receipt ' + (auth.ok ? 'ok' : 'no') + (compact ? ' compact' : '')} role="status">
      <div className="r-head">
        <MerchantMark id={m.id} size={34} />
        <span className="r-m"><b>{t(m.name)}</b><span className="muted small">{t(CHANNEL[m.channel])} · {t(m.city)}</span></span>
        <StatusPill status={auth.ok ? 'paid' : 'declined'} />
      </div>
      <p className="r-fiat num">{fiat(auth.fiat, base)}</p>
      {auth.ok && auth.asset && auth.crypto ? (
        <dl className="r-lines">
          <div><dt>{t('Paid from')}</dt><dd className="num">{crypto(-auth.crypto, auth.asset)}</dd></div>
          <div><dt>{t('Rate')}</dt><dd className="num mono">{rate(auth.asset, auth.rate!, base)}</dd></div>
          <div><dt>{t('NEXUS fee')}</dt><dd className="num">{fiat(auth.fee, base)}</dd></div>
          <div><dt>{t('Available now')}</dt><dd className="num">{fiat(available(state), base)}</dd></div>
        </dl>
      ) : (
        <p className="r-reason">{t(REASON[auth.reason!])}</p>
      )}
    </div>
  );
}

export function Simulator({ onResult, grid = 'wide' }: { onResult?: (a: Auth) => void; grid?: 'wide' | 'list' }) {
  const { t, fiat } = useI18n();
  const { state, pay } = useApp();
  const [last, setLast] = useState<{ auth: Auth; n: number } | null>(null);
  const n = useRef(0);
  const run = (id: MerchantId) => { const auth = pay(id); n.current++; setLast({ auth, n: n.current }); onResult?.(auth); };
  return (
    <div className={'sim ' + grid}>
      <ul className="sim-list">
        {SIMULATOR.map((id) => {
          const m = MERCHANTS[id];
          return (
            <li key={id}>
              <button onClick={() => run(id)} className={last?.auth.merchant.id === id ? (last.auth.ok ? 'last ok' : 'last no') : ''}>
                <MerchantMark id={id} size={36} />
                <span className="sim-m"><b>{t(m.name)}</b><span><Icon name={CHANNEL_ICON[m.channel]} size={13} />{t(CHANNEL[m.channel])}{m.intl ? ' · ' + t('Abroad') : ''}</span></span>
                <span className="sim-amt num">{fiat(m.price[state.base], state.base)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="sim-out" aria-live="polite">
        {last ? <Receipt key={last.n} auth={last.auth} /> : <p className="sim-hint muted">{t('Pick a purchase. The card answers with its current settings.')}</p>}
      </div>
    </div>
  );
}

// ---------- transactions ----------

export function TxRow({ tx, onOpen }: { tx: Tx; onOpen: (id: string) => void }) {
  const { t, fiat, crypto, time, day } = useI18n();
  const dep = tx.kind === 'deposit';
  return (
    <li className={'tx st-' + tx.status}>
      <button onClick={() => onOpen(tx.id)} aria-label={`${merchantName(t, tx)}, ${fiat(tx.fiat, tx.base)}, ${t(tx.status.toUpperCase())}`}>
        <MerchantMark id={tx.merchant} size={40} />
        <span className="tx-m">
          <b>{merchantName(t, tx)}{dep && tx.asset ? ` · ${tx.asset}` : ''}</b>
          <span className="muted small">{t(CATEGORY[categoryOf(tx)])}<span className="tx-ch"> · {dep ? tx.network : t(CHANNEL[tx.channel])}</span></span>
        </span>
        <span className="tx-src num small">
          {tx.asset && tx.crypto ? crypto(dep || tx.status === 'refunded' ? tx.crypto : -tx.crypto, tx.asset, { sign: dep }) : tx.reason ? t(REASON[tx.reason]) : '—'}
        </span>
        <span className="tx-amt num">{dep ? fiat(tx.fiat, tx.base, { sign: true }) : fiat(-tx.fiat, tx.base)}</span>
        <span className="tx-st"><StatusPill status={tx.status} /></span>
        <span className="tx-time num small muted"><span className="tx-day">{day(tx.at)}, </span>{time(tx.at)}</span>
      </button>
    </li>
  );
}

export type TxFilter = 'all' | 'paid' | 'declined' | 'refunded' | 'deposits';
export function filterTx(tx: Tx[], f: TxFilter) {
  if (f === 'all') return tx;
  if (f === 'deposits') return tx.filter((x) => x.kind === 'deposit');
  return tx.filter((x) => x.status === f);
}

export function TxFilters({ value, onChange }: { value: TxFilter; onChange: (f: TxFilter) => void }) {
  const { t } = useI18n();
  const L: Record<TxFilter, string> = { all: 'All', paid: 'Paid', declined: 'Declined', refunded: 'Refunded', deposits: 'Top ups' };
  return <Seg className="filters" value={value} options={['all', 'paid', 'declined', 'refunded', 'deposits'] as TxFilter[]} onChange={onChange} label={t('Filter')} render={(f) => t(L[f])} />;
}

export function TxDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { t, fiat, crypto, rate, dateTime } = useI18n();
  const { state, refund } = useApp();
  const tx = state.tx.find((x) => x.id === id);
  const [phase, setPhase] = useState<'idle' | 'busy'>('idle');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!tx) return null;
  const dep = tx.kind === 'deposit';
  const status = phase === 'busy' ? 'processing' : tx.status;
  const doRefund = () => { setPhase('busy'); timer.current = window.setTimeout(() => { refund(tx.id); setPhase('idle'); }, 1500); };
  const rows: [string, string, string?][] = [
    [t('Date'), dateTime(tx.at)],
    [t('Payment type'), dep ? `${t('Deposit')} · ${tx.network}` : t(CHANNEL[tx.channel])],
  ];
  if (tx.asset && tx.crypto) rows.push([dep ? t('Credited') : t('Crypto debit'), crypto(dep ? tx.crypto : -tx.crypto, tx.asset, { sign: dep }), 'num']);
  if (tx.asset && tx.rate) rows.push([t('Rate'), rate(tx.asset, tx.rate, tx.base), 'num mono']);
  if (!dep) rows.push([t('NEXUS fee'), fiat(tx.fee, tx.base), 'num']);
  if (tx.rule) rows.push([t('Smart Spend'), t(RULE[tx.rule].title)]);
  if (tx.reason) rows.push([t('Reason'), t(REASON[tx.reason])]);
  if (tx.refundedAt) rows.push([t('Refunded'), dateTime(tx.refundedAt)]);
  rows.push([t('Card'), `•••• ${tx.last4}`, 'num mono']);
  rows.push([t('Transaction ID'), tx.id, 'mono']);
  return (
    <Sheet title={t('Transaction')} onClose={onClose}>
      <div className={'txd st-' + status}>
        <div className="txd-head">
          <MerchantMark id={tx.merchant} size={52} />
          <div>
            <b>{merchantName(t, tx)}</b>
            <span className="muted small">{t(CATEGORY[categoryOf(tx)])}{tx.merchant !== 'deposit' ? ' · ' + t(MERCHANTS[tx.merchant].city) : ''}</span>
          </div>
        </div>
        <p className="txd-amt num">{dep ? fiat(tx.fiat, tx.base, { sign: true }) : fiat(-tx.fiat, tx.base)}</p>
        <StatusPill status={status} />
        <dl className="txd-rows">
          {rows.map(([k, v, cls]) => <div key={k}><dt>{k}</dt><dd className={cls}>{v}</dd></div>)}
        </dl>
        {(refundable(tx) || phase === 'busy') && (
          <button className="btn ghost wide" onClick={doRefund} disabled={phase === 'busy'}>
            <Icon name="refund" size={18} />{phase === 'busy' ? t('Processing refund…') : t('Simulate refund')}
          </button>
        )}
        {tx.status === 'refunded' && tx.asset && tx.crypto && <p className="fine ok-text">{t('{amount} returned to your {asset} balance.', { amount: crypto(tx.crypto, tx.asset), asset: tx.asset })}</p>}
      </div>
    </Sheet>
  );
}

// ---------- card details ----------

export function CardDetails() {
  const { t } = useI18n();
  const { state } = useApp();
  const [reveal, setReveal] = useState(false);
  const [cvv, setCvv] = useState(false);
  const [copied, setCopied] = useState(false);
  const num = state.card.number;
  const shown = reveal ? num.replace(/(\d{4})(?=\d)/g, '$1 ') : `•••• •••• •••• ${num.slice(-4)}`;
  const copy = () => { navigator.clipboard?.writeText(num).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <div className="det">
      <div className="det-row wide">
        <span className="label">{t('Card number')}</span>
        <span className="det-val num mono">{shown}</span>
        <span className="det-actions">
          <button className="text-btn" onClick={() => setReveal(!reveal)} aria-pressed={reveal}>{reveal ? t('Hide') : t('Show')}</button>
          <button className="text-btn" onClick={copy}>{copied ? t('Copied') : t('Copy')}</button>
        </span>
      </div>
      <div className="det-row"><span className="label">{t('Expiry')}</span><span className="det-val num mono">{expiryOf(state.card.issuedAt)}</span></div>
      <div className="det-row"><span className="label">CVV</span><span className="det-val num mono">{cvv ? cvvOf(num) : '•••'}</span>
        <span className="det-actions"><button className="text-btn" onClick={() => setCvv(!cvv)} aria-pressed={cvv}>{cvv ? t('Hide') : t('Show')}</button></span></div>
      <div className="det-row"><span className="label">{t('Name on card')}</span><span className="det-val">{state.card.name}</span></div>
      <div className="det-row"><span className="label">{t('Card type')}</span><span className="det-val">{t(KIND[state.card.kind])} · {t(FINISH[state.card.finish])}</span></div>
    </div>
  );
}

/** Big balance figure: fraction digits set smaller, rolls on change. */
export function Balance({ className = '' }: { className?: string }) {
  const { locale } = useI18n();
  const { state } = useApp();
  const v = useCount(available(state));
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: state.base }).formatToParts(v);
  return (
    <span className={'balance num ' + className}>
      {parts.map((p, i) => (p.type === 'fraction' || p.type === 'decimal' ? <small key={i}>{p.value}</small> : p.type === 'currency' ? <span key={i} className="cur">{p.value}</span> : <span key={i}>{p.value}</span>))}
    </span>
  );
}
