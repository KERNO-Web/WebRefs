import { useEffect, useRef, useState } from 'react';
import { REVIEWS, SERVICES, defaultChoice, fromPrice, gameById, quote, tierIndex, type Choice, type Ladder, type Qty, type Rating, type Service } from '../data';
import { useI18n, type Txt } from '../i18n';
import { navigate, placeOrder } from '../store';
import { GameTag, Icon, MiniCard, Star, Stars, img, svcImg, useSummary, useTween } from '../ui/bits';

export function ServicePage({ id }: { id: string }) {
  const { t, tr, rub, num, days } = useI18n();
  const summary = useSummary();
  const s = SERVICES.find((x) => x.id === id);
  const [c, setC] = useState<Choice>(() => defaultChoice(s ?? SERVICES[0]));
  const [checkout, setCheckout] = useState(false);
  const cta = useRef<HTMLButtonElement>(null);
  const [ctaVisible, setCtaVisible] = useState(true);
  const q = s ? quote(s, c) : { price: 0, full: 0, days: [0, 0] as [number, number] };
  const shown = useTween(q.price);

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);

  if (!s) {
    return <main className="page"><div className="empty"><p>{t('Такой услуги нет.')}</p><button className="btn primary" onClick={() => navigate('#/')}>{t('На главную')}</button></div></main>;
  }

  const g = gameById(s.game);
  const sum = summary(s, c);
  const reviews = REVIEWS.filter((r) => r.game === s.game).slice(0, 2);
  const more = SERVICES.filter((x) => x.game === s.game && x.id !== s.id).slice(0, 4);
  const toggle = (e: string) => setC((c) => ({ ...c, extras: c.extras.includes(e) ? c.extras.filter((x) => x !== e) : [...c.extras, e] }));

  return (
    <main className="page svc-page" style={{ ['--gc' as string]: g.color }}>
      <nav className="crumbs" aria-label={t('Навигация')}>
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate('#/', 'games'); }}>{t('Игры')}</a>
        <span>/</span>
        <span>{g.name}</span>
        <span>/</span>
        <span aria-current="page">{tr(s.title)}</span>
      </nav>

      <section className="sp-top">
        <div className="sp-art cut-lg">
          <img src={svcImg(s.id, true)} alt="" width="1600" height="900" />
        </div>
        <div className="sp-info">
          <GameTag game={s.game} full />
          <h1>{tr(s.title)}</h1>
          <p className="lead">{tr(s.desc)}</p>
          <div className="sp-meta">
            <span className="rate big"><Star size={16} /><b>{s.rating.toFixed(1)}</b></span>
            <span>{t('{n} заказов', { n: num(s.orders) })}</span>
          </div>
          <div className="sp-from">
            <span className="price-from big"><small>{t('от')}</small> {rub(fromPrice(s).price)}</span>
            {s.sale && <span className="sale">−{Math.round(s.sale * 100)}% {t('до воскресенья')}</span>}
          </div>
        </div>
      </section>

      <section className="config" aria-labelledby="cfg-h">
        <div className="cfg-main">
          <h2 id="cfg-h">{t('Настройте заказ')}</h2>
          {s.cfg.kind === 'rating' && <RatingPicker cfg={s.cfg} c={c} onChange={(from, to) => setC((c) => ({ ...c, from, to }))} />}
          {s.cfg.kind === 'ladder' && <LadderPicker cfg={s.cfg} c={c} onChange={(from, to) => setC((c) => ({ ...c, from, to }))} />}
          {s.cfg.kind === 'qty' && <QtyPicker cfg={s.cfg} value={c.qty} label={sum.title} onChange={(qty) => setC((c) => ({ ...c, qty }))} />}

          {s.modes && (
            <div className="block">
              <span className="block-label">{t('Кто играет')}</span>
              <div className="seg" role="radiogroup" aria-label={t('Кто играет')}>
                <button role="radio" aria-checked={c.mode === 'solo'} className={c.mode === 'solo' ? 'on' : ''} onClick={() => setC((c) => ({ ...c, mode: 'solo' }))}>
                  <b>{t('Исполнитель')}</b><small>{t('Играет на вашем аккаунте')}</small>
                </button>
                <button role="radio" aria-checked={c.mode === 'duo'} className={c.mode === 'duo' ? 'on' : ''} onClick={() => setC((c) => ({ ...c, mode: 'duo' }))}>
                  <b>{t('Вместе с вами')}</b><small>{t('Вы в пати, +30%')}</small>
                </button>
              </div>
            </div>
          )}

          <div className="block">
            <span className="block-label">{t('Опции')}</span>
            <div className="extras">
              {s.extras.map((e) => (
                <label key={e.id} className={'extra' + (c.extras.includes(e.id) ? ' on' : '')}>
                  <input type="checkbox" checked={c.extras.includes(e.id)} onChange={() => toggle(e.id)} />
                  <span className="box" aria-hidden="true"><Icon name="check" size={14} /></span>
                  <span className="extra-name">{tr(e.label)}</span>
                  <span className="extra-pct">{e.pct ? `+${e.pct}%` : t('бесплатно')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <aside className="total cut-lg" aria-label={t('Итого')}>
          <span className="total-label">{t('Итого')}</span>
          <div className="total-price">
            <span className="price">{rub(Math.round(shown / 10) * 10)}</span>
            {s.sale && <s>{rub(q.full)}</s>}
          </div>
          <span className="total-days"><Icon name="clock" size={15} />≈ {days(q.days)}</span>
          <div className="total-what">
            <b>{sum.title}</b>
            {sum.detail && <span>{sum.detail}</span>}
            {s.modes && <span>{c.mode === 'duo' ? t('Вместе с вами') : t('Играет исполнитель')}</span>}
            {s.extras.filter((e) => c.extras.includes(e.id)).map((e) => <span key={e.id}>+ {tr(e.label)}</span>)}
          </div>
          <button ref={cta} className="btn primary lg wide" onClick={() => setCheckout(true)}>{t('Оформить заказ')}</button>
          <p className="fine">{t('Демо-магазин: оплата не списывается.')}</p>
        </aside>
      </section>

      <section className="sp-below">
        <div className="incl">
          <h2>{t('Что входит')}</h2>
          <ul>{s.includes.map((x) => <li key={x.ru}><Icon name="check" size={18} />{tr(x)}</li>)}</ul>
        </div>
        {reviews.length > 0 && (
          <div className="sp-revs">
            <h2>{t('Отзывы по {game}', { game: g.short })}</h2>
            {reviews.map((r) => (
              <article key={r.nick} className="rev flat">
                <header>
                  <span className="ava" style={{ background: `hsl(${r.hue} 50% 34%)` }} aria-hidden="true">{r.nick[0].toUpperCase()}</span>
                  <span><b>{r.nick}</b><small>{tr(r.result)}</small></span>
                  <Stars value={r.stars} />
                </header>
                <p>«{tr(r.text)}»</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {more.length > 0 && (
        <section className="more" aria-labelledby="more-h">
          <div className="sec-head"><h2 id="more-h">{t('Ещё для {game}', { game: g.short })}</h2></div>
          <div className="mini-row">{more.map((x) => <MiniCard key={x.id} s={x} />)}</div>
        </section>
      )}

      <div className={'sticky-sum' + (ctaVisible ? '' : ' show')} aria-hidden={ctaVisible}>
        <span><small>{sum.title}</small><b>{rub(q.price)}</b></span>
        <button className="btn primary" tabIndex={ctaVisible ? -1 : 0} onClick={() => setCheckout(true)}>{t('Оформить')}</button>
      </div>

      {checkout && <Checkout s={s} c={c} price={q.price} dayRange={q.days} label={sum.title} onClose={() => setCheckout(false)} />}
    </main>
  );
}

/* ---------- rating: ELO / MMR / CS Rating / levels ---------- */

function Badge({ cfg, v }: { cfg: Rating; v: number }) {
  const { tr } = useI18n();
  const tier = cfg.tiers[tierIndex(cfg, v)];
  if (cfg.badge === 'faceit') {
    const n = Number(tr(tier.label!));
    return (
      <span className="lvl" style={{ ['--lv' as string]: tier.color }} aria-hidden="true">
        <svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" /><circle cx="22" cy="22" r="18" className="arc" style={{ strokeDasharray: `${(n / 10) * 113} 113` }} /></svg>
        <b>{n}</b>
      </span>
    );
  }
  if (cfg.badge === 'medal' && tier.icon) return <img className="medal" src={img(tier.icon)} alt="" width="64" height="64" />;
  if (cfg.badge === 'stripe') return <span className="stripe" style={{ ['--lv' as string]: tier.color }} aria-hidden="true" />;
  return null;
}

function End({ cfg, v, label }: { cfg: Rating; v: number; label: string }) {
  const { tr, t, num } = useI18n();
  const tier = cfg.tiers[tierIndex(cfg, v)];
  const name = cfg.badge === 'faceit' ? t('{n} уровень', { n: tr(tier.label!) }) : tier.label ? tr(tier.label) : '';
  return (
    <div className="end" style={{ ['--lv' as string]: tier.color }}>
      <span className="end-label">{label}</span>
      <div className="end-row">
        <Badge cfg={cfg} v={v} />
        <span className="end-val"><b>{num(v)}</b><small>{tr(cfg.unit as Txt | string)}</small>{name && <em>{name}</em>}</span>
      </div>
    </div>
  );
}

function RatingPicker({ cfg, c, onChange }: { cfg: Rating; c: Choice; onChange: (from: number, to: number) => void }) {
  const { t, tr, num } = useI18n();
  const range = cfg.max - cfg.min;
  const pct = (v: number) => ((v - cfg.min) / range) * 100;
  const setFrom = (v: number) => { const from = Math.min(v, cfg.max - cfg.minGap); onChange(from, Math.max(c.to, from + cfg.minGap)); };
  const setTo = (v: number) => { const to = Math.max(v, cfg.min + cfg.minGap); onChange(Math.min(c.from, to - cfg.minGap), to); };
  const plus = (n: number) => { const from = Math.min(c.from, cfg.max - n); onChange(from, from + n); };
  const unit = tr(cfg.unit as Txt | string);
  return (
    <div className="block rating">
      <div className="ends">
        <End cfg={cfg} v={c.from} label={t('Сейчас')} />
        <span className="ends-arrow" aria-hidden="true"><Icon name="arrow" size={22} /></span>
        <End cfg={cfg} v={c.to} label={t('Цель')} />
      </div>
      <div className="dual">
        <div className="dual-track" aria-hidden="true">
          {cfg.tiers.map((x, i) => {
            const a = Math.max(x.at, cfg.min), b = i + 1 < cfg.tiers.length ? cfg.tiers[i + 1].at : cfg.max;
            return <span key={i} className="seg-tier" style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%`, background: x.color }} />;
          })}
          <span className="dual-fill" style={{ left: `${pct(c.from)}%`, width: `${pct(c.to) - pct(c.from)}%` }} />
        </div>
        <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={c.from} onChange={(e) => setFrom(+e.target.value)} aria-label={t('Сейчас')} aria-valuetext={`${num(c.from)} ${unit}`} />
        <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={c.to} onChange={(e) => setTo(+e.target.value)} aria-label={t('Цель')} aria-valuetext={`${num(c.to)} ${unit}`} />
      </div>
      <div className="dual-scale" aria-hidden="true"><span>{num(cfg.min)}</span><span>{num(cfg.max)}</span></div>
      {cfg.chips.length > 0 && (
        <div className="chips">
          <span>{t('Быстро:')}</span>
          {cfg.chips.map((n) => <button key={n} className={c.to - c.from === n ? 'on' : ''} onClick={() => plus(n)}>+{num(n)} {unit}</button>)}
        </div>
      )}
    </div>
  );
}

/* ---------- ladder: ranks with emblems ---------- */

function LadderPicker({ cfg, c, onChange }: { cfg: Ladder; c: Choice; onChange: (from: number, to: number) => void }) {
  const { t, tr } = useI18n();
  const row = (label: string, value: number, pick: (i: number) => void, disabled: (i: number) => boolean) => (
    <div className="rank-row">
      <span className="block-label">{label}</span>
      <div className="ranks" role="radiogroup" aria-label={label}>
        {cfg.rungs.map((r, i) => (
          <button key={i} role="radio" aria-checked={value === i} disabled={disabled(i)} className={value === i ? 'on' : ''} style={{ ['--lv' as string]: r.color }} onClick={() => pick(i)}>
            <img src={img(r.icon)} alt="" width="40" height="40" loading="lazy" />
            <span>{tr(r.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
  const end = (i: number, label: string) => (
    <div className="end" style={{ ['--lv' as string]: cfg.rungs[i].color }}>
      <span className="end-label">{label}</span>
      <div className="end-row"><img className="medal" src={img(cfg.rungs[i].icon)} alt="" width="64" height="64" /><span className="end-val"><b className="rank-name">{tr(cfg.rungs[i].label)}</b></span></div>
    </div>
  );
  return (
    <div className="block ladder">
      <div className="ends">{end(c.from, t('Сейчас'))}<span className="ends-arrow" aria-hidden="true"><Icon name="arrow" size={22} /></span>{end(c.to, t('Цель'))}</div>
      {row(t('Текущий ранг'), c.from, (i) => onChange(i, Math.max(c.to, i + 1)), (i) => i >= cfg.rungs.length - 1)}
      {row(t('Нужный ранг'), c.to, (i) => onChange(c.from, i), (i) => i <= c.from)}
    </div>
  );
}

/* ---------- quantity ---------- */

function QtyPicker({ cfg, value, onChange, label }: { cfg: Qty; value: number; onChange: (n: number) => void; label: string }) {
  const { t, tr } = useI18n();
  const { min, max, step } = cfg;
  return (
    <div className="block qty">
      <span className="block-label">{tr(cfg.question)}</span>
      <div className="qty-row">
        <button className="icon-btn" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min} aria-label={t('Меньше')}><Icon name="minus" /></button>
        <output aria-live="polite">{label}</output>
        <button className="icon-btn" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max} aria-label={t('Больше')}><Icon name="plus" /></button>
      </div>
      {max > min && (
        <input className="single" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} aria-label={tr(cfg.question)}
          style={{ ['--p' as string]: `${((value - min) / (max - min)) * 100}%` }} />
      )}
      {cfg.chips.length > 0 && (
        <div className="chips">{cfg.chips.map((n) => <button key={n} className={value === n ? 'on' : ''} onClick={() => onChange(n)}>{n}</button>)}</div>
      )}
    </div>
  );
}

/* ---------- checkout ---------- */

function Checkout({ s, c, price, dayRange, label, onClose }: { s: Service; c: Choice; price: number; dayRange: [number, number]; label: string; onClose: () => void }) {
  const { t, rub, days } = useI18n();
  const [contact, setContact] = useState('');
  const [pay, setPay] = useState<'sbp' | 'card'>('sbp');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input')?.focus();
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.trim().length < 3) { setErr(true); return; }
    setBusy(true);
    setTimeout(() => {
      const o = placeOrder({ service: s.id, choice: c, price, days: dayRange, contact: contact.trim(), pay });
      document.body.classList.remove('locked');
      navigate(`#/order/${o.id}`);
    }, 900);
  };

  return (
    <div className="modal-root">
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="co-h" ref={ref} style={{ ['--gc' as string]: gameById(s.game).color }}>
        <div className="modal-head">
          <h2 id="co-h">{t('Оформление заказа')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Закрыть')}><Icon name="close" /></button>
        </div>
        <div className="co-sum">
          <img className="cut-sm" src={svcImg(s.id)} alt="" width="96" height="54" />
          <span><GameTag game={s.game} /><b>{label}</b><small>≈ {days(dayRange)}</small></span>
          <b className="co-price">{rub(price)}</b>
        </div>
        <form onSubmit={submit} noValidate>
          <label className="field">
            <span>{t('Telegram или e-mail для связи')}</span>
            <input value={contact} onChange={(e) => { setContact(e.target.value); setErr(false); }} placeholder="@nickname" aria-invalid={err} autoComplete="off" />
            {err && <em className="err">{t('Укажите, куда написать, когда исполнитель начнёт')}</em>}
          </label>
          <div className="field">
            <span>{t('Способ оплаты')}</span>
            <div className="seg" role="radiogroup" aria-label={t('Способ оплаты')}>
              <button type="button" role="radio" aria-checked={pay === 'sbp'} className={pay === 'sbp' ? 'on' : ''} onClick={() => setPay('sbp')}><b>{t('СБП')}</b><small>{t('По QR-коду')}</small></button>
              <button type="button" role="radio" aria-checked={pay === 'card'} className={pay === 'card' ? 'on' : ''} onClick={() => setPay('card')}><b>{t('Картой')}</b><small>{t('Любой банк')}</small></button>
            </div>
          </div>
          <button className="btn primary lg wide" disabled={busy}>{busy ? t('Создаём заказ…') : t('Оплатить {sum}', { sum: rub(price) })}</button>
          <p className="fine">{t('Демо: оплата не проводится, заказ хранится только в этом браузере.')}</p>
        </form>
      </div>
    </div>
  );
}
