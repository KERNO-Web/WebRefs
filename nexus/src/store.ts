import { useEffect, useReducer } from 'react';

export type Asset = 'USDT' | 'USDC' | 'ETH';
export type Network = 'TRON' | 'Ethereum' | 'Solana';
export type Pocket = 'USD' | 'EUR';

export interface Tx {
  id: string;
  merchant: string;
  logo: string; // file in /logos or monogram text prefixed with "#"
  note: string;
  amount: number;
  currency: Pocket;
  at: number; // ms timestamp
  kind: 'spend' | 'topup' | 'exchange' | 'declined';
}

export interface State {
  usd: number;
  eur: number;
  frozen: boolean;
  online: boolean;
  limit: number;
  tx: Tx[];
}

export const ASSET_PRICE: Record<Asset, number> = { USDT: 1, USDC: 1, ETH: 3418.2 };
export const NETWORK_FEE: Record<Network, number> = { TRON: 1, Ethereum: 3.8, Solana: 0.02 };
export const NETWORKS_FOR: Record<Asset, Network[]> = { USDT: ['TRON', 'Ethereum', 'Solana'], USDC: ['Ethereum', 'Solana'], ETH: ['Ethereum'] };
export const USD_EUR = 0.9256;

const day = 86400000;
const NOW = Date.now();
const SEED: State = {
  usd: 2840.6,
  eur: 0,
  frozen: false,
  online: true,
  limit: 1500,
  tx: [
    { id: 't1', merchant: 'Spotify', logo: 'spotify.svg', note: 'Subscription', amount: -10.99, currency: 'USD', at: NOW - 2.5 * 3600000, kind: 'spend' },
    { id: 't2', merchant: 'Booking.com', logo: '#B.', note: 'Hotel, Lisbon', amount: -184, currency: 'USD', at: NOW - day - 3 * 3600000, kind: 'spend' },
    { id: 't3', merchant: 'Steam', logo: 'steam.svg', note: 'Games', amount: -29.99, currency: 'USD', at: NOW - 2 * day, kind: 'spend' },
    { id: 't4', merchant: 'Uber', logo: 'uber.svg', note: 'Ride', amount: -18.4, currency: 'USD', at: NOW - 2 * day - 5 * 3600000, kind: 'spend' },
    { id: 't5', merchant: 'Top up', logo: 'tether.svg', note: '500 USDT · TRON', amount: 500, currency: 'USD', at: NOW - 3 * day, kind: 'topup' },
  ],
};

type Action =
  | { type: 'topup'; asset: Asset; network: Network; amount: number }
  | { type: 'exchange'; from: Pocket; amount: number }
  | { type: 'freeze'; on: boolean }
  | { type: 'online'; on: boolean }
  | { type: 'limit'; value: number }
  | { type: 'pay'; merchant: string; logo: string; amount: number; ok: boolean; note: string }
  | { type: 'reset' };

export const received = (asset: Asset, network: Network, amount: number) =>
  Math.max(0, amount * ASSET_PRICE[asset] - NETWORK_FEE[network]);

export const spentThisMonth = (s: State) => {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  return -s.tx.filter((t) => t.kind === 'spend' && t.at >= start && t.currency === 'USD').reduce((a, t) => a + t.amount, 0);
};

const r2 = (n: number) => Math.round(n * 100) / 100;
let uid = 0;
const id = () => 'n' + Date.now().toString(36) + (uid++);

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'topup': {
      const got = r2(received(a.asset, a.network, a.amount));
      return { ...s, usd: r2(s.usd + got), tx: [{ id: id(), merchant: 'Top up', logo: a.asset === 'ETH' ? 'ethereum.svg' : a.asset === 'USDT' ? 'tether.svg' : '#$', note: `${a.amount} ${a.asset} · ${a.network}`, amount: got, currency: 'USD', at: Date.now(), kind: 'topup' }, ...s.tx] };
    }
    case 'exchange': {
      const to: Pocket = a.from === 'USD' ? 'EUR' : 'USD';
      const out = r2(a.from === 'USD' ? a.amount * USD_EUR : a.amount / USD_EUR);
      const next = { ...s };
      if (a.from === 'USD') { next.usd = r2(s.usd - a.amount); next.eur = r2(s.eur + out); } else { next.eur = r2(s.eur - a.amount); next.usd = r2(s.usd + out); }
      next.tx = [{ id: id(), merchant: 'Exchange', logo: '#⇄', note: `${a.from} → ${to}`, amount: out, currency: to, at: Date.now(), kind: 'exchange' }, ...s.tx];
      return next;
    }
    case 'freeze': return { ...s, frozen: a.on };
    case 'online': return { ...s, online: a.on };
    case 'limit': return { ...s, limit: a.value };
    case 'pay':
      return {
        ...s,
        usd: a.ok ? r2(s.usd - a.amount) : s.usd,
        tx: [{ id: id(), merchant: a.merchant, logo: a.logo, note: a.note, amount: a.ok ? -a.amount : 0, currency: 'USD', at: Date.now(), kind: a.ok ? 'spend' : 'declined' }, ...s.tx],
      };
    case 'reset': return SEED;
  }
}

const KEY = 'nexus-card-v1';
const load = (): State => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw.usd === 'number') return raw;
  } catch { /* ignore */ }
  return SEED;
};

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return [state, dispatch] as const;
}
export type Dispatch = ReturnType<typeof useStore>[1];
