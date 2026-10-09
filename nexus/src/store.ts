import { useEffect, useReducer } from 'react';

// ---------- model ----------

export type Asset = 'USDT' | 'USDC' | 'ETH';
/** Everything the account holds: three crypto assets the card spends from, plus a EUR pocket. */
export type Wallet = Asset | 'EUR';
export type Stable = 'USDT' | 'USDC';
export type Base = 'EUR' | 'USD' | 'GBP';
export type Finish = 'graphite' | 'titanium' | 'ice';
export type Rule = 'stable' | 'best' | 'manual';
export type Channel = 'contactless' | 'online' | 'atm';
export type Network = 'TRON' | 'Ethereum' | 'Solana';
export type Category = 'coffee' | 'subscription' | 'shopping' | 'cash' | 'transport' | 'travel' | 'groceries' | 'deposit' | 'exchange';
export type Reason = 'frozen' | 'online' | 'contactless' | 'atm' | 'intl' | 'limit' | 'funds';
export type MerchantId = 'coffee' | 'spotify' | 'nike' | 'atm' | 'taxi' | 'tokyo' | 'books' | 'market';
export type Path = 'demo' | 'fresh';

export interface CardState {
  number: string;
  finish: Finish;
  name: string;
  issuedAt: number;
}

export interface Controls {
  frozen: boolean;
  online: boolean;
  contactless: boolean;
  atm: boolean;
  intl: boolean;
  limit: number; // monthly, in base currency
}

export interface Settings {
  privacy: boolean;
  notifications: boolean;
  biometric: boolean;
}

export interface Tx {
  id: string;
  kind: 'purchase' | 'deposit' | 'exchange';
  merchant: MerchantId | 'deposit' | 'exchange';
  channel: Channel | 'deposit' | 'exchange';
  status: 'paid' | 'declined' | 'refunded' | 'received' | 'done';
  fiat: number; // amount in `base`
  base: Base;
  fee: number;
  asset?: Wallet; // source: debited asset, deposited asset, or exchanged-from asset
  crypto?: number; // amount of `asset`
  rate?: number; // 1 asset = rate base (purchases, deposits) or 1 asset = rate toAsset (exchange)
  toAsset?: Wallet;
  toAmount?: number;
  rule?: Rule;
  reason?: Reason;
  network?: Network;
  last4: string;
  at: number;
  refundedAt?: number;
}

export interface State {
  v: 3;
  path: Path | null;
  base: Base;
  card: CardState | null;
  balances: Record<Wallet, number>;
  wallet: Record<Asset, number>; // the simulated outside wallet funding comes from
  controls: Controls;
  rule: Rule;
  primary: Stable;
  order: Asset[];
  settings: Settings;
  tx: Tx[];
  seq: number;
}

// ---------- reference data (simulated, fixed) ----------

export const ASSETS: Asset[] = ['USDT', 'USDC', 'ETH'];
export const WALLETS: Wallet[] = ['USDT', 'USDC', 'ETH', 'EUR'];
export const EXCHANGEABLE: Wallet[] = ['USDT', 'USDC', 'EUR'];
export const BASES: Base[] = ['EUR', 'USD', 'GBP'];
export const DECIMALS: Record<Wallet, number> = { USDT: 2, USDC: 2, ETH: 6, EUR: 2 };

/** 1 EUR in each base currency. */
export const FX: Record<Base, number> = { EUR: 1, USD: 1.0851, GBP: 0.8566 };
/** 1 unit in EUR, spread already inside. */
const EUR_RATE: Record<Wallet, number> = { USDT: 0.921, USDC: 0.922, ETH: 2236.4, EUR: 1 };
export const rateOf = (w: Wallet, base: Base) => Math.round(EUR_RATE[w] * FX[base] * 1e6) / 1e6;
/** Conversion spread vs mid-market. Best available picks the lowest one that covers the payment. */
export const SPREAD: Record<Asset, number> = { USDT: 0.0012, USDC: 0.0008, ETH: 0.0045 };

