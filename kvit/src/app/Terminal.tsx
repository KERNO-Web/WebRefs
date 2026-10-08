import { useEffect, useMemo, useRef, useState } from 'react';
import * as f from '../lib/format';
import { useI18n } from '../lib/i18n';
import { tx as txOf, wasPaid } from '../lib/model';
import { getRates, useRates } from '../lib/rates';
import { absolute, encodeSession, href, navigate, useRoute } from '../lib/router';
import { cancelPayment, createPosPayment, expireNow, payPayment, useDemo } from '../lib/store';
import { startOfDay } from '../lib/seed';
import { PosView } from '../product/PosView';
import { PaymentRow } from '../product/widgets';
import { Icon } from '../ui/icons';
import { Button, Empty, toast, useNow } from '../ui/ui';
import { PageHead } from './AppShell';

const MAX_DIGITS = 7;
const MIN_AMOUNT = 10;

export function Terminal({ id }: { id?: string }) {
  const { t } = useI18n();
  return (
    <div className="page">
      <PageHead title={t('nav_pos')} sub={t('pos_sub')} />
      <div className="pos-layout">
        <div className="pos-device">{id ? <Session id={id} /> : <Entry />}</div>
        <TodayAtCounter />
      </div>
    </div>
  );
}

function Entry() {
  const { t, lang } = useI18n();
  const route = useRoute();
  const rates = useRates();
  const [digits, setDigits] = useState(() => {
    const a = route.query.get('amount');
    return a && /^\d{1,7}$/.test(a) ? a : '';
  });
  const [note, setNote] = useState(() => route.query.get('note') ?? '');
  const [busy, setBusy] = useState(false);
  const noteRef = useRef<HTMLInputElement>(null);
  const amount = digits ? parseInt(digits, 10) : 0;
  const valid = amount >= MIN_AMOUNT;

  const press = (k: string) => {
    if (busy) return;
    if (k === 'back') return setDigits((d) => d.slice(0, -1));
    if (k === 'clear') return setDigits('');
    setDigits((d) => {
      const next = (d + k).replace(/^0+/, '');
      return next.length > MAX_DIGITS ? d : next;
    });
  };

  const create = () => {
    if (!valid || busy) return;
    setBusy(true);
    // a short beat so "creating" registers before the QR appears
    setTimeout(() => {
      const id = createPosPayment(amount, note);
      navigate(`/app/pos/${id}`, { replace: false });
    }, 420);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === noteRef.current) {
        if (e.key === 'Enter') create();
        return;
      }
      if ((e.target as HTMLElement)?.closest?.('input, textarea, [role="dialog"]')) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Escape') press('clear');
      else if (e.key === 'Enter') create();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const approx = amount / rates.rub.usdt;
  const shown = digits ? f.rub(amount, lang) : f.rub(0, lang);

  return (
    <div className="pos-entry">
      <p className="pos-entry-label">{t('pos_amount_due')}</p>
      <p className={`pos-entry-amount num${digits ? '' : ' is-empty'}`} aria-live="polite">
        {shown}
      </p>
      <p className="pos-entry-approx num">{amount ? `≈ ${f.usdt(approx, lang)}` : t('pos_enter_amount')}</p>

      <label className="pos-note">
        <span className="sr-only">{t('pos_note')}</span>
        <Icon name="invoice" size={16} />
        <input ref={noteRef} value={note} maxLength={80} placeholder={t('pos_note_ph')} onChange={(e) => setNote(e.target.value)} />
      </label>

      <div className="keypad" role="group" aria-label={t('pos_keypad')}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'].map((k) => (
          <button key={k} type="button" className="key" onClick={() => press(k)} aria-label={k === 'back' ? t('pos_backspace') : k}>
            {k === 'back' ? <Icon name="backspace" size={24} /> : k}
          </button>
        ))}
      </div>

      <Button variant="primary" size="lg" block disabled={!valid} loading={busy} onClick={create}>
        {busy ? t('pos_creating') : t('create_payment')}
      </Button>
      {amount > 0 && !valid ? (
        <p className="pos-entry-hint is-warn">{t('pos_min', { amount: f.rub(MIN_AMOUNT, lang) })}</p>
      ) : (
        <p className="pos-entry-hint is-kbd">{t('pos_keyboard_hint')}</p>
      )}
    </div>
  );
}

