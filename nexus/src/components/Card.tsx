import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { usePulse, reducedMotion, type PulseKind } from '../ctx';
import { expiryOf, type CardKind, type Finish } from '../store';
import { Icon, Mark } from './Icon';

export interface CardProps {
  finish: Finish;
  number: string;
  name: string;
  kind: CardKind;
  issuedAt: number;
  frozen?: boolean;
  draft?: boolean;
  reveal?: boolean;
  /** resting pose, degrees: the card is photographed slightly turned */
  pose?: [number, number];
  /** stage decoration: halo + floor light */
  stage?: boolean;
  /** react to global card pulses (payments, issue, funding) */
  live?: boolean;
  /** a changing value flashes the card as paid, for scripted scenes */
  ping?: number;
  className?: string;
}

const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * The NEXUS card. Pointer drives tilt, sheen and edge light through CSS vars.
 * The loop only runs while the pointer moves and the card is on screen.
 */
export function NexusCard({ finish, number, name, kind, issuedAt, frozen, draft, reveal, pose = [0, 0], stage = true, live = true, ping, className = '' }: CardProps) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const chipId = useId().replace(/:/g, '');
  const p = usePulse();
  const [flash, setFlash] = useState<{ kind: PulseKind; n: number } | null>(null);
  const seen = useRef(p.n);

  useEffect(() => {
    if (!live || p.n === seen.current || !p.kind) return;
    seen.current = p.n;
    setFlash({ kind: p.kind, n: p.n });
    const id = setTimeout(() => setFlash(null), p.kind === 'issued' ? 1900 : 1400);
    return () => clearTimeout(id);
  }, [p, live]);

  const lastPing = useRef(ping);
  useEffect(() => {
    if (ping === undefined || ping === lastPing.current) return;
    lastPing.current = ping;
    setFlash({ kind: 'paid', n: -ping - 1 });
    const id = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(id);
  }, [ping]);

  useEffect(() => {
    const el = wrap.current;
    if (!el || !fine() || reducedMotion()) return;
    let raf = 0, tx = 0, ty = 0, th = 0, x = 0, y = 0, h = 0, visible = false;
    const tick = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      h += (th - h) * 0.08;
      el.style.setProperty('--rx', (-y * 6).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (66 + x * 40 - h * 14).toFixed(1) + '%');
      el.style.setProperty('--gy', (14 + y * 40 + h * 24).toFixed(1) + '%');
      el.style.setProperty('--hover', h.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(th - h) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      tx = Math.max(-1, Math.min(1, dx * 1.1));
      ty = Math.max(-1, Math.min(1, dy * 0.9));
      // edge light wakes up as the pointer approaches the object
      th = Math.max(0, 1 - Math.max(0, Math.hypot(dx, dy * 0.7) - 0.35) / 0.9);
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; th = 0; kick(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) onLeave(); });
    io.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('pointermove', onMove); document.documentElement.removeEventListener('pointerleave', onLeave); };
  }, []);

  const groups = draft ? ['••••', '••••', '••••', '••••'] : reveal ? number.match(/.{4}/g)! : ['••••', '••••', '••••', number.slice(-4)];
  const state = draft ? 'draft' : frozen ? 'frozen' : 'active';
  const label = `NEXUS ${t('virtual card')}${draft ? '' : ` ${t('ending')} ${number.slice(-4)}`}, ${draft ? t('Draft') : frozen ? t('Frozen') : t('Active')}`;

  return (
    <div
      ref={wrap}
      className={`card-stage f-${finish} s-${state}${flash ? ' pulse-' + flash.kind : ''}${stage ? ' staged' : ''} ${className}`}
      style={{ ['--prx' as string]: pose[0] + 'deg', ['--pry' as string]: pose[1] + 'deg' }}
    >
      {stage && <div className="card-halo" aria-hidden="true" />}
      <div className="card-tilt">
        <div className="vcard" role="img" aria-label={label}>
          <div className="vcard-metal" />
          <div className="vcard-aniso" />
          <div className="vcard-sheen" />
          <div className="vcard-frost" />
          <div className="vcard-face">
            <div className="vcard-top">
              <span className="vcard-brand"><Mark size={18} /><span>NEXUS</span></span>
              <span className="vcard-state">
                {frozen && !draft && <Icon name="snow" size={13} stroke={2} />}
                {draft ? t('DRAFT') : frozen ? t('FROZEN') : t('VIRTUAL')}
              </span>
            </div>
            <div className="vcard-mid">
              <svg className="vcard-chip" viewBox="0 0 50 38" aria-hidden="true">
                <defs>
                  <linearGradient id={chipId} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#e4e7ea" />
                    <stop offset="0.45" stopColor="#9aa0a8" />
                    <stop offset="0.7" stopColor="#c8ccd2" />
                    <stop offset="1" stopColor="#7c828a" />
                  </linearGradient>
                </defs>
                <rect x="0.5" y="0.5" width="49" height="37" rx="7" fill={`url(#${chipId})`} />
                <path d="M0 12.5h16M0 25.5h16M34 12.5h16M34 25.5h16M16 0v38M34 0v38M16 19h18M25 0v8M25 30v8" stroke="rgba(20,22,26,.42)" strokeWidth="1" fill="none" />
                <rect x="0.5" y="0.5" width="49" height="37" rx="7" fill="none" stroke="rgba(0,0,0,.35)" />
              </svg>
              <Icon name="contactless" size={22} stroke={1.6} />
            </div>
            <div className={'vcard-number' + (flash?.kind === 'issued' ? ' print' : '')} key={draft ? 'draft' : number}>
              {groups.map((g, i) => <span key={i} style={{ ['--i' as string]: i }}>{g}</span>)}
            </div>
            <div className="vcard-bottom">
              <span className="vcard-name">{name || 'NEXUS MEMBER'}</span>
              <span className="vcard-exp"><small>{t('VALID')}</small>{draft ? '••/••' : expiryOf(issuedAt)}</span>
              <span className="vcard-kind">{kind === 'single' ? t('SINGLE-USE') : t('DEBIT')}</span>
            </div>
          </div>
          <div className="vcard-edge" />
          <div className="vcard-sweep" />
        </div>
      </div>
      {stage && <div className="card-floor" aria-hidden="true" />}
    </div>
  );
}
