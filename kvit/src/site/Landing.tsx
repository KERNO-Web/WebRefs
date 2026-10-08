import { useEffect, useMemo, useRef, useState } from 'react';
import { overview } from '../lib/derive';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { AssetId, Payment } from '../lib/model';
import { assetById, invoiceTotal } from '../lib/model';
import { quote, useRates } from '../lib/rates';
import { absolute, href, navigate } from '../lib/router';
import { startOfDay } from '../lib/seed';
import { useDemo } from '../lib/store';
import { Checkout, type CheckoutPhase, type CheckoutProps } from '../product/Checkout';
import { InvoiceDocument } from '../product/InvoiceDocument';
import { PosView } from '../product/PosView';
import { Metric, PaymentRow, RevenueChart, SettlementBreakdown } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Badge, Button, CopyButton, LangSwitch, LinkButton, Logo, QR, SandboxBadge, useNow } from '../ui/ui';

const scrollTo = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
};

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export function Landing() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  useReveal();

  useEffect(() => {
    document.title = t('site_title');
  }, [t]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <div className="site">
      <a className="skip" href="#main" onClick={scrollTo('main')}>
        {t('skip')}
      </a>
      <header className={`site-head${scrolled ? ' is-scrolled' : ''}`}>
        <div className="wrap site-head-row">
          <a href={href('/')} className="site-logo" aria-label="Kvit">
            <Logo />
          </a>
          <nav className="site-nav" aria-label={t('nav_site')}>
            <a href="#how" onClick={scrollTo('how')}>
              {t('sn_product')}
            </a>
            <a href="#checkout" onClick={scrollTo('checkout')}>
              {t('sn_payments')}
            </a>
            <a href="#invoices" onClick={scrollTo('invoices')}>
              {t('sn_invoices')}
            </a>
            <a href="#dashboard" onClick={scrollTo('dashboard')}>
              {t('sn_dashboard')}
            </a>
          </nav>
          <div className="site-head-right">
            <LangSwitch />
            <LinkButton variant="primary" size="sm" href={href('/app/overview')}>
              {t('open_demo')}
            </LinkButton>
          </div>
        </div>
      </header>

      <main id="main">
        <Hero />
        <How />
        <CheckoutSection />
        <LinksInvoices />
        <DashboardSection />
        <RefundsSettlement />
        <FinalCta />
      </main>

      <footer className="site-foot">
        <div className="wrap site-foot-row">
          <div>
            <Logo />
            <p className="site-foot-text">{t('foot_text')}</p>
          </div>
          <div className="site-foot-links">
            <a href={href('/app/overview')}>{t('open_demo')}</a>
            <a href="https://kerno-web.github.io/WebRefs/">{t('foot_portfolio')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---------- hero ----------

function Hero() {
  const { t, lang } = useI18n();
  const rates = useRates();
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <SandboxBadge small /> {t('hero_eyebrow')}
          </p>
          <h1 className="hero-title">
            {t('hero_title')
              .split(/(?<=\.)\s/)
              .map((line) => (
                <span key={line}>{line}</span>
              ))}
          </h1>
          <p className="hero-sub">{t('hero_sub')}</p>
          <div className="hero-ctas">
            <LinkButton variant="primary" size="lg" href={href('/app/overview')} iconRight="arrow">
              {t('open_demo')}
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="#how" onClick={scrollTo('how')}>
              {t('explore_product')}
            </LinkButton>
          </div>
          <dl className="hero-facts">
            <div>
              <dt>{t('hero_fact_rate')}</dt>
              <dd className="num">
                1 USDT = {f.rate(rates.rub.usdt, lang)}
                <span className={`rates-dot${rates.source === 'live' ? ' is-live' : ''}`} aria-hidden="true" />
              </dd>
            </div>
            <div>
              <dt>{t('hero_fact_time')}</dt>
              <dd>{t('hero_fact_time_v')}</dd>
            </div>
            <div>
              <dt>{t('hero_fact_payout')}</dt>
              <dd>{t('hero_fact_payout_v')}</dd>
            </div>
          </dl>
        </div>
        <HeroStage />
      </div>
    </section>
  );
}

type HeroPhase = 'typing' | 'pending' | 'processing' | 'paid';

function HeroStage() {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const rates = useRates();
  const [phase, setPhase] = useState<HeroPhase>('typing');
  const [digits, setDigits] = useState('');
  const [paidAt, setPaidAt] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  const AMOUNT = 2490;
  const now = useNow(1000);

  useEffect(() => {
    if (reduced) {
      setDigits('2490');
      setPhase('pending');
      return;
    }
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    setPhase('typing');
    setDigits('');
    setPaidAt(null);
    ['2', '24', '249', '2490'].forEach((d, i) => at(500 + i * 240, () => setDigits(d)));
    at(1900, () => setPhase('pending'));
    at(4700, () => setPhase('processing'));
    at(6500, () => {
      setPhase('paid');
      setPaidAt(Date.now());
    });
    at(10200, () => setCycle((c) => c + 1));
    return () => timers.forEach(clearTimeout);
  }, [cycle, reduced]);

  const q = quote(AMOUNT, 'usdt_ton', rates);
  const sessionStart = useRef(Date.now());
  if (phase === 'typing') sessionStart.current = Date.now();
  const expiresAt = sessionStart.current + 15 * 60_000;

  const recent = demo.payments.filter((p) => p.status === 'paid').slice(0, 3);
  const fresh: Payment | null =
    phase === 'paid' && paidAt
      ? {
          id: 'pay_HERO',
          amount: AMOUNT,
          description: { ru: 'Бразилия Серрадо, 1 кг', en: 'Brazil Cerrado, 1 kg' },
          source: 'pos',
          status: 'paid',
          createdAt: paidAt - 8000,
          expiresAt,
          paidAt,
          asset: 'usdt_ton',
          crypto: q.crypto,
          refunds: [],
        }
      : null;

  return (
    <div className="hero-stage" aria-label={t('hero_stage_label')}>
      <div className="device">
        <div className="device-bar">
          <span className="device-merchant">KERN Coffee Roasters</span>
          <span className="device-label">{t('nav_pos')}</span>
        </div>
        <div className="device-screen">
          {phase === 'typing' ? (
            <div className="hero-entry">
              <p className="pos-entry-label">{t('pos_amount_due')}</p>
              <p className={`pos-entry-amount num${digits ? '' : ' is-empty'}`}>
                {f.rub(digits ? parseInt(digits, 10) : 0, lang)}
                <span className="caret" aria-hidden="true" />
              </p>
              <p className="pos-entry-approx num">{digits ? `≈ ${f.usdt(parseInt(digits, 10) / rates.rub.usdt, lang)}` : t('pos_enter_amount')}</p>
              <div className="keypad is-mini" aria-hidden="true">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((k) => (
                  <span key={k} className={`key${digits.endsWith(k) && k !== '0' && k !== '00' ? ' is-pressed' : ''}`}>
                    {k === 'back' ? <Icon name="backspace" size={20} /> : k}
                  </span>
                ))}
              </div>
              <span className={`btn btn-primary btn-lg btn-block${digits.length === 4 ? '' : ' is-disabled'}`} aria-hidden="true">
                {t('create_payment')}
              </span>
            </div>
          ) : (
            <PosView
              id="pay_7QK2M4XH9D"
              amount={AMOUNT}
              description={{ ru: 'Бразилия Серрадо, 1 кг', en: 'Brazil Cerrado, 1 kg' }}
              status={phase === 'pending' ? 'pending' : phase === 'processing' ? 'processing' : 'paid'}
              expiresAt={expiresAt}
              approx={AMOUNT / rates.rub.usdt}
              qrValue={absolute('/app/overview')}
              now={now}
              asset="usdt_ton"
              crypto={q.crypto}
              paidAt={paidAt ?? undefined}
            />
          )}
        </div>
      </div>

      <div className="hero-feed" aria-live="off">
        <div className="hero-feed-head">
          <span>{t('ov_recent')}</span>
          <span className="hero-feed-live">
            <span className="badge-dot is-live" />
            {t('hero_live')}
          </span>
        </div>
        <div className="plist">
          {fresh && (
            <div className="hero-feed-new" key={paidAt}>
              <PaymentRow p={fresh} />
            </div>
          )}
          {recent.slice(0, fresh ? 2 : 3).map((p) => (
            <PaymentRow key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- how it works ----------

function How() {
  const { t, lang } = useI18n();
  const rates = useRates();
  const q = quote(2490, 'usdt_ton', rates);
  return (
    <section className="section" id="how">
      <div className="wrap">
        <SectionHead eyebrow={t('how_eyebrow')} title={t('how_title')} lead={t('how_lead')} />
        <ol className="steps" data-reveal>
          <li className="step">
            <span className="step-n">01</span>
            <h3>{t('how_1_t')}</h3>
            <p>{t('how_1_p')}</p>
            <div className="step-ui">
              <p className="step-amount num">{f.rub(2490, lang)}</p>
              <span className="btn btn-primary btn-sm btn-block" aria-hidden="true">
                {t('create_payment')}
              </span>
            </div>
          </li>
          <li className="step">
            <span className="step-n">02</span>
            <h3>{t('how_2_t')}</h3>
            <p>{t('how_2_p')}</p>
            <div className="step-ui step-ui-row">
              <QR value={absolute('/app/pos')} size={76} label="QR" />
              <div className="step-ui-col">
                <span className="step-ui-k">USDT · TON</span>
                <span className="btn btn-primary btn-sm" aria-hidden="true">
                  {t('co_pay_btn', { amount: f.crypto(q.total, 'usdt_ton', lang) })}
                </span>
              </div>
            </div>
          </li>
          <li className="step">
            <span className="step-n">03</span>
            <h3>{t('how_3_t')}</h3>
            <p>{t('how_3_p')}</p>
            <div className="step-ui">
              <div className="step-paid">
                <span className="step-paid-icon">
                  <Icon name="check" size={16} strokeWidth={2.6} />
                </span>
                <span className="step-paid-text">
                  <b>{t('st_paid')}</b>
                  <span className="num">
                    {f.crypto(q.crypto, 'usdt_ton', lang)} · 14:42
                  </span>
                </span>
                <b className="num">{f.rub(2490, lang)}</b>
              </div>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, lead, id }: { eyebrow: string; title: string; lead?: string; id?: string }) {
  return (
    <div className="section-head" data-reveal>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="section-lead">{lead}</p>}
    </div>
  );
}

// ---------- checkout ----------

function CheckoutSection() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<CheckoutPhase>('open');
  const [charge, setCharge] = useState<CheckoutProps['charge']>();
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + 15 * 60_000);
  const timer = useRef<number>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPay = (asset: AssetId, fail: boolean) => {
    const q = quote(2490, asset);
    const start = Date.now();
    const end = start + (assetById(asset).eta > 30 ? 4200 : 3000);
    setCharge({ asset, crypto: q.crypto, fee: q.fee, startedAt: start, resolveAt: end, id: 'pay_TRYITHERE1' });
    setPhase('processing');
    timer.current = window.setTimeout(() => {
      setPhase(fail ? 'failed' : 'paid');
      setCharge((c) => (c ? { ...c, at: Date.now() } : c));
    }, end - start);
  };

  const reset = () => {
    clearTimeout(timer.current);
    setPhase('open');
    setCharge(undefined);
    setExpiresAt(Date.now() + 15 * 60_000);
  };

  return (
    <section className="section section-tint" id="checkout">
      <div className="wrap split">
        <div className="split-copy">
          <SectionHead eyebrow={t('co_eyebrow')} title={t('co_title')} lead={t('co_lead')} />
          <ul className="points" data-reveal>
            <li>
              <Icon name="check" size={18} />
              <span>
                <b>{t('co_p1_t')}</b> {t('co_p1_p')}
              </span>
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>
                <b>{t('co_p2_t')}</b> {t('co_p2_p')}
              </span>
            </li>
            <li>
              <Icon name="check" size={18} />
              <span>
                <b>{t('co_p3_t')}</b> {t('co_p3_p')}
              </span>
            </li>
          </ul>
          <p className="try-note" data-reveal>
            <Icon name="bolt" size={16} />
            {t('co_try_note')}
          </p>
        </div>
        <div className="split-ui" data-reveal>
          <div className="phone">
            <Checkout
              merchant="KERN Coffee Roasters"
              amount={2490}
              description={{ ru: 'Бразилия Серрадо, 1 кг', en: 'Brazil Cerrado, 1 kg' }}
              phase={phase}
              charge={charge}
              expiresAt={expiresAt}
              accepted={['usdt_ton', 'usdt_tron', 'ton', 'usdc_sol', 'btc', 'eth_base']}
              onPay={onPay}
              onRetry={reset}
              done={{ label: t('co_try_again'), onClick: reset }}
              seed="landing"
              compact
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- links & invoices ----------

function LinksInvoices() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const link = demo.links.find((l) => l.active && l.reusable) ?? demo.links[0];
  const inv = demo.invoices.find((i) => i.status === 'pending') ?? demo.invoices[0];
  const linkPaid = link ? demo.payments.filter((p) => p.sourceId === link.id && (p.status === 'paid' || p.status === 'partial_refund')) : [];
  const url = link ? absolute(`/pay/${link.id}`) : '';

  return (
    <section className="section" id="invoices">
      <div className="wrap">
        <SectionHead eyebrow={t('li_eyebrow')} title={t('li_title')} lead={t('li_lead')} />
        <div className="li-grid">
          {link && (
            <article className="li-card" data-reveal>
              <div className="li-card-copy">
                <h3>{t('li_link_t')}</h3>
                <p>{t('li_link_p')}</p>
              </div>
              <div className="li-ui">
                <div className="li-link">
                  <div className="li-link-top">
                    <Badge tone="success">{t('lnk_active')}</Badge>
                    <span className="link-card-type">{t('lnk_reusable')}</span>
                  </div>
                  <div className="li-link-body">
                    <div>
                      <p className="li-link-title">{tx(link.title)}</p>
                      <p className="li-link-amount num">{f.rub(link.amount, lang)}</p>
                      <p className="li-link-stats">{t('lnk_stats', { n: linkPaid.length, total: f.rub(linkPaid.reduce((s, p) => s + p.amount, 0), lang) })}</p>
                    </div>
                    <QR value={url} size={96} label={t('lnk_share')} />
                  </div>
                  <div className="li-link-url">
                    <span className="mono">{url.replace(/^https?:\/\//, '').replace(/#\/pay\//, '…/pay/')}</span>
                    <CopyButton text={url} />
                  </div>
                </div>
                <div className="li-link-recent">
                  <p className="li-link-recent-head">{t('lnk_payments')}</p>
                  <div className="plist">
                    {linkPaid.slice(0, 3).map((p) => (
                      <PaymentRow key={p.id} p={p} showDate />
                    ))}
                  </div>
                </div>
              </div>
              <a className="text-link" href={href('/app/links/new')}>
                {t('li_link_cta')}
                <Icon name="arrow" size={15} />
              </a>
            </article>
          )}
          {inv && (
            <article className="li-card" data-reveal>
              <div className="li-card-copy">
                <h3>{t('li_inv_t')}</h3>
                <p>{t('li_inv_p')}</p>
              </div>
              <div className="li-ui li-ui-doc">
                <InvoiceDocument inv={inv} merchant={demo.merchant.name} />
              </div>
              <a className="text-link" href={href('/app/invoices/new')}>
                {t('li_inv_cta', { amount: f.rub(invoiceTotal(inv), lang) })}
                <Icon name="arrow" size={15} />
              </a>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- dashboard ----------

function DashboardSection() {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const now = useNow(30_000);
  // before the shop opens, "today" is nearly empty: show the last full day instead
  const live = useMemo(() => overview(demo, now), [demo, now]);
  const quiet = live.count < 5;
  const o = useMemo(() => (quiet ? overview(demo, startOfDay(now) - 60_000) : live), [quiet, demo, now, live]);
  const delta = !quiet && o.receivedPrev > 0 ? o.received / o.receivedPrev - 1 : null;

  return (
    <section className="section section-tint" id="dashboard">
      <div className="wrap">
        <SectionHead eyebrow={t('db_eyebrow')} title={t('db_title')} lead={t('db_lead')} />
        <div className="db-frame" data-reveal>
          <div className="metrics">
            <Metric
              accent
              label={quiet ? t('ov_received_yesterday') : t('ov_received_today')}
              value={o.received}
              format={(n) => f.rub(Math.round(n), lang)}
              delta={delta}
              foot={quiet ? t('ov_yesterday_full') : t('ov_no_compare')}
            />
            <Metric label={t('ov_payments')} value={o.count} format={(n) => f.num(Math.round(n), lang)} foot={t('ov_success', { n: f.num(o.success * 100, lang, 0) })} />
            <Metric label={t('ov_average')} value={o.average} format={(n) => f.rub(Math.round(n), lang)} foot={quiet ? t('ov_yesterday_label') : t('ov_today_label')} />
            <Metric
              label={t('ov_to_settle')}
              value={(quiet ? live.upcoming?.net : o.current?.net) ?? 0}
              format={(n) => f.usdt(n, lang, { symbol: demo.merchant.settleAsset })}
              foot={quiet && live.upcoming ? t('ov_payout_today', { when: f.time(live.upcoming.payoutAt, lang) }) : o.current ? t('ov_payout', { when: f.time(o.current.payoutAt, lang) }) : t('ov_nothing_to_settle')}
            />
          </div>
          <div className="db-row">
            <section className="card">
              <div className="card-head">
                <h3>{t('ov_week')}</h3>
                <span className="card-head-note num">{f.rub(o.weekTotal, lang)}</span>
              </div>
              <RevenueChart week={o.week} lastLabel={quiet ? [t('yesterday'), t('yesterday_short')] : undefined} />
            </section>
            <section className="card card-flush">
              <div className="card-head">
                <h3>{t('ov_recent')}</h3>
                <a className="text-link" href={href('/app/transactions')}>
                  {t('ov_all_transactions')}
                  <Icon name="chevron" size={15} />
                </a>
              </div>
              <div className="plist">
                {demo.payments.slice(0, 5).map((p) => (
                  <PaymentRow key={p.id} p={p} onOpen={() => navigate(`/app/transactions/${p.id}`)} />
                ))}
              </div>
            </section>
          </div>
        </div>
        <p className="db-note" data-reveal>
          <Icon name="info" size={16} />
          {t('db_note')}
        </p>
      </div>
    </section>
  );
}

// ---------- refunds & settlement ----------

function RefundsSettlement() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const o = useMemo(() => overview(demo), [demo]);
  const stl = o.current ?? o.upcoming ?? o.lastPaid;
  const refunded = demo.payments.find((p) => p.refunds.some((r) => r.status === 'completed'));
  const r = refunded?.refunds.find((x) => x.status === 'completed');
  const a = refunded ? assetById(refunded.asset) : null;

  return (
    <section className="section" id="settlement">
      <div className="wrap">
        <SectionHead eyebrow={t('rs_eyebrow')} title={t('rs_title')} lead={t('rs_lead')} />
        <div className="rs-grid">
          {refunded && r && a && (
            <article className="li-card" data-reveal>
              <div className="li-card-copy">
                <h3>{t('rs_refund_t')}</h3>
                <p>{t('rs_refund_p')}</p>
              </div>
              <div className="rs-refund">
                <div className="rs-refund-row">
                  <div>
                    <p className="rf-k">{t('rf_original')}</p>
                    <p className="rf-v">{tx(refunded.description)}</p>
                    <p className="rf-meta num">
                      {f.crypto(refunded.crypto ?? 0, a.id, lang)} · {a.network}
                    </p>
                  </div>
                  <p className="rf-amount num">{f.rub(refunded.amount, lang)}</p>
                </div>
                <div className="rs-refund-arrow" aria-hidden="true">
                  <Icon name="refund" size={18} />
                </div>
                <div className="rs-refund-row is-refund">
                  <div>
                    <p className="rf-k">{t('rs_returned')}</p>
                    <p className="rf-v num">{f.crypto(r.crypto, a.id, lang)}</p>
                    <p className="rf-meta">{tx(r.reason)}</p>
                  </div>
                  <div className="rs-refund-right">
                    <p className="rf-amount num">{f.rub(-r.amount, lang)}</p>
                    <Badge tone="refund">{t('rf_completed')}</Badge>
                  </div>
                </div>
                <ol className="timeline is-compact">
                  <li className="is-done">
                    <span className="timeline-dot" />
                    <span className="timeline-label">{t('rs_tl_1')}</span>
                  </li>
                  <li className="is-done">
                    <span className="timeline-dot" />
                    <span className="timeline-label">{t('rs_tl_2', { network: a.network })}</span>
                  </li>
                  <li className="is-done">
                    <span className="timeline-dot" />
                    <span className="timeline-label">{t('rs_tl_3')}</span>
                  </li>
                </ol>
              </div>
              <a className="text-link" href={href('/app/transactions?status=refunded')}>
                {t('rs_refund_cta')}
                <Icon name="arrow" size={15} />
              </a>
            </article>
          )}
          {stl && (
            <article className="li-card" data-reveal>
              <div className="li-card-copy">
                <h3>{t('rs_settle_t')}</h3>
                <p>{t('rs_settle_p', { asset: demo.merchant.settleAsset })}</p>
              </div>
              <div className="rs-settle">
                <SettlementBreakdown st={stl} feeRate={demo.merchant.feeRate} wallet={demo.merchant.payoutWallet} asset={demo.merchant.settleAsset} />
              </div>
              <a className="text-link" href={href('/app/overview')}>
                {t('rs_settle_cta')}
                <Icon name="arrow" size={15} />
              </a>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useI18n();
  return (
    <section className="section cta-section">
      <div className="wrap">
        <div className="cta" data-reveal>
          <div>
            <h2>{t('cta_title')}</h2>
            <p>{t('cta_text')}</p>
          </div>
          <div className="cta-actions">
            <LinkButton variant="primary" size="lg" href={href('/app/pos')} iconRight="arrow">
              {t('cta_btn')}
            </LinkButton>
            <Button variant="ghost" size="lg" onClick={() => navigate('/app/overview')}>
              {t('cta_btn_2')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
