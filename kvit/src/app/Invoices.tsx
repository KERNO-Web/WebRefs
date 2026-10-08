import { useMemo, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { Invoice, InvoiceItem, InvoiceStatus } from '../lib/model';
import { invoiceTotal } from '../lib/model';
import { absolute, href, navigate, useRoute } from '../lib/router';
import { cancelInvoice, createInvoice, sendInvoice, useDemo } from '../lib/store';
import { InvoiceDocument } from '../product/InvoiceDocument';
import { Icon } from '../ui/icons';
import { Button, CopyButton, Empty, Field, Input, InvoiceBadge, Modal, QR, Segmented, toast } from '../ui/ui';
import { PageHead } from './AppShell';

type Filter = 'all' | 'draft' | 'pending' | 'paid' | 'closed';
const MATCH: Record<Filter, (s: InvoiceStatus) => boolean> = {
  all: () => true,
  draft: (s) => s === 'draft',
  pending: (s) => s === 'pending',
  paid: (s) => s === 'paid',
  closed: (s) => s === 'expired' || s === 'cancelled',
};

export function Invoices({ id }: { id?: string }) {
  if (id === 'new') return <InvoiceForm />;
  if (id) return <InvoiceView id={id} />;
  return <InvoiceList />;
}

function InvoiceList() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const [filter, setFilter] = useState<Filter>('all');
  const list = demo.invoices.filter((i) => MATCH[filter](i.status));
  const sum = (s: InvoiceStatus) => demo.invoices.filter((i) => i.status === s).reduce((a, i) => a + invoiceTotal(i), 0);
  const count = (fl: Filter) => demo.invoices.filter((i) => MATCH[fl](i.status)).length;
  const monthAgo = Date.now() - 30 * 86_400_000;
  const paid30 = demo.invoices.filter((i) => i.status === 'paid' && (i.paidAt ?? 0) >= monthAgo).reduce((a, i) => a + invoiceTotal(i), 0);

  return (
    <div className="page">
      <PageHead
        title={t('nav_invoices')}
        sub={t('inv_sub')}
        actions={
          <Button variant="primary" icon="plus" onClick={() => navigate('/app/invoices/new')}>
            {t('create_invoice')}
          </Button>
        }
      />

      <div className="summary-row">
        <div className="summary">
          <p>{t('inv_awaiting')}</p>
          <b className="num">{f.rub(sum('pending'), lang)}</b>
          <span>{t('inv_n', { n: count('pending') })}</span>
        </div>
        <div className="summary">
          <p>{t('inv_overdue')}</p>
          <b className="num">{f.rub(sum('expired'), lang)}</b>
          <span>{t('inv_n', { n: demo.invoices.filter((i) => i.status === 'expired').length })}</span>
        </div>
        <div className="summary">
          <p>{t('inv_paid_30')}</p>
          <b className="num">{f.rub(paid30, lang)}</b>
          <span>{t('inv_n', { n: demo.invoices.filter((i) => i.status === 'paid' && (i.paidAt ?? 0) >= monthAgo).length })}</span>
        </div>
      </div>

      <div className="filter-row">
        <Segmented
          label={t('tx_status_filter')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('f_all'), count: count('all') },
            { value: 'draft', label: t('inv_draft_pl'), count: count('draft') },
            { value: 'pending', label: t('inv_pending_pl'), count: count('pending') },
            { value: 'paid', label: t('inv_paid_pl'), count: count('paid') },
            { value: 'closed', label: t('inv_closed_pl'), count: count('closed') },
          ]}
        />
      </div>

      <section className="card card-flush">
        {list.length ? (
          <div className="table">
            <div className="table-head inv-grid" aria-hidden="true">
              <span>{t('inv_col_customer')}</span>
              <span>{t('inv_col_status')}</span>
              <span>{t('inv_due')}</span>
              <span className="r">{t('inv_sum')}</span>
            </div>
            {list.map((i) => (
              <a key={i.id} className="table-row inv-grid" href={href(`/app/invoices/${i.id}`)}>
                <span className="inv-cell-main">
                  <b>{tx(i.customer)}</b>
                  <span className="mono">{i.number}</span>
                </span>
                <span>
                  <InvoiceBadge status={i.status} />
                </span>
                <span className="inv-cell-due">
                  {i.status === 'paid' && i.paidAt ? t('inv_paid_date', { date: f.date(i.paidAt, lang) }) : f.date(i.dueAt, lang)}
                </span>
                <span className="r num inv-cell-sum">{f.rub(invoiceTotal(i), lang)}</span>
              </a>
            ))}
          </div>
        ) : (
          <Empty
            icon="invoice"
            title={t('inv_empty')}
            text={t('inv_empty_text')}
            action={
              <Button size="sm" icon="plus" onClick={() => navigate('/app/invoices/new')}>
                {t('create_invoice')}
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}

// ---------- create ----------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
type Row = { title: string; qty: string; price: string };

function InvoiceForm() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const route = useRoute();
  const source = demo.invoices.find((i) => i.id === route.query.get('from'));
  const [customer, setCustomer] = useState(source ? tx(source.customer) : '');
  const [email, setEmail] = useState(source?.email ?? '');
  const [rows, setRows] = useState<Row[]>(
    source ? source.items.map((i) => ({ title: tx(i.title), qty: String(i.qty), price: String(i.price) })) : [{ title: '', qty: '1', price: '' }],
  );
  const [memo, setMemo] = useState(source?.memo ? tx(source.memo) : '');
  const [due, setDue] = useState<'3' | '7' | '14' | '30'>('7');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState<'draft' | 'send' | null>(null);

  const items: InvoiceItem[] = rows.map((r) => ({
    title: r.title.trim(),
    qty: Math.max(0, parseInt(r.qty, 10) || 0),
    price: Math.max(0, parseInt(r.price.replace(/\D/g, ''), 10) || 0),
  }));
  const total = invoiceTotal({ items });

  const errors = {
    customer: !customer.trim() ? t('err_required') : null,
    email: !email.trim() ? t('err_required') : !EMAIL.test(email.trim()) ? t('err_email') : null,
    items: items.some((i) => !i.title || i.qty < 1 || i.price < 1) ? t('err_items') : null,
    total: total > 10_000_000 ? t('err_total') : null,
  };
  const ok = !errors.customer && !errors.email && !errors.items && !errors.total;

  const preview: Invoice = {
    id: 'preview',
    number: `KC-${String(demo.invoices.reduce((m, i) => Math.max(m, parseInt(i.number.replace(/\D/g, ''), 10) || 0), 0) + 1).padStart(4, '0')}`,
    customer: customer.trim(),
    email: email.trim(),
    items: items.map((i) => ({ ...i, title: i.title || '' })),
    memo: memo.trim() || undefined,
    status: 'draft',
    createdAt: Date.now(),
    dueAt: Date.now() + parseInt(due, 10) * 86_400_000,
  };

  const submit = (send: boolean) => {
    setTried(true);
    if (!ok) return;
    setBusy(send ? 'send' : 'draft');
    setTimeout(() => {
      const id = createInvoice({ customer, email, items, memo, dueDays: parseInt(due, 10) }, send);
      toast(send ? t('toast_invoice_sent', { email: email.trim() }) : t('toast_invoice_draft'));
      navigate(`/app/invoices/${id}`, { replace: true });
    }, 450);
  };

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="page">
      <PageHead title={t('inv_new_title')} back={{ label: t('nav_invoices'), to: '/app/invoices' }} />
      <div className="form-layout">
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(true);
          }}
          noValidate
        >
          <div className="form-grid-2">
            <Field label={t('inv_f_customer')} error={tried ? errors.customer : null} htmlFor="inv-customer">
              <Input id="inv-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder={t('inv_f_customer_ph')} maxLength={80} autoComplete="organization" />
            </Field>
            <Field label={t('inv_f_email')} error={tried ? errors.email : null} hint={t('inv_f_email_hint')} htmlFor="inv-email">
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="orders@company.ru" maxLength={80} autoComplete="email" />
            </Field>
          </div>

          <fieldset className="items">
            <legend className="field-label">{t('inv_f_items')}</legend>
            <div className="items-head" aria-hidden="true">
              <span>{t('inv_item')}</span>
              <span>{t('inv_qty')}</span>
              <span>{t('inv_price')}</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div className="items-row" key={i}>
                <Input aria-label={t('inv_item')} value={r.title} onChange={(e) => setRow(i, { title: e.target.value })} placeholder={t('inv_f_item_ph')} maxLength={80} />
                <Input aria-label={t('inv_qty')} inputMode="numeric" value={r.qty} onChange={(e) => setRow(i, { qty: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                <Input aria-label={t('inv_price')} inputMode="numeric" value={r.price} onChange={(e) => setRow(i, { price: e.target.value.replace(/[^\d]/g, '').slice(0, 8) })} suffix="₽" placeholder="0" />
                <button type="button" className="icon-btn" aria-label={t('inv_f_remove')} disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                  <Icon name="close" size={18} />
                </button>
              </div>
            ))}
            {tried && (errors.items || errors.total) && (
              <p className="field-error" role="alert">
                {errors.items ?? errors.total}
              </p>
            )}
            <div className="items-foot">
              <Button size="sm" variant="ghost" icon="plus" disabled={rows.length >= 8} onClick={() => setRows((rs) => [...rs, { title: '', qty: '1', price: '' }])}>
                {t('inv_f_add')}
              </Button>
              <span className="items-total">
                {t('inv_total')} <b className="num">{f.rub(total, lang)}</b>
              </span>
            </div>
          </fieldset>

          <Field label={t('inv_f_due')}>
            <Segmented
              label={t('inv_f_due')}
              value={due}
              onChange={setDue}
              options={(['3', '7', '14', '30'] as const).map((d) => ({ value: d, label: t('inv_days', { n: d }) }))}
            />
          </Field>

          <Field label={t('inv_f_memo')} optional htmlFor="inv-memo">
            <textarea id="inv-memo" className="textarea" rows={2} value={memo} maxLength={240} onChange={(e) => setMemo(e.target.value)} placeholder={t('inv_f_memo_ph')} />
          </Field>

          <div className="form-actions">
            <Button variant="secondary" loading={busy === 'draft'} disabled={!!busy} onClick={() => submit(false)}>
              {t('inv_save_draft')}
            </Button>
            <Button variant="primary" type="submit" icon="send" loading={busy === 'send'} disabled={!!busy}>
              {t('inv_send')}
            </Button>
          </div>
        </form>

        <aside className="form-preview">
          <p className="form-preview-label">{t('inv_preview')}</p>
          <InvoiceDocument inv={preview} merchant={demo.merchant.name} />
        </aside>
      </div>
    </div>
  );
}

