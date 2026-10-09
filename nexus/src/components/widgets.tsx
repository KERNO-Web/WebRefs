import { useEffect, useRef, useState } from 'react';
import { useI18n, type T } from '../i18n';
import { useApp } from '../ctx';
import {
  ASSETS, EXCHANGEABLE, MERCHANTS, NETWORKS, SIMULATOR, analytics, cardAvailable, cvvOf, debitFor, exchangeOut, exchangeRate, expiryOf, networkFee, pickSource, priority, rateOf,
  refundable, spentThisMonth, totalBalance, valueOf,
  type Asset, type Auth, type Category, type Finish, type MerchantId, type Network, type Reason, type Rule, type Stable, type Tx, type Wallet,
} from '../store';
import { AssetMark, CHANNEL_ICON, Icon, MerchantMark } from './Icon';
import { Private, Seg, Sheet, StatusPill, Switch, useCount } from './ui';

// ---------- labels ----------

export const CATEGORY: Record<Category, string> = {
  coffee: 'Coffee', subscription: 'Subscription', shopping: 'Shopping', cash: 'Cash', transport: 'Transport', travel: 'Travel', groceries: 'Groceries', deposit: 'Top up', exchange: 'Exchange',
};
export const CHANNEL: Record<Tx['channel'], string> = { contactless: 'Contactless', online: 'Online', atm: 'ATM withdrawal', deposit: 'Deposit', exchange: 'Exchange' };
export const REASON: Record<Reason, string> = {
  frozen: 'Card is frozen',
  online: 'Online payments are off',
  contactless: 'Contactless is off',
  atm: 'ATM withdrawals are off',
  intl: 'International payments are off',
  limit: 'Monthly limit reached',
  funds: 'No balance covers this payment',
};
export const RULE: Record<Rule, { title: string; desc: string }> = {
  stable: { title: 'Stablecoins first', desc: 'Spends USDT or USDC before anything that moves in price.' },
  best: { title: 'Best available balance', desc: 'Picks the balance with the lowest conversion spread.' },
  manual: { title: 'Manual priority', desc: 'Your order. TapShift falls through it until a balance covers the payment.' },
};
export const FINISH: Record<Finish, { name: string; desc: string }> = {
  graphite: { name: 'Graphite', desc: 'Dark brushed steel' },
  titanium: { name: 'Titanium', desc: 'Light bead-blasted metal' },
  ice: { name: 'Ice', desc: 'Cold tinted alloy' },
};
export const WALLET_NAME: Record<Wallet, string> = { USDT: 'Tether', USDC: 'USD Coin', ETH: 'Ether', EUR: 'Euro pocket' };
const STATUS_WORD: Record<Tx['status'], string> = { paid: 'Paid', declined: 'Declined', refunded: 'Refunded', received: 'Received', done: 'Completed' };

const categoryOf = (tx: Tx): Category => (tx.merchant === 'deposit' ? 'deposit' : tx.merchant === 'exchange' ? 'exchange' : MERCHANTS[tx.merchant].category);
export const txTitle = (t: T, tx: Tx) =>
  tx.kind === 'deposit' ? `${t('Top up')} · ${tx.asset}` : tx.kind === 'exchange' ? `${tx.asset} → ${tx.toAsset}` : t(MERCHANTS[tx.merchant as MerchantId].name);

// ---------- balances ----------

/** Big balance figure: fraction digits set smaller, rolls on change, respects privacy. */
export function Balance({ value, className = '' }: { value?: number; className?: string }) {
  const { locale } = useI18n();
  const { state } = useApp();
  const v = useCount(value ?? totalBalance(state));
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency: state.base }).formatToParts(v);
  return (
    <Private className={'balance num ' + className}>
      {parts.map((p, i) => (p.type === 'fraction' || p.type === 'decimal' ? <small key={i}>{p.value}</small> : p.type === 'currency' ? <span key={i} className="cur">{p.value}</span> : <span key={i}>{p.value}</span>))}
    </Private>
  );
}

// ---------- fund ----------

