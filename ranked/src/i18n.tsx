import { useSyncExternalStore } from 'react';
import { EN } from './en';

export type Lang = 'ru' | 'en';
/** Bilingual content string. UI strings use the Russian text as the key instead. */
export type Txt = { ru: string; en: string };

const KEY = 'ranked-lang-v2';
let current: Lang = (() => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'ru'; } catch { return 'ru'; } })();
document.documentElement.lang = current;
const subs = new Set<() => void>();

export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  subs.forEach((f) => f());
}

export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

export function useI18n() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const t = (s: string, vars?: Record<string, string | number>) => {
    let r = lang === 'en' ? EN[s] ?? s : s;
    if (vars) for (const k in vars) r = r.split(`{${k}}`).join(String(vars[k]));
    return r;
  };
  const tr = (x: Txt | string) => (typeof x === 'string' ? x : x[lang]);
  const rub = (n: number) => `${Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`;
  const num = (n: number) => n.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US').replace(/ /g, ' ');
  const days = ([lo, hi]: [number, number]) => {
    if (hi === 0) return lang === 'ru' ? 'Сегодня или завтра' : 'Today or tomorrow';
    if (lang === 'en') return lo === hi ? `${lo} ${lo === 1 ? 'day' : 'days'}` : `${lo}–${hi} days`;
    return lo === hi ? `${lo} ${plural(lo, 'день', 'дня', 'дней')}` : `${lo}–${hi} ${plural(hi, 'день', 'дня', 'дней')}`;
  };
  return { lang, t, tr, rub, num, days };
}
