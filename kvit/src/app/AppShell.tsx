import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import type { Key } from '../lib/dict';
import { href, navigate } from '../lib/router';
import { useDemo } from '../lib/store';
import { Icon, type IconName } from '../ui/icons';
import { Button, LangSwitch, Logo, SandboxBadge } from '../ui/ui';
import { RatesTicker } from './RatesTicker';

export type Section = 'overview' | 'pos' | 'invoices' | 'links' | 'transactions' | 'settings';

const NAV: { id: Section; icon: IconName; label: Key; short: Key }[] = [
  { id: 'overview', icon: 'overview', label: 'nav_overview', short: 'nav_overview' },
  { id: 'pos', icon: 'terminal', label: 'nav_pos', short: 'nav_pos' },
  { id: 'transactions', icon: 'list', label: 'nav_transactions', short: 'nav_transactions_short' },
  { id: 'invoices', icon: 'invoice', label: 'nav_invoices', short: 'nav_invoices' },
  { id: 'links', icon: 'link', label: 'nav_links', short: 'nav_links_short' },
  { id: 'settings', icon: 'settings', label: 'nav_settings', short: 'nav_settings' },
];

export function AppShell({ section, children }: { section: Section; children: ReactNode }) {
  const { t } = useI18n();
  const demo = useDemo();
  const pendingCount = demo.payments.filter((p) => p.status === 'pending' || p.status === 'processing').length;

  return (
    <div className="app">
      <aside className="side">
        <a className="side-brand" href={href('/')} aria-label={t('back_to_site')}>
          <Logo />
        </a>
        <div className="side-merchant">
          <span className="side-avatar" aria-hidden="true">
            KC
          </span>
          <span className="side-merchant-text">
            <b>{demo.merchant.name}</b>
            <SandboxBadge small />
          </span>
        </div>
        <nav className="side-nav" aria-label={t('nav_app')}>
          {NAV.map((n) => (
            <a key={n.id} href={href(`/app/${n.id}`)} className={section === n.id ? 'is-on' : ''} aria-current={section === n.id ? 'page' : undefined}>
              <Icon name={n.icon} size={19} />
              <span>{t(n.label)}</span>
              {n.id === 'transactions' && pendingCount > 0 && <span className="side-count">{pendingCount}</span>}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <RatesTicker />
          <div className="side-foot-row">
            <LangSwitch />
            <a className="side-site" href={href('/')}>
              {t('back_to_site')}
            </a>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <a className="topbar-brand" href={href('/')} aria-label={t('back_to_site')}>
            <Logo />
          </a>
          <SandboxBadge small />
          <div className="topbar-spacer" />
          <LangSwitch />
          <a className={`icon-btn${section === 'settings' ? ' is-on' : ''}`} href={href('/app/settings')} aria-label={t('nav_settings')}>
            <Icon name="settings" size={20} />
          </a>
        </header>
        <div className="sandbox-strip" role="note">
          <Icon name="info" size={15} />
          <span>{t('sandbox_strip')}</span>
        </div>
        <main className="app-content" id="main">
          {children}
        </main>
      </div>

      <nav className="tabbar" aria-label={t('nav_app')}>
        {NAV.filter((n) => n.id !== 'settings').map((n) => (
          <a key={n.id} href={href(`/app/${n.id}`)} className={section === n.id ? 'is-on' : ''} aria-current={section === n.id ? 'page' : undefined}>
            <Icon name={n.icon} size={22} />
            <span>{t(n.short)}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

export function PageHead({ title, sub, actions, back }: { title: string; sub?: ReactNode; actions?: ReactNode; back?: { label: string; to: string } }) {
  return (
    <div className="page-head">
      {back && (
        <a className="page-back" href={href(back.to)}>
          <Icon name="back" size={16} />
          {back.label}
        </a>
      )}
      <div className="page-head-row">
        <div className="page-head-text">
          <h1>{title}</h1>
          {sub && <p className="page-sub">{sub}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function NewPaymentButton() {
  const { t } = useI18n();
  return (
    <Button variant="primary" icon="plus" onClick={() => navigate('/app/pos')}>
      {t('new_payment')}
    </Button>
  );
}
