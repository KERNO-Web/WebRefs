import { useEffect, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { DemoState, PaymentLink } from '../lib/model';
import { wasPaid } from '../lib/model';
import { absolute, href, navigate } from '../lib/router';
import { createLink, setLinkActive, useDemo } from '../lib/store';
import { PaymentRow } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Badge, Button, CopyButton, Empty, Field, Input, Modal, QR, Toggle, toast } from '../ui/ui';
import { PageHead } from './AppShell';

export function linkStats(demo: DemoState, id: string) {
  const list = demo.payments.filter((p) => p.source === 'link' && p.sourceId === id);
  const paid = list.filter(wasPaid);
  return { list, count: paid.length, total: paid.reduce((s, p) => s + p.amount, 0), last: paid[0]?.paidAt };
}

export function LinkStatus({ link }: { link: PaymentLink }) {
  const { t } = useI18n();
  if (link.completedAt) return <Badge tone="neutral">{t('lnk_completed')}</Badge>;
  return link.active ? <Badge tone="success">{t('lnk_active')}</Badge> : <Badge tone="draft">{t('lnk_paused')}</Badge>;
}

export function Links({ id }: { id?: string }) {
  const [creating, setCreating] = useState(id === 'new');
  useEffect(() => setCreating(id === 'new'), [id]);
  return (
    <>
      {id && id !== 'new' ? <LinkView id={id} /> : <LinkList onCreate={() => navigate('/app/links/new')} />}
      <CreateLink open={creating} onClose={() => navigate('/app/links', { replace: true })} />
    </>
  );
}

