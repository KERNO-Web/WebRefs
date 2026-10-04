import { useEffect, useRef, useState } from 'react';
import type { View, Notice } from '../App';
import { useI18n, LangToggle } from '../i18n';
import { Icon } from './Icon';

export function Logo() {
  return (
    <span className="logo">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="7" fill="var(--accent)" />
        <circle cx="7.5" cy="18.5" r="2" fill="#fff" />
        <path d="M9.5 18.5 H15 a3.2 3.2 0 0 0 0 -6.4 H11 a3.2 3.2 0 0 1 0 -6.4 H17.5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="19" cy="5.7" r="1.6" fill="none" stroke="#fff" strokeWidth="1.4" />
      </svg>
      ROUTE
    </span>
  );
}

const ITEMS: { id: View; label: string; icon: string; count?: 'arriving' | 'transit' | 'delivered' | 'archived' }[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'arriving', label: 'Arriving', icon: 'calendar', count: 'arriving' },
  { id: 'transit', label: 'In transit', icon: 'truck', count: 'transit' },
  { id: 'delivered', label: 'Delivered', icon: 'check', count: 'delivered' },
  { id: 'archived', label: 'Archived', icon: 'archive', count: 'archived' },
];

export function Sidebar({ view, go, counts, onAdd }: { view: View; go: (v: View) => void; counts: Record<string, number>; onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <aside className="sidebar">
      <Logo />
      <button className="btn primary wide add-btn" onClick={onAdd}><Icon name="plus" />{t('Add tracking')}</button>
      <nav aria-label={t('Sections')}>
        {ITEMS.map((it) => (
          <button key={it.id} className={'nav-item' + (view === it.id ? ' on' : '')} aria-current={view === it.id ? 'page' : undefined} onClick={() => go(it.id)}>
            <Icon name={it.icon} />
            <span>{t(it.label)}</span>
            {it.count && counts[it.count] > 0 && <span className="count">{counts[it.count]}</span>}
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <button className={'nav-item' + (view === 'settings' ? ' on' : '')} aria-current={view === 'settings' ? 'page' : undefined} onClick={() => go('settings')}>
          <Icon name="settings" /><span>{t('Settings')}</span>
        </button>
        <LangToggle />
      </div>
    </aside>
  );
}

export function TopBar({ notices, read, onRead, onOpen, notify }: { notices: Notice[]; read: string[]; onRead: (ids: string[]) => void; onOpen: (ship: string) => void; notify: boolean }) {
  const { t, day, time } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notices.filter((n) => !read.includes(n.id));
  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', click); document.removeEventListener('keydown', key); };
  }, [open]);

  return (
    <header className="topbar">
      <span className="m-logo"><Logo /></span>
      <div className="top-right">
        <span className="m-lang"><LangToggle /></span>
        <div className="bell-wrap" ref={ref}>
          <button className="icon-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)} aria-label={t('Notifications ({n} unread)', { n: notify ? unread.length : 0 })}>
            <Icon name="bell" />
            {notify && unread.length > 0 && <span className="badge-dot">{unread.length}</span>}
          </button>
          {open && (
            <div className="dropdown" role="dialog" aria-label={t('Notifications')}>
              <div className="dd-head">
                <b>{t('Notifications')}</b>
                {notify && unread.length > 0 && <button className="link" onClick={() => onRead(notices.map((n) => n.id))}>{t('Mark all as read')}</button>}
              </div>
              {!notify && <p className="dd-off">{t('Notifications are turned off in Settings.')}</p>}
              <ul>
                {notices.map((n) => (
                  <li key={n.id}>
                    <button className={'dd-item' + (read.includes(n.id) ? '' : ' unread')} onClick={() => { onRead([n.id]); onOpen(n.ship); setOpen(false); }}>
                      <span className="dd-dot" aria-hidden="true" />
                      <span className="dd-text"><b>{t(n.title)}</b><span className="muted">{day(n.at)} {time(n.at)}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ view, go, onAdd }: { view: View; go: (v: View) => void; onAdd: () => void }) {
  const { t } = useI18n();
  const items: [View | 'add', string, string][] = [['overview', 'Home', 'home'], ['today', 'Today', 'calendar'], ['add', 'Add', 'plus'], ['archived', 'Archive', 'archive']];
  return (
    <nav className="bottom-nav" aria-label={t('Sections')}>
      {items.map(([id, label, icon]) => (
        <button key={id} className={(view === id ? 'on' : '') + (id === 'add' ? ' add' : '')} aria-current={view === id ? 'page' : undefined} onClick={() => (id === 'add' ? onAdd() : go(id))}>
          <Icon name={icon} />
          <span>{t(label)}</span>
        </button>
      ))}
    </nav>
  );
}
