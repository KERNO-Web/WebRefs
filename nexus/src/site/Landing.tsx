import { Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Lines, setLang, useI18n } from '../i18n';
import { reducedMotion, useApp } from '../ctx';
import { ASSETS, MERCHANTS, RATE, available, pickSource, spentThisMonth, valueOf, type MerchantId } from '../store';
import { NexusCard } from '../components/Card';
import { AssetMark, Icon, Mark, MerchantMark } from '../components/Icon';
import { StatusPill, useCount, useReveal } from '../components/ui';
import {
  Balance, CONTROL, ControlRow, FundFields, FundSummary, IssueControls, LimitControl, RULE, Simulator, SmartSpend, TxDetailSheet, TxFilters, TxRow, filterTx, useDraft, useFund, type TxFilter,
} from '../components/widgets';

export function useMedia(q: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); },
    () => window.matchMedia(q).matches,
  );
}

const jump = (id: string) => (e?: React.MouseEvent) => {
  e?.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
};

/** "YOU PAY {fiat}." with React nodes in place of the placeholders */
function rich(s: string, map: Record<string, ReactNode>) {
  return s.split(/(\{\w+\})/).map((p, i) => {
    const k = p.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{k && k in map ? map[k] : p}</Fragment>;
  });
}

const SECTIONS = ['issue', 'fund', 'spend', 'control', 'activity'] as const;

function useActiveSection() {
  const [active, setActive] = useState<string>('');
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  return active;
}

export function Landing({ openDemo }: { openDemo: (tab?: string) => void }) {
  const { t, lang } = useI18n();
  const active = useActiveSection();
  const [scrolled, setScrolled] = useState(false);
  useReveal();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const NAV: Record<(typeof SECTIONS)[number], string> = { issue: 'Issue', fund: 'Funding', spend: 'Spend', control: 'Control', activity: 'Activity' };

  return (
    <>
      <header className={'nav' + (scrolled ? ' scrolled' : '')}>
        <a href="#top" className="brand" onClick={jump('top')}><Mark size={20} />NEXUS</a>
        <nav aria-label={t('Sections')}>
          {SECTIONS.map((id) => <a key={id} href={'#' + id} onClick={jump(id)} className={active === id ? 'on' : ''}>{t(NAV[id])}</a>)}
        </nav>
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>{lang === 'en' ? 'RU' : 'EN'}</button>
        <button className="btn primary sm" onClick={() => openDemo()}>{t('Open demo')}</button>
      </header>
      <main id="top">
        <Hero openDemo={openDemo} />
        <IssueScene />
        <FundScene />
        <SpendScene />
        <SmartScene />
        <ControlScene />
        <ActivityScene openDemo={openDemo} />
        <FinalScene openDemo={openDemo} />
      </main>
    </>
  );
}

// ---------- hero ----------

function Hero({ openDemo }: { openDemo: (tab?: string) => void }) {
  const { t, crypto, rate, fiat } = useI18n();
  const { state } = useApp();
  const c = state.card;
  const status = state.controls.frozen ? t('Frozen') : t('Active');
  return (
    <section className="hero" aria-labelledby="hero-h">
      <div className="hero-copy">
        <span className="eyebrow mono">NEXUS / {t('Virtual crypto card')}</span>
        <h1 id="hero-h"><Lines text={t('SPEND\nCRYPTO.\nANYWHERE.')} /></h1>
        <p className="lede">{t('Hold USDT and USDC. Pay by card. NEXUS converts at the moment you pay.')}</p>
        <div className="cta">
          <button className="btn primary lg" onClick={() => openDemo()}>{t('Open demo')}<Icon name="arrow" size={18} /></button>
          <a className="btn ghost lg" href="#issue" onClick={jump('issue')}>{t('How it works')}</a>
        </div>
      </div>
      <div className="hero-object">
        <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={state.controls.frozen} pose={[9, -17]} className="hero-card" />
        <div className="ledger">
          <div className="ledger-main">
            <span className={'state-dot' + (state.controls.frozen ? ' frozen' : '')}>{status}</span>
            <span className="label">{t('Available to spend')}</span>
            <Balance className="ledger-bal" />
          </div>
          <ul className="ledger-assets">
            {ASSETS.map((a) => <li key={a}><AssetMark asset={a} size={18} /><span className="num">{crypto(state.balances[a], a)}</span></li>)}
          </ul>
        </div>
      </div>
      <div className="hero-foot mono" aria-hidden="true">
        <span>{rate('USDT', RATE[state.base].USDT, state.base)}</span>
        <span>{t('NEXUS fee')} {fiat(0, state.base)}</span>
        <span>{t('Simulated demo')}</span>
      </div>
    </section>
  );
}

