import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import type { Invoice } from '../lib/model';
import { invoiceTotal } from '../lib/model';
import { InvoiceBadge } from '../ui/ui';

export function InvoiceDocument({ inv, merchant, payUrl }: { inv: Invoice; merchant: string; payUrl?: string }) {
  const { t, lang, tx } = useI18n();
  const total = invoiceTotal(inv);
  return (
    <article className="invdoc" aria-label={t('inv_doc_label', { n: inv.number })}>
      <header className="invdoc-head">
        <div>
          <p className="invdoc-merchant">{merchant}</p>
          <p className="invdoc-kind">
            {t('inv_doc_title')} <span className="mono">{inv.number}</span>
          </p>
        </div>
        <InvoiceBadge status={inv.status} />
      </header>

      <div className="invdoc-meta">
        <div>
          <p className="invdoc-k">{t('inv_bill_to')}</p>
          <p className="invdoc-v">{tx(inv.customer) || '—'}</p>
          <p className="invdoc-sub">{inv.email || '—'}</p>
        </div>
        <div>
          <p className="invdoc-k">{t('inv_issued')}</p>
          <p className="invdoc-v">{f.date(inv.sentAt ?? inv.createdAt, lang, true)}</p>
        </div>
        <div>
          <p className="invdoc-k">{inv.status === 'paid' ? t('inv_paid_on') : t('inv_due')}</p>
          <p className="invdoc-v">{f.date(inv.status === 'paid' && inv.paidAt ? inv.paidAt : inv.dueAt, lang, true)}</p>
        </div>
      </div>

      <table className="invdoc-table">
        <thead>
          <tr>
            <th>{t('inv_item')}</th>
            <th className="r">{t('inv_qty')}</th>
            <th className="r hide-xs">{t('inv_price')}</th>
            <th className="r">{t('inv_sum')}</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={i}>
              <td>{tx(it.title) || '—'}</td>
              <td className="r num">{it.qty}</td>
              <td className="r num hide-xs">{f.rub(it.price, lang)}</td>
              <td className="r num">{f.rub(it.qty * it.price, lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invdoc-total">
        <span>{t('inv_total')}</span>
        <span className="num">{f.rub(total, lang)}</span>
      </div>

      {inv.memo && <p className="invdoc-memo">{tx(inv.memo)}</p>}

      <footer className="invdoc-foot">
        <p>{t('inv_doc_foot')}</p>
        {payUrl && <p className="mono invdoc-url">{payUrl.replace(/^https?:\/\//, '').split('?')[0]}</p>}
      </footer>
    </article>
  );
}
