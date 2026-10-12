import { useEffect, useRef, useState } from 'react';
import { venue } from '../data/venue';

const NAV: [string, string][] = [['Атмосфера', '#atmosphere'], ['Терраса', '#terrace'], ['Меню', '#menu'], ['Контакты', '#contacts']];

export function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  // which chapter is under the reader: the nav item carries it
  useEffect(() => {
    const ids = NAV.map(([, h]) => h.slice(1));
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setActive(e.target.id);
    }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add('menu-open'); // locks page scroll
    const first = panel.current?.querySelector<HTMLElement>('a, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      // keep focus inside the menu and its toggle
      const items = [toggle.current!, ...panel.current.querySelectorAll<HTMLElement>('a, button')];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault(); items[next].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => { root.classList.remove('menu-open'); window.removeEventListener('keydown', onKey); toggle.current?.focus(); };
  }, [open]);

  return (
    <header className={'hdr' + (open ? ' is-open' : '')}>
      <a className="hdr-logo" href="#top">Sorry Mama</a>
      <nav className="hdr-nav" aria-label="Разделы">
        {NAV.map(([t, h]) => <a key={h} href={h} className={active === h.slice(1) ? 'is-active' : undefined} aria-current={active === h.slice(1) ? 'true' : undefined}>{t}</a>)}
      </nav>
      <a className="btn btn-hdr" href={venue.phone.href}><span className="long">Забронировать</span><span className="short">Бронь</span></a>
      <button ref={toggle} className="hdr-toggle" aria-expanded={open} aria-controls="menu-panel" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} onClick={() => setOpen(!open)}><i /><i /></button>
      <div id="menu-panel" ref={panel} className="menu-panel" hidden={!open}>
        <nav aria-label="Разделы">
          {NAV.map(([t, h]) => <a key={h} href={h} onClick={() => setOpen(false)}>{t}</a>)}
        </nav>
        <div className="menu-foot">
          <a className="btn btn-gold" href={venue.phone.href}>Забронировать стол</a>
          <a className="link" href={venue.phone.href}>{venue.phone.display}</a>
        </div>
      </div>
    </header>
  );
}
