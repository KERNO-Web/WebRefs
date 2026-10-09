import { useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './ctx';
import { Landing } from './site/Landing';
import { Entry } from './site/Entry';
import { Onboarding } from './onboarding/Onboarding';
import { AppShell, TABS, type Tab } from './app/AppShell';
import { Toasts } from './components/ui';

/**
 * Routes live in the hash so GitHub Pages serves one file:
 *   ''            landing (+ entry dialog)
 *   #start        onboarding for a fresh account
 *   #app, #app/x  the product (old #demo links land here too)
 */
type Route = { name: 'site' } | { name: 'start' } | { name: 'app'; tab: Tab };
const parse = (): Route => {
  const h = location.hash.replace(/^#\/?/, '');
  if (h === 'start') return { name: 'start' };
  const m = h.match(/^(?:app|demo)(?:\/(\w+))?$/);
  if (m) return { name: 'app', tab: TABS.includes(m[1] as Tab) ? (m[1] as Tab) : 'home' };
  return { name: 'site' };
};

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

function Router() {
  const { state } = useApp();
  const [route, setRoute] = useState<Route>(parse);
  const [entry, setEntry] = useState(false);
  const siteY = useRef(0);

  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = useCallback((r: string) => {
    setEntry(false);
    if (r === '') {
      history.pushState(null, '', location.pathname + location.search);
      setRoute({ name: 'site' });
      requestAnimationFrame(() => window.scrollTo(0, siteY.current));
      return;
    }
    if (parse().name === 'site') siteY.current = window.scrollY;
    location.hash = r;
  }, []);
  const setTab = useCallback((t: Tab) => { history.replaceState(null, '', t === 'home' ? '#app' : '#app/' + t); setRoute({ name: 'app', tab: t }); }, []);

  // the product needs an account: without one, the visitor picks a path first
  const blocked = route.name === 'app' && !state.card;
  useEffect(() => {
    if (!blocked) return;
    if (state.path === 'fresh') location.replace('#start');
    else { history.replaceState(null, '', location.pathname); setRoute({ name: 'site' }); setEntry(true); }
  }, [blocked, state.path]);

  if (route.name === 'start') return <><Onboarding go={go} /><Toasts /></>;
  if (route.name === 'app' && state.card) return <AppShell tab={route.tab} setTab={setTab} go={go} />;
  return (
    <>
      <Landing onEnter={() => setEntry(true)} dimmed={entry} />
      {entry && <Entry onClose={() => setEntry(false)} go={go} />}
    </>
  );
}
