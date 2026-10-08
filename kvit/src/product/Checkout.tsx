// The customer's side of a payment. Presentational: the caller owns the
// payment record and tells this screen what state it is in, so the same UI
// runs the real sandbox checkout and the try-it-here block on the product site.

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import * as f from '../lib/format';
import type { AssetId, InvoiceItem, Text } from '../lib/model';
import { ASSETS, assetById, fakeAddress, shortAddr } from '../lib/model';
import { quote, useRates } from '../lib/rates';
import { Icon } from '../ui/icons';
import { Button, CopyInline, Money, QR, Spinner, Toggle, useNow } from '../ui/ui';

export type CheckoutPhase = 'open' | 'processing' | 'paid' | 'failed' | 'expired' | 'closed';

export interface CheckoutProps {
  merchant: string;
  amount: number;
  title?: Text;
  description?: Text;
  lines?: InvoiceItem[];
  reference?: string;
  phase: CheckoutPhase;
  expiresAt?: number;
  closedText?: string;
  accepted: AssetId[];
  /** what was charged once the customer pays */
  charge?: { asset: AssetId; crypto: number; fee: number; at?: number; startedAt?: number; resolveAt?: number; id?: string };
  onPay: (asset: AssetId, fail: boolean) => void;
  onRetry?: () => void;
  done?: { label: string; onClick: () => void };
  /** keeps addresses stable for one session */
  seed?: string;
  compact?: boolean;
}