const trimFee = (s: string) => s.replace(/([.,]\d*?)0+(?= )/, '$1').replace(/[.,](?= )/, '');

export function FundSheet({ onClose, asset: initial = 'USDT' }: { onClose: () => void; asset?: Asset }) {
  const { t, crypto, fiat } = useI18n();
  const { state, fund, toast } = useApp();
  const [asset, setAssetRaw] = useState<Asset>(initial);
  const [network, setNetwork] = useState<Network>(NETWORKS[initial][0]);
  const [amount, setAmountRaw] = useState(initial === 'ETH' ? '0.05' : '250');
  const [phase, setPhase] = useState<'form' | 'busy' | 'done'>('form');
  const [result, setResult] = useState({ before: 0, credited: 0 });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const n = parseFloat(amount.replace(',', '.')) || 0;
  const fee = networkFee(asset, network);
  const credit = Math.max(0, n - fee);
  const have = state.wallet[asset];
  const over = n > have + 1e-9;
  const valid = n > 0 && credit > 0 && !over;
  const cur = state.balances[asset];
  const rolled = useCount(cur, 900);
  const setAsset = (a: Asset) => { setAssetRaw(a); if (!NETWORKS[a].includes(network)) setNetwork(NETWORKS[a][0]); setAmountRaw(a === 'ETH' ? '0.05' : '250'); setPhase('form'); };
  const setAmount = (v: string) => { setAmountRaw(v.replace(/[^0-9.,]/g, '')); if (phase === 'done') setPhase('form'); };
  const submit = () => {
    if (!valid || phase === 'busy') return;
    setPhase('busy');
    timer.current = window.setTimeout(() => {
      setResult({ before: cur, credited: credit });
      fund(asset, network, n);
      setPhase('done');
      toast(`${t('Received')} ${crypto(credit, asset, { sign: true })}`, 'ok');
    }, 1200);
  };
  const done = phase === 'done';
  return (
    <Sheet title={t('Fund')} onClose={onClose}>
      <div className={'fund-flow ph-' + phase}>
        <div className="ff-row"><span className="label">{t('Current balance')}</span><b className="num">{crypto(done ? result.before : cur, asset)}</b></div>
        <div className="ff-rail" aria-hidden="true"><i /></div>
        <div className="ff-row"><span className="label">{t('Added')}</span><b className="num ff-add">{crypto(done ? result.credited : credit, asset, { sign: true })}</b></div>
        <div className="ff-row big">
          <span className="label">{t('Updated balance')}</span>
          <b className="num">{crypto(done ? rolled : cur + credit, asset)}</b>
          <span className="muted small num">≈ {fiat(valueOf(done ? cur : cur + credit, asset, state.base), state.base)}</span>
        </div>
      </div>
      {done ? (
        <>
          <button className="btn primary wide" onClick={onClose}>{t('Done')}</button>
          <button className="btn ghost wide" onClick={() => setPhase('form')}>{t('Fund again')}</button>
        </>
      ) : (
        <>
          <div className="field">
            <span className="label">{t('Asset')}</span>
            <Seg value={asset} options={ASSETS} onChange={setAsset} label={t('Asset')} render={(a) => <><AssetMark asset={a} size={20} />{a}</>} />
          </div>
          <div className="field">
            <span className="label">{t('Network')}</span>
            <Seg value={network} options={NETWORKS[asset]} onChange={setNetwork} label={t('Network')} render={(nw) => <>{nw}<small>{trimFee(crypto(networkFee(asset, nw), asset))}</small></>} />
          </div>
          <label className="field">
            <span className="label">{t('Amount')}</span>
            <span className={'amount-input' + (over ? ' bad' : '')}>
              <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-describedby="fund-have" />
              <span>{asset}</span>
            </span>
            <span id="fund-have" className={'small ' + (over ? 'neg' : 'muted')}>
              {over ? t('More than your wallet holds') : `${t('External wallet')}: ${crypto(have, asset)}`}
            </span>
          </label>
          <div className="quick">
            {(asset === 'ETH' ? [0.02, 0.05, 0.1] : [100, 250, 500]).map((v) => (
              <button key={v} className={String(v) === amount ? 'on' : ''} onClick={() => setAmount(String(v))}>{v}</button>
            ))}
            <button onClick={() => setAmount(String(have))}>{t('Max')}</button>
          </div>
          <button className="btn primary wide" disabled={!valid || phase === 'busy'} onClick={submit}>
            {phase === 'busy' ? t('Confirming on network…') : t('Fund {amount}', { amount: crypto(n, asset) })}
          </button>
          <p className="fine muted">{t('Simulated. No real crypto moves.')}</p>
        </>
      )}
    </Sheet>
  );
}