function LinkList({ onCreate }: { onCreate: () => void }) {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  return (
    <div className="page">
      <PageHead
        title={t('nav_links')}
        sub={t('lnk_sub')}
        actions={
          <Button variant="primary" icon="plus" onClick={onCreate}>
            {t('create_link')}
          </Button>
        }
      />
      {demo.links.length ? (
        <div className="link-grid">
          {demo.links.map((l) => {
            const s = linkStats(demo, l.id);
            const url = absolute(`/pay/${l.id}`);
            return (
              <article key={l.id} className={`link-card${l.active ? '' : ' is-off'}`}>
                <a className="link-card-main" href={href(`/app/links/${l.id}`)}>
                  <div className="link-card-top">
                    <LinkStatus link={l} />
                    <span className="link-card-type">{l.reusable ? t('lnk_reusable') : t('lnk_oneoff')}</span>
                  </div>
                  <h3>{tx(l.title)}</h3>
                  <p className="link-card-amount num">{f.rub(l.amount, lang)}</p>
                  <p className="link-card-stats">
                    {s.count ? t('lnk_stats', { n: s.count, total: f.rub(s.total, lang) }) : t('lnk_no_payments')}
                  </p>
                </a>
                <div className="link-card-foot">
                  <span className="mono link-card-url">{url.replace(/^https?:\/\//, '').replace(/#\/pay\//, '…/pay/')}</span>
                  {l.active ? <CopyButton text={url} /> : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="card">
          <Empty
            icon="link"
            title={t('lnk_empty')}
            text={t('lnk_empty_text')}
            action={
              <Button size="sm" icon="plus" onClick={onCreate}>
                {t('create_link')}
              </Button>
            }
          />
        </section>
      )}
    </div>
  );
}

function LinkView({ id }: { id: string }) {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const link = demo.links.find((l) => l.id === id);
  if (!link) {
    return (
      <div className="page">
        <PageHead title={t('nav_links')} back={{ label: t('nav_links'), to: '/app/links' }} />
        <Empty icon="link" title={t('lnk_not_found')} />
      </div>
    );
  }
  const url = absolute(`/pay/${link.id}`);
  const s = linkStats(demo, link.id);

  return (
    <div className="page">
      <PageHead
        title={tx(link.title)}
        sub={`${f.rub(link.amount, lang)} · ${link.reusable ? t('lnk_reusable') : t('lnk_oneoff')}`}
        back={{ label: t('nav_links'), to: '/app/links' }}
        actions={<LinkStatus link={link} />}
      />
      <div className="inv-layout">
        <div className="stack">
          <section className="card share">
            <div className="card-head">
              <h2>{t('lnk_share')}</h2>
              {!link.completedAt && (
                <label className="inline-toggle">
                  <span>{link.active ? t('lnk_accepting') : t('lnk_paused')}</span>
                  <Toggle
                    checked={link.active}
                    label={t('lnk_accepting')}
                    onChange={(v) => {
                      setLinkActive(link.id, v);
                      toast(v ? t('toast_link_on') : t('toast_link_off'), 'info');
                    }}
                  />
                </label>
              )}
            </div>
            <div className={`share-body${link.active ? '' : ' is-off'}`}>
              <QR value={url} size={132} label={t('lnk_share')} />
              <div>
                <p className="share-text">{link.completedAt ? t('lnk_completed_text') : link.active ? t('lnk_share_text') : t('lnk_paused_text')}</p>
                <p className="mono share-url">{url.replace(/^https?:\/\//, '')}</p>
              </div>
            </div>
            <div className="share-actions">
              <CopyButton text={url} label={t('copy_link')} />
              <Button size="sm" icon="external" onClick={() => window.open(href(`/pay/${link.id}`), '_blank', 'noopener')}>
                {t('open_pay_page')}
              </Button>
            </div>
          </section>

          <section className="card card-flush">
            <div className="card-head">
              <h2>{t('lnk_payments')}</h2>
              <span className="card-head-note num">{f.rub(s.total, lang)}</span>
            </div>
            {s.list.length ? (
              <div className="plist">
                {s.list.slice(0, 12).map((p) => (
                  <PaymentRow key={p.id} p={p} showDate onOpen={() => navigate(`/app/transactions/${p.id}`)} />
                ))}
              </div>
            ) : (
              <Empty icon="link" title={t('lnk_no_payments')} text={t('lnk_no_payments_text')} />
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="card">
            <div className="card-head">
              <h2>{t('lnk_page')}</h2>
            </div>
            <div className="link-preview">
              <p className="link-preview-merchant">{demo.merchant.name}</p>
              <p className="link-preview-title">{tx(link.title)}</p>
              {link.description && <p className="link-preview-desc">{tx(link.description)}</p>}
              <p className="link-preview-amount num">{f.rub(link.amount, lang)}</p>
            </div>
          </section>
          <section className="summary-col">
            <div className="summary">
              <p>{t('lnk_paid_count')}</p>
              <b className="num">{s.count}</b>
            </div>
            <div className="summary">
              <p>{t('lnk_last')}</p>
              <b>{s.last ? f.dateTime(s.last, lang) : '—'}</b>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function CreateLink({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useI18n();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [reusable, setReusable] = useState(true);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDesc('');
      setAmount('');
      setReusable(true);
      setTried(false);
      setBusy(false);
    }
  }, [open]);

  const value = parseInt(amount, 10) || 0;
  const errors = {
    title: !title.trim() ? t('err_required') : null,
    amount: value < 10 ? t('err_min_amount', { amount: f.rub(10, lang) }) : value > 5_000_000 ? t('err_total') : null,
  };
  const submit = () => {
    setTried(true);
    if (errors.title || errors.amount) return;
    setBusy(true);
    setTimeout(() => {
      const id = createLink({ title, description: desc, amount: value, reusable });
      toast(t('toast_link_created'));
      navigate(`/app/links/${id}`, { replace: true });
    }, 400);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('create_link')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="primary" icon="link" loading={busy} onClick={submit}>
            {t('lnk_create_btn')}
          </Button>
        </>
      }
    >
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <Field label={t('lnk_f_title')} error={tried ? errors.title : null} htmlFor="lnk-title" hint={t('lnk_f_title_hint')}>
          <Input id="lnk-title" value={title} maxLength={70} onChange={(e) => setTitle(e.target.value)} placeholder={t('lnk_f_title_ph')} />
        </Field>
        <Field label={t('lnk_f_desc')} optional htmlFor="lnk-desc">
          <textarea id="lnk-desc" className="textarea" rows={2} value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} placeholder={t('lnk_f_desc_ph')} />
        </Field>
        <Field label={t('lnk_f_amount')} error={tried ? errors.amount : null} htmlFor="lnk-amount">
          <Input id="lnk-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 7))} suffix="₽" placeholder="1 890" />
        </Field>
        <div className="toggle-row">
          <div>
            <p className="toggle-row-title">{t('lnk_reusable')}</p>
            <p className="toggle-row-text">{reusable ? t('lnk_reusable_text') : t('lnk_oneoff_text')}</p>
          </div>
          <Toggle checked={reusable} onChange={setReusable} label={t('lnk_reusable')} />
        </div>
        <button type="submit" hidden />
      </form>
      <p className="modal-note">
        <Icon name="info" size={15} />
        {t('lnk_f_note')}
      </p>
    </Modal>
  );
}
