import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import { useRates } from '../lib/rates';

export function RatesTicker({ inline }: { inline?: boolean }) {
  const { t, lang } = useI18n();
  const r = useRates();
  const items: [string, number][] = [
    ['USDT', r.rub.usdt],
    ['TON', r.rub.ton],
    ['BTC', r.rub.btc],
  ];
  return (
    <div className={`rates${inline ? ' is-inline' : ''}`}>
      <p className="rates-head">
        <span className={`rates-dot${r.source === 'live' ? ' is-live' : ''}`} aria-hidden="true" />
        {r.source === 'live' ? t('rates_live', { time: f.time(r.updatedAt, lang) }) : r.source === 'cached' ? t('rates_cached') : t('rates_reference')}
      </p>
      <ul>
        {items.map(([s, v]) => (
          <li key={s}>
            <span>{s}</span>
            <b className="num">{f.rate(v, lang)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
