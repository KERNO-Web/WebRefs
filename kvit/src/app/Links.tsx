import { useEffect, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { DemoState, PaymentLink } from '../lib/model';
import { wasPaid } from '../lib/model';
import { absolute, href, navigate } from '../lib/router';
import { createLink, setLinkActive, useDemo } from '../lib/store';
import { PaymentRow } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Badge, Button, CopyButton, Empty, Field, Input, Modal, Money, QRFrame, Toggle, copyText, toast, useMedia } from '../ui/ui';
import { PageHead } from './AppShell';

export function linkStats(demo: DemoState, id: string) {
  const list = demo.payments.filter((p) => p.source === 'link' && p.sourceId === id);
  const paid = list.filter(wasPaid);
  return { list, count: paid.length, total: paid.reduce((s, p) => s + p.amount, 0), last: paid[0]?.paidAt };
}

type LinkState = 'active' | 'paused' | 'completed';
const stateOf = (l: PaymentLink): LinkState => (l.completedAt ? 'completed' : l.active ? 'active' : 'paused');

export function LinkStatus({ link, strong }: { link: PaymentLink; strong?: boolean }) {
  const { t } = useI18n();
  const s = stateOf(link);
  if (s === 'completed') return <Badge tone="success" strong={strong}>{t('lnk_completed')}</Badge>;
  return s === 'active' ? <Badge tone="success" live>{t('lnk_active')}</Badge> : <Badge tone="draft">{t('lnk_paused')}</Badge>;
}

async function shareLink(title: string, url: string, t: (k: 'toast_link_copied') => string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      /* cancelled: fall back to copying */
    }
  }
  if (await copyText(url)) toast(t('toast_link_copied'));
}

export function Links({ id }: { id?: string }) {
  const { t } = useI18n();
  const demo = useDemo();
  const wide = useMedia('(min-width: 1100px)');
  const creating = id === 'new';
  const selectedId = id && id !== 'new' ? id : wide ? demo.links[0]?.id : undefined;
  const selected = demo.links.find((l) => l.id === selectedId);

  const monthAgo = Date.now() - 30 * 86_400_000;
  const linkPaid = demo.payments.filter((p) => p.source === 'link' && wasPaid(p) && (p.paidAt ?? 0) >= monthAgo);
  const activeCount = demo.links.filter((l) => stateOf(l) === 'active').length;

  return (
    <div className="page">
      <PageHead
        title={t('nav_links')}
        sub={t('lnk_sub')}
        actions={
          <Button variant="primary" icon="plus" onClick={() => navigate('/app/links/new')}>
            {t('create_link')}
          </Button>
        }
      />

      <div className="summary-row">
        <div className="summary is-mint">
          <p>{t('lnk_sum_received')}</p>
          <b>
            <Money value={linkPaid.reduce((s, p) => s + p.amount, 0)} tween />
          </b>
          <span>{t('lnk_sum_30')}</span>
        </div>
        <div className="summary">
          <p>{t('lnk_sum_payments')}</p>
          <b>
            <Money value={linkPaid.length} kind="count" />
          </b>
          <span>{t('lnk_sum_30')}</span>
        </div>
        <div className="summary">
          <p>{t('lnk_sum_active')}</p>
          <b>
            <Money value={activeCount} kind="count" />
          </b>
          <span>{t('lnk_sum_total', { n: demo.links.length })}</span>
        </div>
      </div>

      {demo.links.length ? (
        <div className="links-layout">
          <div className="link-grid">
            {demo.links.map((l) => (
              <LinkCard key={l.id} link={l} selected={l.id === selectedId} />
            ))}
          </div>
          {wide && selected && (
            <aside className="link-panel">
              <LinkPreview link={selected} />
            </aside>
          )}
        </div>
      ) : (
        <section className="card">
          <Empty
            icon="link"
            title={t('lnk_empty')}
            text={t('lnk_empty_text')}
            action={
              <Button size="sm" icon="plus" onClick={() => navigate('/app/links/new')}>
                {t('create_link')}
              </Button>
            }
          />
        </section>
      )}

      {!wide && (
        <Modal open={!!selected && !!id && !creating} onClose={() => navigate('/app/links')} title={t('lnk_details')}>
          {selected && <LinkPreview link={selected} />}
        </Modal>
      )}
      <CreateLink open={creating} onClose={() => navigate('/app/links', { replace: true })} />
    </div>
  );
}

