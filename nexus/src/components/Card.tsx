import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V5l14 14V5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

/** The virtual card. Tilt and light follow the pointer, written straight to CSS vars. */
export function VirtualCard({ frozen, number, reveal }: { frozen: boolean; number: string; reveal: boolean }) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.4)));
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty('--rx', (-y * 7).toFixed(2) + 'deg');
      el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (50 + x * 38).toFixed(1) + '%');
      el.style.setProperty('--gy', (35 + y * 30).toFixed(1) + '%');
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); };
  }, []);

  const shown = reveal ? number.replace(/(\d{4})(?=\d)/g, '$1 ') : `••••  ${number.slice(-4)}`;
  return (
    <div className="card-stage" ref={wrap}>
      <div className={'vcard' + (frozen ? ' frozen' : '')} role="img" aria-label={`NEXUS virtual card ending ${number.slice(-4)}${frozen ? ', ' + t('Frozen') : ''}`}>
        <div className="vcard-grain" />
        <div className="vcard-sheen" />
        <div className="vcard-top">
          <span className="vcard-brand"><Mark size={20} />NEXUS</span>
          <span className="vcard-kind">{t('VIRTUAL')}</span>
        </div>
        <div className="vcard-chip" aria-hidden="true"><span /><span /><span /></div>
        <div className="vcard-number">{shown}</div>
        <div className="vcard-bottom">
          <span><small>{t('VALID')}</small> 09/29</span>
          <span className="vcard-scheme" aria-hidden="true"><i /><i /></span>
        </div>
        <div className="vcard-frost" aria-hidden="true"><span>{t('Card is frozen')}</span></div>
      </div>
      <div className="vcard-shadow" aria-hidden="true" />
    </div>
  );
}
