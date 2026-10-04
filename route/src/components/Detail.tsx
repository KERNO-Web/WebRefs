import { useEffect, useRef, useState } from 'react';
import { NOW, isToday, type Shipment } from '../data';
import { useI18n } from '../i18n';
import { Icon } from './Icon';
import { StatusTag, Thumb } from './List';
import { RouteMap } from './RouteMap';

export function Detail({ ship, onBack, onArchive, onReport, notify }: {
  ship: Shipment | null; onBack: () => void; onArchive: (id: string, on: boolean) => void; onReport: (id: string) => void; notify: (m: string) => void;
}) {
  const { t, day, time, date, stamp } = useI18n();
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: 0 }); setCopied(false); }, [ship?.id]);

  if (!ship) {
    return (
      <section className="detail empty-detail" aria-label={t('Delivery details')}>
        <Icon name="box" size={36} />
        <p>{t('Select a delivery to see where it is.')}</p>
      </section>
    );
  }

  const s = ship;
  const today = isToday(s);
  const currentIdx = s.events.findIndex((e) => !e.at) - 1;
  const copy = () => {
    navigator.clipboard?.writeText(s.tracking.replace(/\s/g, '')).catch(() => {});
    setCopied(true);
    notify(t('Tracking number copied'));
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="detail" ref={ref} aria-labelledby="d-title" key={s.id}>
      <button className="back" onClick={onBack}><Icon name="back" />{t('All deliveries')}</button>

      <header className="d-head">
        <Thumb s={s} size="lg" />
        <div className="d-title">
          <span className="store">{s.store}</span>
          <h2 id="d-title">{t(s.product)}</h2>
          <StatusTag s={s} />
        </div>
      </header>

      {s.status === 'delivered' && s.delivered ? (
        <div className="eta-block delivered">
          <span className="eyebrow">{t('Delivered')}</span>
          <b className="eta-big">{day(s.delivered.at)} {time(s.delivered.at)}</b>
          <span>{t('Left at')}: <b>{t(s.delivered.leftAt)}</b></span>
          {!s.archived && <button className="btn ghost" onClick={() => onArchive(s.id, true)}><Icon name="archive" size={18} />{t('Archive')}</button>}
        </div>
      ) : s.status === 'delayed' && s.delay ? (
        <div className="eta-block delayed" role="status">
          <div className="delay-head"><Icon name="alert" size={18} /><b>{t('Delayed')} · {t(s.delay.reason)}</b></div>
          <div className="delay-grid">
            <div><span className="eyebrow">{t('What happened')}</span><p>{t(s.delay.detail)}</p></div>
            <div>
              <span className="eyebrow">{t('What changes')}</span>
              <p className="eta-change"><s>{date(s.delay.was)}</s> <Icon name="chevron" size={16} /> <b>{date(s.eta)}</b></p>
              <p className="muted">{t('Updated ETA. No action needed from you.')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="eta-block">
          <span className="eyebrow">{t('Expected')}</span>
          <b className="eta-big">{today ? t('TODAY') : day(s.eta, true)}</b>
          {s.window && <span className="eta-window mono">{t(s.window)}</span>}
        </div>
      )}

      {s.issue && (
        <p className="issue"><Icon name="flag" size={16} />{t('Issue reported')}: <b>{t(s.issue)}</b> · {t('awaiting carrier reply')}</p>
      )}

      <section className="timeline-wrap" aria-labelledby="tl-h">
        <h3 id="tl-h" className="sec-label">{t('Journey')}</h3>
        <ol className="timeline">
          {s.events.map((e, i) => {
            const state = e.at ? (i === currentIdx && s.status !== 'delivered' ? 'current' : 'done') : 'todo';
            return (
              <li key={i} className={state + (s.status === 'delayed' && i === currentIdx ? ' warn' : '')} style={{ ['--i' as string]: i }}>
                <span className="tl-mark" aria-hidden="true">{state === 'done' ? <Icon name="check" size={14} /> : null}</span>
                <span className="tl-label">{t(e.label)}{e.place && <span className="muted"> · {e.place}</span>}</span>
                <span className="tl-time mono">{e.at ? stamp(e.at) : state === 'todo' && i === s.events.length - 1 && s.status !== 'delivered' ? day(s.eta) : ''}</span>
                <span className="sr-only">{state === 'done' ? t('completed') : state === 'current' ? t('current step') : t('upcoming')}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {s.status === 'out_for_delivery' && <RouteMap updated={s.updated} />}

      <section aria-labelledby="dt-h">
        <h3 id="dt-h" className="sec-label">{t('Details')}</h3>
        <dl className="facts">
          <div><dt>{t('Tracking ID')}</dt><dd className="mono">{s.tracking}</dd></div>
          <div><dt>{t('Carrier')}</dt><dd>{s.carrier}</dd></div>
          <div><dt>{t('Origin')}</dt><dd>{s.origin}</dd></div>
          <div><dt>{t('Destination')}</dt><dd>{s.destination}</dd></div>
          <div><dt>{t('Weight')}</dt><dd>{s.weight}</dd></div>
          <div><dt>{t('Last update')}</dt><dd>{stamp(s.updated)}</dd></div>
        </dl>
      </section>

      <div className="actions">
        <button className="btn ghost" onClick={copy}><Icon name={copied ? 'check' : 'copy'} size={18} />{copied ? t('Copied') : t('Copy tracking')}</button>
        <button className="btn ghost" onClick={() => onArchive(s.id, !s.archived)}><Icon name={s.archived ? 'restore' : 'archive'} size={18} />{s.archived ? t('Restore') : t('Archive')}</button>
        <button className="btn ghost danger" onClick={() => onReport(s.id)} disabled={!!s.issue}><Icon name="flag" size={18} />{s.issue ? t('Issue reported') : t('Report issue')}</button>
      </div>
      <p className="fine muted">{t('Demo data · current time {time}', { time: `${day(NOW.toISOString())} ${time(NOW.toISOString())}` })}</p>
    </section>
  );
}
