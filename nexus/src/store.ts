import { useEffect, useReducer } from 'react';

// ---------- model ----------

export type Asset = 'USDT' | 'USDC' | 'ETH';
export type Base = 'EUR' | 'USD';
export type Finish = 'graphite' | 'titanium' | 'ice';
export type CardKind = 'multi' | 'single';
export type Rule = 'stable' | 'best' | 'manual';
export type Channel = 'contactless' | 'online' | 'atm';
export type Network = 'TRON' | 'Ethereum' | 'Solana';
export type Category = 'coffee' | 'subscription' | 'shopping' | 'cash' | 'transport' | 'travel' | 'groceries' | 'deposit';
export type Reason = 'frozen' | 'online' | 'contactless' | 'atm' | 'intl' | 'limit' | 'funds';
export type MerchantId = 'coffee' | 'spotify' | 'nike' | 'atm' | 'taxi' | 'tokyo' | 'halle' | 'market';

export interface CardState {
  number: string;
  finish: Finish;
  name: string;
  kind: CardKind;
  issuedAt: number;
}

export interface Controls {
  frozen: boolean;
  online: boolean;
  contactless: boolean;
  atm: boolean;
  intl: boolean;
  limit: number; // in base currency
}

export interface Tx {
  id: string;
  kind: 'purchase' | 'deposit';
  merchant: MerchantId | 'deposit';
  channel: Channel | 'deposit';
  status: 'paid' | 'declined' | 'refunded' | 'received';
  fiat: number; // purchase amount in `base`
  base: Base;
  fee: number;
  asset?: Asset;
  crypto?: number; // debit (purchase) or credit (deposit), in asset units
  rate?: number; // 1 asset = rate base
  rule?: Rule;
  reason?: Reason;
  network?: Network;
  last4: string;
  at: number;
  refundedAt?: number;
}

export interface State {
  v: 2;
  base: Base;
  card: CardState;
  balances: Record<Asset, number>;
  wallet: Record<Asset, number>; // the simulated outside wallet funding comes from
  controls: Controls;
  rule: Rule;
  order: Asset[];
  tx: Tx[];
  seq: number;
}

// ---------- reference data (simulated, fixed) ----------

export const ASSETS: Asset[] = ['USDT', 'USDC', 'ETH'];
export const STABLE: Asset[] = ['USDT', 'USDC'];
export const DECIMALS: Record<Asset, number> = { USDT: 2, USDC: 2, ETH: 6 };

/** 1 asset = RATE[base][asset] units of base. The spread is already inside the rate. */
export const RATE: Record<Base, Record<Asset, number>> = {
  EUR: { USDT: 0.921, USDC: 0.922, ETH: 2236.4 },
  USD: { USDT: 0.9993, USDC: 1.0004, ETH: 2426.5 },
};
/** Conversion spread vs mid-market. Best available picks the lowest one that covers the payment. */
export const SPREAD: Record<Asset, number> = { USDT: 0.0012, USDC: 0.0008, ETH: 0.0045 };
export const EUR_USD = 1.0851;

export const NETWORKS: Record<Asset, Network[]> = { USDT: ['TRON', 'Ethereum', 'Solana'], USDC: ['Solana', 'Ethereum'], ETH: ['Ethereum'] };
/** Network fee, in units of the asset sent. */
export const NETWORK_FEE: Record<Asset, Partial<Record<Network, number>>> = {
  USDT: { TRON: 1, Ethereum: 2.4, Solana: 0.05 },
  USDC: { Solana: 0.05, Ethereum: 2.4 },
  ETH: { Ethereum: 0.0008 },
};

export const ATM_FEE = 1.5;

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
  coffee: { id: 'coffee', name: 'Coffee Corner', category: 'coffee', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 8.4, USD: 8.9 }, mark: 'Cc' },
  spotify: { id: 'spotify', name: 'Spotify', category: 'subscription', channel: 'online', city: 'Stockholm', intl: false, price: { EUR: 14.99, USD: 15.99 }, mark: 'Sp' },
  nike: { id: 'nike', name: 'Nike', category: 'shopping', channel: 'online', city: 'Amsterdam', intl: false, price: { EUR: 89, USD: 95 }, mark: 'Nk' },
  atm: { id: 'atm', name: 'ATM', category: 'cash', channel: 'atm', city: 'Berlin', intl: false, price: { EUR: 100, USD: 100 }, mark: 'At' },
  taxi: { id: 'taxi', name: 'Taxi', category: 'transport', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 21.5, USD: 23 }, mark: 'Tx' },
  tokyo: { id: 'tokyo', name: 'Tokyo Metro', category: 'travel', channel: 'contactless', city: 'Tokyo', intl: true, price: { EUR: 12.6, USD: 13.4 }, mark: 'Tm' },
  halle: { id: 'halle', name: 'Halle Store', category: 'shopping', channel: 'online', city: 'Berlin', intl: false, price: { EUR: 54.9, USD: 59 }, mark: 'Hs' },
  market: { id: 'market', name: 'Corner Market', category: 'groceries', channel: 'contactless', city: 'Berlin', intl: false, price: { EUR: 36.2, USD: 39 }, mark: 'Cm' },
};
export const SIMULATOR: MerchantId[] = ['coffee', 'spotify', 'nike', 'atm', 'taxi', 'tokyo'];

