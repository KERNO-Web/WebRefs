// Customer-facing payment page for a terminal session, a payment link or an
// invoice. Lives outside the merchant shell: this is what the customer sees.

import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n';
import type { Payment } from '../lib/model';
import { invoiceTotal } from '../lib/model';
import { decodeSession, href, navigate, useRoute } from '../lib/router';
import { importSession, payInvoice, payLink, payPayment, useDemo } from '../lib/store';
import { Checkout, type CheckoutPhase, type CheckoutProps } from '../product/Checkout';
import { Icon } from '../ui/icons';
import { LangSwitch, SandboxBadge } from '../ui/ui';

export function CheckoutPage({ id }: { id: string }) {
  const { t } = useI18n();
  const route = useRoute();
  const demo = useDemo();
  // payment created from this page for a link or invoice
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    document.title = `${t('co_doc_title')} — ${demo.merchant.name}`;
  }, [t, demo.merchant.name]);

  // a QR scanned on another device carries the session with it
  useEffect(() => {
    if (!id.startsWith('pay_')) return;
    const payload = decodeSession(route.query.get('d'));
    if (payload && !demo.payments.some((p) => p.id === id)) importSession(id, payload.a, payload.d, payload.e);
  }, [id, route.query, demo.payments]);

  const base = {
    merchant: demo.merchant.name,
    accepted: demo.merchant.accepted,
    seed: id,
    done: { label: t('co_back_demo'), onClick: () => navigate('/app/overview') },
  };

  let props: CheckoutProps | null = null;

  const fromPayment = (p: Payment): Pick<CheckoutProps, 'phase' | 'charge'> => {
    let phase: CheckoutPhase = 'open';
    if (p.status === 'processing') phase = 'processing';
    else if (p.status === 'paid' || p.status === 'partial_refund' || p.status === 'refunded') phase = 'paid';
    else if (p.status === 'failed') phase = retrying ? 'open' : 'failed';
    else if (p.status === 'expired') phase = 'expired';
    else if (p.status === 'cancelled') phase = 'closed';
    return {
      phase,
      charge: p.asset && p.crypto !== undefined ? { asset: p.asset, crypto: p.crypto, fee: p.networkFee ?? 0, at: p.paidAt, startedAt: p.processingAt, resolveAt: p.resolveAt, id: p.id } : undefined,
    };
  };

  if (id.startsWith('pay_')) {
    const p = demo.payments.find((x) => x.id === id);
    if (p) {
      props = {
        ...base,
        amount: p.amount,
        description: p.description,
        reference: p.id,
        expiresAt: p.expiresAt,
        ...fromPayment(p),
        closedText: p.status === 'cancelled' ? t('co_cancelled_text') : undefined,
        onPay: (asset, fail) => {
          setRetrying(false);
          payPayment(p.id, asset, fail);
        },
        onRetry: () => setRetrying(true),
      };
    }
  } else if (id.startsWith('lnk_')) {
    const link = demo.links.find((l) => l.id === id);
    if (link) {
      const attempt = attemptId ? demo.payments.find((p) => p.id === attemptId) : undefined;
      const state = attempt && !retrying ? fromPayment(attempt) : { phase: (link.active ? 'open' : 'closed') as CheckoutPhase };
      props = {
        ...base,
        amount: link.amount,
        title: link.title,
        description: link.description,
        ...state,
        closedText: link.completedAt ? t('co_link_done') : t('co_link_paused'),
        onPay: (asset, fail) => {
          setRetrying(false);
          const pid = payLink(link.id, asset, fail);
          if (pid) setAttemptId(pid);
        },
        onRetry: () => setRetrying(true),
      };
    }
  } else if (id.startsWith('inv_')) {
    const inv = demo.invoices.find((i) => i.id === id);
    if (inv) {
      const attempt = attemptId
        ? demo.payments.find((p) => p.id === attemptId)
        : inv.paymentId
          ? demo.payments.find((p) => p.id === inv.paymentId)
          : undefined;
      let state: Pick<CheckoutProps, 'phase' | 'charge'> = { phase: 'open' };
      if (attempt && !retrying) state = fromPayment(attempt);
      else if (inv.status === 'expired') state = { phase: 'expired' };
      else if (inv.status === 'cancelled' || inv.status === 'draft') state = { phase: 'closed' };
      props = {
        ...base,
        amount: invoiceTotal(inv),
        title: { ru: `Счёт ${inv.number}`, en: `Invoice ${inv.number}` },
        lines: inv.items,
        description: inv.memo,
        ...state,
        expiresAt: undefined,
        closedText: inv.status === 'expired' ? t('co_invoice_expired') : inv.status === 'draft' ? t('co_invoice_draft') : t('co_invoice_cancelled'),
        onPay: (asset, fail) => {
          setRetrying(false);
          const pid = payInvoice(inv.id, asset, fail);
          if (pid) setAttemptId(pid);
        },
        onRetry: () => setRetrying(true),
      };
    }
  }

  return (
    <div className="co-page">
      <header className="co-page-head">
        <SandboxBadge small />
        <LangSwitch />
      </header>
      <main className="co-page-main">
        {props ? (
          <Checkout {...props} />
        ) : (
          <div className="checkout">
            <div className="co-panel co-result">
              <span className="co-result-icon tone-neutral">
                <Icon name="info" size={28} />
              </span>
              <h1 className="co-result-title">{t('co_not_found')}</h1>
              <p className="co-result-text">{t('co_not_found_text')}</p>
            </div>
          </div>
        )}
        <p className="co-page-note">
          {t('co_page_note')}{' '}
          <a href={href('/app/overview')}>{t('co_page_note_link')}</a>
        </p>
      </main>
    </div>
  );
}
