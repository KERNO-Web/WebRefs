import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { overview } from '../lib/derive';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import type { AssetId, Invoice, Payment } from '../lib/model';
import { assetById, invoiceTotal } from '../lib/model';
import { quote, useRates } from '../lib/rates';
import { absolute, href, navigate } from '../lib/router';
import { startOfDay } from '../lib/seed';
import { useDemo } from '../lib/store';
import { Checkout, type CheckoutPhase, type CheckoutProps } from '../product/Checkout';
import { InvoiceDocument } from '../product/InvoiceDocument';
import { PosView } from '../product/PosView';
import { Metric, PaymentRow, RevenueChart, SettlementBreakdown } from '../product/widgets';
import { Icon, type IconName } from '../ui/icons';
import { Badge, LangSwitch, LinkButton, Logo, Money, QRFrame, SandboxBadge, useMedia, useNow } from '../ui/ui';

const DAY = 86_400_000;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- scrolling ----------
// Native scrolling runs on the compositor thread and stays smooth even when
// the page is busy; only anchor jumps are animated.

const jump = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
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
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const NAV = ['pos', 'checkout', 'invoices', 'dashboard'] as const;

function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    for (const id of [...NAV, 'top', 'settlement', 'start']) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return active;
}

// ---------- page ----------

export function Landing() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection();
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

  const labels: Record<(typeof NAV)[number], string> = {
    pos: t('sn_product'),
    checkout: t('sn_payments'),
    invoices: t('sn_invoices'),
    dashboard: t('sn_dashboard'),
  };

  return (
    <div className="site">
      <a className="skip" href="#main" onClick={jump('main')}>
        {t('skip')}
      </a>
      <header className={`site-head${scrolled ? ' is-scrolled' : ''}`}>
        <div className="wrap site-head-row">
          <a href={href('/')} className="site-logo" aria-label="KVIT" onClick={jump('top')}>
            <Logo />
          </a>
          <nav className="site-nav" aria-label={t('nav_site')}>
            {NAV.map((id) => (
              <a key={id} href={`#${id}`} onClick={jump(id)} className={active === id ? 'is-on' : ''} aria-current={active === id ? 'true' : undefined}>
                {labels[id]}
              </a>
            ))}
          </nav>
          <div className="site-head-right">
            <LangSwitch />
            <LinkButton variant="primary" size="sm" href={href('/app/overview')} iconRight="arrow">
              {t('open_demo')}
            </LinkButton>
          </div>
        </div>
      </header>

      <main id="main">
        <Hero />
        <PosStory />
        <TrySection />
        <InvoiceStory />
        <DashboardSection />
        <SettleSection />
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
  const [l1, l2] = t('hero_title').split(/(?<=\.)\s/);
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <SandboxBadge small />
            <span>{t('hero_eyebrow')}</span>
          </p>
          <h1 className="hero-title">
            <span>{l1}</span>
            <span className="is-accent">{l2}</span>
          </h1>
          <p className="hero-sub">{t('hero_sub')}</p>
          <div className="hero-ctas">
            <LinkButton variant="primary" size="lg" href={href('/app/overview')} iconRight="arrow">
              {t('open_demo')}
            </LinkButton>
            <LinkButton variant="secondary" size="lg" href="#pos" onClick={jump('pos')}>
              {t('hero_cta_2')}
            </LinkButton>
          </div>
          <dl className="hero-proof">
            <div>
              <dt>{t('proof_1_v')}</dt>
              <dd>{t('proof_1_l')}</dd>
            </div>
            <div>
              <dt>{t('proof_2_v')}</dt>
              <dd>{t('proof_2_l')}</dd>
            </div>
            <div>
              <dt>{t('proof_3_v')}</dt>
              <dd>{t('proof_3_l')}</dd>
            </div>
          </dl>
          <p className="hero-rate">
            <span className={`rates-dot${rates.source === 'live' ? ' is-live' : ''}`} aria-hidden="true" />
            <b className="num">1 USDT = {f.rate(rates.rub.usdt, lang)}</b>
            <span>{rates.source === 'live' ? t('rates_live', { time: f.time(rates.updatedAt, lang) }) : t('rates_reference')}</span>
          </p>
        </div>
        <HeroStage />
      </div>
    </section>
  );
}