// ---------- math ----------

const r2 = (n: number) => Math.round(n * 100) / 100;
const roundTo = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
/** Card issuers round the debit up to the smallest unit. */
const ceilTo = (n: number, d: number) => Math.ceil(n * 10 ** d - 1e-7) / 10 ** d;

export const debitFor = (fiat: number, asset: Asset, base: Base) => ceilTo(fiat / RATE[base][asset], DECIMALS[asset]);
export const valueOf = (amount: number, asset: Asset, base: Base) => amount * RATE[base][asset];
export const available = (s: Pick<State, 'balances' | 'base'>) => Math.floor(ASSETS.reduce((a, k) => a + valueOf(s.balances[k], k, s.base), 0) * 100) / 100;
export const toBase = (n: number, from: Base, to: Base) => (from === to ? n : from === 'EUR' ? n * EUR_USD : n / EUR_USD);
export const networkFee = (asset: Asset, network: Network) => NETWORK_FEE[asset][network] ?? 0;

export function spentThisMonth(s: State, now = Date.now()) {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return r2(s.tx.filter((t) => t.kind === 'purchase' && t.status === 'paid' && t.at >= start).reduce((a, t) => a + toBase(t.fiat, t.base, s.base), 0));
}

/** The order NEXUS tries balances in for the active Smart Spend rule. */
export function priority(s: Pick<State, 'rule' | 'order' | 'balances' | 'base'>): Asset[] {
  if (s.rule === 'manual') return s.order;
  if (s.rule === 'best') return [...ASSETS].sort((a, b) => SPREAD[a] - SPREAD[b]);
  const stables = [...STABLE].sort((a, b) => valueOf(s.balances[b], b, s.base) - valueOf(s.balances[a], a, s.base));
  return [...stables, 'ETH'];
}

