import { useEffect, useMemo, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { Payment, PaymentStatus } from '../lib/model';
import { assetById, refundable, tx as txOf } from '../lib/model';
import { navigate, useRoute } from '../lib/router';
import { startOfDay } from '../lib/seed';
import { issueRefund, useDemo } from '../lib/store';
import { PaymentDetail } from '../product/PaymentDetail';
import { PaymentRow } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Button, Empty, Field, Input, Modal, Segmented, toast, useMedia } from '../ui/ui';
import { NewPaymentButton, PageHead } from './AppShell';

type Filter = 'all' | 'paid' | 'pending' | 'refunded' | 'failed';
const MATCH: Record<Filter, (s: PaymentStatus) => boolean> = {
  all: () => true,
  paid: (s) => s === 'paid' || s === 'partial_refund',
  pending: (s) => s === 'pending' || s === 'processing' || s === 'created',
  refunded: (s) => s === 'refunded' || s === 'partial_refund',
  failed: (s) => s === 'failed' || s === 'expired' || s === 'cancelled',
};

const PAGE = 40;

export function Transactions({ id }: { id?: string }) {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const route = useRoute();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>(() => (route.query.get('status') as Filter) || 'all');
  const [source, setSource] = useState<'all' | Payment['source']>('all');
  const [limit, setLimit] = useState(PAGE);
  const wide = useMedia('(min-width: 1100px)');

  useEffect(() => setLimit(PAGE), [query, filter, source]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s/g, '');
    return demo.payments.filter((p) => {
      if (source !== 'all' && p.source !== source) return false;
      if (!q) return true;
      const hay = [p.id, txOf(p.description, 'ru'), txOf(p.description, 'en'), txOf(p.customer, 'ru'), txOf(p.customer, 'en'), String(p.amount), p.asset ? assetById(p.asset).symbol : '']
        .join(' ')
        .toLowerCase()
        .replace(/\s/g, '');
      return hay.includes(q);
    });
  }, [demo.payments, query, source]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, paid: 0, pending: 0, refunded: 0, failed: 0 };
    for (const p of searched) for (const k of Object.keys(MATCH) as Filter[]) if (MATCH[k](p.status)) c[k]++;
    return c;
  }, [searched]);

  const list = searched.filter((p) => MATCH[filter](p.status));
  const shown = list.slice(0, limit);
  const groups = useMemo(() => {
    const g: { day: number; items: Payment[]; total: number }[] = [];
    for (const p of shown) {
      const day = startOfDay(p.createdAt);
      let last = g[g.length - 1];
      if (!last || last.day !== day) g.push((last = { day, items: [], total: 0 }));
      last.items.push(p);
      if (p.status === 'paid' || p.status === 'partial_refund' || p.status === 'refunded') last.total += p.amount;
    }
    return g;
  }, [shown]);

  const today = startOfDay(Date.now());
  const dayLabel = (d: number) => (d === today ? t('today') : d === today - 86_400_000 ? t('yesterday') : f.dateLong(d, lang));
  const selected = id ? demo.payments.find((p) => p.id === id) : undefined;

  return (
    <div className="page">
      <PageHead title={t('nav_transactions')} sub={t('tx_sub')} actions={<NewPaymentButton />} />

      <div className="toolbar">
        <label className="search">
          <Icon name="search" size={18} />
          <span className="sr-only">{t('tx_search')}</span>
          <input type="search" value={query} placeholder={t('tx_search_ph')} onChange={(e) => setQuery(e.target.value)} />
          {query && (
            <button type="button" className="search-clear" onClick={() => setQuery('')} aria-label={t('clear')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
        <div className="select">
          <select value={source} onChange={(e) => setSource(e.target.value as typeof source)} aria-label={t('tx_source')}>
            <option value="all">{t('tx_all_sources')}</option>
            <option value="pos">{t('src_pos')}</option>
            <option value="invoice">{t('src_invoice')}</option>
            <option value="link">{t('src_link')}</option>
          </select>
          <Icon name="down" size={16} />
        </div>
      </div>

      <div className="filter-row">
        <Segmented
          label={t('tx_status_filter')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('f_all'), count: counts.all },
            { value: 'paid', label: t('f_paid'), count: counts.paid },
            { value: 'pending', label: t('f_pending'), count: counts.pending },
            { value: 'refunded', label: t('f_refunded'), count: counts.refunded },
            { value: 'failed', label: t('f_failed'), count: counts.failed },
          ]}
        />
      </div>

      <section className="card card-flush">
        {groups.length ? (
          <>
            {groups.map((g) => (
              <div key={g.day} className="tx-group">
                <div className="tx-group-head">
                  <span>{dayLabel(g.day)}</span>
                  {g.total > 0 && <span className="num">{f.rub(g.total, lang)}</span>}
                </div>
                <div className="plist">
                  {g.items.map((p) => (
                    <PaymentRow key={p.id} p={p} onOpen={() => navigate(`/app/transactions/${p.id}`)} />
                  ))}
                </div>
              </div>
            ))}
            {list.length > limit && (
              <div className="tx-more">
                <Button onClick={() => setLimit((l) => l + PAGE)}>{t('tx_show_more', { n: Math.min(PAGE, list.length - limit) })}</Button>
              </div>
            )}
          </>
        ) : (
          <Empty
            icon="search"
            title={query ? t('tx_nothing', { q: query }) : t('tx_empty_filter')}
            text={t('tx_nothing_hint')}
            action={
              <Button
                size="sm"
                onClick={() => {
                  setQuery('');
                  setFilter('all');
                  setSource('all');
                }}
              >
                {t('tx_reset_filters')}
              </Button>
            }
          />
        )}
      </section>

      <Modal open={!!id} onClose={() => navigate('/app/transactions')} title={t('pd_title')} side={wide}>
        {selected ? <DetailBody p={selected} /> : id ? <Empty icon="search" title={t('pd_not_found')} /> : null}
      </Modal>
    </div>
  );
}

