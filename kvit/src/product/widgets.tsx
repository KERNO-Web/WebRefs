import { useState } from 'react';
import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import type { DayStats, Settlement } from '../lib/derive';
import { COIN_LABEL } from '../lib/derive';
import type { Coin, Lang, Payment } from '../lib/model';
import { assetById, refundedAmount, shortAddr } from '../lib/model';
import { Icon, type IconName } from '../ui/icons';
import { Badge, Money, PaymentBadge } from '../ui/ui';
import { CoinMark } from './Checkout';

export function compactRub(n: number, lang: Lang) {
  if (n >= 1_000_000) return lang === 'ru' ? `${f.num(n / 1_000_000, lang, 0, 1)} млн` : `${f.num(n / 1_000_000, lang, 0, 1)}M`;
  if (n >= 1000) return lang === 'ru' ? `${f.num(Math.round(n / 1000), lang)} тыс.` : `${f.num(Math.round(n / 1000), lang)}k`;
  return f.num(n, lang);
}

// ---------- metrics ----------

export function Metric({
  label,
  value,
  kind,
  symbol,
  delta,
  foot,
  tone,
}: {
  label: string;
  value: number;
  kind: 'rub' | 'crypto' | 'count';
  symbol?: string;
  delta?: number | null;
  foot?: string;
  tone?: 'emerald' | 'mint' | 'dark';
}) {
  const { t, lang } = useI18n();
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  return (
    <div className={`metric${tone ? ` is-${tone}` : ''}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">
        <Money value={value} kind={kind} symbol={symbol} tween />
      </p>
      <p className="metric-foot">
        {hasDelta && (
          <span className={`delta ${delta! >= 0 ? 'is-up' : 'is-down'}`}>
            {delta! >= 0 ? '↑' : '↓'} {f.num(Math.abs(delta! * 100), lang, 0)}%
          </span>
        )}
        {hasDelta ? ` ${t('vs_yesterday')}` : foot}
      </p>
    </div>
  );
}

// ---------- revenue chart ----------

export function RevenueChart({ week, lastLabel }: { week: DayStats[]; lastLabel?: [string, string] }) {
  const { t, lang } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...week.map((d) => d.revenue));
  const step = niceStep(max / 3);
  const top = Math.ceil(max / step) * step;
  const ticks = [0, step, step * 2, step * 3].filter((v) => v <= top);
  const H = 168;
  const active = hover ?? week.length - 1;
  const d = week[active];

  return (
    <div className="chart">
      <div className="chart-readout" aria-live="polite">
        <span className="chart-readout-day">
          {active === week.length - 1 ? (lastLabel?.[0] ?? t('today')) : `${f.weekday(d.day, lang)}, ${f.date(d.day, lang)}`}
        </span>
        <span className="chart-readout-val num">{f.rub(d.revenue, lang)}</span>
        <span className="chart-readout-count">
          {d.count} {f.plural(d.count, lang, t('payments_forms').split('|') as [string, string, string])}
        </span>
      </div>
      <div className="chart-plot" style={{ height: H }}>
        <div className="chart-grid" aria-hidden="true">
          {ticks.map((v) => (
            <div key={v} className="chart-gridline" style={{ bottom: `${(v / top) * 100}%` }}>
              <span>{compactRub(v, lang)}</span>
            </div>
          ))}
        </div>
        <div className="chart-bars" role="list">
          {week.map((day, i) => {
            const h = (day.revenue / top) * 100;
            const isToday = i === week.length - 1;
            return (
              <button
                key={day.day}
                type="button"
                role="listitem"
                className={`chart-col${isToday ? ' is-today' : ''}${active === i ? ' is-on' : ''}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${f.date(day.day, lang)}: ${f.rub(day.revenue, lang)}`}
              >
                <span className="chart-bar" style={{ height: `${Math.max(h, 1.5)}%` }} />
                <span className="chart-x">{isToday ? (lastLabel?.[1] ?? t('today_short')) : f.weekday(day.day, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// ---------- asset mix ----------

const MIX_COLORS: Record<Coin, string> = {
  usdt: 'var(--emerald)',
  usdc: '#5C8BD6',
  ton: '#7FB8DE',
  btc: '#D89A4A',
  eth: '#9A97C9',
};

export function AssetMix({ mix }: { mix: { coin: Coin; amount: number; share: number }[] }) {
  const { lang } = useI18n();
  return (
    <div className="mix">
      <div className="mix-bar" aria-hidden="true">
        {mix.map((m) => (
          <span key={m.coin} style={{ flexGrow: m.share, background: MIX_COLORS[m.coin] }} />
        ))}
      </div>
      <ul className="mix-legend">
        {mix.map((m) => (
          <li key={m.coin}>
            <span className="mix-swatch" style={{ background: MIX_COLORS[m.coin] }} />
            <span className="mix-name">{COIN_LABEL[m.coin]}</span>
            <span className="mix-share num">{f.num(m.share * 100, lang, 0)}%</span>
            <span className="mix-amt num">{compactRub(m.amount, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- settlement ----------

export function SettlementBreakdown({
  st,
  feeRate,
  wallet,
  asset = 'USDT',
}: {
  st: Settlement;
  feeRate: number;
  wallet: string;
  asset?: string;
}) {
  const { t, lang } = useI18n();
  const tone = st.status === 'completed' ? 'success' : st.status === 'scheduled' ? 'info' : 'warning';
  const label = st.status === 'completed' ? t('stl_completed') : st.status === 'scheduled' ? t('stl_scheduled') : t('stl_open');
  const usd = (n: number, sign?: boolean) => f.usdt(n, lang, { sign, symbol: asset });
  return (
    <div className="settle">
      <div className="settle-head">
        <div>
          <p className="settle-day">
            {st.status === 'open' ? t('stl_today') : f.dateLong(st.day, lang)}
            <span className="mono settle-id">{st.id}</span>
          </p>
          <p className="settle-sub">
            {st.count} {f.plural(st.count, lang, t('payments_forms').split('|') as [string, string, string])} · {f.rub(st.grossRub, lang)}
          </p>
        </div>
        <Badge tone={tone} live={st.status === 'open'} strong={st.status === 'completed'}>
          {label}
        </Badge>
      </div>
      <dl className="settle-rows">
        <div>
          <dt>{t('stl_received', { asset })}</dt>
          <dd className="num">{usd(st.gross)}</dd>
        </div>
        <div>
          <dt>{t('stl_fee', { rate: f.num(feeRate * 100, lang, 1) })}</dt>
          <dd className="num">{usd(-st.fee)}</dd>
        </div>
        <div>
          <dt>
            {t('stl_refunds')}
            {st.refundCount > 0 && <span className="settle-count"> · {st.refundCount}</span>}
          </dt>
          <dd className="num">{st.refunds ? usd(-st.refunds) : usd(0)}</dd>
        </div>
        <div className="settle-total">
          <dt>{st.status === 'completed' ? t('stl_credited') : t('stl_to_credit')}</dt>
          <dd>
            <Money value={st.net} kind="crypto" symbol={asset} tween />
          </dd>
        </div>
      </dl>
      <p className="settle-foot">
        <Icon name="wallet" size={15} />
        <span>
          {st.status === 'completed' ? t('stl_paid_at', { when: f.dateTime(st.payoutAt, lang) }) : t('stl_payout_at', { when: f.dateTime(st.payoutAt, lang) })}
          {' · '}
          <span className="mono">{shortAddr(wallet, 4, 4)}</span>
        </span>
      </p>
    </div>
  );
}

// ---------- payment row ----------

const SOURCE_ICON: Record<Payment['source'], IconName> = { pos: 'terminal', invoice: 'invoice', link: 'link' };

export function PaymentRow({ p, onOpen, showDate }: { p: Payment; onOpen?: () => void; showDate?: boolean }) {
  const { t, lang, tx } = useI18n();
  const a = p.asset ? assetById(p.asset) : null;
  const refunded = refundedAmount(p);
  const when = p.paidAt ?? p.createdAt;
  const Tag = onOpen ? 'button' : 'div';
  return (
    <Tag className="prow" onClick={onOpen} type={onOpen ? 'button' : undefined}>
      <span className="prow-icon" aria-hidden="true">
        {a && p.status !== 'expired' && p.status !== 'cancelled' && p.status !== 'pending' ? (
          <CoinMark coin={a.coin} size={34} />
        ) : (
          <span className="prow-src">
            <Icon name={SOURCE_ICON[p.source]} size={17} />
          </span>
        )}
      </span>
      <span className="prow-main">
        <span className="prow-title">{tx(p.description) || t('pos_payment')}</span>
        <span className="prow-meta">
          {showDate ? f.dateTime(when, lang) : f.time(when, lang)}
          {' · '}
          {t(`src_${p.source}` as 'src_pos')}
          {a && (p.status === 'paid' || p.status === 'refunded' || p.status === 'partial_refund') ? ` · ${a.symbol}` : ''}
        </span>
      </span>
      <span className="prow-status">
        <PaymentBadge status={p.status} />
      </span>
      <span className="prow-amount num">
        <span className={p.status === 'refunded' || p.status === 'failed' || p.status === 'expired' || p.status === 'cancelled' ? 'is-muted' : ''}>
          {f.rub(p.amount, lang)}
        </span>
        {refunded > 0 && p.status === 'partial_refund' && <span className="prow-refund">{f.rub(-refunded, lang)}</span>}
      </span>
    </Tag>
  );
}