function SceneHead({ idx, title, text, id }: { idx: string; title: string; text?: string; id: string }) {
  return (
    <header className="scene-head" data-reveal>
      <span className="idx mono">{idx}</span>
      <h2 id={id}><Lines text={title} /></h2>
      {text && <p>{text}</p>}
    </header>
  );
}

// ---------- 01 issue ----------

function IssueScene() {
  const { t } = useI18n();
  const { state } = useApp();
  const d = useDraft();
  return (
    <section className="scene issue" id="issue" aria-labelledby="issue-h">
      <SceneHead idx={`01 / ${t('ISSUE')}`} id="issue-h" title={t('YOUR CARD.\nIN SECONDS.')} text={t('Pick a finish, put your name on it, create it. The number is yours instantly.')} />
      <div className="issue-stage">
        <NexusCard finish={d.draft.finish} number={state.card.number} name={d.draft.name.toUpperCase()} kind={d.draft.kind} issuedAt={state.card.issuedAt} draft={d.dirty} frozen={state.controls.frozen} pose={[4, 0]} />
      </div>
      <IssueControls {...d} />
    </section>
  );
}

// ---------- 02 fund ----------

function FundScene() {
  const { t, fiat, crypto } = useI18n();
  const f = useFund();
  const base = f.state.base;
  const c = f.state.card;
  return (
    <section className="scene fund" id="fund" aria-labelledby="fund-h">
      <SceneHead idx={`02 / ${t('FUND')}`} id="fund-h" title={t('FUND IT.\nFROM ANY WALLET.')} text={t('Send stablecoins or ETH. They land on the card as spendable balance.')} />
      <div className={'fund-flow ph-' + f.phase} data-reveal>
        <div className="ff-src">
          <span className="ff-tag mono"><Icon name="wallet" size={14} />{t('Your wallet · simulated')}</span>
          <FundFields f={f} />
        </div>
        <div className="ff-line" aria-hidden="true">
          <span className="ff-rail"><i /></span>
          <span className="ff-amt num mono">{crypto(f.credit, f.asset)}</span>
        </div>
        <div className="ff-dst">
          <span className="ff-tag mono"><Mark size={13} />{t('NEXUS card')} · {c.number.slice(-4)}</span>
          <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={f.state.controls.frozen} stage={false} className="mini" />
          <div className="ff-bal">
            <span className="label">{t('Card balance')}</span>
            <Balance className="ff-big" />
            {f.phase !== 'done' && f.valid && <span className="ff-after num">→ {fiat(f.after, base)}</span>}
            {f.phase === 'done' && <span className="ff-after ok num">+{crypto(f.credited, f.asset)} · {t('Received')}</span>}
          </div>
          <FundSummary f={f} />
          <button className="btn primary wide" disabled={!f.valid || f.phase === 'busy'} onClick={f.phase === 'done' ? () => f.setPhase('form') : f.submit}>
            {f.phase === 'busy' ? t('Confirming on network…') : f.phase === 'done' ? t('Fund again') : t('Fund {amount}', { amount: crypto(f.n, f.asset) })}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------- 03 spend (sticky) ----------

const SPEND: MerchantId[] = ['coffee', 'spotify', 'nike', 'taxi'];

function useSpendSteps() {
  const { state } = useApp();
  return useMemo(() => {
    let bal = { ...state.balances };
    return SPEND.map((id) => {
      const m = MERCHANTS[id];
      const fiat = m.price[state.base];
      const src = pickSource({ ...state, balances: bal }, fiat);
      if (src) bal = { ...bal, [src.asset]: bal[src.asset] - src.crypto };
      return { m, fiat, src, rate: src ? RATE[state.base][src.asset] : 0, after: available({ base: state.base, balances: bal }) };
    });
  }, [state]);
}

function SpendScene() {
  const { t } = useI18n();
  const sticky = useMedia('(min-width: 900px) and (min-height: 600px)');
  return (
    <section className={'scene spend ' + (sticky ? 'is-sticky' : 'is-list')} id="spend" aria-labelledby="spend-h">
      {sticky ? <SpendSticky /> : <SpendList />}
      <h2 id="spend-h" className="sr-only">{t('Spend')}</h2>
    </section>
  );
}

function SpendFigures({ step }: { step: ReturnType<typeof useSpendSteps>[number] }) {
  const { t, amount, symbol, fiat, rate, lang } = useI18n();
  const { state } = useApp();
  const base = state.base;
  const fv = useCount(step.fiat, 600);
  const cv = useCount(step.src?.crypto ?? 0, 600);
  const cur = symbol(base);
  const fiatNode = <span className="fig">{lang === 'ru' ? <>{amount(fv)}&nbsp;{cur}</> : <>{cur}{amount(fv)}</>}</span>;
  const cryptoNode = step.src ? <span className="fig c">{amount(cv, step.src.asset === 'ETH' ? 6 : 2)}&nbsp;{step.src.asset}</span> : <span className="fig no">—</span>;
  return (
    <>
      <p className="spend-line">{rich(t('YOU PAY {fiat}.'), { fiat: fiatNode })}</p>
      <p className="spend-line second">{rich(t('NEXUS USES {crypto}.'), { crypto: cryptoNode })}</p>
      <dl className="spend-meta">
        <div><dt>{t('Rate')}</dt><dd className="num mono">{step.src ? rate(step.src.asset, step.rate, base) : '—'}</dd></div>
        <div><dt>{t('Fee')}</dt><dd className="num">{fiat(0, base)}</dd></div>
        <div><dt>{t('Smart Spend')}</dt><dd>{t(RULE[state.rule].title)}</dd></div>
        <div><dt>{t('Left after')}</dt><dd className="num">{fiat(step.after, base)}</dd></div>
      </dl>
    </>
  );
}

function SpendSticky() {
  const { t, fiat, crypto } = useI18n();
  const { state } = useApp();
  const steps = useSpendSteps();
  const ref = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - window.innerHeight)));
      bar.current?.style.setProperty('--p', p.toFixed(4));
      setI(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, [steps.length]);
  const step = steps[i];
  const c = state.card;
  return (
    <div className="spend-track" ref={ref} style={{ ['--n' as string]: steps.length }}>
      <div className="spend-pin">
        <div className="spend-copy">
          <span className="idx mono">03 / {t('SPEND')}</span>
          <SpendFigures step={step} />
        </div>
        <div className="spend-object">
          <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={state.controls.frozen} pose={[7, 12]} live={false} ping={i} />
          <ol className="spend-merchants">
            {steps.map((s, k) => (
              <li key={s.m.id} className={k === i ? 'on' : k < i ? 'past' : ''}>
                <MerchantMark id={s.m.id} size={34} />
                <span className="sm-name"><b>{t(s.m.name)}</b><span className="muted small">{s.src ? crypto(-s.src.crypto, s.src.asset) : t('Declined')}</span></span>
                <span className="num sm-amt">{fiat(s.fiat, state.base)}</span>
                {k <= i ? <StatusPill status={s.src ? 'paid' : 'declined'} /> : <span className="pill ghost">{t('NEXT')}</span>}
              </li>
            ))}
          </ol>
        </div>
        <div className="spend-progress" ref={bar} aria-hidden="true">
          {steps.map((s, k) => <span key={s.m.id} className={k <= i ? 'on' : ''}>0{k + 1}</span>)}
          <i />
        </div>
      </div>
    </div>
  );
}

