// The merchant-facing payment session: QR while waiting, live status after.
// Used by the terminal in the demo and by the hero on the product site.

import type { ReactNode } from 'react';
import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import type { AssetId, PaymentStatus, Text } from '../lib/model';
import { SESSION_MINUTES, assetById } from '../lib/model';
import { Icon } from '../ui/icons';
import { PaymentBadge, QR, Spinner } from '../ui/ui';
import { SuccessMark } from './Checkout';

export interface PosViewProps {
  id?: string;
  amount: number;
  description?: Text;
  status: PaymentStatus;
  expiresAt: number;
  approx: number;
  qrValue: string;
  now: number;
  asset?: AssetId;
  crypto?: number;
  paidAt?: number;
  actions?: ReactNode;
}

export function PosView(p: PosViewProps) {
  const { t, lang, tx } = useI18n();
  const left = Math.max(0, p.expiresAt - p.now);
  const share = left / (SESSION_MINUTES * 60_000);
  const waiting = p.status === 'pending' || p.status === 'created';
  const a = p.asset ? assetById(p.asset) : null;

  return (
    <div className="pos-view" data-status={p.status}>
      <div className="pos-view-head">
        <span className="pos-view-id mono">{p.id ? p.id : t('pos_new_session')}</span>
        <PaymentBadge status={p.status} />
      </div>

      <div className="pos-view-stage">
        {(waiting || p.status === 'processing') && (
          <div className={`pos-qr${p.status === 'processing' ? ' is-busy' : ''}`}>
            <QR value={p.qrValue} size={208} label={t('pos_qr_label')} />
            {p.status === 'processing' && (
              <div className="pos-qr-cover" aria-live="polite">
                <Spinner size={26} />
                <span>{t('pos_receiving')}</span>
              </div>
            )}
          </div>
        )}
        {(p.status === 'paid' || p.status === 'partial_refund' || p.status === 'refunded') && (
          <div className="pos-result is-paid">
            <SuccessMark size={72} />
          </div>
        )}
        {p.status === 'failed' && (
          <div className="pos-result">
            <span className="pos-result-icon tone-danger">
              <Icon name="alert" size={30} />
            </span>
          </div>
        )}
        {(p.status === 'expired' || p.status === 'cancelled') && (
          <div className="pos-result">
            <span className="pos-result-icon tone-neutral">
              <Icon name="clock" size={30} />
            </span>
          </div>
        )}
      </div>

      <div className="pos-view-sum">
        <p className="pos-view-amount num">{f.rub(p.amount, lang)}</p>
        {p.status === 'paid' && a && p.crypto !== undefined ? (
          <p className="pos-view-sub num">
            {f.crypto(p.crypto, a.id, lang)} · {a.network}
            {p.paidAt ? ` · ${f.time(p.paidAt, lang)}` : ''}
          </p>
        ) : p.status === 'processing' && a && p.crypto !== undefined ? (
          <p className="pos-view-sub num">{f.crypto(p.crypto, a.id, lang)} · {a.network}</p>
        ) : waiting ? (
          <p className="pos-view-sub num">≈ {f.usdt(p.approx, lang)}</p>
        ) : null}
        {p.description && <p className="pos-view-desc">{tx(p.description)}</p>}
      </div>

      {waiting && (
        <div className="pos-timer">
          <div className="pos-timer-row">
            <span>{t('pos_scan_hint')}</span>
            <span className="num">{f.countdown(left)}</span>
          </div>
          <div className="pos-timer-bar">
            <span style={{ transform: `scaleX(${share})` }} />
          </div>
        </div>
      )}
      {p.status === 'failed' && <p className="pos-view-note">{t('pos_failed_text')}</p>}
      {p.status === 'expired' && <p className="pos-view-note">{t('pos_expired_text')}</p>}
      {p.status === 'cancelled' && <p className="pos-view-note">{t('pos_cancelled_text')}</p>}

      {p.actions && <div className="pos-view-actions">{p.actions}</div>}
    </div>
  );
}