// ---------- view ----------

function InvoiceView({ id }: { id: string }) {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const inv = demo.invoices.find((i) => i.id === id);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const url = useMemo(() => absolute(`/pay/${id}`), [id]);

  if (!inv) {
    return (
      <div className="page">
        <PageHead title={t('nav_invoices')} back={{ label: t('nav_invoices'), to: '/app/invoices' }} />
        <Empty icon="invoice" title={t('inv_not_found')} />
      </div>
    );
  }

  const openPay = () => window.open(href(`/pay/${inv.id}`), '_blank', 'noopener');
  const total = invoiceTotal(inv);

  const steps: { label: string; at?: number; tone: 'done' | 'now' | 'bad' | 'muted' }[] = [{ label: t('inv_tl_created'), at: inv.createdAt, tone: 'done' }];
  if (inv.sentAt) steps.push({ label: t('inv_tl_sent', { email: inv.email }), at: inv.sentAt, tone: 'done' });
  if (inv.status === 'pending') steps.push({ label: t('inv_tl_waiting'), at: inv.dueAt, tone: 'now' });
  if (inv.status === 'paid') steps.push({ label: t('inv_tl_paid'), at: inv.paidAt, tone: 'done' });
  if (inv.status === 'expired') steps.push({ label: t('inv_tl_expired'), at: inv.closedAt, tone: 'bad' });
  if (inv.status === 'cancelled') steps.push({ label: t('inv_tl_cancelled'), at: inv.closedAt, tone: 'muted' });

  return (
    <div className="page">
      <PageHead
        title={`${t('inv_doc_title')} ${inv.number}`}
        sub={`${tx(inv.customer)} · ${f.rub(total, lang)}`}
        back={{ label: t('nav_invoices'), to: '/app/invoices' }}
        actions={
          <>
            {inv.status === 'draft' && (
              <Button
                variant="primary"
                icon="send"
                onClick={() => {
                  sendInvoice(inv.id);
                  toast(t('toast_invoice_sent', { email: inv.email }));
                }}
              >
                {t('inv_send_now')}
              </Button>
            )}
            {inv.status === 'pending' && <CopyButton text={url} label={t('copy_link')} size="md" />}
            {inv.status === 'paid' && inv.paymentId && (
              <Button icon="list" onClick={() => navigate(`/app/transactions/${inv.paymentId}`)}>
                {t('inv_open_payment')}
              </Button>
            )}
            {(inv.status === 'expired' || inv.status === 'cancelled') && (
              <Button variant="primary" icon="reset" onClick={() => navigate(`/app/invoices/new?from=${inv.id}`)}>
                {t('inv_reissue')}
              </Button>
            )}
          </>
        }
      />

      <div className="inv-layout">
        <InvoiceDocument inv={inv} merchant={demo.merchant.name} payUrl={inv.status === 'pending' ? url : undefined} />

        <aside className="stack">
          {inv.status === 'pending' && (
            <section className="card share">
              <div className="card-head">
                <h2>{t('inv_share')}</h2>
              </div>
              <div className="share-body">
                <QR value={url} size={120} label={t('inv_share')} />
                <div>
                  <p className="share-text">{t('inv_share_text')}</p>
                  <p className="mono share-url">{url.replace(/^https?:\/\//, '')}</p>
                </div>
              </div>
              <div className="share-actions">
                <CopyButton text={url} label={t('copy_link')} />
                <Button size="sm" icon="external" onClick={openPay}>
                  {t('open_pay_page')}
                </Button>
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h2>{t('pd_timeline')}</h2>
            </div>
            <ol className="timeline">
              {steps.map((s, i) => (
                <li key={i} className={`is-${s.tone}`}>
                  <span className="timeline-dot" aria-hidden="true" />
                  <span className="timeline-label">{s.label}</span>
                  {s.at && <time className="timeline-time num">{s.tone === 'now' ? t('inv_until', { date: f.dateTime(s.at, lang) }) : f.dateTime(s.at, lang)}</time>}
                </li>
              ))}
            </ol>
          </section>

          {(inv.status === 'pending' || inv.status === 'draft') && (
            <Button variant="ghost" className="danger-text" onClick={() => setConfirmCancel(true)}>
              {t('inv_cancel')}
            </Button>
          )}
        </aside>
      </div>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={t('inv_cancel_title', { n: inv.number })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
              {t('inv_keep')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                cancelInvoice(inv.id);
                setConfirmCancel(false);
                toast(t('toast_invoice_cancelled'), 'info');
              }}
            >
              {t('inv_cancel_confirm')}
            </Button>
          </>
        }
      >
        <p className="modal-lead">{t('inv_cancel_text')}</p>
      </Modal>
    </div>
  );
}