function DetailBody({ p }: { p: Payment }) {
  const { t } = useI18n();
  const demo = useDemo();
  const [refundOpen, setRefundOpen] = useState(false);
  const invoice = p.source === 'invoice' ? demo.invoices.find((i) => i.id === p.sourceId) : undefined;
  const link = p.source === 'link' ? demo.links.find((l) => l.id === p.sourceId) : undefined;
  const pendingRefund = p.refunds.some((r) => r.status === 'pending');
  const canRefund = refundable(p) > 0 && !pendingRefund;

  return (
    <>
      <PaymentDetail
        p={p}
        invoice={invoice}
        link={link}
        feeRate={demo.merchant.feeRate}
        settleAsset={demo.merchant.settleAsset}
        actions={
          canRefund ? (
            <Button icon="refund" onClick={() => setRefundOpen(true)}>
              {t('refund_btn')}
            </Button>
          ) : p.status === 'pending' ? (
            <Button icon="terminal" onClick={() => navigate(`/app/pos/${p.id}`)}>
              {t('pd_open_pos')}
            </Button>
          ) : pendingRefund ? (
            <p className="pdetail-inline-note">
              <Icon name="clock" size={15} />
              {t('pd_refund_in_progress')}
            </p>
          ) : null
        }
      />
      <RefundModal p={p} open={refundOpen} onClose={() => setRefundOpen(false)} />
    </>
  );
}

function RefundModal({ p, open, onClose }: { p: Payment; open: boolean; onClose: () => void }) {
  const { t, lang, tx } = useI18n();
  const max = refundable(p);
  const [mode, setMode] = useState<'full' | 'part'>('full');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const a = assetById(p.asset);

  useEffect(() => {
    if (open) {
      setMode('full');
      setValue('');
      setReason('');
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (mode === 'part') setTimeout(() => document.getElementById('rf-amount')?.focus(), 30);
  }, [mode]);

  const amount = mode === 'full' ? max : parseInt(value.replace(/\D/g, ''), 10) || 0;
  const error = mode === 'part' && value && (amount <= 0 || amount > max) ? t('rf_err_range', { max: f.rub(max, lang) }) : null;
  const valid = amount > 0 && amount <= max;
  const crypto = p.crypto ? +((p.crypto * amount) / p.amount).toFixed(a.decimals) : 0;

  const submit = () => {
    if (!valid || busy) return;
    setBusy(true);
    setTimeout(() => {
      const id = issueRefund(p.id, amount, reason);
      if (id) {
        toast(t('toast_refund_started', { amount: f.rub(amount, lang) }), 'info');
        onClose();
      } else {
        setBusy(false);
        toast(t('rf_failed_toast'), 'danger');
      }
    }, 500);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('refund_title')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" icon="refund" disabled={!valid} loading={busy} onClick={submit}>
            {valid ? t('rf_confirm', { amount: f.rub(amount, lang) }) : t('refund_btn')}
          </Button>
        </>
      }
    >
      <div className="rf-original">
        <div>
          <p className="rf-k">{t('rf_original')}</p>
          <p className="rf-v">{tx(p.description) || p.id}</p>
          <p className="rf-meta num">
            {p.paidAt ? f.dateTime(p.paidAt, lang) : ''} · {p.crypto !== undefined ? f.crypto(p.crypto, a.id, lang) : ''} · {a.network}
          </p>
        </div>
        <p className="rf-amount num">{f.rub(p.amount, lang)}</p>
      </div>

      <Segmented
        label={t('rf_amount')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'full', label: t('rf_full', { amount: f.rub(max, lang) }) },
          { value: 'part', label: t('rf_part') },
        ]}
      />

      {mode === 'part' && (
        <Field label={t('rf_amount')} error={error} hint={t('rf_max', { max: f.rub(max, lang) })} htmlFor="rf-amount">
          <Input
            id="rf-amount"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d\s]/g, ''))}
            suffix="₽"
            placeholder={String(Math.round(max / 2))}
            autoComplete="off"
          />
        </Field>
      )}

      <Field label={t('rf_reason')} optional htmlFor="rf-reason">
        <Input id="rf-reason" value={reason} maxLength={120} onChange={(e) => setReason(e.target.value)} placeholder={t('rf_reason_ph')} />
      </Field>

      <div className="rf-summary">
        <Icon name="info" size={17} />
        <p>
          {t('rf_summary', {
            crypto: f.crypto(crypto, a.id, lang),
            network: a.network,
          })}
        </p>
      </div>
    </Modal>
  );
}
