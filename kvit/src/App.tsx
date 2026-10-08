import { useEffect, useRef } from 'react';
import { AppShell, type Section } from './app/AppShell';
import { Invoices } from './app/Invoices';
import { Links } from './app/Links';
import { Overview } from './app/Overview';
import { Settings } from './app/Settings';
import { Terminal } from './app/Terminal';
import { Transactions } from './app/Transactions';
import { CheckoutPage } from './checkout/CheckoutPage';
import { useI18n } from './lib/i18n';
import { navigate, useRoute } from './lib/router';
import { Landing } from './site/Landing';
import { Toasts } from './ui/ui';

const SECTIONS: Section[] = ['overview', 'pos', 'invoices', 'links', 'transactions', 'settings'];

export function App() {
  const route = useRoute();
  const { t } = useI18n();
  const [root, section, id] = route.parts;
  const lastPath = useRef('');

  // keep the scroll position when only a detail drawer opens or closes
  useEffect(() => {
    const key = root === 'app' && (section === 'transactions' || (section === 'links' && id === 'new')) ? `${root}/${section}` : route.parts.join('/');
    if (key !== lastPath.current) window.scrollTo(0, 0);
    lastPath.current = key;
  }, [route, root, section, id]);

  useEffect(() => {
    if (root === 'app' && !SECTIONS.includes(section as Section)) navigate('/app/overview', { replace: true });
  }, [root, section]);

  useEffect(() => {
    if (root === 'app') document.title = `${t('nav_' + (section === 'pos' ? 'pos' : section) as 'nav_pos')} · Kvit`;
  }, [root, section, t]);

  let page: JSX.Element;
  if (root === 'pay' && section) {
    page = <CheckoutPage key={section} id={section} />;
  } else if (root === 'app') {
    const s = (SECTIONS.includes(section as Section) ? section : 'overview') as Section;
    page = (
      <AppShell section={s}>
        {s === 'overview' && <Overview />}
        {s === 'pos' && <Terminal key={id ?? 'entry'} id={id} />}
        {s === 'transactions' && <Transactions id={id} />}
        {s === 'invoices' && <Invoices key={id ?? 'list'} id={id} />}
        {s === 'links' && <Links id={id} />}
        {s === 'settings' && <Settings />}
      </AppShell>
    );
  } else {
    page = <Landing />;
  }

  return (
    <>
      {page}
      <Toasts />
    </>
  );
}
