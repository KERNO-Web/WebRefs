import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { setHandoff, useApp } from '../ctx';
import { MERCHANTS, SHOWCASE_CARD } from '../store';
import { TapCard, cardProps } from '../components/Card';
import { Icon, Mark, MerchantMark } from '../components/Icon';
import { StatusPill } from '../components/ui';

/**
 * The door into the product. Two paths that look like what they are:
 * a populated account, and an object not made yet.
 */
export function Entry({ onClose, go }: { onClose: () => void; go: (route: string) => void }) {
  const { t, fiat } = useI18n();
  const { state, dispatch } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const demoCard = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('.entry-opt button')?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button');
        const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('locked'); prev?.focus?.({ preventScroll: true }); };
  }, []);

  const openDemo = () => { setHandoff(demoCard.current); dispatch({ type: 'enter-demo' }); go('app'); };
  const startFresh = () => { dispatch({ type: 'start-fresh' }); go('start'); };
  const resume = state.path === 'fresh' && !state.card ? 'start' : state.card ? 'app' : null;

  return (
    <div className="entry-root">
      <div className="entry-scrim" onClick={onClose} />
      <div className="entry" role="dialog" aria-modal="true" aria-labelledby="entry-h" ref={ref}>
        <div className="entry-head">
          <span className="brand"><Mark size={18} />TAPSHIFT</span>
          <h2 id="entry-h">{t('How do you want to start?')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Close')}><Icon name="close" /></button>
        </div>

        {resume && (
          <button className="entry-resume" onClick={() => go(resume)}>
            <span className="muted small">{state.path === 'demo' ? t('Demo account') : t('Your account')}</span>
            <span>{resume === 'start' ? t('Continue setting up your card') : t('Continue where you left off')}</span>
            <Icon name="arrow" size={18} />
          </button>
        )}

        <div className="entry-opts">
          <article className="entry-opt demo">
            <div className="eo-preview" aria-hidden="true">
              <TapCard ref={demoCard} {...cardProps(SHOWCASE_CARD)} stage={false} live={false} pose={[6, -10]} className="eo-card" />
              <div className="eo-bal">
                <span className="label">{t('Total balance')}</span>
                <b className="num">{fiat(1284.62, 'EUR')}</b>
              </div>
              <ul className="eo-tx">
                <li><MerchantMark id="coffee" size={24} /><span>Coffee Corner</span><b className="num">{fiat(-MERCHANTS.coffee.price.EUR, 'EUR')}</b><StatusPill status="paid" /></li>
                <li><MerchantMark id="spotify" size={24} /><span>Spotify</span><b className="num">{fiat(-MERCHANTS.spotify.price.EUR, 'EUR')}</b><StatusPill status="paid" /></li>
                <li><MerchantMark id="atm" size={24} /><span>{t('ATM')}</span><b className="num">{fiat(-100, 'EUR')}</b><StatusPill status="declined" /></li>
              </ul>
            </div>
            <div className="eo-copy">
              <h3>{t('Demo account')}</h3>
              <p>{t('A ready-to-use account with an active card, balances, payments and transaction history.')}</p>
              <button className="btn primary wide" onClick={openDemo}>{t('Open demo')}<Icon name="arrow" size={18} /></button>
            </div>
          </article>

          <article className="entry-opt fresh">
            <div className="eo-preview" aria-hidden="true">
              <TapCard {...cardProps({ ...SHOWCASE_CARD, name: '' })} draft stage={false} live={false} pose={[6, 10]} className="eo-card" />
              <ol className="eo-steps mono">
                {['Finish', 'Cardholder', 'Currency', 'Spending source', 'Activate'].map((s, i) => <li key={s}><span>0{i + 1}</span>{t(s)}</li>)}
              </ol>
            </div>
            <div className="eo-copy">
              <h3>{t('Start from zero')}</h3>
              <p>{t('Create a fresh account, issue your card, choose its finish and configure your first balance.')}</p>
              <button className="btn ghost wide" onClick={startFresh}>{t('Create account')}<Icon name="arrow" size={18} /></button>
            </div>
          </article>
        </div>
        <p className="entry-note fine muted">{t('Everything is simulated and stays in this browser. You can switch paths any time in Settings.')}</p>
      </div>
    </div>
  );
}