type HeroPhase = 'typing' | 'pending' | 'processing' | 'paid';
const PHASES: HeroPhase[] = ['typing', 'pending', 'processing', 'paid'];
const HERO_AMOUNT = 2490;
const BEANS = { ru: 'Бразилия Серрадо, 1 кг', en: 'Brazil Cerrado, 1 kg' };

function HeroStage() {
  const { t } = useI18n();
  const demo = useDemo();
  const rates = useRates();
  const [phase, setPhase] = useState<HeroPhase>('typing');
  const [digits, setDigits] = useState('');
  const [paidAt, setPaidAt] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const now = useNow(1000, visible);
  const sessionStart = useRef(Date.now());

  // the loop only runs while the hero is on screen
  useEffect(() => {
    const el = stage.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion()) {
      setDigits('2490');
      setPhase('pending');
      return;
    }
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    setPhase('typing');
    setDigits('');
    setPaidAt(null);
    sessionStart.current = Date.now();
    ['2', '24', '249', '2490'].forEach((d, i) => at(450 + i * 230, () => setDigits(d)));
    at(1800, () => setPhase('pending'));
    at(4600, () => setPhase('processing'));
    at(6300, () => {
      setPhase('paid');
      setPaidAt(Date.now());
    });
    at(10400, () => setCycle((c) => c + 1));
    return () => timers.forEach(clearTimeout);
  }, [cycle, visible]);

  const q = quote(HERO_AMOUNT, 'usdt_ton', rates);
  const recent = demo.payments.filter((p) => p.status === 'paid').slice(0, 3);
  const fresh: Payment | null =
    phase === 'paid' && paidAt
      ? { id: 'pay_HERO', amount: HERO_AMOUNT, description: BEANS, source: 'pos', status: 'paid', createdAt: paidAt - 8000, expiresAt: paidAt, paidAt, asset: 'usdt_ton', crypto: q.crypto, refunds: [] }
      : null;
  const labels = [t('ph_amount'), 'QR', t('ph_pay'), t('ph_paid')];

  return (
    <div className="hero-stage" ref={stage} aria-label={t('hero_stage_label')}>
      <ol className="hero-phases" aria-hidden="true">
        {PHASES.map((p, i) => (
          <li key={p} className={`${p === phase ? 'is-on' : ''}${PHASES.indexOf(phase) > i ? ' is-done' : ''}`}>
            {labels[i]}
          </li>
        ))}
      </ol>
      <div className="hero-scene">
        <Device label={t('nav_pos')}>
          {phase === 'typing' ? (
            <EntryPreview digits={digits} />
          ) : (
            <PosView
              id="pay_7QK2M4XH9D"
              amount={HERO_AMOUNT}
              description={BEANS}
              status={phase === 'pending' ? 'pending' : phase === 'processing' ? 'processing' : 'paid'}
              expiresAt={sessionStart.current + 15 * 60_000}
              approx={HERO_AMOUNT / rates.rub.usdt}
              qrValue={absolute('/app/pos')}
              now={now}
              asset="usdt_ton"
              crypto={q.crypto}
              paidAt={paidAt ?? undefined}
            />
          )}
        </Device>
        <div className="hero-feed">
          <div className="hero-feed-head">
            <span>{t('ov_recent')}</span>
            <span className="hero-feed-live">
              <span className="live-dot" />
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
    </div>
  );
}

function Device({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="device">
      <div className="device-bar">
        <span className="device-merchant">KERN Coffee Roasters</span>
        <span className="device-label">{label}</span>
      </div>
      <div className="device-screen">{children}</div>
    </div>
  );
}