// ---------- exchange ----------

export function Exchange({ onDone, initialFrom = 'USDT' }: { onDone?: () => void; initialFrom?: Wallet }) {
  const { t, crypto, pair, fiat } = useI18n();
  const { state, exchange, toast } = useApp();
  const [from, setFrom] = useState<Wallet>(initialFrom);
  const [to, setTo] = useState<Wallet>(initialFrom === 'EUR' ? 'USDT' : 'EUR');
  const [amount, setAmount] = useState('100');
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const n = parseFloat(amount.replace(',', '.')) || 0;
  const out = exchangeOut(from, to, n);
  const have = state.balances[from];
  const short = n > have + 1e-9;
  const ok = n > 0 && !short && out > 0;
  const pickFrom = (w: Wallet) => { setFrom(w); if (w === to) setTo(EXCHANGEABLE.find((x) => x !== w)!); };
  const pickTo = (w: Wallet) => { setTo(w); if (w === from) setFrom(EXCHANGEABLE.find((x) => x !== w)!); };
  const flip = () => { setFrom(to); setTo(from); if (out) setAmount(String(out)); };
  const go = () => {
    if (!ok) return;
    setBusy(true);
    timer.current = window.setTimeout(() => {
      exchange(from, to, n);
      setBusy(false);
      toast(`${t('Exchanged')} ${crypto(n, from)} → ${crypto(out, to)}`, 'ok');
      onDone?.();
    }, 700);
  };
  return (
    <div className="xch">
      <div className="xch-side">
        <div className="xch-top"><span className="label">{t('You send')}</span>
          <Seg className="mini" value={from} options={EXCHANGEABLE} onChange={pickFrom} label={t('You send')} /></div>
        <span className={'amount-input' + (short ? ' bad' : '')}>
          <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label={t('You send')} />
          <span>{from}</span>
        </span>
        <span className="small muted num xch-have">{t('Available')}: <Private>{crypto(have, from)}</Private>
          <button className="text-btn sm" onClick={() => setAmount(String(have))}>{t('Max')}</button></span>
      </div>
      <button className="xch-flip" onClick={flip} aria-label={t('Swap direction')}><Icon name="exchange" size={18} /></button>
      <div className="xch-side">
        <div className="xch-top"><span className="label">{t('You receive')}</span>
          <Seg className="mini" value={to} options={EXCHANGEABLE} onChange={pickTo} label={t('You receive')} /></div>
        <p className="xch-out num">{crypto(out, to)}</p>
        <span className="small muted num">≈ {fiat(valueOf(out, to, state.base), state.base)}</span>
      </div>
      <dl className="summary xch-sum">
        <div><dt>{t('Rate')}</dt><dd className="num mono">{pair(from, to, exchangeRate(from, to))}</dd></div>
        <div><dt>{t('Fee')}</dt><dd className="num">{fiat(0, state.base)}</dd></div>
      </dl>
      <button className="btn primary wide" disabled={!ok || busy} onClick={go}>
        {busy ? t('Exchanging…') : short ? t('Not enough {asset}', { asset: from }) : t('Exchange')}
      </button>
    </div>
  );
}

// ---------- smart spend ----------