export const NETWORKS: Record<Asset, Network[]> = { USDT: ['TRON', 'Ethereum', 'Solana'], USDC: ['Solana', 'Ethereum'], ETH: ['Ethereum'] };
/** Network fee, in units of the asset sent. */
export const NETWORK_FEE: Record<Asset, Partial<Record<Network, number>>> = {
  USDT: { TRON: 1, Ethereum: 2.4, Solana: 0.05 },
  USDC: { Solana: 0.05, Ethereum: 2.4 },
  ETH: { Ethereum: 0.0008 },
};
export const ATM_FEE: Record<Base, number> = { EUR: 1.5, USD: 1.5, GBP: 1.25 };

export interface Merchant {
  id: MerchantId;
  name: string;
  category: Category;
  channel: Channel;
  city: string;
  intl: boolean;
  price: Record<Base, number>;
  mark: string;
}

export const MERCHANTS: Record<MerchantId, Merchant> = {
  coffee: { id: 'coffee', name: 'Coffee Corner', category: 'coffee', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 8.4, USD: 8.9, GBP: 7.2 }, mark: 'Cc' },
  spotify: { id: 'spotify', name: 'Spotify', category: 'subscription', channel: 'online', city: 'Stockholm', intl: false, price: { EUR: 14.99, USD: 15.99, GBP: 11.99 }, mark: 'Sp' },
  nike: { id: 'nike', name: 'Nike', category: 'shopping', channel: 'online', city: 'Amsterdam', intl: false, price: { EUR: 89, USD: 95, GBP: 76 }, mark: 'Nk' },
  taxi: { id: 'taxi', name: 'Taxi', category: 'transport', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 21.5, USD: 23, GBP: 18.5 }, mark: 'Tx' },
  atm: { id: 'atm', name: 'ATM', category: 'cash', channel: 'atm', city: 'Berlin', intl: false, price: { EUR: 100, USD: 100, GBP: 100 }, mark: 'At' },
  tokyo: { id: 'tokyo', name: 'Tokyo Metro', category: 'travel', channel: 'contactless', city: 'Tokyo', intl: true, price: { EUR: 12.6, USD: 13.4, GBP: 10.8 }, mark: 'Tm' },
  books: { id: 'books', name: 'Paper & Co', category: 'shopping', channel: 'online', city: 'Berlin', intl: false, price: { EUR: 32, USD: 35, GBP: 27.5 }, mark: 'Pc' },
  market: { id: 'market', name: 'Corner Market', category: 'groceries', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 36.2, USD: 39, GBP: 31 }, mark: 'Cm' },
};
export const SIMULATOR: MerchantId[] = ['coffee', 'spotify', 'nike', 'taxi', 'atm', 'tokyo'];

// ---------- math ----------

const r2 = (n: number) => Math.round(n * 100) / 100;
export const roundTo = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
const ceilTo = (n: number, d: number) => Math.ceil(n * 10 ** d - 1e-7) / 10 ** d;
const floorTo = (n: number, d: number) => Math.floor(n * 10 ** d + 1e-7) / 10 ** d;

/** Card issuers round the debit up to the smallest unit. */
export const debitFor = (fiat: number, asset: Asset, base: Base) => ceilTo(fiat / rateOf(asset, base), DECIMALS[asset]);
export const valueOf = (amount: number, w: Wallet, base: Base) => amount * rateOf(w, base);
export const toBase = (n: number, from: Base, to: Base) => (from === to ? n : (n / FX[from]) * FX[to]);
export const networkFee = (asset: Asset, network: Network) => NETWORK_FEE[asset][network] ?? 0;

const sumValue = (s: Pick<State, 'balances' | 'base'>, ws: Wallet[]) => Math.floor(ws.reduce((a, k) => a + valueOf(s.balances[k], k, s.base), 0) * 100 + 1e-6) / 100;
/** What the card can spend: the crypto balances. */
export const cardAvailable = (s: Pick<State, 'balances' | 'base'>) => sumValue(s, ASSETS);
/** Everything held, EUR pocket included. */
export const totalBalance = (s: Pick<State, 'balances' | 'base'>) => sumValue(s, WALLETS);

export const exchangeRate = (from: Wallet, to: Wallet) => EUR_RATE[from] / EUR_RATE[to];
export const exchangeOut = (from: Wallet, to: Wallet, amount: number) => floorTo(amount * exchangeRate(from, to), DECIMALS[to]);

