import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { ASSET_PRICE, NETWORK_FEE, NETWORKS_FOR, USD_EUR, received, spentThisMonth, type Asset, type Dispatch, type Network, type Pocket, type State } from '../store';
import { Icon, Logo } from './Icon';

export const CARD_NUMBER = '4319872051634821';

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), input');
        const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', key);
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', key); document.body.classList.remove('locked'); prev?.focus?.(); };
  }, []);
  return (
    <div className="sheet-root">
      <div className="sheet-scrim" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={ref}>
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Close')}><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange, label, render }: { value: T; options: T[]; onChange: (v: T) => void; label: string; render?: (v: T) => React.ReactNode }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o} role="radio" aria-checked={value === o} className={value === o ? 'on' : ''} onClick={() => onChange(o)}>{render ? render(o) : o}</button>
      ))}
    </div>
  );
}

const ASSET_LOGO: Record<Asset, string> = { USDT: 'tether.svg', USDC: '#$', ETH: 'ethereum.svg' };

export function TopUpSheet({ state, dispatch, onClose }: { state: State; dispatch: Dispatch; onClose: () => void }) {
  const { t, money } = useI18n();
  const [asset, setAsset] = useState<Asset>('USDT');
  const [network, setNetwork] = useState<Network>('TRON');
  const [amount, setAmount] = useState('500');
  const [phase, setPhase] = useState<'form' | 'busy' | 'done'>('form');
  const [got, setGot] = useState(0);
  const n = parseFloat(amount.replace(',', '.')) || 0;
  const usd = received(asset, network, n);
  const valid = n > 0 && usd > 0;
  const pickAsset = (a: Asset) => { setAsset(a); if (!NETWORKS_FOR[a].includes(network)) setNetwork(NETWORKS_FOR[a][0]); setAmount(a === 'ETH' ? '0.15' : '500'); };
  const submit = () => {
    if (!valid) return;
    setPhase('busy');
    setTimeout(() => { dispatch({ type: 'topup', asset, network, amount: n }); setGot(usd); setPhase('done'); }, 1100);
  };
  return (
    <Sheet title={t('Top up card')} onClose={onClose}>
      {phase === 'done' ? (
        <div className="done">
          <span className="done-mark"><Icon name="check" size={28} /></span>
          <p className="done-amt num">+{money(got)}</p>
          <p className="muted">{t('Balance updated')} · {money(state.usd)}</p>
          <button className="btn primary wide" onClick={onClose}>{t('Done')}</button>
        </div>
      ) : (
        <>
          <div className="field">
            <span className="label">{t('Choose asset')}</span>
            <Seg value={asset} options={['USDT', 'USDC', 'ETH']} onChange={pickAsset} label={t('Choose asset')} render={(a) => <><Logo src={ASSET_LOGO[a]} size={18} />{a}</>} />
          </div>
          <div className="field">
            <span className="label">{t('Network')}</span>
            <Seg value={network} options={NETWORKS_FOR[asset]} onChange={setNetwork} label={t('Network')} />
          </div>
          <label className="field">
            <span className="label">{t('Amount')}</span>
            <span className="amount-input">
              <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} />
              <span>{asset}</span>
            </span>
          </label>
          {asset !== 'ETH' && (
            <div className="quick">
              {[100, 500, 1000].map((v) => <button key={v} onClick={() => setAmount(String(v))}>{v}</button>)}
            </div>
          )}
          <dl className="summary">
            <div><dt>{t('Network fee')}</dt><dd className="num">{money(NETWORK_FEE[network])}</dd></div>
            {asset === 'ETH' && <div><dt>1 ETH</dt><dd className="num">{money(ASSET_PRICE.ETH)}</dd></div>}
            <div><dt>{t('You get')}</dt><dd className="num strong">{money(usd)}</dd></div>
            <div><dt>{t('Estimated balance')}</dt><dd className="num">{money(state.usd + usd)}</dd></div>
          </dl>
          <button className="btn primary wide" disabled={!valid || phase === 'busy'} onClick={submit}>{phase === 'busy' ? t('Sending…') : t('Continue')}</button>
          <p className="fine muted">{t('Demo only. No real crypto is sent.')}</p>
        </>
      )}
    </Sheet>
  );
}

