// Read-only market rates from CoinGecko's public API. The app never waits on
// it: it starts from the last cached quote (or built-in reference values) and
// swaps in live numbers when they arrive.

import { useSyncExternalStore } from 'react';
import type { AssetId, Coin } from './model';
import { assetById } from './model';

export type RateSource = 'live' | 'cached' | 'reference';

export interface Rates {
  rub: Record<Coin, number>;
  usd: Record<Coin, number>;
  updatedAt: number;
  source: RateSource;
}

const IDS: Record<Coin, string> = {
  usdt: 'tether',
  usdc: 'usd-coin',
  ton: 'the-open-network',
  btc: 'bitcoin',
  eth: 'ethereum',
};

const REFERENCE: Rates = {
  rub: { usdt: 91.75, usdc: 91.72, ton: 296.4, btc: 10_240_000, eth: 377_800 },
  usd: { usdt: 1, usdc: 1, ton: 3.23, btc: 111_600, eth: 4_118 },
  updatedAt: 0,
  source: 'reference',
};

const KEY = 'kvit:rates';
const REFRESH_MS = 60_000;

function readCache(): Rates | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Rates;
    if (!r?.rub?.usdt || !r?.usd?.btc) return null;
    return { ...r, source: 'cached' };
  } catch {
    return null;
  }
}

let rates: Rates = readCache() ?? REFERENCE;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function refresh() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const url =
      'https://api.coingecko.com/api/v3/simple/price?vs_currencies=rub,usd&ids=' + Object.values(IDS).join(',');
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as Record<string, { rub?: number; usd?: number }>;
    const next: Rates = { rub: { ...rates.rub }, usd: { ...rates.usd }, updatedAt: Date.now(), source: 'live' };
    for (const coin of Object.keys(IDS) as Coin[]) {
      const q = data[IDS[coin]];
      if (q?.rub && q.rub > 0) next.rub[coin] = q.rub;
      if (q?.usd && q.usd > 0) next.usd[coin] = q.usd;
    }
    rates = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable */
    }
    emit();
  } catch {
    // keep whatever we had: cached or reference values
  }
}

let started = false;
function start() {
  if (started || typeof window === 'undefined') return;
  started = true;
  refresh();
  setInterval(() => {
    if (document.visibilityState === 'visible') refresh();
  }, REFRESH_MS);
}

export function getRates() {
  return rates;
}

export function useRates() {
  start();
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => rates,
  );
}

/** Roubles for one unit of the asset. */
export const rubPer = (asset: AssetId, r: Rates = rates) => r.rub[assetById(asset).coin];

export function quote(amountRub: number, asset: AssetId, r: Rates = rates) {
  const a = assetById(asset);
  const rate = rubPer(asset, r);
  const factor = 10 ** a.decimals;
  // round up so the merchant is never short-changed by rounding
  const crypto = Math.ceil((amountRub / rate) * factor) / factor;
  return { crypto, rate, fee: a.fee, total: +(crypto + a.fee).toFixed(a.decimals) };
}