const monthStart = (now: number) => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
export function spentThisMonth(s: State, now = Date.now()) {
  const start = monthStart(now);
  return r2(s.tx.filter((t) => t.kind === 'purchase' && t.status === 'paid' && t.at >= start).reduce((a, t) => a + toBase(t.fiat, t.base, s.base), 0));
}

/** The order TapShift tries balances in for the active Smart Spend rule. */
export function priority(s: Pick<State, 'rule' | 'order' | 'primary'>): Asset[] {
  if (s.rule === 'manual') return s.order;
  if (s.rule === 'best') return [...ASSETS].sort((a, b) => SPREAD[a] - SPREAD[b]);
  return [s.primary, s.primary === 'USDT' ? 'USDC' : 'USDT', 'ETH'];
}

export function pickSource(s: Pick<State, 'rule' | 'order' | 'primary' | 'balances' | 'base'>, total: number): { asset: Asset; crypto: number } | null {
  for (const asset of priority(s)) {
    const crypto = debitFor(total, asset, s.base);
    if (s.balances[asset] + 1e-9 >= crypto) return { asset, crypto };
  }
  return null;
}

export interface Auth {
  ok: boolean;
  reason?: Reason;
  merchant: Merchant;
  fiat: number;
  fee: number;
  asset?: Asset;
  crypto?: number;
  rate?: number;
}

/** Runs a simulated authorization against the current card state. */
export function authorize(s: State, id: MerchantId): Auth {
  const m = MERCHANTS[id];
  const fiat = m.price[s.base];
  const fee = m.channel === 'atm' ? ATM_FEE[s.base] : 0;
  const c = s.controls;
  const base = { merchant: m, fiat, fee };
  if (c.frozen) return { ...base, ok: false, reason: 'frozen' };
  if (m.channel === 'online' && !c.online) return { ...base, ok: false, reason: 'online' };
  if (m.channel === 'contactless' && !c.contactless) return { ...base, ok: false, reason: 'contactless' };
  if (m.channel === 'atm' && !c.atm) return { ...base, ok: false, reason: 'atm' };
  if (m.intl && !c.intl) return { ...base, ok: false, reason: 'intl' };
  if (spentThisMonth(s) + fiat > c.limit + 1e-9) return { ...base, ok: false, reason: 'limit' };
  const src = pickSource(s, fiat + fee);
  if (!src) return { ...base, ok: false, reason: 'funds' };
  return { ...base, ok: true, asset: src.asset, crypto: src.crypto, rate: rateOf(src.asset, s.base) };
}

// ---------- analytics ----------

const D = 86400000;
export function analytics(s: State, now = Date.now()) {
  const from = now - 30 * D;
  const paid = s.tx.filter((t) => t.kind === 'purchase' && t.status === 'paid' && t.at >= from);
  const spent = r2(paid.reduce((a, t) => a + toBase(t.fiat, t.base, s.base), 0));
  const byCat = new Map<Category, number>();
  paid.forEach((t) => { const c = MERCHANTS[t.merchant as MerchantId].category; byCat.set(c, (byCat.get(c) ?? 0) + toBase(t.fiat, t.base, s.base)); });
  const top = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
  const converted = r2(
    paid.reduce((a, t) => a + toBase(t.fiat + t.fee, t.base, s.base), 0) +
    s.tx.filter((t) => t.kind === 'exchange' && t.at >= from && t.asset !== 'EUR').reduce((a, t) => a + toBase(t.fiat, t.base, s.base), 0),
  );
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const start = today.getTime() - (29 - i) * D;
    const v = paid.filter((t) => t.at >= start && t.at < start + D).reduce((a, t) => a + toBase(t.fiat, t.base, s.base), 0);
    return { start, value: r2(v) };
  });
  return { spent, top: top ? { category: top[0], value: r2(top[1]) } : null, converted, count: paid.length, days };
}

// ---------- deterministic ids & card numbers ----------

