import qrcode from 'qrcode-generator';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../lib/i18n';
import type { Key } from '../lib/dict';
import type { InvoiceStatus, PaymentStatus, RefundStatus } from '../lib/model';
import { Icon, type IconName } from './icons';

// ---------- buttons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  block,
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  block?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size}${block ? ' btn-block' : ''}${loading ? ' is-loading' : ''} ${className}`}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={size === 'sm' ? 16 : 18} /> : null}
      {children && <span className="btn-label">{children}</span>}
      {iconRight && !loading && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </button>
  );
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  className = '',
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: IconName; iconRight?: IconName }) {
  return (
    <a className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      <span className="btn-label">{children}</span>
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 16 : 18} />}
    </a>
  );
}

export function IconButton({ icon, label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={20} />
    </button>
  );
}

export const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// ---------- status ----------

export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'refund' | 'draft';

const PAYMENT_TONE: Record<PaymentStatus, [Tone, Key]> = {
  created: ['neutral', 'st_created'],
  pending: ['warning', 'st_pending'],
  processing: ['info', 'st_processing'],
  paid: ['success', 'st_paid'],
  failed: ['danger', 'st_failed'],
  expired: ['neutral', 'st_expired'],
  cancelled: ['neutral', 'st_cancelled'],
  partial_refund: ['refund', 'st_partial'],
  refunded: ['refund', 'st_refunded'],
};

const INVOICE_TONE: Record<InvoiceStatus, [Tone, Key]> = {
  draft: ['draft', 'inv_draft'],
  pending: ['warning', 'inv_pending'],
  paid: ['success', 'inv_paid'],
  expired: ['danger', 'inv_expired'],
  cancelled: ['neutral', 'inv_cancelled'],
};

const REFUND_TONE: Record<RefundStatus, [Tone, Key]> = {
  pending: ['info', 'rf_pending'],
  completed: ['refund', 'rf_completed'],
  failed: ['danger', 'rf_failed'],
};

export function Badge({ tone, children, live }: { tone: Tone; children: ReactNode; live?: boolean }) {
  return (
    <span className={`badge tone-${tone}`}>
      <span className={`badge-dot${live ? ' is-live' : ''}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const { t } = useI18n();
  const [tone, key] = PAYMENT_TONE[status];
  return (
    <Badge tone={tone} live={status === 'pending' || status === 'processing'}>
      {t(key)}
    </Badge>
  );
}

export function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useI18n();
  const [tone, key] = INVOICE_TONE[status];
  return <Badge tone={tone}>{t(key)}</Badge>;
}

export function RefundBadge({ status }: { status: RefundStatus }) {
  const { t } = useI18n();
  const [tone, key] = REFUND_TONE[status];
  return (
    <Badge tone={tone} live={status === 'pending'}>
      {t(key)}
    </Badge>
  );
}

export const paymentTone = (s: PaymentStatus) => PAYMENT_TONE[s][0];

// ---------- brand ----------

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="logo">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <rect width="26" height="26" rx="7.5" fill="var(--accent)" />
        <path d="M8.5 7v12M8.5 13.4 15.6 7M11.4 11l5.6 8" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && <span className="logo-word">Kvit</span>}
    </span>
  );
}

export function SandboxBadge({ small }: { small?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`sandbox${small ? ' is-small' : ''}`} title={t('sandbox_hint')}>
      {t('sandbox')}
    </span>
  );
}