function EntryPreview({ digits, pressed }: { digits: string; pressed?: boolean }) {
  const { t, lang } = useI18n();
  const rates = useRates();
  const amount = digits ? parseInt(digits, 10) : 0;
  const last = digits.slice(-1);
  return (
    <div className="entry-preview">
      <p className="pos-entry-label">{t('pos_amount_due')}</p>
      <p className={`pos-entry-amount${digits ? '' : ' is-empty'}`}>
        <Money value={amount} />
        {!pressed && <span className="caret" aria-hidden="true" />}
      </p>
      <p className="pos-entry-approx num">{digits ? `≈ ${f.usdt(amount / rates.rub.usdt, lang)}` : t('pos_enter_amount')}</p>
      <div className="keypad is-mini" aria-hidden="true">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((k) => (
          <span key={k} className={`key${k === last && !pressed ? ' is-pressed' : ''}`}>
            {k === 'back' ? <Icon name="backspace" size={20} /> : k}
          </span>
        ))}
      </div>
      <span className={`btn btn-primary btn-lg btn-block${digits.length === 4 ? '' : ' is-disabled'}${pressed ? ' is-pressed' : ''}`} aria-hidden="true">
        {t('create_payment')}
      </span>
    </div>
  );
}

// ---------- sticky story ----------

interface StoryStep {
  title: string;
  text: string;
}