function LinkCard({ link, selected }: { link: PaymentLink; selected: boolean }) {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const s = linkStats(demo, link.id);
  const state = stateOf(link);
  const url = absolute(`/pay/${link.id}`);
  const open = () => navigate(`/app/links/${link.id}`, { replace: true });

  return (
    <article className={`link-card is-${state}${selected ? ' is-selected' : ''}`}>
      <button type="button" className="link-card-main" onClick={open} aria-pressed={selected}>
        <span className="link-card-top">
          <LinkStatus link={link} />
          <span className="link-card-type">{link.reusable ? t('lnk_reusable') : t('lnk_oneoff')}</span>
        </span>
        <span className="link-card-title">{tx(link.title)}</span>
        <span className="link-card-amount">
          <Money value={link.amount} />
        </span>
        <span className="link-card-stats">
          {s.count ? (
            <>
              <b>
                {s.count} {f.plural(s.count, lang, t('pay_forms').split('|') as [string, string, string])}
              </b>
              <span>{t('lnk_received', { total: f.rub(s.total, lang) })}</span>
            </>
          ) : (
            <span>{t('lnk_no_payments')}</span>
          )}
        </span>
      </button>
      <div className="link-card-actions">
        {state === 'active' && <CopyButton text={url} variant="ghost" />}
        {state === 'active' && (
          <Button size="sm" variant="ghost" icon="share" onClick={() => shareLink(tx(link.title), url, t)}>
            {t('lnk_share_btn')}
          </Button>
        )}
        {state === 'paused' && (
          <Button
            size="sm"
            variant="ghost"
            icon="play"
            onClick={() => {
              setLinkActive(link.id, true);
              toast(t('toast_link_on'), 'info');
            }}
          >
            {t('lnk_resume')}
          </Button>
        )}
        {state === 'completed' && link.completedAt && <span className="link-card-done">{t('lnk_paid_on', { date: f.date(link.completedAt, lang) })}</span>}
        <button type="button" className="link-card-open" onClick={open} aria-label={t('lnk_open')} title={t('lnk_open')}>
          <Icon name="arrow" size={17} />
        </button>
      </div>
    </article>
  );
}

function LinkPreview({ link }: { link: PaymentLink }) {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const s = linkStats(demo, link.id);
  const state = stateOf(link);
  const url = absolute(`/pay/${link.id}`);
  const [showQr, setShowQr] = useState(false);
  useEffect(() => setShowQr(false), [link.id]);

  return (
    <div className="lp">
      <p className="lp-label">{t('lnk_customer_sees')}</p>
      <div className={`lp-checkout${state === 'active' ? '' : ' is-off'}`}>
        <div className="lp-merchant">
          <span className="co-avatar" aria-hidden="true">
            KC
          </span>
          <span>{demo.merchant.name}</span>
        </div>
        <p className="lp-title">{tx(link.title)}</p>
        {link.description && <p className="lp-desc">{tx(link.description)}</p>}
        <p className="lp-amount">
          <Money value={link.amount} />
        </p>
        <span className="lp-pay" aria-hidden="true">
          {state === 'active' ? t('lnk_preview_pay') : state === 'paused' ? t('lnk_paused') : t('lnk_completed')}
        </span>
        <p className="lp-assets">USDT · USDC · TON · BTC · ETH</p>
      </div>

      <dl className="lp-stats">
        <div>
          <dt>{t('lnk_paid_count')}</dt>
          <dd>
            <Money value={s.count} kind="count" />
          </dd>
        </div>
        <div>
          <dt>{t('lnk_revenue')}</dt>
          <dd>
            <Money value={s.total} />
          </dd>
        </div>
        <div>
          <dt>{t('lnk_status')}</dt>
          <dd>
            <LinkStatus link={link} strong />
          </dd>
        </div>
        <div>
          <dt>{t('lnk_created')}</dt>
          <dd className="lp-date">{f.date(link.createdAt, lang)}</dd>
        </div>
      </dl>

      {state !== 'completed' && (
        <div className="lp-url">
          <span className="mono">{url.replace(/^https?:\/\//, '')}</span>
        </div>
      )}
      <div className="lp-actions">
        <CopyButton text={url} label={t('copy_link')} />
        <Button size="sm" icon="external" onClick={() => window.open(href(`/pay/${link.id}`), '_blank', 'noopener')}>
          {t('open_pay_page')}
        </Button>
        <Button size="sm" variant="ghost" icon="qr" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
          QR
        </Button>
      </div>
      {showQr && (
        <div className="lp-qr">
          <QRFrame value={url} size={150} label={t('lnk_share')} />
        </div>
      )}
      {state !== 'completed' && (
        <label className="lp-toggle">
          <span>
            <b>{t('lnk_accepting')}</b>
            <span>{link.active ? t('lnk_share_text') : t('lnk_paused_text')}</span>
          </span>
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

      <div className="lp-recent">
        <p className="lp-label">{t('lnk_payments')}</p>
        {s.list.length ? (
          <div className="plist">
            {s.list.slice(0, 4).map((p) => (
              <PaymentRow key={p.id} p={p} showDate onOpen={() => navigate(`/app/transactions/${p.id}`)} />
            ))}
          </div>
        ) : (
          <p className="lp-empty">{t('lnk_no_payments_text')}</p>
        )}
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
