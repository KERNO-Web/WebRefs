import { useMemo, useState } from 'react';
import { overview } from '../lib/derive';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import { invoiceTotal } from '../lib/model';
import { href, navigate } from '../lib/router';
import { useDemo } from '../lib/store';
import { AssetMix, Metric, PaymentRow, RevenueChart, SettlementBreakdown } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Badge, Button, Empty, Modal, useNow } from '../ui/ui';
import { PageHead } from './AppShell';

export function Overview() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const now = useNow(30_000);
  const o = useMemo(() => overview(demo, now), [demo, now]);
  const [allSettlements, setAllSettlements] = useState(false);
  const recent = demo.payments.slice(0, 7);
  const delta = o.receivedPrev > 0 ? o.received / o.receivedPrev - 1 : null;
  const stl = o.current ?? o.upcoming ?? o.lastPaid;
  const due = [...o.openInvoices].sort((a, b) => a.dueAt - b.dueAt);
  const dueTotal = due.reduce((s, i) => s + invoiceTotal(i), 0);

  return (
    <div className="page">
      <PageHead
        title={t('nav_overview')}
        sub={`${f.dateLong(now, lang)} · ${demo.merchant.name}`}
        actions={
          <>
            <Button icon="invoice" onClick={() => navigate('/app/invoices/new')} className="hide-sm">
              {t('create_invoice')}
            </Button>
            <Button variant="primary" icon="plus" onClick={() => navigate('/app/pos')}>
              {t('new_payment')}
            </Button>
          </>
        }
      />

      <section className="metrics" aria-label={t('ov_today')}>
        <Metric accent label={t('ov_received_today')} value={o.received} format={(n) => f.rub(Math.round(n), lang)} delta={delta} foot={t('ov_no_compare')} />
        <Metric label={t('ov_payments')} value={o.count} format={(n) => f.num(Math.round(n), lang)} foot={t('ov_success', { n: f.num(o.success * 100, lang, 0) })} />
        <Metric label={t('ov_average')} value={o.average} format={(n) => f.rub(Math.round(n), lang)} foot={o.refundsToday ? t('ov_refunds_today', { amount: f.rub(o.refundsToday, lang) }) : t('ov_no_refunds')} />
        <Metric
          label={t('ov_to_settle')}
          value={o.current?.net ?? 0}
          format={(n) => f.usdt(n, lang, { symbol: demo.merchant.settleAsset })}
          foot={o.current ? t('ov_payout', { when: f.time(o.current.payoutAt, lang) }) : t('ov_nothing_to_settle')}
        />
      </section>

      <div className="grid-2-1">
        <section className="card">
          <div className="card-head">
            <h2>{t('ov_week')}</h2>
            <span className="card-head-note num">{f.rub(o.weekTotal, lang)}</span>
          </div>
          <RevenueChart week={o.week} />
        </section>

        <section className="card">
          <div className="card-head">
            <h2>{t('ov_settlement')}</h2>
            <button type="button" className="text-link" onClick={() => setAllSettlements(true)}>
              {t('ov_all_settlements')}
            </button>
          </div>
          {stl ? (
            <SettlementBreakdown st={stl} feeRate={demo.merchant.feeRate} wallet={demo.merchant.payoutWallet} asset={demo.merchant.settleAsset} />
          ) : (
            <Empty icon="wallet" title={t('ov_no_settlements')} />
          )}
        </section>
      </div>

      <div className="grid-2-1">
        <section className="card card-flush">
          <div className="card-head">
            <h2>{t('ov_recent')}</h2>
            <a className="text-link" href={href('/app/transactions')}>
              {t('ov_all_transactions')}
              <Icon name="chevron" size={15} />
            </a>
          </div>
          {recent.length ? (
            <div className="plist">
              {recent.map((p) => (
                <PaymentRow key={p.id} p={p} showDate={now - (p.paidAt ?? p.createdAt) > 20 * 3_600_000} onOpen={() => navigate(`/app/transactions/${p.id}`)} />
              ))}
            </div>
          ) : (
            <Empty icon="list" title={t('tx_empty')} />
          )}
        </section>

        <div className="stack">
          <section className="card">
            <div className="card-head">
              <h2>{t('ov_mix')}</h2>
              <span className="card-head-note">{t('ov_30_days')}</span>
            </div>
            {o.mix.length ? <AssetMix mix={o.mix} /> : <Empty icon="wallet" title={t('ov_no_data')} />}
            <p className="card-note">{t('ov_mix_note', { asset: demo.merchant.settleAsset })}</p>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>{t('ov_invoices_due')}</h2>
              <a className="text-link" href={href('/app/invoices')}>
                {t('ov_open')}
                <Icon name="chevron" size={15} />
              </a>
            </div>
            {due.length ? (
              <>
                <p className="due-total num">{f.rub(dueTotal, lang)}</p>
                <ul className="due-list">
                  {due.slice(0, 3).map((i) => (
                    <li key={i.id}>
                      <a href={href(`/app/invoices/${i.id}`)}>
                        <span className="due-name">{tx(i.customer)}</span>
                        <span className="due-meta">
                          {i.number} · {t('inv_due_on', { date: f.date(i.dueAt, lang) })}
                        </span>
                      </a>
                      <span className="num">{f.rub(invoiceTotal(i), lang)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Empty icon="invoice" title={t('ov_no_due')} action={<Button size="sm" icon="plus" onClick={() => navigate('/app/invoices/new')}>{t('create_invoice')}</Button>} />
            )}
          </section>
        </div>
      </div>

      <Modal open={allSettlements} onClose={() => setAllSettlements(false)} title={t('ov_settlements_title')} side>
        <p className="modal-lead">{t('ov_settlements_lead', { asset: demo.merchant.settleAsset })}</p>
        <ul className="stl-list">
          {o.settlements.slice(0, 14).map((s) => (
            <li key={s.id}>
              <div>
                <b>{s.status === 'open' ? t('stl_today') : f.dateLong(s.day, lang)}</b>
                <span>
                  {s.count} {f.plural(s.count, lang, t('payments_forms').split('|') as [string, string, string])} · {f.rub(s.grossRub, lang)}
                </span>
              </div>
              <div className="stl-list-right">
                <b className="num">{f.usdt(s.net, lang, { symbol: demo.merchant.settleAsset })}</b>
                <Badge tone={s.status === 'completed' ? 'success' : s.status === 'scheduled' ? 'info' : 'warning'} live={s.status === 'open'}>
                  {s.status === 'completed' ? t('stl_completed') : s.status === 'scheduled' ? t('stl_scheduled') : t('stl_open')}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
