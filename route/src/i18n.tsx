import { useSyncExternalStore } from 'react';
import { RU } from './ru';
import { NOW, sameDay } from './data';

export type Lang = 'en' | 'ru';
const KEY = 'route-lang';
let current: Lang = (() => { try { return localStorage.getItem(KEY) === 'ru' ? 'ru' : 'en'; } catch { return 'en'; } })();
document.documentElement.lang = current;
const subs = new Set<() => void>();
export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  subs.forEach((f) => f());
}

export type T = (s: string, vars?: Record<string, string | number>) => string;

export function useI18n() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  const t: T = (s, vars) => {
    let r = lang === 'ru' ? RU[s] ?? s : s;
    if (vars) for (const k in vars) r = r.split(`{${k}}`).join(String(vars[k]));
    return r;
  };
  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const day = (iso: string, long = false) => {
    const dt = new Date(iso);
    const diff = Math.round((new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime() - new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()).getTime()) / 86400000);
    if (diff === 0) return t('Today');
    if (diff === 1) return t('Tomorrow');
    if (diff === -1) return t('Yesterday');
    if (diff > 1 && diff < 7 && !long) return cap(dt.toLocaleDateString(locale, { weekday: 'long' }));
    return cap(dt.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' }));
  };
  const date = (iso: string) => cap(new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
  const stamp = (iso: string) => (sameDay(new Date(iso), NOW) ? `${t('Today')} ${time(iso)}` : `${date(iso)} ${time(iso)}`);
  return { lang, t, locale, time, day, date, stamp };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function LangToggle() {
  const { lang, t } = useI18n();
  return (
    <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>
      <span className={lang === 'en' ? 'on' : ''}>EN</span>
      <span className={lang === 'ru' ? 'on' : ''}>RU</span>
    </button>
  );
}
