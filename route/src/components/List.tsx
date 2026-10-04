import { useMemo, useRef, useState } from 'react';
import type { View, Prefs } from '../App';
import { NOW, isActive, isToday, isThisWeek, inTransit, photoOf, type Shipment, type Status } from '../data';
import { useI18n, type T } from '../i18n';
import { Icon } from './Icon';

export const STATUS_LABEL: Record<Status, string> = {
  processing: 'Processing', shipped: 'Shipped', in_transit: 'In transit', customs: 'Customs',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', delayed: 'Delayed',
};
export const KIND_ICON = { parcel: 'box', box: 'box', groceries: 'bag', documents: 'doc' } as const;

export function StatusTag({ s }: { s: Shipment }) {
  const { t } = useI18n();
  return <span className={'status st-' + s.status}><span className="sdot" aria-hidden="true" />{t(STATUS_LABEL[s.status])}</span>;
}

export function useEta() {
  const { t, day, time } = useI18n();
  return (s: Shipment): [string, string] => {
    if (s.status === 'delivered' && s.delivered) return [t('Delivered'), `${day(s.delivered.at)} ${time(s.delivered.at)}`];
    if (s.status === 'delayed') return [t('New ETA'), day(s.eta)];
    const d = day(s.eta);
    const today = isToday(s);
    return [today ? t('Arriving today') : t('Arriving {day}', { day: d }), s.window ? t(s.window) : ''];
  };
}

export function Thumb({ s, size = 'sm' }: { s: Shipment; size?: 'sm' | 'lg' }) {
  return <span className={'thumb ' + size} aria-hidden="true"><img src={photoOf(s)} alt="" width="240" height="240" loading="lazy" /></span>;
}

function Card({ s, on, onSelect, t }: { s: Shipment; on: boolean; onSelect: () => void; t: T }) {
  const eta = useEta()(s);
  return (
    <button className={'card' + (on ? ' on' : '') + (s.status === 'delivered' ? ' done' : '')} onClick={onSelect} aria-current={on ? 'true' : undefined} data-id={s.id}>
      <Thumb s={s} />
      <span className="card-main">
        <span className="store">{s.store}</span>
        <span className="product">{t(s.product)}</span>
        <StatusTag s={s} />
      </span>
      <span className="card-side">
        <span className="eta-a">{eta[0]}</span>
        {eta[1] && <span className="eta-b">{eta[1]}</span>}
        <span className="carrier"><span className="carrier-name">{s.carrier}</span> <span className="mono">#{s.tracking.replace(/\s/g, '').slice(-4)}</span></span>
      </span>
    </button>
  );
}

const scheduleTime = (s: Shipment, time: (iso: string) => string) => {
  if (s.status === 'delivered' && s.delivered) return time(s.delivered.at);
  if (s.window) return s.window.replace(/^around\s*/, '');
  return '—';
};

export function TodaySchedule({ ships, onSelect, big = false }: { ships: Shipment[]; onSelect: (id: string) => void; big?: boolean }) {
  const { t, locale, time } = useI18n();
  const items = ships.filter((s) => !s.archived && isToday(s)).sort((a, b) => scheduleTime(a, time).localeCompare(scheduleTime(b, time)));
  const title = NOW.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <section className={'today' + (big ? ' big' : '')} aria-labelledby="today-h">
      <h2 id="today-h" className="sec-label">{t('Today')} · <span className="cap">{title}</span></h2>
      {items.length ? (
        <ol className="sched">
          {items.map((s) => (
            <li key={s.id}>
              <button onClick={() => onSelect(s.id)} className={s.status === 'delivered' ? 'past' : ''}>
                <span className="sched-time mono">{scheduleTime(s, time)}</span>
                <span className="sched-line" aria-hidden="true" />
                <span className="sched-name">{t(s.product)}</span>
                <span className="sched-state">{s.status === 'delivered' ? t('Delivered') : t('Expected')}</span>
              </button>
            </li>
          ))}
        </ol>
      ) : <p className="muted">{t('Nothing arriving today.')}</p>}
    </section>
  );
}

type Filter = 'all' | 'today' | 'week' | 'delayed' | 'delivered';
const FILTERS: [Filter, string][] = [['all', 'All'], ['today', 'Today'], ['week', 'This week'], ['delayed', 'Delayed'], ['delivered', 'Delivered']];
const TITLES: Partial<Record<View, string>> = { arriving: 'Arriving', transit: 'In transit', delivered: 'Delivered', archived: 'Archived', today: 'Today' };