export function SmartSpend({ compact }: { compact?: boolean }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state, dispatch } = useApp();
  const base = state.base;
  const presets = [MERCHANTS.coffee.price[base], MERCHANTS.nike.price[base], { EUR: 250, USD: 270, GBP: 215 }[base]];
  const [amt, setAmt] = useState(presets[0]);
  useEffect(() => { setAmt(presets[0]); }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
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
    <div className={'smart' + (compact ? ' compact' : '')}>
      <div className="smart-rules" role="radiogroup" aria-label={t('Smart Spend rule')}>
        {(['stable', 'best', 'manual'] as Rule[]).map((r) => (
          <button key={r} role="radio" aria-checked={state.rule === r} className={'rule' + (state.rule === r ? ' on' : '')} onClick={() => dispatch({ type: 'rule', rule: r })}>
            <span className="rule-txt"><b>{t(RULE[r].title)}</b><span>{t(RULE[r].desc)}</span></span>
            <span className="rule-dot" aria-hidden="true" />
          </button>
        ))}
      </div>
      {!compact && (
        <div className="smart-stack">
          <div className="smart-head">
            <span className="label">{t('Order TapShift tries')}</span>
            {state.rule === 'stable' && (
              <Seg className="mini" value={state.primary} options={['USDT', 'USDC'] as Stable[]} onChange={(p) => dispatch({ type: 'primary', primary: p })} label={t('First stablecoin')} />
            )}
          </div>
          <ol className="balances">
            {order.map((a, i) => {
              const used = pick?.asset === a;
              const covers = state.balances[a] + 1e-9 >= debitFor(amt, a, base);
              return (
                <li key={a} className={(used ? 'used' : '') + (covers ? '' : ' short')}>
                  <span className="b-pos mono">{i + 1}</span>
                  <AssetMark asset={a} size={32} />
                  <span className="b-main">
                    <b className="num"><Private>{crypto(state.balances[a], a)}</Private></b>
                    <span className="muted small num mono">{rate(a, rateOf(a, base), base)}</span>
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
      )}
    </div>
  );
}

// ---------- controls ----------

export type ControlKey = 'frozen' | 'online' | 'contactless' | 'atm' | 'intl';
export const CONTROL: Record<ControlKey, { title: string; desc: string; icon: string }> = {
  frozen: { title: 'Freeze card', desc: 'Every payment declines until you unfreeze.', icon: 'snow' },
  online: { title: 'Online payments', desc: 'Shops, apps and subscriptions.', icon: 'online' },
  contactless: { title: 'Contactless', desc: 'Tap to pay with your phone.', icon: 'contactless' },
  atm: { title: 'ATM withdrawals', desc: 'Cash, with a flat {fee} fee.', icon: 'atm' },
  intl: { title: 'International payments', desc: 'Merchants outside your home region.', icon: 'globe' },
};

export function ControlRow({ k }: { k: ControlKey }) {
  const { t, fiat } = useI18n();
  const { state, dispatch } = useApp();
  const on = state.controls[k];
  const c = CONTROL[k];
  return (
    <div className={'ctl k-' + k + (on ? ' is-on' : '')}>
      <span className="ctl-ico"><Icon name={c.icon} size={18} /></span>
      <span className="ctl-txt"><b>{t(c.title)}</b><span>{t(c.desc, { fee: fiat({ EUR: 1.5, USD: 1.5, GBP: 1.25 }[state.base], state.base) })}</span></span>
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

export function Receipt({ auth }: { auth: Auth }) {
  const { t, fiat, crypto, rate } = useI18n();
  const { state } = useApp();
  const base = state.base;
  const m = auth.merchant;
  return (
    <div className={'receipt ' + (auth.ok ? 'ok' : 'no')}>
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
          <div><dt>{t('Fee')}</dt><dd className="num">{fiat(auth.fee, base)}</dd></div>
          <div><dt>{t('Smart Spend')}</dt><dd>{t(RULE[state.rule].title)}</dd></div>
          <div><dt>{t('Card balance after')}</dt><dd className="num"><Private>{fiat(cardAvailable(state), base)}</Private></dd></div>
        </dl>
      ) : (
        <p className="r-reason">{t(REASON[auth.reason!])}</p>
      )}
    </div>
  );
}

export function Simulator() {
  const { t, fiat } = useI18n();
  const { state, pay, toast } = useApp();
  const [last, setLast] = useState<{ auth: Auth; n: number } | null>(null);
  const n = useRef(0);
  const run = (id: MerchantId) => {
    const auth = pay(id);
    n.current++;
    setLast({ auth, n: n.current });
    toast(auth.ok ? `${t(auth.merchant.name)} · ${fiat(auth.fiat, state.base)} · ${t('Paid')}` : `${t(auth.merchant.name)} · ${t(REASON[auth.reason!])}`, auth.ok ? 'ok' : 'no', false);
  };
  return (
    <div className="sim">
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

type Fmt = ReturnType<typeof useI18n>;
function txAmount(tx: Tx, f: Pick<Fmt, 'fiat' | 'crypto'>) {
  if (tx.kind === 'deposit') return f.fiat(tx.fiat, tx.base, { sign: true });
  if (tx.kind === 'exchange') return f.crypto(tx.toAmount ?? 0, tx.toAsset!, { sign: true });
  if (tx.status === 'refunded') return f.fiat(tx.fiat, tx.base, { sign: true });
  return f.fiat(-tx.fiat - tx.fee, tx.base);
}

export function TxRow({ tx, onOpen }: { tx: Tx; onOpen: (id: string) => void }) {
  const f = useI18n();
  const { t, crypto, time, day } = f;
  const src = tx.kind === 'deposit' && tx.asset && tx.crypto ? `${tx.network ?? t('Demo funds')} · ${crypto(tx.crypto, tx.asset)}`
    : tx.kind === 'exchange' && tx.asset ? crypto(-(tx.crypto ?? 0), tx.asset)
    : tx.asset && tx.crypto ? crypto(tx.status === 'refunded' ? tx.crypto : -tx.crypto, tx.asset, { sign: tx.status === 'refunded' })
    : tx.reason ? t(REASON[tx.reason]) : '—';
  return (
    <li className={'tx st-' + tx.status + ' k-' + tx.kind}>
      <button onClick={() => onOpen(tx.id)}>
        <MerchantMark id={tx.merchant} size={40} />
        <span className="tx-m">
          <b>{txTitle(t, tx)}</b>
          <span className="muted small">{t(CATEGORY[categoryOf(tx)])} · {day(tx.at)}, {time(tx.at)}</span>
        </span>
        <span className="tx-src num small">{src}</span>
        <span className="tx-amt num">{txAmount(tx, f)}</span>
        <span className="tx-st"><StatusPill status={tx.status} /></span>
      </button>
    </li>
  );
}

export type TxFilter = 'all' | 'paid' | 'declined' | 'refunded' | 'moves';
export function filterTx(tx: Tx[], f: TxFilter) {
  if (f === 'all') return tx;
  if (f === 'moves') return tx.filter((x) => x.kind !== 'purchase');
  return tx.filter((x) => x.status === f);
}

export function TxFilters({ value, onChange }: { value: TxFilter; onChange: (f: TxFilter) => void }) {
  const { t } = useI18n();
  const L: Record<TxFilter, string> = { all: 'All', paid: 'Paid', declined: 'Declined', refunded: 'Refunded', moves: 'Top ups & exchanges' };
  return <Seg className="filters" value={value} options={['all', 'paid', 'declined', 'refunded', 'moves'] as TxFilter[]} onChange={onChange} label={t('Filter')} render={(x) => t(L[x])} />;
}

const REFUND_STEPS = ['Refund requested', 'Processing', 'Refunded'];

export function TxDetailSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const f = useI18n();
  const { t, fiat, crypto, rate, pair, dateTime } = f;
  const { state, refund, toast } = useApp();
  const tx = state.tx.find((x) => x.id === id);
  const [step, setStep] = useState(-1);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  if (!tx) return null;
  const busy = step >= 0 && step < 2;
  const status = busy ? 'processing' : tx.status;
  const doRefund = () => {
    setStep(0);
    timers.current.push(window.setTimeout(() => setStep(1), 750));
    timers.current.push(window.setTimeout(() => {
      refund(tx.id);
      setStep(2);
      if (tx.asset && tx.crypto) toast(t('{amount} returned to your {asset} balance.', { amount: crypto(tx.crypto, tx.asset), asset: tx.asset }), 'ok');
    }, 1950));
  };
  const rows: [string, string, string?][] = [[t('Date'), dateTime(tx.at)], [t('Status'), t(busy ? 'Processing' : STATUS_WORD[tx.status])]];
  if (tx.kind === 'purchase') {
    rows.push([t('Payment type'), t(CHANNEL[tx.channel])]);
    if (tx.asset && tx.crypto) {
      rows.push([t('Source asset'), tx.asset]);
      rows.push([t('Crypto debit'), crypto(-tx.crypto, tx.asset), 'num']);
      rows.push([t('Rate'), rate(tx.asset, tx.rate!, tx.base), 'num mono']);
    }
    rows.push([t('Fee'), fiat(tx.fee, tx.base), 'num']);
    if (tx.rule) rows.push([t('Smart Spend'), t(RULE[tx.rule].title)]);
    if (tx.reason) rows.push([t('Reason'), t(REASON[tx.reason])]);
    if (tx.refundedAt) rows.push([t('Refunded'), dateTime(tx.refundedAt)]);
  } else if (tx.kind === 'deposit' && tx.asset && tx.crypto) {
    rows.push([t('Payment type'), `${t('Deposit')} · ${tx.network ?? t('Demo funds')}`]);
    rows.push([t('Credited'), crypto(tx.crypto, tx.asset, { sign: true }), 'num']);
    rows.push([t('Rate'), rate(tx.asset, tx.rate!, tx.base), 'num mono']);
  } else if (tx.kind === 'exchange' && tx.asset && tx.toAsset) {
    rows.push([t('You send'), crypto(-(tx.crypto ?? 0), tx.asset), 'num']);
    rows.push([t('You receive'), crypto(tx.toAmount ?? 0, tx.toAsset, { sign: true }), 'num']);
    rows.push([t('Rate'), pair(tx.asset, tx.toAsset, tx.rate!), 'num mono']);
    rows.push([t('Fee'), fiat(0, tx.base), 'num']);
  }
  rows.push([t('Card'), `•••• ${tx.last4}`, 'num mono']);
  rows.push([t('Transaction ID'), tx.id, 'mono']);
  return (
    <Sheet title={t('Transaction')} onClose={onClose}>
      <div className={'txd st-' + status}>
        <div className="txd-head">
          <MerchantMark id={tx.merchant} size={52} />
          <div>
            <b>{txTitle(t, tx)}</b>
            <span className="muted small">{t(CATEGORY[categoryOf(tx)])}{tx.kind === 'purchase' ? ' · ' + t(MERCHANTS[tx.merchant as MerchantId].city) : ''}</span>
          </div>
        </div>
        <p className="txd-amt num">{txAmount(tx, f)}</p>
        <StatusPill status={status} />
        {step >= 0 && (
          <ol className="refund-steps" aria-label={t('Refund')}>
            {REFUND_STEPS.map((s, i) => <li key={s} className={i < step || step === 2 ? 'done' : i === step ? 'now' : ''}><i />{t(s)}</li>)}
          </ol>
        )}
        <dl className="txd-rows">
          {rows.map(([k, v, cls]) => <div key={k}><dt>{k}</dt><dd className={cls}>{v}</dd></div>)}
        </dl>
        {(refundable(tx) || busy) && (
          <button className="btn ghost wide" onClick={doRefund} disabled={busy}>
            <Icon name="refund" size={18} />{busy ? t('Processing refund…') : t('Simulate refund')}
          </button>
        )}
      </div>
    </Sheet>
  );
}

// ---------- card details ----------

export function CardDetails() {
  const { t } = useI18n();
  const { state, toast } = useApp();
  const card = state.card!;
  const [reveal, setReveal] = useState({ num: false, cvv: false });
  const [scan, setScan] = useState<'num' | 'cvv' | null>(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const num = card.number;
  const exp = expiryOf(card.issuedAt);
  // with biometric lock on, revealing asks for a (simulated) scan first
  const toggle = (k: 'num' | 'cvv') => {
    if (reveal[k] || !state.settings.biometric) { setReveal((r) => ({ ...r, [k]: !r[k] })); return; }
    setScan(k);
    timer.current = window.setTimeout(() => { setScan(null); setReveal((r) => ({ ...r, [k]: true })); }, 1100);
  };
  const copy = (text: string, what: string) => { navigator.clipboard?.writeText(text).catch(() => {}); toast(t('{what} copied', { what }), 'info'); };
  const revealBtn = (k: 'num' | 'cvv') => (
    <button className="text-btn" onClick={() => toggle(k)} aria-pressed={reveal[k]} disabled={scan !== null}>
      {scan === k ? <><Icon name="finger" size={16} />{t('Confirming…')}</> : <><Icon name={reveal[k] ? 'eyeoff' : 'eye'} size={15} />{reveal[k] ? t('Hide') : t('Reveal')}</>}
    </button>
  );
  return (
    <div className="det">
      <div className="det-row wide">
        <span className="label">{t('Card number')}</span>
        <span className={'det-val num mono' + (reveal.num ? ' shown' : '')}>{reveal.num ? num.replace(/(\d{4})(?=\d)/g, '$1 ') : `•••• •••• •••• ${num.slice(-4)}`}</span>
        <span className="det-actions">{revealBtn('num')}<button className="text-btn" onClick={() => copy(num, t('Card number'))}><Icon name="copy" size={15} />{t('Copy')}</button></span>
      </div>
      <div className="det-row">
        <span className="label">{t('Expiry')}</span>
        <span className="det-val num mono">{exp}</span>
        <span className="det-actions"><button className="text-btn" onClick={() => copy(exp, t('Expiry'))}><Icon name="copy" size={15} />{t('Copy')}</button></span>
      </div>
      <div className="det-row">
        <span className="label">CVV</span>
        <span className={'det-val num mono' + (reveal.cvv ? ' shown' : '')}>{reveal.cvv ? cvvOf(num) : '•••'}</span>
        <span className="det-actions">{revealBtn('cvv')}</span>
      </div>
      <div className="det-row wide"><span className="label">{t('Cardholder')}</span><span className="det-val">{card.name}</span></div>
    </div>
  );
}

// ---------- analytics ----------

export function Analytics() {
  const { t, fiat, day } = useI18n();
  const { state } = useApp();
  const a = analytics(state);
  const max = Math.max(1, ...a.days.map((d) => d.value));
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? a.days.length - 1;
  const tick = Math.max(50, Math.ceil(max / 50) * 50);
  return (
    <section className="analytics" aria-label={t('Spending')}>
      <dl className="kpis">
        <div><dt>{t('Spent · 30 days')}</dt><dd className="num">{fiat(a.spent, state.base)}</dd></div>
        <div><dt>{t('Top category')}</dt><dd>{a.top ? t(CATEGORY[a.top.category]) : '—'}{a.top && <small className="num">{fiat(a.top.value, state.base)}</small>}</dd></div>
        <div><dt>{t('Converted from crypto')}</dt><dd className="num">{fiat(a.converted, state.base)}</dd></div>
        <div><dt>{t('Payments')}</dt><dd className="num">{a.count}</dd></div>
      </dl>
      <div className="chart">
        <div className="chart-head">
          <span className="label">{t('Daily spend · 30 days')}</span>
          <span className="chart-read num" aria-live="polite">{day(a.days[shown].start)} · <b>{fiat(a.days[shown].value, state.base)}</b></span>
        </div>
        {a.count === 0 ? <p className="chart-empty muted">{t('No spending yet. Try a test payment.')}</p> : (
          <div className="bars" onPointerLeave={() => setHover(null)}>
            <span className="bars-tick num" aria-hidden="true">{fiat(tick, state.base, { whole: true })}</span>
            {a.days.map((d, i) => (
              <button
                key={d.start}
                className={'bar' + (i === shown ? ' on' : '')}
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${day(d.start)}: ${fiat(d.value, state.base)}`}
              >
                <i style={{ height: `${(d.value / tick) * 100}%` }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
