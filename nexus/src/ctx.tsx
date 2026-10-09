import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { authorize, useStore, type Asset, type Auth, type Base, type CardKind, type Dispatch, type Finish, type MerchantId, type Network, type State } from './store';

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

// ---------- context ----------

interface Api {
  state: State;
  dispatch: Dispatch;
  pay: (id: MerchantId) => Auth;
  issue: (o: { finish: Finish; name: string; kind: CardKind; base: Base }) => void;
  fund: (asset: Asset, network: Network, amount: number) => void;
  refund: (id: string) => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useStore();
  const api = useMemo<Api>(() => ({
    state,
    dispatch,
    pay: (id) => {
      const auth = authorize(state, id);
      dispatch({ type: 'pay', auth });
      emitPulse(auth.ok ? 'paid' : 'declined');
      return auth;
    },
    issue: (o) => { dispatch({ type: 'issue', ...o }); emitPulse('issued'); },
    fund: (asset, network, amount) => { dispatch({ type: 'fund', asset, network, amount }); emitPulse('funded'); },
    refund: (id) => { dispatch({ type: 'refund', id }); emitPulse('refunded'); },
  }), [state, dispatch]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