export function ListPane({ view, ships, selected, onSelect, prefs, go }: { view: View; ships: Shipment[]; selected: string | null; onSelect: (id: string) => void; prefs: Prefs; go: (v: View) => void }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const listRef = useRef<HTMLDivElement>(null);

  const base = useMemo(() => {
    switch (view) {
      case 'arriving': return ships.filter((s) => isActive(s) && isThisWeek(s));
      case 'transit': return ships.filter(inTransit);
      case 'delivered': return ships.filter((s) => s.status === 'delivered' && !s.archived);
      case 'archived': return ships.filter((s) => s.archived);
      case 'today': return ships.filter((s) => !s.archived && isToday(s));
      default: return ships.filter((s) => !s.archived && (prefs.showDelivered || s.status !== 'delivered'));
    }
  }, [view, ships, prefs.showDelivered]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return base.filter((s) => {
      if (view === 'overview') {
        if (filter === 'today' && !isToday(s)) return false;
        if (filter === 'week' && !(isActive(s) && isThisWeek(s))) return false;
        if (filter === 'delayed' && s.status !== 'delayed') return false;
        if (filter === 'delivered' && s.status !== 'delivered') return false;
      }
      if (!term) return true;
      return [s.product, t(s.product), s.store, s.tracking, s.tracking.replace(/\s/g, ''), s.carrier].some((x) => x.toLowerCase().includes(term));
    });
  }, [base, q, filter, view, t]);

  const groups = useMemo(() => {
    if (view !== 'overview') return [['', list]] as [string, Shipment[]][];
    const g: [string, Shipment[]][] = [
      ['Today', list.filter((s) => isToday(s) && s.status !== 'delivered')],
      ['This week', list.filter((s) => !isToday(s) && isActive(s) && isThisWeek(s))],
      ['Later', list.filter((s) => isActive(s) && !isThisWeek(s))],
      ['Delivered', list.filter((s) => s.status === 'delivered')],
    ];
    return g.filter(([, l]) => l.length);
  }, [list, view]);

  const week = ships.filter((s) => isActive(s) && isThisWeek(s)).length;
  const today = ships.filter((s) => isActive(s) && isToday(s)).length;
  const transit = ships.filter(inTransit).length;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const ids = list.map((s) => s.id);
    const i = ids.indexOf(selected ?? '');
    const next = ids[Math.max(0, Math.min(ids.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
    if (next) {
      e.preventDefault();
      onSelect(next);
      listRef.current?.querySelector<HTMLElement>(`[data-id="${next}"]`)?.focus();
    }
  };

  return (
    <div className="list-pane" id="list">
      {view === 'overview' || view === 'today' ? (
        <header className="greet">
          <h1>{view === 'today' ? t('Today') : t('Good morning.')}</h1>
          <p className="summary" aria-label={t('Summary')}>
            <span><b>{today}</b> {t('today')}</span>
            <span><b>{week}</b> {t('this week')}</span>
            <span><b>{transit}</b> {t('in transit')}</span>
          </p>
        </header>
      ) : (
        <header className="greet small">
          <h1>{t(TITLES[view]!)}</h1>
          <p>{t('{n} deliveries', { n: base.length })}</p>
        </header>
      )}

      {(view === 'overview' || view === 'today') && <TodaySchedule ships={ships} onSelect={onSelect} big={view === 'today'} />}

      {view !== 'today' && (
        <div className="tools">
          <label className="search">
            <Icon name="search" size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search product, store, tracking, courier')} aria-label={t('Search deliveries')} />
            {q && <button onClick={() => setQ('')} aria-label={t('Clear search')}><Icon name="close" size={16} /></button>}
          </label>
          {view === 'overview' && (
            <div className="filters" role="radiogroup" aria-label={t('Filter')}>
              {FILTERS.map(([id, label]) => (
                <button key={id} role="radio" aria-checked={filter === id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{t(label)}</button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="cards" ref={listRef} onKeyDown={onKey}>
        {list.length === 0 ? (
          <div className="empty">
            <p>{q ? t('No deliveries match “{q}”.', { q }) : view === 'archived' ? t('Archive is empty. Delivered items you archive will appear here.') : t('Nothing here right now.')}</p>
            {(q || filter !== 'all') && <button className="btn ghost" onClick={() => { setQ(''); setFilter('all'); }}>{t('Clear filters')}</button>}
            {view === 'archived' && !q && <button className="btn ghost" onClick={() => go('delivered')}>{t('Go to delivered')}</button>}
          </div>
        ) : groups.map(([label, items]) => (
          <section key={label || 'all'} aria-label={label ? t(label) : undefined}>
            {label && <h2 className="sec-label">{t(label)} <span className="muted">{items.length}</span></h2>}
            <div className="card-list">
              {items.map((s) => <Card key={s.id} s={s} on={s.id === selected} onSelect={() => onSelect(s.id)} t={t} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