export function pickSource(s: Pick<State, 'rule' | 'order' | 'balances' | 'base'>, total: number): { asset: Asset; crypto: number } | null {
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
  const fee = m.channel === 'atm' ? ATM_FEE : 0;
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
  return { ...base, ok: true, asset: src.asset, crypto: src.crypto, rate: RATE[s.base][src.asset] };
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
export const txId = (seq: number) => `NX-${hex(seq).slice(0, 4)}-${hex(seq + 7919).slice(0, 4)}`;

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
export const cvvOf = (n: string) => String(hash(+n.slice(-6)) % 900 + 100);
export function expiryOf(issuedAt: number) {
  const d = new Date(issuedAt);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String((d.getFullYear() + 3) % 100).padStart(2, '0')}`;
}

// ---------- seed ----------

const H = 3600000;
const D = 24 * H;

function seed(): State {
  const now = Date.now();
  const number = '4319872051634821';
  const l4 = last4(number);
  const buy = (n: number, merchant: MerchantId, at: number, asset: Asset, extra: Partial<Tx> = {}): Tx => {
    const m = MERCHANTS[merchant];
    const fee = m.channel === 'atm' ? ATM_FEE : 0;
    return { id: txId(n), kind: 'purchase', merchant, channel: m.channel, status: 'paid', fiat: m.price.EUR, base: 'EUR', fee, asset, crypto: debitFor(m.price.EUR + fee, asset, 'EUR'), rate: RATE.EUR[asset], rule: 'stable', last4: l4, at: now - at, ...extra };
  };
  const dep = (n: number, asset: Asset, network: Network, sent: number, at: number): Tx => ({
    id: txId(n), kind: 'deposit', merchant: 'deposit', channel: 'deposit', status: 'received', fiat: r2(valueOf(sent - networkFee(asset, network), asset, 'EUR')), base: 'EUR', fee: 0,
    asset, crypto: roundTo(sent - networkFee(asset, network), DECIMALS[asset]), rate: RATE.EUR[asset], network, last4: l4, at: now - at,
  });
  return {
    v: 2,
    base: 'EUR',
    card: { number, finish: 'graphite', name: 'ALEX MORGAN', kind: 'multi', issuedAt: now - 41 * D },
    balances: { USDT: 420, USDC: 180, ETH: 0.03 },
    wallet: { USDT: 1250, USDC: 640, ETH: 0.25 },
    controls: { frozen: false, online: true, contactless: true, atm: false, intl: true, limit: 1500 },
    rule: 'stable',
    order: ['USDT', 'USDC', 'ETH'],
    tx: [
      buy(9, 'spotify', 2 * H, 'USDT'),
      buy(8, 'coffee', 5.3 * H, 'USDT'),
      buy(7, 'taxi', D + 3 * H, 'USDT'),
      { ...buy(6, 'atm', D + 6 * H, 'USDT'), status: 'declined', reason: 'atm', asset: undefined, crypto: undefined, rate: undefined, rule: undefined },
      buy(5, 'nike', 2 * D + 2 * H, 'USDC', { rule: 'best' }),
      buy(4, 'halle', 3 * D + 4 * H, 'USDT', { status: 'refunded', refundedAt: now - 2 * D }),
      buy(3, 'market', 4 * D + 1 * H, 'USDT'),
      dep(2, 'USDT', 'TRON', 250, 6 * D),
      dep(1, 'USDC', 'Solana', 180, 12 * D),
    ],
    seq: 10,
  };
}

// ---------- reducer ----------

export type Action =
  | { type: 'issue'; finish: Finish; name: string; kind: CardKind; base: Base }
  | { type: 'fund'; asset: Asset; network: Network; amount: number }
  | { type: 'control'; key: 'frozen' | 'online' | 'contactless' | 'atm' | 'intl'; on: boolean }
  | { type: 'limit'; value: number }
  | { type: 'rule'; rule: Rule }
  | { type: 'order'; order: Asset[] }
  | { type: 'base'; base: Base }
  | { type: 'pay'; auth: Auth }
  | { type: 'refund'; id: string }
  | { type: 'reset' };

const roundLimit = (n: number) => Math.max(250, Math.min(5000, Math.round(n / 50) * 50));

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'issue': {
      const seq = s.seq + 1;
      const next: State = {
        ...s,
        seq,
        card: { number: cardNumber(seq), finish: a.finish, name: a.name.trim().toUpperCase() || 'NEXUS MEMBER', kind: a.kind, issuedAt: Date.now() },
        controls: { ...s.controls, frozen: false },
      };
      return a.base === s.base ? next : reducer(next, { type: 'base', base: a.base });
    }
    case 'fund': {
      const fee = networkFee(a.asset, a.network);
      const credit = roundTo(Math.max(0, a.amount - fee), DECIMALS[a.asset]);
      if (a.amount <= 0 || a.amount > s.wallet[a.asset] + 1e-9 || credit <= 0) return s;
      const seq = s.seq + 1;
      return {
        ...s,
        seq,
        wallet: { ...s.wallet, [a.asset]: roundTo(s.wallet[a.asset] - a.amount, DECIMALS[a.asset]) },
        balances: { ...s.balances, [a.asset]: roundTo(s.balances[a.asset] + credit, DECIMALS[a.asset]) },
        tx: [{ id: txId(seq), kind: 'deposit', merchant: 'deposit', channel: 'deposit', status: 'received', fiat: r2(valueOf(credit, a.asset, s.base)), base: s.base, fee: 0, asset: a.asset, crypto: credit, rate: RATE[s.base][a.asset], network: a.network, last4: last4(s.card.number), at: Date.now() }, ...s.tx],
      };
    }
    case 'control': return { ...s, controls: { ...s.controls, [a.key]: a.on } };
    case 'limit': return { ...s, controls: { ...s.controls, limit: roundLimit(a.value) } };
    case 'rule': return { ...s, rule: a.rule };
    case 'order': return { ...s, order: a.order };
    case 'base': return a.base === s.base ? s : { ...s, base: a.base, controls: { ...s.controls, limit: roundLimit(toBase(s.controls.limit, s.base, a.base)) } };
    case 'pay': {
      const { auth } = a;
      const seq = s.seq + 1;
      const tx: Tx = {
        id: txId(seq), kind: 'purchase', merchant: auth.merchant.id, channel: auth.merchant.channel, status: auth.ok ? 'paid' : 'declined',
        fiat: auth.fiat, base: s.base, fee: auth.fee, asset: auth.asset, crypto: auth.crypto, rate: auth.rate, rule: auth.ok ? s.rule : undefined, reason: auth.reason,
        last4: last4(s.card.number), at: Date.now(),
      };
      let next: State = { ...s, seq, tx: [tx, ...s.tx] };
      if (auth.ok && auth.asset && auth.crypto) {
        next.balances = { ...s.balances, [auth.asset]: roundTo(s.balances[auth.asset] - auth.crypto, DECIMALS[auth.asset]) };
        // a single-use card burns its number after one approved purchase
        if (s.card.kind === 'single') next = { ...next, seq: seq + 1, card: { ...s.card, number: cardNumber(seq + 1), issuedAt: Date.now() } };
      }
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
    case 'reset': return seed();
  }
}

export const refundable = (t: Tx) => t.kind === 'purchase' && t.status === 'paid' && t.channel !== 'atm';

// ---------- persistence ----------

const KEY = 'nexus-card-v2';
const load = (): State => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && raw.v === 2 && raw.card && raw.balances && Array.isArray(raw.tx)) return raw;
  } catch { /* ignore */ }
  return seed();
};

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return [state, dispatch] as const;
}
export type Dispatch = ReturnType<typeof useStore>[1];