function Story({ steps, frame, tone }: { steps: StoryStep[]; frame: (i: number) => ReactNode; tone: 'dark' | 'light' }) {
  const [active, setActive] = useState(0);
  const sticky = useMedia('(min-width: 1024px)');
  const ref = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const n = steps.length;

  // Scroll position drives the scene. Progress bars are written straight to
  // the DOM once per frame; React only re-renders when the step changes.
  useEffect(() => {
    if (!sticky) return;
    let raf = 0;
    let current = -1;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const run = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, run)));
      const idx = Math.min(n - 1, Math.floor(p * n * 0.999));
      const local = Math.min(1, Math.max(0, p * n - idx));
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleX(${i < idx ? 1 : i === idx ? local : 0})`;
      });
      if (idx !== current) {
        current = idx;
        setActive(idx);
      }
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, [sticky, n]);

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = el.offsetHeight - window.innerHeight;
    const y = top + ((i + 0.5) / n) * run;
    window.scrollTo({ top: y, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  if (!sticky) {
    return (
      <ol className={`story-flow is-${tone}`}>
        {steps.map((s, i) => (
          <li key={i} className="story-flow-step">
            <span className="story-n">{String(i + 1).padStart(2, '0')}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <div className="story-inline">{frame(i)}</div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div ref={ref} className={`story is-${tone}`} style={{ height: `calc(${n * 48}vh + 100vh)` }}>
      <div className="story-pin">
        <ol className="story-steps">
          {steps.map((s, i) => (
            <li key={i} className={`story-step${i === active ? ' is-active' : ''}${i < active ? ' is-done' : ''}`}>
              <button type="button" onClick={() => goTo(i)} aria-current={i === active ? 'step' : undefined}>
                <span className="story-n">
                  {String(i + 1).padStart(2, '0')}
                  <span className="story-bar">
                    <span
                      ref={(el) => {
                        bars.current[i] = el;
                      }}
                    />
                  </span>
                </span>
                <h3>{s.title}</h3>
              </button>
              <div className="story-text">
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="story-frame">
          {steps.map((_, i) => (
            <div key={i} className={`story-layer${i === active ? ' is-on' : ''}${i < active ? ' is-past' : ''}`} aria-hidden={i !== active}>
              {Math.abs(i - active) <= 1 ? frame(i) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StoryHead({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) {
  const lines = title.split('|');
  return (
    <header className="story-head" data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2>
        {lines.map((l, i) => (
          <span key={i} className={lines.length > 1 && i === lines.length - 1 ? 'is-accent' : ''}>
            {l}
          </span>
        ))}
      </h2>
      <p className="lead">{lead}</p>
    </header>
  );
}

// ---------- story 1: terminal ----------

function PosStory() {
  const { t } = useI18n();
  const rates = useRates();
  const q = quote(HERO_AMOUNT, 'usdt_ton', rates);
  const [base] = useState(() => Date.now());
  const now = useNow(1000, false);
  const pos = (status: 'pending' | 'paid') => (
    <PosView
      id="pay_9H3XQ7LM2C"
      amount={HERO_AMOUNT}
      description={BEANS}
      status={status}
      expiresAt={base + 15 * 60_000}
      approx={HERO_AMOUNT / rates.rub.usdt}
      qrValue={absolute('/app/pos')}
      now={status === 'pending' ? now : base}
      asset="usdt_ton"
      crypto={q.crypto}
      paidAt={base + 42_000}
    />
  );

  const frames = [
    <Device key="0" label={t('frame_merchant')}>
      <EntryPreview digits="2490" pressed />
    </Device>,
    <Device key="1" label={t('frame_merchant')}>
      {pos('pending')}
    </Device>,
    <div key="2" className="phone-frame">
      <p className="frame-tag">{t('frame_customer')}</p>
      <Checkout
        merchant="KERN Coffee Roasters"
        amount={HERO_AMOUNT}
        description={BEANS}
        phase="open"
        expiresAt={base + 14 * 60_000}
        accepted={['usdt_ton', 'ton', 'btc']}
        onPay={() => navigate('/app/pos')}
        seed="story"
        compact
      />
    </div>,
    <div key="3" className="paid-frame">
      <Device label={t('frame_merchant')}>{pos('paid')}</Device>
      <div className="frame-toast">
        <Icon name="check" size={16} strokeWidth={2.6} />
        <span>
          {t('st_paid')} · <Money value={HERO_AMOUNT} />
        </span>
      </div>
    </div>,
  ];

  return (
    <section className="panel panel-dark" id="pos">
      <div className="wrap">
        <StoryHead eyebrow={t('s1_eyebrow')} title={t('s1_title')} lead={t('s1_lead')} />
        <Story
          tone="dark"
          steps={[
            { title: t('s1_1_t'), text: t('s1_1_p') },
            { title: t('s1_2_t'), text: t('s1_2_p') },
            { title: t('s1_3_t'), text: t('s1_3_p') },
            { title: t('s1_4_t'), text: t('s1_4_p') },
          ]}
          frame={(i) => frames[i]}
        />
        <div className="story-cta" data-reveal>
          <LinkButton variant="bright" size="lg" href={href('/app/pos')} iconRight="arrow">
            {t('s1_cta')}
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

// ---------- try checkout ----------

function TrySection() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<CheckoutPhase>('open');
  const [charge, setCharge] = useState<CheckoutProps['charge']>();
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + 15 * 60_000);
  const timer = useRef<number>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPay = (asset: AssetId, fail: boolean) => {
    const q = quote(HERO_AMOUNT, asset);
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

  const points: [IconName, string, string][] = [
    ['check', t('co_p1_t'), t('co_p1_p')],
    ['alert', t('co_p2_t'), t('co_p2_p')],
    ['qr', t('co_p3_t'), t('co_p3_p')],
  ];

  return (
    <section className="panel panel-mint" id="checkout">
      <div className="wrap try">
        <div className="try-copy">
          <header className="story-head" data-reveal>
            <p className="eyebrow">{t('try_eyebrow')}</p>
            <h2>
              <span>{t('try_title')}</span>
            </h2>
            <p className="lead">{t('try_lead')}</p>
          </header>
          <ul className="try-points" data-reveal>
            {points.map(([icon, title, text]) => (
              <li key={title}>
                <span className="try-icon">
                  <Icon name={icon} size={18} />
                </span>
                <span>
                  <b>{title}</b> {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="try-ui" data-reveal>
          <span className="try-tag">
            <Icon name="bolt" size={15} />
            {t('try_tag')}
          </span>
          <Checkout
            merchant="KERN Coffee Roasters"
            amount={HERO_AMOUNT}
            description={BEANS}
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
    </section>
  );
}

// ---------- story 2: invoice → link → payment → dashboard ----------

function InvoiceStory() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const [base] = useState(() => Date.now());
  const inv: Invoice = useMemo(
    () => ({
      id: 'inv_SAMPLE',
      number: 'KC-0146',
      customer: { ru: 'Кофейня «Сезон»', en: 'Sezon Coffee' },
      email: 'orders@sezon.cafe',
      items: [
        { title: { ru: 'Эспрессо-смесь «Утро», 1 кг', en: 'Morning espresso blend, 1 kg' }, qty: 10, price: 1590 },
        { title: { ru: 'Гватемала Антигуа, 1 кг', en: 'Guatemala Antigua, 1 kg' }, qty: 4, price: 3290 },
      ],
      status: 'pending',
      createdAt: base - 2 * DAY,
      sentAt: base - 2 * DAY,
      dueAt: base + 5 * DAY,
    }),
    [base],
  );
  const total = invoiceTotal(inv);
  const url = absolute('/app/invoices');
  const crypto = quote(total, 'usdt_tron').crypto;
  const o = useMemo(() => overview(demo, base), [demo, base]);
  const quiet = o.count < 5;
  const before = quiet ? overview(demo, startOfDay(base) - 60_000).received : o.received;
  const paidRow: Payment = {
    id: 'pay_INVOICE146',
    amount: total,
    description: { ru: `Счёт ${inv.number}`, en: `Invoice ${inv.number}` },
    source: 'invoice',
    customer: inv.customer,
    status: 'paid',
    createdAt: base,
    expiresAt: base,
    paidAt: base,
    asset: 'usdt_tron',
    crypto,
    refunds: [],
  };

  const frames = [
    <div key="0" className="doc-frame">
      <InvoiceDocument inv={inv} merchant={demo.merchant.name} />
    </div>,
    <div key="1" className="share-frame">
      <div className="share-card">
        <div className="share-card-head">
          <span className="share-card-kind">{t('frame_link_title')}</span>
          <Badge tone="warning" live>
            {t('inv_pending')}
          </Badge>
        </div>
        <p className="share-card-title">
          {t('inv_doc_title')} {inv.number} · {tx(inv.customer)}
        </p>
        <p className="share-card-amount">
          <Money value={total} />
        </p>
        <QRFrame value={url} size={150} label={t('inv_share')} caption={<span className="mono">…/pay/inv_KC0146</span>} />
        <div className="share-card-sent">
          <Icon name="send" size={16} />
          {t('frame_sent', { email: inv.email })}
        </div>
      </div>
    </div>,
    <div key="2" className="phone-frame">
      <p className="frame-tag">{t('frame_customer')}</p>
      <Checkout
        merchant={demo.merchant.name}
        amount={total}
        title={{ ru: `Счёт ${inv.number}`, en: `Invoice ${inv.number}` }}
        lines={inv.items}
        phase="paid"
        charge={{ asset: 'usdt_tron', crypto, fee: assetById('usdt_tron').fee, at: base, id: 'pay_INVOICE146' }}
        accepted={demo.merchant.accepted}
        onPay={() => undefined}
        seed="story2"
        compact
      />
    </div>,
    <div key="3" className="mini-db">
      <Metric tone="emerald" label={quiet ? t('ov_received_yesterday') : t('ov_received_today')} value={before + total} kind="rub" foot={t('frame_plus', { amount: f.rub(total, lang) })} />
      <div className="mini-db-list">
        <p className="mini-db-head">{t('ov_recent')}</p>
        <div className="plist">
          <div className="hero-feed-new">
            <PaymentRow p={paidRow} />
          </div>
          {demo.payments
            .filter((p) => p.status === 'paid')
            .slice(0, 2)
            .map((p) => (
              <PaymentRow key={p.id} p={p} />
            ))}
        </div>
      </div>
    </div>,
  ];

  return (
    <section className="section" id="invoices">
      <div className="wrap">
        <StoryHead eyebrow={t('s2_eyebrow')} title={t('s2_title')} lead={t('s2_lead')} />
        <Story
          tone="light"
          steps={[
            { title: t('s2_1_t'), text: t('s2_1_p') },
            { title: t('s2_2_t'), text: t('s2_2_p') },
            { title: t('s2_3_t'), text: t('s2_3_p') },
            { title: t('s2_4_t'), text: t('s2_4_p') },
          ]}
          frame={(i) => frames[i]}
        />
        <div className="story-cta" data-reveal>
          <LinkButton variant="primary" size="lg" href={href('/app/invoices/new')} iconRight="arrow">
            {t('s2_cta')}
          </LinkButton>
          <LinkButton variant="secondary" size="lg" href={href('/app/links/new')}>
            {t('s2_cta2')}
          </LinkButton>
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
    <section className="panel panel-dark" id="dashboard">
      <div className="wrap">
        <StoryHead eyebrow={t('db_eyebrow')} title={t('db_title')} lead={t('db_lead')} />
        <div className="db-frame" data-reveal>
          <div className="metrics">
            <Metric tone="emerald" label={quiet ? t('ov_received_yesterday') : t('ov_received_today')} value={o.received} kind="rub" delta={delta} foot={quiet ? t('ov_yesterday_full') : t('ov_no_compare')} />
            <Metric label={t('ov_payments')} value={o.count} kind="count" foot={t('ov_success', { n: f.num(o.success * 100, lang, 0) })} />
            <Metric label={t('ov_average')} value={o.average} kind="rub" foot={quiet ? t('ov_yesterday_label') : t('ov_today_label')} />
            <Metric
              tone="mint"
              label={t('ov_to_settle')}
              value={(quiet ? live.upcoming?.net : o.current?.net) ?? 0}
              kind="crypto"
              symbol={demo.merchant.settleAsset}
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
          <span className="live-dot" />
          {t('db_note')}
        </p>
      </div>
    </section>
  );
}

// ---------- refunds & settlement ----------

function SettleSection() {
  const { t, lang, tx } = useI18n();
  const demo = useDemo();
  const o = useMemo(() => overview(demo), [demo]);
  const stl = o.current && o.current.count >= 5 ? o.current : (o.upcoming ?? o.lastPaid ?? o.current);
  const refunded = demo.payments.find((p) => p.refunds.some((r) => r.status === 'completed'));
  const r = refunded?.refunds.find((x) => x.status === 'completed');
  const a = refunded ? assetById(refunded.asset) : null;

  return (
    <section className="panel panel-emerald" id="settlement">
      <div className="wrap">
        <StoryHead eyebrow={t('rs_eyebrow')} title={t('rs_title')} lead={t('rs_lead')} />
        <div className="rs-grid">
          {stl && (
            <article className="rs-card is-settle" data-reveal>
              <div className="rs-card-copy">
                <h3>{t('rs_settle_t')}</h3>
                <p>{t('rs_settle_p', { asset: demo.merchant.settleAsset })}</p>
              </div>
              <SettlementBreakdown st={stl} feeRate={demo.merchant.feeRate} wallet={demo.merchant.payoutWallet} asset={demo.merchant.settleAsset} />
              <a className="text-link" href={href('/app/overview')}>
                {t('rs_settle_cta')}
                <Icon name="arrow" size={15} />
              </a>
            </article>
          )}
          {refunded && r && a && (
            <article className="rs-card" data-reveal>
              <div className="rs-card-copy">
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
                  <p className="rf-amount">
                    <Money value={refunded.amount} />
                  </p>
                </div>
                <div className="rs-refund-row is-refund">
                  <div>
                    <p className="rf-k">{t('rs_returned')}</p>
                    <p className="rf-v num">{f.crypto(r.crypto, a.id, lang)}</p>
                    <p className="rf-meta">{tx(r.reason)}</p>
                  </div>
                  <div className="rs-refund-right">
                    <p className="rf-amount">
                      <Money value={-r.amount} />
                    </p>
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
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { t } = useI18n();
  const actions: [string, string, string, IconName][] = [
    ['/app/pos', t('cta_a1'), t('cta_a1_s'), 'terminal'],
    ['/app/invoices/new', t('cta_a2'), t('cta_a2_s'), 'invoice'],
    ['/app/links/new', t('cta_a3'), t('cta_a3_s'), 'link'],
  ];
  return (
    <section className="section cta-section" id="start">
      <div className="wrap cta">
        <div className="cta-copy" data-reveal>
          <h2>{t('cta_title')}</h2>
          <p>{t('cta_text')}</p>
        </div>
        <ul className="cta-actions" data-reveal>
          {actions.map(([to, title, sub, icon], i) => (
            <li key={to}>
              <a href={href(to)} className={i === 0 ? 'is-primary' : ''}>
                <span className="cta-icon">
                  <Icon name={icon} size={20} />
                </span>
                <span className="cta-text">
                  <b>{title}</b>
                  <span>{sub}</span>
                </span>
                <Icon name="arrow" size={20} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