const hash = (n: number) => {
  let h = Math.imul(n ^ 0x5bd1e995, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return h >>> 0;
};
const hex = (n: number) => hash(n).toString(16).toUpperCase().padStart(8, '0');
export const txId = (seq: number) => `TS-${hex(seq).slice(0, 4)}-${hex(seq + 7919).slice(0, 4)}`;

const luhn = (digits: string) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = +digits[digits.length - 1 - i];
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
};
export function cardNumber(seq: number) {
  const body = '431987' + String(hash(seq * 31 + 3)).padStart(10, '0').slice(0, 9);
  return body + luhn(body);
}
export const last4 = (n: string) => n.slice(-4);
export const cvvOf = (n: string) => String((hash(+n.slice(-6)) % 900) + 100);
export function expiryOf(issuedAt: number) {
  const d = new Date(issuedAt);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String((d.getFullYear() + 3) % 100).padStart(2, '0')}`;
}
/** The card shown before anyone has one: the landing showcase. */
export const SHOWCASE_CARD: CardState = { number: '4319872051634821', finish: 'graphite', name: 'ALEX MORGAN', issuedAt: Date.UTC(2026, 8, 1) };

// ---------- seeds ----------

const H = 3600000;
const EXTERNAL_WALLET: Record<Asset, number> = { USDT: 1250, USDC: 640, ETH: 0.25 };
const CONTROLS: Controls = { frozen: false, online: true, contactless: true, atm: false, intl: true, limit: 1500 };
const SETTINGS: Settings = { privacy: false, notifications: true, biometric: false };
const ZERO: Record<Wallet, number> = { USDT: 0, USDC: 0, ETH: 0, EUR: 0 };

function initial(settings: Settings = SETTINGS): State {
  return {
    v: 3, path: null, base: 'EUR', card: null, balances: { ...ZERO }, wallet: { ...EXTERNAL_WALLET }, controls: { ...CONTROLS },
    rule: 'stable', primary: 'USDT', order: ['USDT', 'USDC', 'ETH'], settings, tx: [], seq: 1,
  };
}

/** A lived-in account: three weeks of everyday spending, one decline, one refund, an exchange, two top ups. */
function demoAccount(settings: Settings): State {
  const now = Date.now();
  const card = { ...SHOWCASE_CARD, issuedAt: now - 41 * 24 * H };
  const l4 = last4(card.number);
  let n = 100;
  const buy = (merchant: MerchantId, ago: number, asset: Asset, extra: Partial<Tx> = {}): Tx => {
    const m = MERCHANTS[merchant];
    const fee = m.channel === 'atm' ? ATM_FEE.EUR : 0;
    return { id: txId(n--), kind: 'purchase', merchant, channel: m.channel, status: 'paid', fiat: m.price.EUR, base: 'EUR', fee, asset, crypto: debitFor(m.price.EUR + fee, asset, 'EUR'), rate: rateOf(asset, 'EUR'), rule: 'stable', last4: l4, at: now - ago, ...extra };
  };
  const dep = (asset: Asset, network: Network, sent: number, ago: number): Tx => {
    const credit = roundTo(sent - networkFee(asset, network), DECIMALS[asset]);
    return { id: txId(n--), kind: 'deposit', merchant: 'deposit', channel: 'deposit', status: 'received', fiat: r2(valueOf(credit, asset, 'EUR')), base: 'EUR', fee: 0, asset, crypto: credit, rate: rateOf(asset, 'EUR'), network, last4: l4, at: now - ago };
  };
  const xch = (from: Wallet, to: Wallet, amount: number, ago: number): Tx => ({
    id: txId(n--), kind: 'exchange', merchant: 'exchange', channel: 'exchange', status: 'done', fiat: r2(valueOf(amount, from, 'EUR')), base: 'EUR', fee: 0,
    asset: from, crypto: amount, toAsset: to, toAmount: exchangeOut(from, to, amount), rate: exchangeRate(from, to), last4: l4, at: now - ago,
  });
  const declined = (merchant: MerchantId, ago: number, reason: Reason): Tx => ({ ...buy(merchant, ago, 'USDT'), status: 'declined', reason, asset: undefined, crypto: undefined, rate: undefined, rule: undefined });
  const tx: Tx[] = [
    buy('coffee', 2.2 * H, 'USDT'),
    buy('spotify', 7 * H, 'USDT'),
    declined('atm', 26 * H, 'atm'),
    buy('nike', 29 * H, 'USDC', { rule: 'best' }),
    buy('books', 46 * H, 'USDT', { status: 'refunded', refundedAt: now - 20 * H }),
    buy('taxi', 51 * H, 'USDT'),
    xch('USDT', 'EUR', 100, 74 * H),
    buy('market', 98 * H, 'USDT'),
    buy('tokyo', 6 * 24 * H, 'USDT'),
    buy('coffee', 7 * 24 * H + 3 * H, 'USDT'),
    buy('market', 9 * 24 * H, 'USDC'),
    buy('taxi', 11 * 24 * H, 'USDT'),
    buy('coffee', 13 * 24 * H, 'USDT'),
    dep('USDT', 'TRON', 250, 15 * 24 * H),
    buy('nike', 17 * 24 * H, 'USDT'),
    buy('market', 19 * 24 * H, 'USDT'),
    buy('coffee', 21 * 24 * H, 'USDT'),
    buy('taxi', 23 * 24 * H, 'USDC'),
    dep('USDC', 'Solana', 180, 26 * 24 * H),
    buy('spotify', 30 * 24 * H + 7 * H, 'USDT'),
  ];
  return {
    ...initial(settings),
    path: 'demo',
    card,
    // 386.82 + 165.96 + 67.09 + 664.75 = €1,284.62
    balances: { USDT: 420, USDC: 180, ETH: 0.03, EUR: 664.75 },
    tx,
    seq: 200,
  };
}

export const DEMO_FUNDS: Record<Stable, number> = { USDT: 500, USDC: 200 };

// ---------- reducer ----------

export interface ActivateInput { finish: Finish; name: string; base: Base; primary: Stable; rule: Rule }

export type Action =
  | { type: 'enter-demo' }
  | { type: 'start-fresh' }
  | { type: 'activate'; o: ActivateInput }
  | { type: 'finish'; finish: Finish }
  | { type: 'fund'; asset: Asset; network: Network; amount: number }
  | { type: 'exchange'; from: Wallet; to: Wallet; amount: number }
  | { type: 'control'; key: 'frozen' | 'online' | 'contactless' | 'atm' | 'intl'; on: boolean }
  | { type: 'limit'; value: number }
  | { type: 'rule'; rule: Rule }
  | { type: 'order'; order: Asset[] }
  | { type: 'primary'; primary: Stable }
  | { type: 'base'; base: Base }
  | { type: 'setting'; key: keyof Settings; on: boolean }
  | { type: 'pay'; auth: Auth }
  | { type: 'refund'; id: string }
  | { type: 'reset' };

const roundLimit = (n: number) => Math.max(250, Math.min(5000, Math.round(n / 50) * 50));

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'enter-demo': return demoAccount(s.settings);
    case 'start-fresh': return { ...initial(s.settings), path: 'fresh' };
    case 'activate': {
      const now = Date.now();
      const seq = s.seq + 1;
      const card: CardState = { number: cardNumber(seq), finish: a.o.finish, name: a.o.name.trim().toUpperCase() || 'TAPSHIFT MEMBER', issuedAt: now };
      const other: Stable = a.o.primary === 'USDT' ? 'USDC' : 'USDT';
      const gift = (asset: Stable, i: number): Tx => ({
        id: txId(seq + 1 + i), kind: 'deposit', merchant: 'deposit', channel: 'deposit', status: 'received', fiat: r2(valueOf(DEMO_FUNDS[asset], asset, a.o.base)), base: a.o.base, fee: 0,
        asset, crypto: DEMO_FUNDS[asset], rate: rateOf(asset, a.o.base), last4: last4(card.number), at: now - i,
      });
      return {
        ...s,
        path: 'fresh',
        card,
        base: a.o.base,
        rule: a.o.rule,
        primary: a.o.primary,
        order: [a.o.primary, other, 'ETH'],
        balances: { ...ZERO, USDT: DEMO_FUNDS.USDT, USDC: DEMO_FUNDS.USDC },
        controls: { ...CONTROLS, limit: roundLimit(toBase(CONTROLS.limit, 'EUR', a.o.base)) },
        tx: [gift('USDC', 0), gift('USDT', 1)],
        seq: seq + 3,
      };
    }
    case 'finish': return s.card ? { ...s, card: { ...s.card, finish: a.finish } } : s;
    case 'fund': {
      const fee = networkFee(a.asset, a.network);
      const credit = roundTo(Math.max(0, a.amount - fee), DECIMALS[a.asset]);
      if (!s.card || a.amount <= 0 || a.amount > s.wallet[a.asset] + 1e-9 || credit <= 0) return s;
      const seq = s.seq + 1;
      return {
        ...s,
        seq,
        wallet: { ...s.wallet, [a.asset]: roundTo(s.wallet[a.asset] - a.amount, DECIMALS[a.asset]) },
        balances: { ...s.balances, [a.asset]: roundTo(s.balances[a.asset] + credit, DECIMALS[a.asset]) },
        tx: [{ id: txId(seq), kind: 'deposit', merchant: 'deposit', channel: 'deposit', status: 'received', fiat: r2(valueOf(credit, a.asset, s.base)), base: s.base, fee: 0, asset: a.asset, crypto: credit, rate: rateOf(a.asset, s.base), network: a.network, last4: last4(s.card.number), at: Date.now() }, ...s.tx],
      };
    }
    case 'exchange': {
      const out = exchangeOut(a.from, a.to, a.amount);
      if (!s.card || a.from === a.to || a.amount <= 0 || a.amount > s.balances[a.from] + 1e-9 || out <= 0) return s;
      const seq = s.seq + 1;
      return {
        ...s,
        seq,
        balances: { ...s.balances, [a.from]: roundTo(s.balances[a.from] - a.amount, DECIMALS[a.from]), [a.to]: roundTo(s.balances[a.to] + out, DECIMALS[a.to]) },
        tx: [{ id: txId(seq), kind: 'exchange', merchant: 'exchange', channel: 'exchange', status: 'done', fiat: r2(valueOf(a.amount, a.from, s.base)), base: s.base, fee: 0, asset: a.from, crypto: a.amount, toAsset: a.to, toAmount: out, rate: exchangeRate(a.from, a.to), last4: last4(s.card.number), at: Date.now() }, ...s.tx],
      };
    }
    case 'control': return { ...s, controls: { ...s.controls, [a.key]: a.on } };
    case 'limit': return { ...s, controls: { ...s.controls, limit: roundLimit(a.value) } };
    case 'rule': return { ...s, rule: a.rule };
    case 'order': return { ...s, order: a.order };
    case 'primary': return { ...s, primary: a.primary };
    case 'base': return a.base === s.base ? s : { ...s, base: a.base, controls: { ...s.controls, limit: roundLimit(toBase(s.controls.limit, s.base, a.base)) } };
    case 'setting': return { ...s, settings: { ...s.settings, [a.key]: a.on } };
    case 'pay': {
      if (!s.card) return s;
      const { auth } = a;
      const seq = s.seq + 1;
      const tx: Tx = {
        id: txId(seq), kind: 'purchase', merchant: auth.merchant.id, channel: auth.merchant.channel, status: auth.ok ? 'paid' : 'declined',
        fiat: auth.fiat, base: s.base, fee: auth.fee, asset: auth.asset, crypto: auth.crypto, rate: auth.rate, rule: auth.ok ? s.rule : undefined, reason: auth.reason,
        last4: last4(s.card.number), at: Date.now(),
      };
      const next: State = { ...s, seq, tx: [tx, ...s.tx] };
      if (auth.ok && auth.asset && auth.crypto) next.balances = { ...s.balances, [auth.asset]: roundTo(s.balances[auth.asset] - auth.crypto, DECIMALS[auth.asset]) };
      return next;
    }
    case 'refund': {
      const t = s.tx.find((x) => x.id === a.id);
      if (!t || !refundable(t) || !t.asset || !t.crypto) return s;
      return {
        ...s,
        balances: { ...s.balances, [t.asset]: roundTo(s.balances[t.asset] + t.crypto, DECIMALS[t.asset]) },
        tx: s.tx.map((x) => (x.id === a.id ? { ...x, status: 'refunded', refundedAt: Date.now() } : x)),
      };
    }
    case 'reset': return initial();
  }
}

export const refundable = (t: Tx) => t.kind === 'purchase' && t.status === 'paid' && t.channel !== 'atm';

// ---------- persistence ----------

const KEY = 'tapshift-v1';
const load = (): State => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 3 && raw.balances && raw.settings && Array.isArray(raw.tx)) return raw;
  } catch { /* ignore */ }
  try { localStorage.removeItem('nexus-card-v2'); } catch { /* ignore */ }
  return initial();
};

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return [state, dispatch] as const;
}
export type Dispatch = ReturnType<typeof useStore>[1];
