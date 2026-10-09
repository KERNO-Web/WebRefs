import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '../i18n';
import { reducedMotion, useApp } from '../ctx';
import { Icon } from './Icon';

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

/** Side sheet on desktop, bottom sheet on phones. Traps focus, closes on Escape. */
export function Sheet({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('.sheet-body ' + FOCUSABLE.split(',')[0])?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close.current(); }
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', key, true);
    document.body.classList.add('locked');
    return () => { document.removeEventListener('keydown', key, true); document.body.classList.remove('locked'); prev?.focus?.({ preventScroll: true }); };
  }, []);
  return (
    <div className="sheet-root">
      <div className="sheet-scrim" onClick={onClose} />
      <div className={'sheet' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={ref}>
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('Close')}><Icon name="close" /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Switch({ on, onChange, label, tone }: { on: boolean; onChange: (v: boolean) => void; label: string; tone?: 'ice' }) {
  return (
    <button className={'switch' + (on ? ' on' : '') + (tone ? ' ' + tone : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}

export function Seg<T extends string>({ value, options, onChange, label, render, className = '' }: { value: T; options: T[]; onChange: (v: T) => void; label: string; render?: (v: T) => ReactNode; className?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + options.length) % options.length;
    onChange(options[n]);
    refs.current[n]?.focus();
  };
  return (
    <div className={'seg ' + className} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o}
          ref={(el) => { refs.current[i] = el; }}
          role="radio"
          aria-checked={value === o}
          tabIndex={value === o ? 0 : -1}
          className={value === o ? 'on' : ''}
          onClick={() => onChange(o)}
          onKeyDown={(e) => onKey(e, i)}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  );
}

/** Rolls a number toward its target. */
export function useCount(target: number, ms = 750) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reducedMotion() || from.current === target) { setV(target); from.current = target; return; }
    const a = from.current, t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      const val = a + (target - a) * e;
      setV(val);
      from.current = val;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function Count({ value, format, ms }: { value: number; format: (n: number) => string; ms?: number }) {
  const v = useCount(value, ms);
  return <>{format(v)}</>;
}

export function StatusPill({ status }: { status: 'paid' | 'declined' | 'refunded' | 'received' | 'processing' | 'done' }) {
  const { t } = useI18n();
  const label = { paid: t('PAID'), declined: t('DECLINED'), refunded: t('REFUNDED'), received: t('RECEIVED'), processing: t('PROCESSING'), done: t('DONE') }[status];
  return <span className={'pill st-' + status}><i />{label}</span>;
}

/** Fades content in once it scrolls into view. Content is visible without JS or with reduced motion. */
export function useReveal() {
  useEffect(() => {
    if (reducedMotion() || !('IntersectionObserver' in window)) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.in)'));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.documentElement.classList.add('reveal-on');
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Balance privacy: the figure stays in layout, masked and blurred. */
export function Private({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { state } = useApp();
  const { t } = useI18n();
  if (!state.settings.privacy) return <span className={className}>{children}</span>;
  return <span className={'private ' + className} aria-label={t('Hidden')}><span aria-hidden="true">••••••</span></span>;
}

export function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((x) => <div key={x.id} className={'toast t-' + x.tone}><i />{x.text}</div>)}
    </div>
  );
}

/** Press and hold to confirm. Pointer, touch and keyboard (Space / Enter). */
export function HoldButton({ label, doneLabel, ms = 1500, done, onProgress, onDone }: { label: string; doneLabel: string; ms?: number; done: boolean; onProgress: (p: number) => void; onDone: () => void }) {
  const holding = useRef(false);
  const p = useRef(0);
  const raf = useRef(0);
  const [, force] = useState(0);
  const cb = useRef({ onProgress, onDone, done });
  cb.current = { onProgress, onDone, done };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const loop = (last: number) => (now: number) => {
    const dt = now - last;
    p.current = Math.max(0, Math.min(1, p.current + (holding.current ? dt / ms : -dt / 450)));
    cb.current.onProgress(p.current);
    force((n) => n + 1);
    if (p.current >= 1) { holding.current = false; cb.current.onDone(); return; }
    raf.current = p.current > 0 || holding.current ? requestAnimationFrame(loop(now)) : 0;
  };
  const start = () => {
    if (cb.current.done || holding.current) return;
    holding.current = true;
    if (!raf.current) raf.current = requestAnimationFrame(loop(performance.now()));
  };
  const stop = () => { holding.current = false; };
  const pct = Math.round(p.current * 100);
  return (
    <button
      className={'hold' + (done ? ' done' : '') + (holding.current ? ' holding' : '')}
      style={{ ['--p' as string]: done ? 1 : p.current }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start(); }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
      onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') stop(); }}
      onContextMenu={(e) => e.preventDefault()}
      aria-disabled={done}
      aria-valuenow={pct}
    >
      <span className="hold-fill" aria-hidden="true" />
      <span className="hold-label">{done ? doneLabel : label}{!done && pct > 0 ? ` · ${pct}%` : ''}</span>
    </button>
  );
}
