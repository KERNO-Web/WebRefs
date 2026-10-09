import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { authorize, useStore, type ActivateInput, type Asset, type Auth, type Dispatch, type MerchantId, type Network, type State, type Wallet } from './store';

// ---------- card light pulses ----------
// Every card on screen is the same card, so a payment lights all of them.

export type PulseKind = 'paid' | 'declined' | 'issued' | 'funded' | 'refunded';
let pulse: { kind: PulseKind | null; n: number } = { kind: null, n: 0 };
const pulseSubs = new Set<() => void>();
export function emitPulse(kind: PulseKind) {
  pulse = { kind, n: pulse.n + 1 };
  pulseSubs.forEach((f) => f());
}
export const usePulse = () =>
  useSyncExternalStore((cb) => { pulseSubs.add(cb); return () => { pulseSubs.delete(cb); }; }, () => pulse);

// ---------- card hand-off ----------
// The card the visitor just looked at (onboarding, entry preview) hands its
// screen position to the dashboard card, which flies in from there.

let handoff: DOMRect | null = null;
export const setHandoff = (el: Element | null) => { handoff = el ? el.getBoundingClientRect() : null; };
export const takeHandoff = () => { const h = handoff; handoff = null; return h; };

// ---------- toasts ----------

export interface Toast { id: number; text: string; tone: 'ok' | 'no' | 'info' }

// ---------- context ----------

interface Api {
  state: State;
  dispatch: Dispatch;
  pay: (id: MerchantId) => Auth;
  activate: (o: ActivateInput) => void;
  fund: (asset: Asset, network: Network, amount: number) => void;
  exchange: (from: Wallet, to: Wallet, amount: number) => void;
  refund: (id: string) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast['tone'], force?: boolean) => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useStore();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const n = useRef(0);
  const notify = useRef(state.settings.notifications);
  notify.current = state.settings.notifications;
  /** Notifications off silences payment alerts; confirmations of the visitor's own clicks still show. */
  const toast = useCallback((text: string, tone: Toast['tone'] = 'info', force = true) => {
    if (!force && !notify.current) return;
    const id = ++n.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);
  const api = useMemo<Api>(() => ({
    state,
    dispatch,
    toasts,
    toast,
    pay: (id) => {
      const auth = authorize(state, id);
      dispatch({ type: 'pay', auth });
      emitPulse(auth.ok ? 'paid' : 'declined');
      return auth;
    },
    activate: (o) => { dispatch({ type: 'activate', o }); emitPulse('issued'); },
    fund: (asset, network, amount) => { dispatch({ type: 'fund', asset, network, amount }); emitPulse('funded'); },
    exchange: (from, to, amount) => { dispatch({ type: 'exchange', from, to, amount }); emitPulse('funded'); },
    refund: (id) => { dispatch({ type: 'refund', id }); emitPulse('refunded'); },
  }), [state, dispatch, toasts, toast]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