function Session({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const now = useNow(500);
  const p = demo.payments.find((x) => x.id === id);
  const prevStatus = useRef(p?.status);

  useEffect(() => {
    if (!p) return;
    if (prevStatus.current && prevStatus.current !== 'paid' && p.status === 'paid') toast(t('toast_paid', { amount: f.rub(p.amount, lang) }));
    prevStatus.current = p.status;
  }, [p, p?.status, t, lang]);

  const qrValue = useMemo(() => {
    if (!p) return '';
    const d = encodeSession({ a: p.amount, d: txOf(p.description, lang) || undefined, e: p.expiresAt });
    return absolute(`/pay/${p.id}?d=${d}`);
  }, [p, lang]);

  if (!p) {
    return (
      <div className="pos-entry">
        <Empty
          icon="terminal"
          title={t('pos_not_found')}
          text={t('pos_not_found_text')}
          action={
            <Button variant="primary" onClick={() => navigate('/app/pos')}>
              {t('new_payment')}
            </Button>
          }
        />
      </div>
    );
  }

  const openCheckout = () => window.open(href(`/pay/${p.id}`), '_blank', 'noopener');
  const approx = p.amount / getRates().rub.usdt;
  const again = () =>
    navigate(`/app/pos?amount=${p.amount}${p.description ? `&note=${encodeURIComponent(txOf(p.description, lang))}` : ''}`);

  let actions: React.ReactNode = null;
  if (p.status === 'pending' || p.status === 'created') {
    actions = (
      <>
        <Button variant="primary" block icon="external" onClick={openCheckout}>
          {t('pos_open_checkout')}
        </Button>
        <div className="pos-sim">
          <span className="pos-sim-label">{t('sandbox')}</span>
          <button type="button" onClick={() => payPayment(p.id, 'usdt_ton')}>
            {t('pos_sim_pay')}
          </button>
          <button type="button" onClick={() => payPayment(p.id, 'usdt_ton', true)}>
            {t('pos_sim_fail')}
          </button>
          <button type="button" onClick={() => expireNow(p.id)}>
            {t('pos_sim_expire')}
          </button>
        </div>
        <Button variant="ghost" block onClick={() => cancelPayment(p.id)}>
          {t('pos_cancel')}
        </Button>
      </>
    );
  } else if (p.status === 'processing') {
    actions = <p className="pos-wait-note">{t('pos_processing_note')}</p>;
  } else if (wasPaid(p)) {
    actions = (
      <>
        <Button variant="primary" block icon="plus" onClick={() => navigate('/app/pos')}>
          {t('new_payment')}
        </Button>
        <Button variant="secondary" block onClick={() => navigate(`/app/transactions/${p.id}`)}>
          {t('pos_details')}
        </Button>
      </>
    );
  } else if (p.status === 'failed') {
    actions = (
      <>
        <Button variant="primary" block icon="external" onClick={openCheckout}>
          {t('pos_open_checkout')}
        </Button>
        <div className="pos-sim">
          <span className="pos-sim-label">{t('sandbox')}</span>
          <button type="button" onClick={() => payPayment(p.id, 'usdt_ton')}>
            {t('pos_sim_retry')}
          </button>
        </div>
        <Button variant="ghost" block onClick={() => navigate('/app/pos')}>
          {t('new_payment')}
        </Button>
      </>
    );
  } else {
    actions = (
      <>
        <Button variant="primary" block icon="reset" onClick={again}>
          {t('pos_again')}
        </Button>
        <Button variant="secondary" block onClick={() => navigate('/app/pos')}>
          {t('new_payment')}
        </Button>
      </>
    );
  }

  return (
    <PosView
      id={p.id}
      amount={p.amount}
      description={p.description}
      status={p.status}
      expiresAt={p.expiresAt}
      approx={approx}
      qrValue={qrValue}
      now={now}
      asset={p.asset}
      crypto={p.crypto}
      paidAt={p.paidAt}
      actions={actions}
    />
  );
}

function TodayAtCounter() {
  const { t, lang } = useI18n();
  const demo = useDemo();
  const today = startOfDay(Date.now());
  const list = demo.payments.filter((p) => p.source === 'pos' && p.createdAt >= today);
  const paid = list.filter(wasPaid);
  const total = paid.reduce((s, p) => s + p.amount, 0);
  return (
    <aside className="pos-side">
      <section className="card card-flush">
        <div className="card-head">
          <h2>{t('pos_today')}</h2>
          <span className="card-head-note num">{f.rub(total, lang)}</span>
        </div>
        {list.length ? (
          <div className="plist">
            {list.slice(0, 6).map((p) => (
              <PaymentRow key={p.id} p={p} onOpen={() => navigate(p.status === 'pending' ? `/app/pos/${p.id}` : `/app/transactions/${p.id}`)} />
            ))}
          </div>
        ) : (
          <Empty icon="terminal" title={t('pos_today_empty')} />
        )}
      </section>
      <section className="tip">
        <Icon name="info" size={18} />
        <div>
          <p className="tip-title">{t('pos_tip_title')}</p>
          <p>{t('pos_tip_text')}</p>
        </div>
      </section>
    </aside>
  );
}
