import { useEffect, useRef, useState } from 'react';
import { NOW, lookup, type Carrier, type Shipment } from '../data';
import { useI18n } from '../i18n';
import { Icon } from './Icon';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input, textarea, button:not(.close)')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('input, select, textarea, button:not(:disabled)');
        const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('locked'); prev?.focus?.(); };
  }, []);
  return (
    <div className="modal-root">
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="m-title" ref={ref}>
        <div className="m-head">
          <h2 id="m-title">{title}</h2>
          <button className="icon-btn close" onClick={onClose} aria-label={t('Close')}><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const CARRIERS: Carrier[] = ['NorthPost', 'ExpressOne', 'Global Parcel', 'DHL', 'City Courier'];

export function AddModal({ onClose, onAdd, existing }: { onClose: () => void; onAdd: (s: Shipment) => void; existing: string[] }) {
  const { t, day, date } = useI18n();
  const [num, setNum] = useState('');
  const [carrier, setCarrier] = useState<'auto' | Carrier>('auto');
  const [name, setName] = useState('');
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const found = clean.length >= 6 ? lookup(clean) : null;
  const finalCarrier = carrier === 'auto' ? found?.carrier ?? null : carrier;
  const dup = existing.includes(clean);
  const ready = clean.length >= 6 && !!finalCarrier && !dup;
  const eta = found?.eta ?? (() => { const e = new Date(NOW); e.setDate(e.getDate() + 3); return e.toISOString(); })();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const product = name.trim() || found?.product || 'Parcel';
    onAdd({
      id: 'u' + Date.now(), product, store: found?.store ?? finalCarrier!, carrier: finalCarrier!, tracking: clean, status: 'shipped',
      eta, origin: t('Awaiting first scan'), destination: 'Lindenstraße 14, Berlin', weight: '—', updated: NOW.toISOString(), kind: 'parcel', added: true,
      events: [
        { label: 'Tracking added', at: NOW.toISOString() },
        { label: 'Shipped', at: NOW.toISOString(), place: finalCarrier! },
        { label: 'In transit', at: null },
        { label: 'Delivered', at: null },
      ],
    });
  };

  return (
    <Modal title={t('Add tracking')} onClose={onClose}>
      <form onSubmit={submit} className="add-form">
        <label className="field">
          <span>{t('Tracking number')}</span>
          <input className="mono" value={num} onChange={(e) => setNum(e.target.value.toUpperCase())} placeholder="RQ84299318" autoComplete="off" spellCheck={false} aria-describedby="detect" />
        </label>
        {!num && (
          <button type="button" className="try" onClick={() => setNum('RQ84299318')}>{t('Try a demo number')}: <span className="mono">RQ84299318</span></button>
        )}
        <label className="field">
          <span>{t('Carrier')}</span>
          <select value={carrier} onChange={(e) => setCarrier(e.target.value as 'auto' | Carrier)}>
            <option value="auto">{t('Auto detect')}</option>
            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="field">
          <span>{t('Name')} <em className="muted">{t('Optional')}</em></span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={found?.product ? t(found.product) : t('e.g. Birthday gift')} />
        </label>

        <div id="detect" className={'detect' + (found || (carrier !== 'auto' && clean.length >= 6) ? ' ok' : clean.length >= 6 ? ' miss' : '')} aria-live="polite">
          {dup ? (
            <p>{t('This tracking number is already in your list.')}</p>
          ) : clean.length < 6 ? (
            <p className="muted">{t('Formats we recognise: NP…, RQ… NorthPost · EX… ExpressOne · GL… Global Parcel')}</p>
          ) : finalCarrier ? (
            <>
              <span className="eyebrow">{carrier === 'auto' ? t('Detected') : t('Selected')}</span>
              <b>{finalCarrier}</b>
              <span>{name.trim() || (found?.product ? t(found.product) : t('Parcel'))}</span>
              <span className="muted">{t('Estimated')} {day(eta)} · {date(eta)}</span>
            </>
          ) : (
            <p>{t('Carrier not recognised. Choose it from the list above.')}</p>
          )}
        </div>
        <div className="m-actions">
          <button type="button" className="btn ghost" onClick={onClose}>{t('Cancel')}</button>
          <button type="submit" className="btn primary" disabled={!ready}>{t('Add delivery')}</button>
        </div>
      </form>
    </Modal>
  );
}

const REASONS = ['Package is late', 'Marked delivered, not received', 'Package arrived damaged', 'Wrong address', 'Something else'];

export function ReportModal({ ship, onClose, onSubmit }: { ship: Shipment; onClose: () => void; onSubmit: (reason: string) => void }) {
  const { t } = useI18n();
  const [reason, setReason] = useState(ship.status === 'delayed' ? REASONS[0] : '');
  const [note, setNote] = useState('');
  return (
    <Modal title={t('Report issue')} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (reason) onSubmit(reason); }} className="add-form">
        <p className="muted">{t('{product} · {carrier}', { product: t(ship.product), carrier: ship.carrier })}</p>
        <fieldset className="reasons">
          <legend className="sr-only">{t('Reason')}</legend>
          {REASONS.map((r) => (
            <label key={r} className={'reason' + (reason === r ? ' on' : '')}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              <span className="radio" aria-hidden="true" />
              {t(r)}
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>{t('Details')} <em className="muted">{t('Optional')}</em></span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('Anything the carrier should know')} />
        </label>
        <div className="m-actions">
          <button type="button" className="btn ghost" onClick={onClose}>{t('Cancel')}</button>
          <button type="submit" className="btn primary" disabled={!reason}>{t('Send report')}</button>
        </div>
      </form>
    </Modal>
  );
}
