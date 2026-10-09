import { useSyncExternalStore } from 'react';
import type { Asset, Base } from './store';
import { RU } from './ru';

export type Lang = 'en' | 'ru';
const KEY = 'nexus-card-lang';
let current: Lang = (() => { try { return localStorage.getItem(KEY) === 'ru' ? 'ru' : 'en'; } catch { return 'en'; } })();
document.documentElement.lang = current;
const subs = new Set<() => void>();
export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  subs.forEach((f) => f());
}

export type T = (s: string, v?: Record<string, string | number>) => string;

const fmtCache = new Map<string, Intl.NumberFormat>();
const nf = (locale: string, o: Intl.NumberFormatOptions) => {
  const k = locale + JSON.stringify(o);
  let f = fmtCache.get(k);
  if (!f) { f = new Intl.NumberFormat(locale, o); fmtCache.set(k, f); }
  return f;
};
const signOf = (n: number, sign: boolean) => (n < 0 ? '−' : sign && n > 0 ? '+' : '');

export function useI18n() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  const t: T = (s, v) => {
    let r = lang === 'ru' ? RU[s] ?? s : s;
    if (v) for (const k in v) r = r.split(`{${k}}`).join(String(v[k]));
    return r;
  };
  /** €8.40 / 8,40 € */
  const fiat = (n: number, cur: Base, o: { sign?: boolean; whole?: boolean } = {}) =>
    signOf(n, !!o.sign) + nf(locale, { style: 'currency', currency: cur, minimumFractionDigits: o.whole ? 0 : 2, maximumFractionDigits: o.whole ? 0 : 2 }).format(Math.abs(n));
  /** the number part only, for big display figures */
  const amount = (n: number, d = 2) => nf(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(Math.abs(n));
  const symbol = (cur: Base) => (cur === 'EUR' ? '€' : '$');
  /** 9.13 USDT */
  const crypto = (n: number, asset: Asset, o: { sign?: boolean } = {}) => {
    const d = asset === 'ETH' ? { minimumFractionDigits: 2, maximumFractionDigits: 6 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return `${signOf(n, !!o.sign)}${nf(locale, d).format(Math.abs(n))} ${asset}`;
  };
  /** 1 USDT = €0.921 */
  const rate = (asset: Asset, r: number, cur: Base) =>
    `1 ${asset} = ${nf(locale, { style: 'currency', currency: cur, minimumFractionDigits: asset === 'ETH' ? 2 : 3, maximumFractionDigits: asset === 'ETH' ? 2 : 4 }).format(r)}`;
  const time = (ts: number) => new Date(ts).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const day = (ts: number) => {
    const d = new Date(ts), now = new Date();
    const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86400000);
    if (diff === 0) return t('Today');
    if (diff === 1) return t('Yesterday');
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };
  const dateTime = (ts: number) => new Date(ts).toLocaleString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return { lang, locale, t, fiat, amount, symbol, crypto, rate, time, day, dateTime };
}

/** Renders "\n"-separated copy as stacked lines, so each language sets its own breaks. */
export function Lines({ text }: { text: string }) {
  return <>{text.split('\n').map((p, i) => <span className="ln" key={i}>{p}</span>)}</>;
}
