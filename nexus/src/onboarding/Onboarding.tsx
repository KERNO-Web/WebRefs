import { useEffect, useRef, useState } from 'react';
import { setLang, useI18n } from '../i18n';
import { reducedMotion, setHandoff, useApp } from '../ctx';
import { BASES, DEMO_FUNDS, MERCHANTS, SHOWCASE_CARD, last4, type Base, type Finish, type Rule, type Stable } from '../store';
import { TapCard } from '../components/Card';
import { AssetMark, Icon, Mark } from '../components/Icon';
import { HoldButton } from '../components/ui';
import { FINISH, RULE } from '../components/widgets';

const STEPS = ['Finish', 'Cardholder', 'Currency', 'Spending source', 'Activate'] as const;
const CLEAN = (s: string) => s.replace(/[^\p{L} '-]/gu, '').slice(0, 14);

/** Five steps that build one object: the card that then follows the visitor into the app. */
export function Onboarding({ go }: { go: (route: string) => void }) {
  const { t, lang, fiat } = useI18n();
  const { state, dispatch, activate, toast } = useApp();
  const [step, setStep] = useState(0);
  const [finish, setFinish] = useState<Finish>('graphite');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [base, setBase] = useState<Base>('EUR');
  const [primary, setPrimary] = useState<Stable>('USDT');
  const [rule, setRule] = useState<Rule>('stable');
  const [charge, setCharge] = useState(0);
  const [phase, setPhase] = useState<'setup' | 'active' | 'leaving'>('setup');
  const card = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // arriving here directly (bookmark, reload) still starts a fresh account
  useEffect(() => { if (state.path !== 'fresh' && !state.card) dispatch({ type: 'start-fresh' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { panel.current?.querySelector<HTMLElement>('input, [role=radio][aria-checked=true], button.hold')?.focus({ preventScroll: true }); }, [step]);

  const name = `${first} ${last}`.trim().toUpperCase();
  const canNext = step !== 1 || first.trim().length > 0;
  const next = () => { if (canNext) setStep((s) => Math.min(4, s + 1)); };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const onActivated = () => {
    activate({ finish, name, base, primary, rule });
    setPhase('active');
    setCharge(0);
    timers.current.push(window.setTimeout(() => {
      setPhase('leaving');
      setHandoff(card.current);
      toast(t('Demo funds added: {usdt} · {usdc}', { usdt: `${DEMO_FUNDS.USDT} USDT`, usdc: `${DEMO_FUNDS.USDC} USDC` }), 'ok');
      go('app');
    }, reducedMotion() ? 900 : 2200));
  };

  const issued = phase !== 'setup' && state.card;
  const shown = issued ? state.card! : { ...SHOWCASE_CARD, finish, name, issuedAt: Date.now() };

  return (
    <div className={'onb ph-' + phase}>
      <header className="onb-top">
        <span className="brand"><Mark size={18} />TAPSHIFT</span>
        <ol className="onb-progress" aria-label={t('Progress')}>
          {STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'now' : ''} aria-current={i === step ? 'step' : undefined}><span className="mono">0{i + 1}</span><b>{t(s)}</b></li>)}
        </ol>
        <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')}>{lang === 'en' ? 'RU' : 'EN'}</button>
        <button className="icon-btn" onClick={() => go('')} aria-label={t('Back to site')}><Icon name="close" /></button>
      </header>

      <div className="onb-stage grain">
        <TapCard
          ref={card}
          finish={shown.finish}
          number={shown.number}
          name={shown.name}
          issuedAt={shown.issuedAt}
          draft={!issued}
          charge={charge}
          pose={[8, -12]}
          className="onb-card"
        />
        <p className="onb-status mono" aria-live="polite">
          {issued ? <><i className="state-dot">{t('Active')}</i> •••• {last4(state.card!.number)}</> : charge > 0 ? t('Activating…') : t('Not issued')}
        </p>
      </div>

      <div className="onb-panel" ref={panel}>
        <span className="idx mono">0{step + 1} / 05</span>

        {step === 0 && (
          <>
            <h1>{t('Choose a finish.')}</h1>
            <p className="onb-sub">{t('Three metals. The card updates as you pick.')}</p>
            <div className="choice-list" role="radiogroup" aria-label={t('Finish')}>
              {(['graphite', 'titanium', 'ice'] as Finish[]).map((f) => (
                <button key={f} role="radio" aria-checked={finish === f} className={'choice' + (finish === f ? ' on' : '')} onClick={() => setFinish(f)}>
                  <i className={'swatch lg f-' + f} /><span><b>{t(FINISH[f].name)}</b><small>{t(FINISH[f].desc)}</small></span><span className="rule-dot" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1>{t('Put your name on it.')}</h1>
            <p className="onb-sub">{t('It is printed on the card as you type.')}</p>
            <div className="name-fields">
              <label className="field"><span className="label">{t('First name')}</span>
                <input className="text-input" value={first} onChange={(e) => setFirst(CLEAN(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && next()} autoComplete="given-name" placeholder="Alex" /></label>
              <label className="field"><span className="label">{t('Last name')}</span>
                <input className="text-input" value={last} onChange={(e) => setLast(CLEAN(e.target.value))} onKeyDown={(e) => e.key === 'Enter' && next()} autoComplete="family-name" placeholder="Johnson" /></label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1>{t('Pick a base currency.')}</h1>
            <p className="onb-sub">{t('Prices, limits and balances are shown in it.')}</p>
            <div className="choice-list cur" role="radiogroup" aria-label={t('Base currency')}>
              {BASES.map((b) => (
                <button key={b} role="radio" aria-checked={base === b} className={'choice' + (base === b ? ' on' : '')} onClick={() => setBase(b)}>
                  <span className="cur-sym num">{({ EUR: '€', USD: '$', GBP: '£' })[b]}</span>
                  <span><b>{b}</b><small>Coffee Corner · {fiat(MERCHANTS.coffee.price[b], b)}</small></span><span className="rule-dot" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1>{t('Choose what pays.')}</h1>
            <p className="onb-sub">{t('Your default stablecoin, and the rule TapShift follows at checkout.')}</p>
            <div className="seg big" role="radiogroup" aria-label={t('Default source')}>
              {(['USDT', 'USDC'] as Stable[]).map((a) => (
                <button key={a} role="radio" aria-checked={primary === a} className={primary === a ? 'on' : ''} onClick={() => setPrimary(a)}><AssetMark asset={a} size={22} />{a}</button>
              ))}
            </div>
            <div className="smart-rules" role="radiogroup" aria-label={t('Smart Spend rule')}>
              {(['stable', 'best', 'manual'] as Rule[]).map((r) => (
                <button key={r} role="radio" aria-checked={rule === r} className={'rule' + (rule === r ? ' on' : '')} onClick={() => setRule(r)}>
                  <span className="rule-txt"><b>{t(RULE[r].title)}</b><span>{t(RULE[r].desc)}</span></span>
                  <span className="rule-dot" aria-hidden="true" />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1>{issued ? t('Your card is live.') : t('Hold to activate.')}</h1>
            <p className="onb-sub">{issued ? t('Demo funds added. Taking you inside…') : t('Press and hold. Light runs the edge, the number is issued.')}</p>
            <dl className="onb-summary">
              <div><dt>{t('Finish')}</dt><dd>{t(FINISH[finish].name)}</dd></div>
              <div><dt>{t('Cardholder')}</dt><dd>{name || '—'}</dd></div>
              <div><dt>{t('Base currency')}</dt><dd>{base}</dd></div>
              <div><dt>{t('Spending source')}</dt><dd>{primary} · {t(RULE[rule].title)}</dd></div>
              <div><dt>{t('Demo funds')}</dt><dd className="num">{DEMO_FUNDS.USDT} USDT · {DEMO_FUNDS.USDC} USDC</dd></div>
            </dl>
            <HoldButton label={t('Hold to activate')} doneLabel={t('Activated')} done={phase !== 'setup'} onProgress={setCharge} onDone={onActivated} />
          </>
        )}

        {phase === 'setup' && (
          <div className="onb-nav">
            {step > 0 ? <button className="btn ghost" onClick={back}><Icon name="back" size={18} />{t('Back')}</button> : <span />}
            {step < 4 && <button className="btn primary" onClick={next} disabled={!canNext}>{t('Continue')}<Icon name="arrow" size={18} /></button>}
          </div>
        )}
      </div>
    </div>
  );
}
