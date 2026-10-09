import { useEffect, useRef, useState } from 'react';
import { fine, lockScroll, reduced, scrollTo, startMotion } from './fx/motion';
import { setLang, useT } from './i18n';
import { Hero } from './sections/Hero';
import { Muse, ObjectScene, Notes, Frames } from './sections/Editorial';
import { Film, Closing } from './sections/Film';

const NAV: [string, string][] = [['The Muse', '#muse'], ['The Object', '#object'], ['Notes', '#notes'], ['Frames', '#frames'], ['Film', '#film']];

function Intro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (reduced()) { onDone(); setPhase(3); return; }
    lockScroll(true);
    const a = setTimeout(() => setPhase(1), 80);
    const b = setTimeout(() => setPhase(2), 1500);
    const c = setTimeout(() => { setPhase(3); lockScroll(false); onDone(); }, 2350);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (phase === 3) return null;
  return (
    <div className={'intro p' + phase} aria-hidden="true">
      <div className="intro-word">{[...'NOCTIS'].map((c, i) => <span key={i} style={{ ['--i' as string]: i }}>{c}</span>)}</div>
      <i className="intro-line" />
    </div>
  );
}

function Header() {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  // the menu only undoes its own lock (the intro uses the same one)
  const menuLock = useRef(false);
  const unlock = () => { if (menuLock.current) { menuLock.current = false; lockScroll(false); } };
  // unlock before scrolling: a stopped Lenis ignores scrollTo
  const go = (id: string) => { setOpen(false); unlock(); scrollTo(id); };
  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open);
    // overflow alone doesn't stop Lenis, so the page kept moving under the menu
    if (open) { menuLock.current = true; lockScroll(true); } else unlock();
  }, [open]);
  return (
    <>
      <header className="hdr">
        <button className="logo" onClick={() => go('#top')} aria-label="NOCTIS">NOCTIS</button>
        <nav className="nav" aria-label="Campaign">
          {NAV.map(([label, id]) => <button key={id} onClick={() => go(id)} data-cursor="">{t(label)}</button>)}
        </nav>
        <div className="hdr-end">
          <button className="lang" onClick={() => setLang(lang === 'en' ? 'ru' : 'en')} aria-label={t('Switch language')} data-cursor="">
            <span className={lang === 'en' ? 'on' : ''}>EN</span><span className={lang === 'ru' ? 'on' : ''}>RU</span>
          </button>
          <button className={'burger' + (open ? ' x' : '')} onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu"><i /><i /></button>
        </div>
      </header>
      <nav className={'menu' + (open ? ' open' : '')} aria-label="Campaign" aria-hidden={!open}>
        {NAV.map(([label, id], i) => (
          <button key={id} onClick={() => go(id)} tabIndex={open ? 0 : -1} style={{ ['--i' as string]: i }}><small>0{i + 1}</small>{t(label)}</button>
        ))}
      </nav>
    </>
  );
}

function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fine() || reduced()) return;
    document.documentElement.classList.add('has-cursor');
    let raf = 0, x = -100, y = -100, rx = x, ry = y;
    const move = (e: PointerEvent) => {
      x = e.clientX; y = e.clientY;
      const hot = (e.target as HTMLElement).closest?.('[data-cursor], button, a');
      ring.current?.classList.toggle('hot', !!hot);
    };
    const tick = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); document.documentElement.classList.remove('has-cursor'); };
  }, []);
  return <><div className="cur-dot" ref={dot} aria-hidden="true" /><div className="cur-ring" ref={ring} aria-hidden="true" /></>;
}

/** Film grain from a tiny generated noise tile. */
function Grain() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 160;
    const ctx = c.getContext('2d')!;
    const d = ctx.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; }
    ctx.putImageData(d, 0, 0);
    setUrl(c.toDataURL());
  }, []);
  return <div className="grain" aria-hidden="true" style={url ? { backgroundImage: `url(${url})` } : undefined} />;
}

export default function App() {
  const [ready, setReady] = useState(false);
  useEffect(() => { startMotion(); }, []);
  useEffect(() => { document.documentElement.classList.toggle('ready', ready); }, [ready]);
  return (
    <>
      <Intro onDone={() => setReady(true)} />
      <Header />
      <main>
        <Hero />
        <Muse />
        <ObjectScene />
        <Notes />
        <Frames />
        <Film />
        <Closing />
      </main>
      <Grain />
      <Cursor />
    </>
  );
}
