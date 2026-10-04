import { useState } from 'react';
import type { Prefs } from '../App';
import { useI18n, LangToggle } from '../i18n';

function Row({ title, desc, on, onChange }: { title: string; desc: string; on: boolean; onChange: () => void }) {
  return (
    <div className="set-row">
      <div><b>{title}</b><p className="muted">{desc}</p></div>
      <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={title} onClick={onChange}><span /></button>
    </div>
  );
}

export function Settings({ prefs, setPrefs, onReset }: { prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void; onReset: () => void }) {
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="settings">
      <header className="greet small"><h1>{t('Settings')}</h1><p>{t('Saved on this device.')}</p></header>
      <section className="set-group">
        <h2 className="sec-label">{t('Notifications')}</h2>
        <Row title={t('Delivery updates')} desc={t('Show alerts for arrivals, delays and deliveries.')} on={prefs.notify} onChange={() => setPrefs({ notify: !prefs.notify })} />
      </section>
      <section className="set-group">
        <h2 className="sec-label">{t('Display')}</h2>
        <Row title={t('Show delivered on Overview')} desc={t('Keep recently delivered items in the main list.')} on={prefs.showDelivered} onChange={() => setPrefs({ showDelivered: !prefs.showDelivered })} />
        <Row title={t('Reduce motion')} desc={t('Turn off map and timeline animations.')} on={prefs.reduceMotion} onChange={() => setPrefs({ reduceMotion: !prefs.reduceMotion })} />
        <div className="set-row">
          <div><b>{t('Language')}</b><p className="muted">English · Русский</p></div>
          <LangToggle />
        </div>
      </section>
      <section className="set-group">
        <h2 className="sec-label">{t('Delivery address')}</h2>
        <div className="set-row"><div><b>{t('Home')}</b><p className="muted">Lindenstraße 14, 10969 Berlin</p></div></div>
      </section>
      <section className="set-group">
        <h2 className="sec-label">{t('Demo data')}</h2>
        <div className="set-row">
          <div><b>{t('Reset deliveries')}</b><p className="muted">{t('Restore the original 12 shipments and remove added ones.')}</p></div>
          {confirm ? (
            <span className="confirm">
              <button className="btn ghost" onClick={() => setConfirm(false)}>{t('Cancel')}</button>
              <button className="btn danger-solid" onClick={() => { onReset(); setConfirm(false); }}>{t('Reset')}</button>
            </span>
          ) : <button className="btn ghost" onClick={() => setConfirm(true)}>{t('Reset')}</button>}
        </div>
      </section>
    </div>
  );
}
