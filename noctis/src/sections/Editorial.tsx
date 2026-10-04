import { useEffect, useRef, useState, type RefObject } from 'react';
import { fine, reduced, useProgress, useReveal, useSpeed } from '../fx/motion';
import { useT } from '../i18n';
import { img } from './Hero';

/** An image whose inner photo drifts against the scroll. */
function Drift({ name, speed = -0.12, className, alt = '', w, h }: { name: string; speed?: number; className?: string; alt?: string; w: number; h: number }) {
  const probe = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLImageElement>(null);
  useSpeed(probe as RefObject<HTMLElement>, target as RefObject<HTMLElement>, speed);
  return (
    <div className={'drift ' + (className ?? '')} ref={probe} data-reveal="">
      <img ref={target} src={img(name)} alt={alt} width={w} height={h} loading="lazy" />
    </div>
  );
}

/* ---------------- I. The Muse ---------------- */

export function Muse() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section className="muse" id="muse" ref={root}>
      <div className="muse-main">
        <Drift name="back" className="muse-back" w={1400} h={2240} speed={-0.1} />
        <div className="muse-smoke" aria-hidden="true"><img src={img('n-smoke')} alt="" loading="lazy" /></div>
      </div>
      <div className="muse-copy">
        <span className="kicker" data-reveal="">{t('I — The Muse')}</span>
        <h2 data-reveal="">{t('Presence')}<br /><em>{t('before speech.')}</em></h2>
        <p data-reveal="">{t('She is not a face but a weather. You notice her the way you notice the night has started: all at once, and only afterwards.')}</p>
        <ul className="muse-words" data-reveal="">
          <li>{t('Skin and shadow')}</li>
          <li>{t('Stillness')}</li>
          <li>{t('Aura')}</li>
        </ul>
      </div>
      <Drift name="shoulder" className="muse-second" w={1400} h={937} speed={0.08} />
      <span className="muse-vertical" aria-hidden="true">SILHOUETTE</span>
    </section>
  );
}

/* ---------------- II. The Object ---------------- */