function SpendList() {
  const { t } = useI18n();
  const steps = useSpendSteps();
  return (
    <div className="spend-stack">
      <span className="idx mono">03 / {t('SPEND')}</span>
      {steps.map((s) => (
        <article key={s.m.id} className="spend-item" data-reveal>
          <div className="si-head"><MerchantMark id={s.m.id} size={34} /><b>{t(s.m.name)}</b><StatusPill status={s.src ? 'paid' : 'declined'} /></div>
          <SpendFigures step={s} />
        </article>
      ))}
    </div>
  );
}

// ---------- 04 smart spend (pearl) ----------

function SmartScene() {
  const { t } = useI18n();
  return (
    <section className="scene smart-scene theme-pearl" id="smart" aria-labelledby="smart-h">
      <div className="smart-title" data-reveal>
        <span className="idx mono">04 / SMART SPEND</span>
        <h2 id="smart-h">SMART<br />SPEND</h2>
        <p>{t('You hold more than one balance. Choose the rule, NEXUS picks the one that pays.')}</p>
      </div>
      <div data-reveal><SmartSpend /></div>
    </section>
  );
}

// ---------- 05 control ----------

function ControlScene() {
  const { t } = useI18n();
  const { state } = useApp();
  const c = state.card;
  const lights: (keyof typeof CONTROL)[] = ['online', 'contactless', 'atm', 'intl'];
  return (
    <section className="scene control" id="control" aria-labelledby="control-h">
      <SceneHead idx={`05 / ${t('CONTROL')}`} id="control-h" title={t('FREEZE IT.\nLIMIT IT.\nUSE IT.')} text={t('Every switch is live. Change one, then try a purchase below.')} />
      <div className="console" data-reveal>
        <div className="console-side left">
          <ControlRow k="frozen" />
          <ControlRow k="online" />
          <ControlRow k="contactless" />
        </div>
        <div className="console-card">
          <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={state.controls.frozen} pose={[3, 0]} />
          <ul className="lights" aria-label={t('Card status')}>
            {lights.map((k) => (
              <li key={k} className={state.controls[k] && !state.controls.frozen ? 'on' : ''}>
                <Icon name={CONTROL[k].icon} size={14} /><span>{t(CONTROL[k].title)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="console-side right">
          <ControlRow k="atm" />
          <ControlRow k="intl" />
          <LimitControl />
        </div>
      </div>
      <div className="trypay" data-reveal>
        <div className="trypay-head">
          <span className="idx mono">{t('TEST A PURCHASE')}</span>
          <p className="muted">{t('Six real-world scenarios. Each one runs against the switches above.')}</p>
        </div>
        <Simulator />
      </div>
    </section>
  );
}

// ---------- 06 activity ----------

function ActivityScene({ openDemo }: { openDemo: (tab?: string) => void }) {
  const { t, fiat } = useI18n();
  const { state } = useApp();
  const [filter, setFilter] = useState<TxFilter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const spent = spentThisMonth(state);
  const limit = state.controls.limit;
  const list = filterTx(state.tx, filter).slice(0, 8);
  const held = ASSETS.reduce((a, k) => a + valueOf(state.balances[k], k, state.base), 0);
  return (
    <section className="scene activity" id="activity" aria-labelledby="activity-h">
      <div className="activity-top">
        <SceneHead idx={`06 / ${t('ACTIVITY')}`} id="activity-h" title={state.base === 'EUR' ? t('EVERY EURO.\nEVERY USDT.') : t('EVERY DOLLAR.\nEVERY USDT.')} />
        <dl className="month" data-reveal>
          <div><dt>{t('Spent this month')}</dt><dd className="num">{fiat(spent, state.base)}</dd></div>
          <div><dt>{t('Monthly limit')}</dt><dd className="num">{fiat(limit, state.base, { whole: true })}</dd></div>
          <div><dt>{t('Held')}</dt><dd className="num">{fiat(held, state.base)}</dd></div>
          <span className="month-bar" style={{ ['--p' as string]: Math.min(1, spent / limit) }} aria-hidden="true"><i /></span>
        </dl>
      </div>
      <div className="ledger-surface" data-reveal>
        <div className="ls-bar">
          <TxFilters value={filter} onChange={setFilter} />
          <button className="text-btn" onClick={() => openDemo('activity')}>{t('Full history')}<Icon name="arrow" size={16} /></button>
        </div>
        <div className="ls-cols mono" aria-hidden="true">
          <span>{t('Merchant')}</span><span>{t('Crypto source')}</span><span>{t('Amount')}</span><span>{t('Status')}</span><span>{t('Time')}</span>
        </div>
        <ul className="tx-list">
          {list.map((x) => <TxRow key={x.id} tx={x} onOpen={setOpen} />)}
          {list.length === 0 && <li className="tx-empty muted">{t('Nothing here yet.')}</li>}
        </ul>
      </div>
      {open && <TxDetailSheet id={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

// ---------- final ----------

function FinalScene({ openDemo }: { openDemo: (tab?: string) => void }) {
  const { t, lang } = useI18n();
  const { state, dispatch } = useApp();
  const c = state.card;
  const [confirm, setConfirm] = useState(false);
  return (
    <section className="scene final" aria-labelledby="final-h">
      <div className="final-object">
        <NexusCard finish={c.finish} number={c.number} name={c.name} kind={c.kind} issuedAt={c.issuedAt} frozen={state.controls.frozen} pose={[14, 0]} />
      </div>
      <div className="final-copy" data-reveal>
        <h2 id="final-h"><Lines text={t('THE WHOLE CARD.\nIN ONE APP.')} /></h2>
        <p>{t('Home, card, activity, settings. Same balances, same rules, same history.')}</p>
        <button className="btn primary lg" onClick={() => openDemo()}>{t('Open demo')}<Icon name="arrow" size={18} /></button>
      </div>
      <footer className="foot">
        <span className="brand"><Mark size={16} />NEXUS</span>
        <p className="muted small">{t('Portfolio concept by KERNØ. Simulated balances, rates and payments. No real cards, custody or blockchain transactions.')}</p>
        <div className="foot-actions">
          <button className="text-btn" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')}>{lang === 'en' ? 'Русский' : 'English'}</button>
          {confirm ? (
            <span className="confirm">
              <span className="small">{t('Reset everything?')}</span>
              <button className="text-btn neg" onClick={() => { dispatch({ type: 'reset' }); setConfirm(false); }}>{t('Reset')}</button>
              <button className="text-btn" onClick={() => setConfirm(false)}>{t('Cancel')}</button>
            </span>
          ) : <button className="text-btn" onClick={() => setConfirm(true)}>{t('Reset demo')}</button>}
        </div>
      </footer>
    </section>
  );
}
