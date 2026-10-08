import type { Lang } from './model';
import { assetById, type AssetId } from './model';

const NBSP = ' ';
const loc = (lang: Lang) => (lang === 'ru' ? 'ru-RU' : 'en-US');
// ru-RU groups with U+202F; a regular no-break space renders reliably in Onest
const clean = (s: string) => s.replace(/[  ]/g, NBSP);

export function num(n: number, lang: Lang, digits = 0, maxDigits = digits) {
  return clean(
    new Intl.NumberFormat(loc(lang), { minimumFractionDigits: digits, maximumFractionDigits: maxDigits }).format(n),
  );
}

/** 2 490 ₽ · ₽2,490 */
export function rub(n: number, lang: Lang, opts: { sign?: boolean; kopecks?: boolean } = {}) {
  const abs = Math.abs(n);
  const frac = opts.kopecks || abs % 1 !== 0 ? 2 : 0;
  const body = num(abs, lang, frac);
  const sign = n < 0 ? '−' : opts.sign && n > 0 ? '+' : '';
  return lang === 'ru' ? `${sign}${body}${NBSP}₽` : `${sign}₽${body}`;
}

export function crypto(n: number, asset: AssetId, lang: Lang, opts: { sign?: boolean } = {}) {
  const a = assetById(asset);
  const sign = n < 0 ? '−' : opts.sign && n > 0 ? '+' : '';
  return `${sign}${num(Math.abs(n), lang, a.decimals)}${NBSP}${a.symbol}`;
}

export function usdt(n: number, lang: Lang, opts: { sign?: boolean; symbol?: string } = {}) {
  const sign = n < 0 ? '−' : opts.sign && n > 0 ? '+' : '';
  return `${sign}${num(Math.abs(n), lang, 2)}${NBSP}${opts.symbol ?? 'USDT'}`;
}

export function rate(n: number, lang: Lang) {
  if (n >= 10_000) return rub(Math.round(n), lang);
  return lang === 'ru' ? `${num(n, lang, 2)}${NBSP}₽` : `₽${num(n, lang, 2)}`;
}

export const time = (t: number, lang: Lang) =>
  new Intl.DateTimeFormat(loc(lang), { hour: '2-digit', minute: '2-digit', hour12: false }).format(t);

export const timeSec = (t: number, lang: Lang) =>
  new Intl.DateTimeFormat(loc(lang), { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(t);

export const date = (t: number, lang: Lang, withYear = false) =>
  clean(
    new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: lang === 'ru' ? 'long' : 'short', ...(withYear ? { year: 'numeric' } : {}) })
      .format(t)
      .replace(/\s?г\.?$/, ''),
  );

export const dateLong = (t: number, lang: Lang) =>
  clean(new Intl.DateTimeFormat(loc(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(t)).replace(' г.', '');

export const weekday = (t: number, lang: Lang) =>
  new Intl.DateTimeFormat(loc(lang), { weekday: 'short' }).format(t).replace('.', '');

export const dateTime = (t: number, lang: Lang) => `${date(t, lang)}, ${time(t, lang)}`;

export function countdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function plural(n: number, lang: Lang, forms: [string, string, string] | [string, string]) {
  if (lang === 'en' || forms.length === 2) return n === 1 ? forms[0] : forms[1];
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
  return forms[2];
}