export function ObjectScene() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useProgress(root);

  // the light follows the hand
  useEffect(() => {
    const el = stage.current;
    if (!el || !fine() || reduced()) return;
    let raf = 0, x = 0.5, y = 0.5, tx = 0.5, ty = 0.5;
    const move = (e: PointerEvent) => { tx = e.clientX / innerWidth; ty = e.clientY / innerHeight; };
    const tick = () => {
      x += (tx - x) * 0.06; y += (ty - y) * 0.06;
      el.style.setProperty('--lx', x.toFixed(3));
      el.style.setProperty('--ly', y.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);

  return (
    <section className="object" id="object" ref={root}>
      <div className="object-stage" ref={stage}>
        <div className="object-glow" aria-hidden="true" />
        <div className="object-title">
          <span className="kicker">{t('II — The Object')}</span>
          <h2>{t('Obsidian glass.')}<br /><em>{t('A warm heart.')}</em></h2>
        </div>
        <figure className="bottle" data-cursor="">
          <div className="bottle-tilt">
            <img src={img('bottle')} alt="NOCTIS Eau de Parfum" width="1400" height="1400" loading="lazy" />
            <span className="bottle-label" aria-hidden="true"><b>NOCTIS</b><small>EAU DE PARFUM</small></span>
            <span className="bottle-sheen" aria-hidden="true" />
          </div>
        </figure>
        <ul className="callouts">
          <li className="c1"><i aria-hidden="true" />{t('Smoked glass, poured by hand')}</li>
          <li className="c2"><i aria-hidden="true" />{t('Chrome cap, cold to the touch')}</li>
          <li className="c3"><i aria-hidden="true" />{t('75 ml · Eau de Parfum')}</li>
        </ul>
        <span className="object-hint" aria-hidden="true">{t('Move to turn the light')}</span>
      </div>
    </section>
  );
}

/* ---------------- III. Notes ---------------- */

const NOTES: [string, string, string, string][] = [
  ['Smoke', 'A haze that stays after the candle.', 'n-smoke', '#cfc9c2'],
  ['Velvet', 'Wine-dark, warm under the hand.', 'n-velvet', '#9b3456'],
  ['Ember', 'Heat that glows without a flame.', 'n-ember', '#d98a4e'],
  ['Skin', 'The note that belongs to you.', 'n-skin', '#d4a891'],
  ['Silk', 'Cool at first, then slowly warm.', 'n-silk', '#bfc3c9'],
  ['Shadow', 'Everything the light forgot.', 'n-shadow', '#8c8178'],
  ['Glass', 'Cold reflections, held still.', 'n-glass', '#8fa7c4'],
  ['Afterlight', 'What the moon leaves on water.', 'n-afterlight', '#e3d3ae'],
];

export function Notes() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  const follower = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;
  useReveal(root);

  // the image follows the cursor with a little weight
  useEffect(() => {
    const el = follower.current;
    if (!el || !fine()) return;
    let raf = 0, x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, vx = 0;
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; };
    const tick = () => {
      const nx = x + (tx - x) * 0.12;
      vx = nx - x; x = nx; y += (ty - y) * 0.12;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${Math.max(-8, Math.min(8, vx * 0.35)).toFixed(2)}deg)`;
      // the list can scroll away under a resting pointer: let go of the image when that happens
      const list = root.current?.querySelector('.note-list')?.getBoundingClientRect();
      if (activeRef.current !== null && list && (ty < list.top || ty > list.bottom)) setActive(null);
      raf = requestAnimationFrame(tick);
    };
    addEventListener('pointermove', move, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', move); };
  }, []);

  // on touch screens the row crossing the middle of the screen becomes active
  useEffect(() => {
    if (fine() || !root.current) return;
    const rows = root.current.querySelectorAll<HTMLElement>('.note');
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }), { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach((r) => io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section className={'notes' + (active !== null ? ' has-active' : '')} id="notes" ref={root} onPointerLeave={() => fine() && setActive(null)}>
      <span className="kicker" data-reveal="">{t('III — Notes of the Night')}</span>
      <ol className="note-list">
        {NOTES.map(([word, line, image, color], i) => (
          <li key={word} className={'note' + (active === i ? ' on' : '')} data-i={i} data-reveal="" style={{ ['--c' as string]: color, ['--i' as string]: i }}
            onPointerEnter={() => fine() && setActive(i)}>
            <span className="note-n">{String(i + 1).padStart(2, '0')}</span>
            <span className="note-thumb" aria-hidden="true"><img src={img(image)} alt="" loading="lazy" /></span>
            <span className="note-word">{t(word)}</span>
            <span className="note-line">{t(line)}</span>
          </li>
        ))}
      </ol>
      <div className="note-follower" ref={follower} aria-hidden="true">
        <div className={'nf-frame' + (active !== null ? ' show' : '')}>
          {NOTES.map(([w, , image], i) => <img key={w} src={img(image)} alt="" className={active === i ? 'on' : ''} loading="lazy" />)}
        </div>
      </div>
    </section>
  );
}

/* ---------------- IV. Frames ---------------- */

const FRAMES: [string, string, number, number, number][] = [
  ['Afterlight', 'f-afterlight', 1200, 1800, -0.06],
  ['Veil', 'f-veil', 1200, 800, 0.1],
  ['Touch', 'f-touch', 1200, 800, -0.04],
  ['Ember', 'f-ember', 1200, 1600, 0.12],
  ['Ritual', 'f-ritual', 1200, 800, 0.05],
  ['Midnight', 'f-midnight', 1200, 1800, -0.1],
];

function Frame({ i, name, image, w, h, speed }: { i: number; name: string; image: string; w: number; h: number; speed: number }) {
  const { t } = useT();
  const probe = useRef<HTMLElement>(null);
  const target = useRef<HTMLDivElement>(null);
  useSpeed(probe as RefObject<HTMLElement>, target as RefObject<HTMLElement>, speed);
  return (
    <figure className={'frame fr' + (i + 1)} ref={probe} data-reveal="" data-cursor="">
      <div className="frame-move" ref={target}>
        <div className="frame-img"><img src={img(image)} alt="" width={w} height={h} loading="lazy" /></div>
        <figcaption><span>N°{String(i + 1).padStart(2, '0')}</span><em>{t(name)}</em></figcaption>
      </div>
    </figure>
  );
}

export function Frames() {
  const { t } = useT();
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section className="frames" id="frames" ref={root}>
      <div className="frames-head">
        <span className="kicker" data-reveal="">{t('IV — Campaign Frames')}</span>
        <h2 data-reveal="">{t('Every frame,')}<br /><em>{t('a held breath.')}</em></h2>
      </div>
      <div className="frames-grid">
        {FRAMES.map(([name, image, w, h, speed], i) => <Frame key={name} i={i} name={name} image={image} w={w} h={h} speed={speed} />)}
      </div>
    </section>
  );
}
