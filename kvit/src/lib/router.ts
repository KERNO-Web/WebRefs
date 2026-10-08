// Hash routing keeps deep links working on GitHub Pages without a server.
//   #/                      product site
//   #/app/<section>/<id>    merchant demo
//   #/pay/<id>?d=<payload>  customer checkout

import { useSyncExternalStore } from 'react';

export interface Route {
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, q = ''] = raw.split('?');
  return { parts: path.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

let current = parse();
let currentHash = location.hash;
const listeners = new Set<() => void>();

window.addEventListener('hashchange', () => {
  if (location.hash === currentHash) return;
  currentHash = location.hash;
  current = parse();
  listeners.forEach((l) => l());
});

export function useRoute() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}

export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const hash = '#' + path;
  if (hash === location.hash) return;
  if (opts.replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  currentHash = location.hash;
  current = parse();
  listeners.forEach((l) => l());
}

export const href = (path: string) => '#' + path;

/** Absolute URL to a path inside this app, usable in QR codes and shared links. */
export const absolute = (path: string) => `${location.origin}${location.pathname}#${path}`;

// ---- portable session payload for checkouts opened on another device ----

interface SessionPayload {
  a: number;
  d?: string;
  e: number;
}

export function encodeSession(p: SessionPayload) {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSession(s: string | null): SessionPayload | null {
  if (!s) return null;
  try {
    const b = s.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes)) as SessionPayload;
    return typeof p.a === 'number' && typeof p.e === 'number' ? p : null;
  } catch {
    return null;
  }
}