export function ExchangeSheet({ state, dispatch, onClose }: { state: State; dispatch: Dispatch; onClose: () => void }) {
  const { t, money } = useI18n();
  const [from, setFrom] = useState<Pocket>('USD');
  const [amount, setAmount] = useState('250');
  const [done, setDone] = useState(false);
  const to: Pocket = from === 'USD' ? 'EUR' : 'USD';
  const n = parseFloat(amount.replace(',', '.')) || 0;
  const out = from === 'USD' ? n * USD_EUR : n / USD_EUR;
  const have = from === 'USD' ? state.usd : state.eur;
  const ok = n > 0 && n <= have + 1e-9;
  return (
    <Sheet title={t('Exchange')} onClose={onClose}>
      {done ? (
        <div className="done">
          <span className="done-mark"><Icon name="check" size={28} /></span>
          <p className="done-amt num">+{money(out, to)}</p>
          <p className="muted">{t('Pockets')}: {money(state.usd)} · {money(state.eur, 'EUR')}</p>
          <button className="btn primary wide" onClick={onClose}>{t('Done')}</button>
        </div>
      ) : (
        <>
          <div className="fx">
            <label className="fx-row">
              <span className="label">{t('From')}</span>
              <span className="fx-line">
                <input className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label={t('From')} />
                <span className="fx-cur">{from === 'USD' ? 'USDT' : 'EUR'}</span>
              </span>
              <span className={'fx-have ' + (ok || !n ? 'muted' : 'neg')}>{ok || !n ? money(have, from) : t('Not enough balance')}</span>
            </label>
            <button className="fx-swap" onClick={() => { setFrom(to); setAmount(out ? out.toFixed(2) : amount); }} aria-label={t('Swap direction')}><Icon name="swap" /></button>
            <div className="fx-row">
              <span className="label">{t('To')}</span>
              <span className="fx-line"><span className="num fx-out">{money(out, to)}</span><span className="fx-cur">{to === 'USD' ? 'USDT' : 'EUR'}</span></span>
              <span className="fx-have muted">{t('Rate')} 1 {from === 'USD' ? 'USDT' : 'EUR'} = {from === 'USD' ? `€${USD_EUR.toFixed(4)}` : `$${(1 / USD_EUR).toFixed(4)}`}</span>
            </div>
          </div>
          <button className="btn primary wide" disabled={!ok} onClick={() => { dispatch({ type: 'exchange', from, amount: n }); setDone(true); }}>{t('Convert')}</button>
          <p className="fine muted">{t('Demo only. No real crypto is sent.')}</p>
        </>
      )}
    </Sheet>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={'switch' + (on ? ' on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}><span /></button>;
}

export function LimitSlider({ state, dispatch }: { state: State; dispatch: Dispatch }) {
  const { t, money } = useI18n();
  const spent = spentThisMonth(state);
  return (
    <div className="limit">
      <div className="limit-top"><span>{t('Monthly limit')}</span><b className="num">{money(state.limit).replace('.00', '')}</b></div>
      <input type="range" min={250} max={5000} step={50} value={state.limit} onChange={(e) => dispatch({ type: 'limit', value: +e.target.value })} aria-label={t('Monthly limit')}
        style={{ ['--p' as string]: `${((state.limit - 250) / 4750) * 100}%` }} />
      <span className="muted small">{t('{spent} of {limit} spent this month', { spent: money(spent), limit: money(state.limit).replace('.00', '') })}</span>
    </div>
  );
}

export function DetailsSheet({ state, dispatch, onClose, reveal, setReveal }: { state: State; dispatch: Dispatch; onClose: () => void; reveal: boolean; setReveal: (v: boolean) => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [cvv, setCvv] = useState(false);
  const num = reveal ? CARD_NUMBER.replace(/(\d{4})(?=\d)/g, '$1 ') : `•••• •••• •••• ${CARD_NUMBER.slice(-4)}`;
  return (
    <Sheet title={t('Card details')} onClose={onClose}>
      <div className="det">
        <div className="det-row">
          <span className="label">{t('Card number')}</span>
          <span className="det-val num">{num}</span>
          <span className="det-actions">
            <button className="text-btn" onClick={() => setReveal(!reveal)}>{reveal ? t('Hide') : t('Show')}</button>
            <button className="text-btn" onClick={() => { navigator.clipboard?.writeText(CARD_NUMBER).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? t('Copied') : t('Copy')}</button>
          </span>
        </div>
        <div className="det-pair">
          <div className="det-row"><span className="label">{t('Expiry')}</span><span className="det-val num">09/29</span></div>
          <div className="det-row"><span className="label">CVV</span><span className="det-val num">{cvv ? '582' : '•••'}</span>
            <span className="det-actions"><button className="text-btn" onClick={() => setCvv(!cvv)}>{cvv ? t('Hide') : t('Show')}</button></span></div>
        </div>
      </div>
      <div className="ctl-list">
        <div className="ctl"><div><b>{t('Freeze card')}</b><p className="muted small">{t('Blocks every payment instantly. Unfreeze any time.')}</p></div><Switch on={state.frozen} onChange={(v) => dispatch({ type: 'freeze', on: v })} label={t('Freeze card')} /></div>
        <div className="ctl"><div><b>{t('Online payments')}</b><p className="muted small">{t('Turn off when you are not shopping.')}</p></div><Switch on={state.online} onChange={(v) => dispatch({ type: 'online', on: v })} label={t('Online payments')} /></div>
        <LimitSlider state={state} dispatch={dispatch} />
      </div>
    </Sheet>
  );
}