export function Checkout(p: CheckoutProps) {
  const { t, lang, tx } = useI18n();
  const rates = useRates();
  const now = useNow(500);
  const options = ASSETS.filter((a) => p.accepted.includes(a.id));
  const quotes = useMemo(() => Object.fromEntries(options.map((a) => [a.id, quote(p.amount, a.id, rates)])), [options, p.amount, rates]);
  const firstAffordable = options.find((a) => quotes[a.id].total <= a.demoBalance)?.id ?? options[0]?.id;
  const [asset, setAsset] = useState<AssetId>(firstAffordable ?? 'usdt_ton');
  const [method, setMethod] = useState<'wallet' | 'transfer'>('wallet');
  const [failNext, setFailNext] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!p.accepted.includes(asset) && firstAffordable) setAsset(firstAffordable);
  }, [p.accepted, asset, firstAffordable]);

  const a = assetById(asset);
  const q = quotes[asset] ?? quote(p.amount, asset, rates);
  const enough = q.total <= a.demoBalance;
  const left = p.expiresAt ? p.expiresAt - now : null;
  const visibleOptions = showAll ? options : options.slice(0, 4);
  const address = useMemo(() => fakeAddress(asset, seeded(`${p.seed ?? ''}${asset}`)), [asset, p.seed]);

  const pay = () => {
    p.onPay(asset, failNext);
    setFailNext(false);
  };

  return (
    <div className={`checkout${p.compact ? ' is-compact' : ''}`} data-phase={p.phase}>
      <header className="co-head">
        <div className="co-merchant">
          <span className="co-avatar" aria-hidden="true">
            {initials(p.merchant)}
          </span>
          <div>
            <p className="co-label">{t('co_pay_to')}</p>
            <p className="co-name">{p.merchant}</p>
          </div>
        </div>
        {p.phase === 'open' && left !== null && (
          <span className={`co-timer${left < 120_000 ? ' is-low' : ''}`}>
            <Icon name="clock" size={15} />
            {f.countdown(left)}
          </span>
        )}
      </header>

      <section className="co-amount">
        {p.title && <p className="co-title">{tx(p.title)}</p>}
        <p className="co-sum">
          <Money value={p.amount} />
        </p>
        {p.description && <p className="co-desc">{tx(p.description)}</p>}
        {p.lines && p.lines.length > 0 && (
          <ul className="co-lines">
            {p.lines.map((l, i) => (
              <li key={i}>
                <span>
                  {tx(l.title)}
                  {l.qty > 1 && <span className="co-qty"> × {l.qty}</span>}
                </span>
                <span className="num">{f.rub(l.qty * l.price, lang)}</span>
              </li>
            ))}
          </ul>
        )}
        {p.reference && <p className="co-ref mono">{p.reference}</p>}
      </section>

      <div className="co-stage">
        {p.phase === 'open' && (
          <div className="co-panel co-enter" key="open">
            <div className="co-tabs" role="tablist" aria-label={t('co_method')}>
              <button role="tab" aria-selected={method === 'wallet'} className={method === 'wallet' ? 'is-on' : ''} onClick={() => setMethod('wallet')}>
                <Icon name="wallet" size={16} />
                {t('co_wallet')}
              </button>
              <button role="tab" aria-selected={method === 'transfer'} className={method === 'transfer' ? 'is-on' : ''} onClick={() => setMethod('transfer')}>
                <Icon name="qr" size={16} />
                {t('co_transfer')}
              </button>
            </div>

            <p className="co-section">{t('co_pay_with')}</p>
            <div className="co-assets" role="radiogroup" aria-label={t('co_pay_with')}>
              {visibleOptions.map((o) => {
                const oq = quotes[o.id];
                const ok = method === 'transfer' || oq.total <= o.demoBalance;
                return (
                  <button
                    key={o.id}
                    role="radio"
                    aria-checked={asset === o.id}
                    className={`co-asset${asset === o.id ? ' is-on' : ''}${ok ? '' : ' is-short'}`}
                    onClick={() => setAsset(o.id)}
                  >
                    <CoinMark coin={o.coin} />
                    <span className="co-asset-name">
                      <b>{o.symbol}</b>
                      <span>{o.network}</span>
                    </span>
                    <span className="co-asset-amt">
                      <b className="num">{f.num(oq.crypto, lang, o.decimals)}</b>
                      {method === 'wallet' && (
                        <span className={ok ? '' : 'is-warn'}>
                          {ok ? `${t('co_balance')} ${f.num(o.demoBalance, lang, o.decimals)}` : t('co_not_enough')}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {options.length > 4 && (
              <button type="button" className="co-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? t('co_less') : t('co_more', { n: options.length - 4 })}
                <Icon name="down" size={16} style={{ transform: showAll ? 'rotate(180deg)' : undefined }} />
              </button>
            )}

            {method === 'transfer' ? (
              <div className="co-transfer">
                <div className="co-transfer-qr">
                  <QR value={`${a.network.toLowerCase()}:${address}?amount=${q.crypto}`} size={112} label={t('co_address')} />
                </div>
                <div className="co-transfer-info">
                  <p className="co-k">{t('co_send_exactly')}</p>
                  <CopyInline text={String(q.crypto)} display={f.crypto(q.crypto, asset, lang)} mono={false} />
                  <p className="co-k">
                    {t('co_address')} · {a.network}
                  </p>
                  <CopyInline text={address} display={shortAddr(address, 8, 6)} />
                </div>
              </div>
            ) : (
              <dl className="co-summary">
                <div>
                  <dt>{t('co_amount')}</dt>
                  <dd className="num">{f.crypto(q.crypto, asset, lang)}</dd>
                </div>
                <div>
                  <dt>{t('co_network_fee')}</dt>
                  <dd className="num">{f.crypto(q.fee, asset, lang)}</dd>
                </div>
                <div className="co-total">
                  <dt>{t('co_total')}</dt>
                  <dd className="num">{f.crypto(q.total, asset, lang)}</dd>
                </div>
              </dl>
            )}

            <p className="co-rate">
              1 {a.symbol} = {f.rate(q.rate, lang)}
              <span className="co-rate-src">
                {rates.source === 'live' ? t('rate_live') : t('rate_cached')}
              </span>
            </p>

            {method === 'wallet' ? (
              <Button variant="primary" size="lg" block disabled={!enough} onClick={pay}>
                {enough ? t('co_pay_btn', { amount: f.crypto(q.total, asset, lang) }) : t('co_choose_other')}
              </Button>
            ) : (
              <Button variant="primary" size="lg" block onClick={pay}>
                {t('co_sent_btn')}
              </Button>
            )}

            <div className="co-sandbox">
              <span>
                <b>{t('sandbox')}</b> {t('co_sandbox_note')}
              </span>
              <label className="co-fail">
                <Toggle checked={failNext} onChange={setFailNext} label={t('co_fail_toggle')} />
                <span>{t('co_fail_toggle')}</span>
              </label>
            </div>
          </div>
        )}

        {p.phase === 'processing' && p.charge && <Processing charge={p.charge} now={now} />}

        {p.phase === 'paid' && p.charge && (
          <div className="co-panel co-result co-enter" key="paid">
            <SuccessMark />
            <h3 className="co-result-title">{t('st_paid')}</h3>
            <p className="co-result-sub num">
              {f.crypto(+(p.charge.crypto + p.charge.fee).toFixed(assetById(p.charge.asset).decimals), p.charge.asset, lang)} · {assetById(p.charge.asset).network}
            </p>
            <dl className="co-receipt">
              <div>
                <dt>{t('co_merchant')}</dt>
                <dd>{p.merchant}</dd>
              </div>
              {p.charge.at && (
                <div>
                  <dt>{t('co_when')}</dt>
                  <dd>{f.dateTime(p.charge.at, lang)}</dd>
                </div>
              )}
              {p.charge.id && (
                <div>
                  <dt>{t('co_operation')}</dt>
                  <dd className="mono">{p.charge.id}</dd>
                </div>
              )}
            </dl>
            {p.done && (
              <Button variant="secondary" block onClick={p.done.onClick}>
                {p.done.label}
              </Button>
            )}
          </div>
        )}

        {p.phase === 'failed' && (
          <div className="co-panel co-result co-enter" key="failed">
            <span className="co-result-icon tone-danger">
              <Icon name="alert" size={28} />
            </span>
            <h3 className="co-result-title">{t('co_failed_title')}</h3>
            <p className="co-result-text">{t('co_failed_text')}</p>
            {p.onRetry && (
              <Button variant="primary" block onClick={p.onRetry}>
                {t('co_retry')}
              </Button>
            )}
          </div>
        )}

        {(p.phase === 'expired' || p.phase === 'closed') && (
          <div className="co-panel co-result co-enter" key="closed">
            <span className="co-result-icon tone-neutral">
              <Icon name={p.phase === 'expired' ? 'clock' : 'info'} size={28} />
            </span>
            <h3 className="co-result-title">{p.phase === 'expired' ? t('co_expired_title') : t('co_closed_title')}</h3>
            <p className="co-result-text">{p.closedText ?? t('co_expired_text')}</p>
            {p.done && (
              <Button variant="secondary" block onClick={p.done.onClick}>
                {p.done.label}
              </Button>
            )}
          </div>
        )}
      </div>

      <footer className="co-foot">
        <span>{t('co_powered')}</span>
        <span className="co-foot-brand">KVIT</span>
      </footer>
    </div>
  );
}

function Processing({ charge, now }: { charge: NonNullable<CheckoutProps['charge']>; now: number }) {
  const { t, lang } = useI18n();
  const start = charge.startedAt ?? now;
  const end = charge.resolveAt ?? now + 3000;
  const k = Math.max(0, Math.min(1, (now - start) / (end - start)));
  const steps = [t('co_step_found'), t('co_step_confirm'), t('co_step_credit')];
  const current = k < 0.25 ? 0 : k < 0.8 ? 1 : 2;
  return (
    <div className="co-panel co-result co-enter" key="processing" aria-live="polite">
      <span className="co-result-icon tone-info">
        <Spinner size={28} />
      </span>
      <h3 className="co-result-title">{t('co_processing_title')}</h3>
      <p className="co-result-sub num">{f.crypto(charge.crypto, charge.asset, lang)}</p>
      <ol className="co-steps">
        {steps.map((s, i) => (
          <li key={i} className={i < current ? 'is-done' : i === current ? 'is-now' : ''}>
            <span className="co-step-dot">{i < current ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className="co-progress">
        <span style={{ transform: `scaleX(${0.08 + k * 0.92})` }} />
      </div>
    </div>
  );
}

export function SuccessMark({ size = 64 }: { size?: number }) {
  return (
    <svg className="success-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" className="sm-ring" />
      <path d="M20 33.5 28.5 42 45 24" className="sm-check" />
    </svg>
  );
}

const COIN_COLORS: Record<string, [string, string]> = {
  usdt: ['#E6F4EF', '#1E8A6A'],
  usdc: ['#E8EFFB', '#2E62C8'],
  ton: ['#E4F1FB', '#1F7FC4'],
  btc: ['#FBF0E2', '#C2730E'],
  eth: ['#EEEDF8', '#5A5AA8'],
};

const COIN_GLYPH: Record<string, JSX.Element> = {
  usdt: (
    <>
      <path d="M7 7.5h10M12 7.5V17" />
      <ellipse cx="12" cy="11.2" rx="5.2" ry="1.7" />
    </>
  ),
  usdc: (
    <>
      <path d="M14.6 9.2c-.4-1-1.4-1.6-2.6-1.6-1.6 0-2.7.8-2.7 2 0 2.8 5.6 1.6 5.6 4.6 0 1.2-1.2 2.1-2.9 2.1-1.3 0-2.4-.6-2.8-1.7M12 6v1.6M12 16.3V18" />
    </>
  ),
  ton: (
    <>
      <path d="M6.5 7h11L12 17.5Z" />
      <path d="M12 7v10.5" />
    </>
  ),
  btc: (
    <>
      <path d="M8.5 7h4.6a2.4 2.4 0 0 1 0 4.8H8.5h5.2a2.6 2.6 0 0 1 0 5.2H8.5ZM10.3 5.5V7M10.3 17v1.5M12.8 5.5V7M12.8 17v1.5" />
    </>
  ),
  eth: (
    <>
      <path d="M12 4.5 7.5 12l4.5 2.7 4.5-2.7Z" />
      <path d="M7.5 13.6 12 19.5l4.5-5.9-4.5 2.7Z" />
    </>
  ),
};

export function CoinMark({ coin, size = 32 }: { coin: string; size?: number }) {
  const [bg, fg] = COIN_COLORS[coin] ?? ['#eee', '#555'];
  return (
    <span className="coin" style={{ width: size, height: size, background: bg, color: fg }} aria-hidden="true">
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {COIN_GLYPH[coin]}
      </svg>
    </span>
  );
}

const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter((w) => /[\p{L}]/u.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function seeded(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
