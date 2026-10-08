import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import type { Invoice, Payment, PaymentLink } from '../lib/model';
import { assetById, refundable, refundedAmount, shortAddr } from '../lib/model';
import { startOfDay } from '../lib/seed';
import { href } from '../lib/router';
import { Icon } from '../ui/icons';
import { CopyInline, PaymentBadge, RefundBadge } from '../ui/ui';
import { CoinMark } from './Checkout';

interface Props {
  p: Payment;
  invoice?: Invoice;
  link?: PaymentLink;
  feeRate: number;
  settleAsset: string;
  actions?: ReactNode;
  linkSources?: boolean;
}

export function PaymentDetail({ p, invoice, link, feeRate, settleAsset, actions, linkSources = true }: Props) {
  const { t, lang, tx } = useI18n();
  const a = p.asset ? assetById(p.asset) : null;
  const refunded = refundedAmount(p);
  const left = refundable(p);
  const paid = p.status === 'paid' || p.status === 'partial_refund' || p.status === 'refunded';

  type Step = { at: number; label: string; tone: 'done' | 'bad' | 'muted' | 'now'; note?: string };
  const steps: Step[] = [{ at: p.createdAt, label: t('tl_created'), tone: 'done' }];
  if (p.processingAt) steps.push({ at: p.processingAt, label: t('tl_sent'), tone: p.status === 'processing' ? 'now' : 'done', note: a ? `${f.crypto(p.crypto ?? 0, a.id, lang)} · ${a.network}` : undefined });
  if (p.paidAt) steps.push({ at: p.paidAt, label: t('tl_paid'), tone: 'done' });
  if (p.failedAt) steps.push({ at: p.failedAt, label: t('tl_failed'), tone: 'bad' });
  if (p.status === 'expired' && p.closedAt) steps.push({ at: p.closedAt, label: t('tl_expired'), tone: 'muted' });
  if (p.status === 'cancelled' && p.closedAt) steps.push({ at: p.closedAt, label: t('tl_cancelled'), tone: 'muted' });
  for (const r of p.refunds) {
    steps.push({
      at: r.completedAt ?? r.createdAt,
      label: r.status === 'completed' ? t('tl_refunded', { amount: f.rub(r.amount, lang) }) : t('tl_refunding', { amount: f.rub(r.amount, lang) }),
      tone: r.status === 'pending' ? 'now' : r.status === 'failed' ? 'bad' : 'done',
    });
  }
  if (p.status === 'pending') steps.push({ at: p.expiresAt, label: t('tl_waiting', { time: f.time(p.expiresAt, lang) }), tone: 'now' });

  const settleUsdt = p.usdt ?? 0;
  const settleFee = settleUsdt * feeRate;
  const refundUsdt = p.refunds.filter((r) => r.status !== 'failed').reduce((s, r) => s + r.usdt, 0);

  return (
    <div className="pdetail">
      <div className="pdetail-top">
        <div className="pdetail-amount">
          <p className="num">{f.rub(p.amount, lang)}</p>
          {refunded > 0 && <span className="pdetail-refunded num">{t('pd_refunded', { amount: f.rub(refunded, lang) })}</span>}
        </div>
        <PaymentBadge status={p.status} />
      </div>
      {p.description && <p className="pdetail-desc">{tx(p.description)}</p>}
      <p className="pdetail-id">
        <CopyInline text={p.id} />
      </p>

      {actions && <div className="pdetail-actions">{actions}</div>}

      <h3 className="pdetail-h">{t('pd_timeline')}</h3>
      <ol className="timeline">
        {steps.map((s, i) => (
          <li key={i} className={`is-${s.tone}`}>
            <span className="timeline-dot" aria-hidden="true" />
            <span className="timeline-label">
              {s.label}
              {s.note && <span className="timeline-note num">{s.note}</span>}
            </span>
            <time className="timeline-time num">{f.dateTime(s.at, lang)}</time>
          </li>
        ))}
      </ol>

      <h3 className="pdetail-h">{t('pd_details')}</h3>
      <dl className="kv">
        <div>
          <dt>{t('pd_source')}</dt>
          <dd>
            {p.source === 'pos' && t('src_pos')}
            {p.source === 'invoice' &&
              (invoice && linkSources ? <a href={href(`/app/invoices/${invoice.id}`)}>{t('src_invoice_n', { n: invoice.number })}</a> : t('src_invoice'))}
            {p.source === 'link' && (link && linkSources ? <a href={href(`/app/links/${link.id}`)}>{tx(link.title)}</a> : t('src_link'))}
          </dd>
        </div>
        {p.customer && (
          <div>
            <dt>{t('pd_customer')}</dt>
            <dd>{tx(p.customer)}</dd>
          </div>
        )}
        {a && (
          <div>
            <dt>{t('pd_paid_with')}</dt>
            <dd className="kv-asset">
              <CoinMark coin={a.coin} size={20} />
              {a.symbol} · {a.network}
            </dd>
          </div>
        )}
        {a && p.crypto !== undefined && (
          <div>
            <dt>{t('pd_crypto')}</dt>
            <dd className="num">{f.crypto(p.crypto, a.id, lang)}</dd>
          </div>
        )}
        {a && p.rate && (
          <div>
            <dt>{t('pd_rate')}</dt>
            <dd className="num">
              1 {a.symbol} = {f.rate(p.rate, lang)}
            </dd>
          </div>
        )}
        {a && p.networkFee !== undefined && (
          <div>
            <dt>{t('pd_network_fee')}</dt>
            <dd className="num">
              {f.crypto(p.networkFee, a.id, lang)} <span className="kv-muted">{t('pd_fee_by_customer')}</span>
            </dd>
          </div>
        )}
        {p.from && (
          <div>
            <dt>{t('pd_from')}</dt>
            <dd>
              <CopyInline text={p.from} display={shortAddr(p.from, 6, 6)} />
            </dd>
          </div>
        )}
        {p.txHash && (
          <div>
            <dt>{t('pd_hash')}</dt>
            <dd>
              <CopyInline text={p.txHash} display={shortAddr(p.txHash, 8, 6)} />
            </dd>
          </div>
        )}
      </dl>

      {paid && (
        <>
          <h3 className="pdetail-h">{t('pd_settlement')}</h3>
          <dl className="kv kv-money">
            <div>
              <dt>{t('pd_converted', { asset: settleAsset })}</dt>
              <dd className="num">{f.usdt(settleUsdt, lang, { symbol: settleAsset })}</dd>
            </div>
            <div>
              <dt>{t('stl_fee', { rate: f.num(feeRate * 100, lang, 1) })}</dt>
              <dd className="num">{f.usdt(-settleFee, lang, { symbol: settleAsset })}</dd>
            </div>
            {refundUsdt > 0 && (
              <div>
                <dt>{t('stl_refunds')}</dt>
                <dd className="num">{f.usdt(-refundUsdt, lang, { symbol: settleAsset })}</dd>
              </div>
            )}
            <div className="kv-total">
              <dt>{t('pd_net')}</dt>
              <dd className="num">{f.usdt(settleUsdt - settleFee - refundUsdt, lang, { symbol: settleAsset })}</dd>
            </div>
          </dl>
          {p.paidAt && (
            <p className="pdetail-note">
              <Icon name="wallet" size={15} />
              {t('pd_in_settlement', { date: f.date(startOfDay(p.paidAt), lang) })}
            </p>
          )}
        </>
      )}

      {p.refunds.length > 0 && (
        <>
          <h3 className="pdetail-h">{t('pd_refunds')}</h3>
          <ul className="refunds">
            {p.refunds.map((r) => (
              <li key={r.id}>
                <div>
                  <b className="num">{f.rub(r.amount, lang)}</b>
                  <span className="num">
                    {a ? f.crypto(r.crypto, a.id, lang) : ''} · {f.dateTime(r.createdAt, lang)}
                  </span>
                  {r.reason && <span>{tx(r.reason)}</span>}
                </div>
                <RefundBadge status={r.status} />
              </li>
            ))}
          </ul>
          {left > 0 && <p className="pdetail-note">{t('pd_left', { amount: f.rub(left, lang) })}</p>}
        </>
      )}
    </div>
  );
}
