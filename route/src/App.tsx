import { useCallback, useEffect, useMemo, useState } from 'react';
import { SEED, NOW, isActive, inTransit, isThisWeek, type Shipment } from './data';
import { useI18n } from './i18n';
import { Sidebar, BottomNav, TopBar } from './components/Nav';
import { ListPane } from './components/List';
import { Detail } from './components/Detail';
import { AddModal, ReportModal } from './components/Modals';
import { Settings } from './components/Settings';

export type View = 'overview' | 'arriving' | 'transit' | 'delivered' | 'archived' | 'settings' | 'today';
export interface Prefs { notify: boolean; showDelivered: boolean; reduceMotion: boolean }
interface Persisted { shipments: Shipment[]; read: string[]; prefs: Prefs }

const KEY = 'route-v2';
const DEFAULT_PREFS: Prefs = { notify: true, showDelivered: true, reduceMotion: false };
const load = (): Persisted => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw?.shipments?.length) return { prefs: DEFAULT_PREFS, read: [], ...raw };
  } catch { /* ignore */ }
  return { shipments: SEED, read: [], prefs: DEFAULT_PREFS };
};

export interface Notice { id: string; ship: string; title: string; at: string }

export default function App() {
  const { t } = useI18n();
  const [data, setData] = useState<Persisted>(load);
  const [view, setView] = useState<View>('overview');
  const [selected, setSelected] = useState<string | null>('s1');
  const [mobileDetail, setMobileDetail] = useState(false);
  const [adding, setAdding] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);
  useEffect(() => {
    document.documentElement.classList.toggle('calm', data.prefs.reduceMotion);
  }, [data.prefs.reduceMotion]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(id);
  }, [toast]);

  const ships = data.shipments;
  const patch = useCallback((id: string, p: Partial<Shipment>) => setData((d) => ({ ...d, shipments: d.shipments.map((s) => (s.id === id ? { ...s, ...p } : s)) })), []);

  const notices: Notice[] = useMemo(() => {
    const base: Notice[] = [
      { id: 'n1', ship: 's1', title: 'Package arriving today', at: new Date(2026, 9, 6, 8, 31).toISOString() },
      { id: 'n2', ship: 's6', title: 'Delivery delayed', at: new Date(2026, 9, 5, 18, 5).toISOString() },
      { id: 'n3', ship: 's9', title: 'Parcel delivered', at: new Date(2026, 9, 5, 15, 42).toISOString() },
    ];
    const added = ships.filter((s) => s.added).map((s) => ({ id: 'a-' + s.id, ship: s.id, title: 'Tracking added', at: s.updated }));
    return [...added, ...base];
  }, [ships]);

  const counts = {
    arriving: ships.filter((s) => isActive(s) && isThisWeek(s)).length,
    transit: ships.filter(inTransit).length,
    delivered: ships.filter((s) => s.status === 'delivered' && !s.archived).length,
    archived: ships.filter((s) => s.archived).length,
  };

  const select = (id: string) => { setSelected(id); setMobileDetail(true); };
  const go = (v: View) => { setView(v); setMobileDetail(false); window.scrollTo({ top: 0 }); };

  const archive = (id: string, on: boolean) => {
    patch(id, { archived: on });
    setToast({ msg: on ? t('Moved to archive') : t('Restored from archive'), undo: () => patch(id, { archived: !on }) });
  };

  const addShipment = (s: Shipment) => {
    setData((d) => ({ ...d, shipments: [s, ...d.shipments] }));
    setSelected(s.id);
    setView('overview');
    setMobileDetail(true);
    setAdding(false);
    setToast({ msg: t('{name} added', { name: t(s.product) }) });
  };

  const current = ships.find((s) => s.id === selected) ?? null;
  const showDetail = view !== 'settings';

  return (
    <div className={'app' + (mobileDetail && current ? ' m-detail' : '')}>
      <a href="#list" className="skip">{t('Skip to deliveries')}</a>
      <Sidebar view={view} go={go} counts={counts} onAdd={() => setAdding(true)} />
      <div className="workspace">
        <TopBar notices={notices} read={data.read} onRead={(ids) => setData((d) => ({ ...d, read: Array.from(new Set([...d.read, ...ids])) }))} onOpen={(id) => { select(id); if (ships.find((s) => s.id === id)?.archived) setView('archived'); }} notify={data.prefs.notify} />
        {view === 'settings' ? (
          <Settings prefs={data.prefs} setPrefs={(p) => setData((d) => ({ ...d, prefs: { ...d.prefs, ...p } }))}
            onReset={() => { setData({ shipments: SEED, read: [], prefs: DEFAULT_PREFS }); setSelected('s1'); setToast({ msg: t('Demo data restored') }); }} />
        ) : (
          <div className="panes">
            <ListPane view={view} ships={ships} selected={selected} onSelect={select} prefs={data.prefs} go={go} />
            {showDetail && (
              <Detail
                ship={current}
                onBack={() => setMobileDetail(false)}
                onArchive={archive}
                onReport={(id) => setReporting(id)}
                notify={(msg) => setToast({ msg })}
              />
            )}
          </div>
        )}
      </div>
      <BottomNav view={view} go={go} onAdd={() => setAdding(true)} />
      {adding && <AddModal onClose={() => setAdding(false)} onAdd={addShipment} existing={ships.map((s) => s.tracking.replace(/\s/g, ''))} />}
      {reporting && (
        <ReportModal
          ship={ships.find((s) => s.id === reporting)!}
          onClose={() => setReporting(null)}
          onSubmit={(reason) => { patch(reporting, { issue: reason, updated: NOW.toISOString() }); setReporting(null); setToast({ msg: t('Issue reported. The carrier will reply within 24 hours.') }); }}
        />
      )}
      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.msg}>
            <span>{toast.msg}</span>
            {toast.undo && <button onClick={() => { toast.undo!(); setToast(null); }}>{t('Undo')}</button>}
          </div>
        )}
      </div>
    </div>
  );
}