export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`lang ${className}`} role="group" aria-label={t('lang_label')}>
      {(['ru', 'en'] as const).map((l) => (
        <button key={l} type="button" className={lang === l ? 'is-on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// ---------- form ----------

export function Field({
  label,
  hint,
  error,
  children,
  optional,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  optional?: boolean;
  htmlFor?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="field-opt">{t('optional')}</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ suffix, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div className={`input ${className}`}>
      <input {...rest} />
      {suffix && <span className="input-suffix">{suffix}</span>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (v: T) => void;
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`segmented seg-${size}`} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          className={value === o.value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.count !== undefined && <span className="seg-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} className={`toggle${checked ? ' is-on' : ''}`} onClick={() => onChange(!checked)}>
      <span className="toggle-knob" />
    </button>
  );
}

// ---------- copy ----------

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function CopyButton({ text, label, size = 'sm', variant = 'secondary' }: { text: string; label?: string; size?: 'sm' | 'md'; variant?: Variant }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <Button
      size={size}
      variant={variant}
      icon={done ? 'check' : 'copy'}
      className={done ? 'is-copied' : ''}
      onClick={async () => setDone(await copyText(text))}
      aria-live="polite"
    >
      {done ? t('copied') : (label ?? t('copy'))}
    </Button>
  );
}

export function CopyInline({ text, display, mono = true }: { text: string; display?: string; mono?: boolean }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setDone(false), 1400);
    return () => clearTimeout(id);
  }, [done]);
  return (
    <button type="button" className={`copy-inline${mono ? ' mono' : ''}${done ? ' is-copied' : ''}`} onClick={async () => setDone(await copyText(text))} title={t('copy')}>
      <span>{display ?? text}</span>
      <Icon name={done ? 'check' : 'copy'} size={14} />
      <span className="sr-only" aria-live="polite">
        {done ? t('copied') : ''}
      </span>
    </button>
  );
}

// ---------- QR ----------

export function QR({ value, size = 200, label }: { value: string; size?: number; label?: string }) {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'Q');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    // finder patterns are drawn separately so they can be rounded
    const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    const hole = (r: number, c: number) => {
      const mid = n / 2;
      return Math.abs(r + 0.5 - mid) < 3.2 && Math.abs(c + 0.5 - mid) < 3.2;
    };
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!qr.isDark(r, c) || inFinder(r, c) || hole(r, c)) continue;
        d += `M${c + 0.08} ${r + 0.08}h0.84v0.84h-0.84z`;
      }
    }
    return { path: d, count: n };
  }, [value]);

  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={1.6} fill="none" stroke="currentColor" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.8} fill="currentColor" />
    </g>
  );
  const pad = 2;
  const mid = count / 2;
  return (
    <svg className="qr" width={size} height={size} viewBox={`${-pad} ${-pad} ${count + pad * 2} ${count + pad * 2}`} role="img" aria-label={label}>
      <rect x={-pad} y={-pad} width={count + pad * 2} height={count + pad * 2} fill="#fff" rx={2} />
      <path d={path} fill="currentColor" />
      {finder(0, 0)}
      {finder(count - 7, 0)}
      {finder(0, count - 7)}
      <rect x={mid - 2.6} y={mid - 2.6} width={5.2} height={5.2} rx={1.5} fill="var(--accent)" />
      <path
        d={`M${mid - 1} ${mid - 1.5}v3M${mid - 1} ${mid + 0.05}l1.65-1.55M${mid - 0.35} ${mid - 0.55}l1.5 2.05`}
        stroke="#fff"
        strokeWidth={0.5}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ---------- numbers ----------

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Rolls between values so changes are noticed without being loud. */
export function useTween(value: number, duration = 650) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      const v = a + (value - a) * e;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      from.current = value;
    };
  }, [value, duration]);
  return shown;
}

export function Tween({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useTween(value);
  return <>{format(v)}</>;
}

// ---------- overlays ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  side,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** slides in from the right on desktop (detail views) */
  side?: boolean;
}) {
  const { t } = useI18n();
  const id = useId();
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const id = setTimeout(() => setMounted(false), 220);
    lastFocus.current?.focus?.();
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  useEffect(() => {
    if (visible) panel.current?.focus();
  }, [visible]);

  if (!mounted) return null;
  return createPortal(
    <div className={`overlay${visible ? ' is-in' : ''}${side ? ' is-side' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className={`modal${wide ? ' is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id} tabIndex={-1}>
        <header className="modal-head">
          <h2 id={id}>{title}</h2>
          <IconButton icon="close" label={t('close')} onClick={onClose} />
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

// ---------- toast ----------

type ToastItem = { id: number; text: string; tone: 'success' | 'info' | 'danger' };
let toasts: ToastItem[] = [];
const toastListeners = new Set<(t: ToastItem[]) => void>();
let toastSeq = 0;

export function toast(text: string, tone: ToastItem['tone'] = 'success') {
  const item = { id: ++toastSeq, text, tone };
  toasts = [...toasts, item].slice(-3);
  toastListeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== item.id);
    toastListeners.forEach((l) => l(toasts));
  }, 3200);
}

export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    toastListeners.add(setItems);
    return () => {
      toastListeners.delete(setItems);
    };
  }, []);
  return createPortal(
    <div className="toasts" role="status" aria-live="polite">
      {items.map((i) => (
        <div key={i.id} className={`toast tone-${i.tone}`}>
          <Icon name={i.tone === 'danger' ? 'alert' : i.tone === 'info' ? 'info' : 'check'} size={18} />
          {i.text}
        </div>
      ))}
    </div>,
    document.body,
  );
}

// ---------- misc ----------

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
      {action}
    </div>
  );
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}
