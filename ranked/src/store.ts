import { useEffect, useSyncExternalStore } from 'react';
import type { Choice } from './data';

export type Order = {
  id: number;
  service: string;
  choice: Choice;
  price: number;
  days: [number, number];
  contact: string;
  pay: 'sbp' | 'card';
  at: number;
};

const KEY = 'ranked-orders-v2';
const FIRST_ID = 18492;

let orders: Order[] = (() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } })();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const sub = (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb); }; };

export function useOrders() {
  return useSyncExternalStore(sub, () => orders);
}

export function placeOrder(o: Omit<Order, 'id' | 'at'>) {
  const id = orders.length ? Math.max(...orders.map((x) => x.id)) + 1 : FIRST_ID;
  const order = { ...o, id, at: Date.now() };
  orders = [order, ...orders];
  try { localStorage.setItem(KEY, JSON.stringify(orders)); } catch { /* ignore */ }
  emit();
  return order;
}

export function clearOrders() {
  orders = [];
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  emit();
}

/** Demo order lifecycle, driven by time since the order was placed. */
export const STAGES = [0, 7000, 15000, 45000];
export function stageOf(o: Order, now: number) {
  const e = now - o.at;
  let s = 0;
  STAGES.forEach((t, i) => { if (e >= t) s = i; });
  return s;
}

/* ---------- hash routing ---------- */

export type Route = { page: 'home' } | { page: 'service'; id: string } | { page: 'order'; id: number } | { page: 'orders' };

const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (a === 's' && b) return { page: 'service', id: b };
  if (a === 'order' && b) return { page: 'order', id: +b };
  if (a === 'orders') return { page: 'orders' };
  return { page: 'home' };
};
let route = parse();
let routeKey = location.hash;
const rsubs = new Set<() => void>();
window.addEventListener('hashchange', () => { route = parse(); routeKey = location.hash; rsubs.forEach((f) => f()); });

export function useRoute() {
  useSyncExternalStore((cb) => { rsubs.add(cb); return () => { rsubs.delete(cb); }; }, () => routeKey);
  return route;
}

let pendingAnchor: string | null = null;
export const navigate = (hash: string, anchor?: string) => {
  pendingAnchor = anchor ?? null;
  if (location.hash === hash || (hash === '#/' && !location.hash)) {
    if (anchor) scrollToId(anchor); else window.scrollTo({ top: 0 });
    return;
  }
  location.hash = hash;
};

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 76, behavior: reduced ? 'auto' : 'smooth' });
}

/** After a route renders: jump to the requested anchor, or to the top. */
export function useRouteScroll(r: Route) {
  useEffect(() => {
    const a = pendingAnchor;
    pendingAnchor = null;
    if (a) requestAnimationFrame(() => scrollToId(a));
    else window.scrollTo({ top: 0 });
  }, [r.page, 'id' in r ? r.id : 0]);
}
