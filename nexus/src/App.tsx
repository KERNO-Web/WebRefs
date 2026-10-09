import { useCallback, useEffect, useRef, useState } from 'react';
import { AppProvider } from './ctx';
import { Landing } from './site/Landing';
import { DemoApp, TABS, type Tab } from './demo/DemoApp';

/** #demo, #demo/card, #demo/activity, #demo/settings open the app; anything else is the site. */
const parse = (): Tab | null => {
  const m = location.hash.match(/^#demo(?:\/(\w+))?$/);
  if (!m) return null;
  return TABS.includes(m[1] as Tab) ? (m[1] as Tab) : 'home';
};

export default function App() {
  const [tab, setTabState] = useState<Tab | null>(parse);
  const siteY = useRef(0);

  useEffect(() => {
    const on = () => setTabState(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  // coming back from the app returns the visitor to where they left the site
  const wasDemo = useRef(tab !== null);
  useEffect(() => {
    if (tab === null && wasDemo.current) requestAnimationFrame(() => window.scrollTo(0, siteY.current));
    wasDemo.current = tab !== null;
  }, [tab]);

  const openDemo = useCallback((t: string = 'home') => {
    siteY.current = window.scrollY;
    location.hash = t === 'home' ? 'demo' : 'demo/' + t;
  }, []);
  const setTab = useCallback((t: Tab) => { history.replaceState(null, '', t === 'home' ? '#demo' : '#demo/' + t); setTabState(t); }, []);
  const exit = useCallback(() => {
    history.pushState(null, '', location.pathname + location.search);
    setTabState(null);
  }, []);

  return (
    <AppProvider>
      {tab ? <DemoApp tab={tab} setTab={setTab} onExit={exit} /> : <Landing openDemo={openDemo} />}
    </AppProvider>
  );
}
