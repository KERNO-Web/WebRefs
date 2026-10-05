import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { startMotion } from './motion';
import { CREDITS, PHOTOS, type Photo } from './photos';

const TRACKS = [
  'Flashbulb',
  'Silver Hour',
  'Negative Space',
  'Long Exposure',
  'Afterglow',
  'Crimson Proof',
  'Still Life With Chrome',
  'Overexposed',
  'Contact Sheet',
  'The Image Remains',
];
const LENGTHS = ['2:48', '3:31', '4:02', '5:17', '3:09', '2:56', '4:44', '3:23', '3:58', '6:10'];

const FRAMES = [
  { label: 'Flash', note: '1/250 · f2.8' },
  { label: 'Motion', note: '1/30 · drag' },
  { label: 'Silence', note: '1/125 · f4' },
  { label: 'Control', note: '1/500 · f5.6' },
  { label: 'Distance', note: '1/60 · f8' },
  { label: 'Presence', note: '1/60 · f2' },
];
const KEPT = 2;

const TICKER = ['Presence', 'Status', 'Light', 'Style', 'Aura', 'Flash', 'Silhouette', 'Repetition'];

function Img({ photo, className = '', eager = false }: { photo: Photo; className?: string; eager?: boolean }) {
  return (
    <img
      className={className}
      src={photo.src}
      alt={photo.alt}
      style={{ objectPosition: photo.pos }}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  );
}

/** Headline lines that rise out of a mask when their block enters. */
function Lines({ lines, className = '' }: { lines: string[]; className?: string }) {
  return (
    <span className={`lines ${className}`}>
      {lines.map((l, i) => (
        <span key={i} className="line">
          <span style={{ transitionDelay: `${0.09 * i}s` }}>{l}</span>
        </span>
      ))}
    </span>
  );
}

/** A word split into letters, each with its own entrance delay. */
function Letters({ word, delay = 0, step = 0.07 }: { word: string; delay?: number; step?: number }) {
  return (
    <>
      {word.split('').map((ch, i) => (
        <span key={i} className="ch" style={{ '--d': `${delay + i * step}s` } as CSSProperties}>
          {ch}
        </span>
      ))}
    </>
  );
}

function FilmStrip() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const measure = () => {
      if (!sec.current || !track.current) return;
      const shift = Math.max(0, track.current.scrollWidth - innerWidth);
      sec.current.style.setProperty('--shift', `${shift}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section ref={sec} className="sheet" data-track>
      <div className="sheet-pin">
        <div className="perf top" aria-hidden="true" />
        <div ref={track} className="strip">
          <div className="sheet-head" data-reveal>
            <p className="label">III &nbsp;—&nbsp; Contact Sheet</p>
            <h2><Lines lines={['Six frames.', 'One is kept.']} /></h2>
            <p className="sheet-note">Scroll the roll. The red mark is the frame that made the issue.</p>
          </div>
          {PHOTOS.frames.map((ph, i) => (
            <figure key={ph.src} className={`frame f${i + 1} ${i === KEPT ? 'kept' : ''}`} data-reveal>
              <div className="frame-img flashable">
                <Img photo={ph} />
                {i === KEPT && (
                  <svg className="mark" viewBox="0 0 200 200" aria-hidden="true">
                    <path d="M100 14c52 2 86 34 84 84-2 54-42 90-90 88-48-2-80-40-78-88 2-46 38-80 92-82 14 0 26 4 34 8" />
                  </svg>
                )}
              </div>
              <figcaption>
                <span>{i + 12}A</span>
                <b>{FRAMES[i].label}</b>
                <em>{FRAMES[i].note}</em>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="perf bottom" aria-hidden="true" />
        <div className="roll" aria-hidden="true"><i /></div>
      </div>
    </section>
  );
}

function Record() {
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const float = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);

  // the floating print trails the cursor with a little lag and lean
  useEffect(() => {
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = list.current?.getBoundingClientRect();
      if (!r) return;
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dx = tx - x;
      x += dx * 0.12;
      y += (ty - y) * 0.12;
      float.current?.style.setProperty('transform', `translate(${x}px, ${y}px) rotate(${Math.max(-7, Math.min(7, dx * 0.04))}deg)`);
    };
    addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <section className="tracks" data-track>
      <div className="tracks-inner">
        <div className="tracks-head" data-reveal>
          <p className="label">IV &nbsp;—&nbsp; The Record</p>
          <h2><Lines lines={['Afterimage,', 'in ten exposures.']} /></h2>
          <p className="tracks-note">A fictional sequence. Read it like a contact sheet: left to right, light to dark.</p>
          <figure className="tracks-still" aria-hidden="true">
            {PHOTOS.tracks.map((ph, i) => (
              <Img key={ph.src} photo={ph} className={i === active ? 'on' : ''} />
            ))}
          </figure>
        </div>
        <ol
          ref={list}
          className="tracklist"
          data-hover={hovering ? '' : undefined}
          data-reveal
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        >
          {TRACKS.map((t, i) => (
            <li
              key={t}
              onPointerEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              className={i === active ? 'on' : ''}
              style={{ transitionDelay: `${i * 0.05}s` }}
            >
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{t}</span>
              <span className="len">{LENGTHS[i]}</span>
            </li>
          ))}
          <div ref={float} className="float" aria-hidden="true">
            <div className="float-in">
              {PHOTOS.tracks.map((ph, i) => (
                <Img key={ph.src} photo={ph} className={i === active ? 'on' : ''} />
              ))}
            </div>
          </div>
        </ol>
      </div>
    </section>
  );
}

export default function App() {
  useEffect(() => startMotion(), []);

  return (
    <>
      <div className="grain" aria-hidden="true" />

      <header className="mast">
        <a href="#cover" className="mast-l">Afterimage</a>
        <span className="mast-c">Issue 01 &nbsp;/&nbsp; Autumn 2026</span>
        <a href="../" className="mast-r">Portfolio</a>
      </header>

      <main>
        {/* 1 — COVER */}
        <section id="cover" className="cover" data-track>
          <div className="flash" aria-hidden="true" />
          <h1 className="sr-only">Afterimage — A$AP Rocky, an unofficial concept editorial</h1>
          <div className="w-after" aria-hidden="true">
            <Letters word="After" delay={0.35} step={0.08} />
          </div>
          <figure className="cover-photo">
            <Img photo={PHOTOS.hero} eager />
          </figure>
          <div className="w-image" aria-hidden="true">
            <span className="word"><Letters word="image" delay={0.7} step={0.07} /></span>
            <span className="ghost g1">image</span>
            <span className="ghost g2">image</span>
          </div>
          <p className="cover-kicker">A$AP Rocky &nbsp;/&nbsp; Unofficial concept editorial &nbsp;/&nbsp; 2026</p>
          <div className="cover-foot">
            <p className="cover-line">A portrait in light,<br />repeated until it stays.</p>
            <a className="enter" href="#presence">
              <span>Enter the issue</span>
              <i aria-hidden="true" />
            </a>
          </div>
          <p className="cover-num" aria-hidden="true">N°01</p>
        </section>

        {/* ticker */}
        <section className="ticker" data-track aria-hidden="true">
          <div className="tick-row r1">
            {[0, 1].map((k) => (
              <span key={k}>{TICKER.map((w) => <b key={w}>{w}<i>✦</i></b>)}</span>
            ))}
          </div>
          <div className="tick-row r2">
            {[0, 1].map((k) => (
              <span key={k}>{[...TICKER].reverse().map((w) => <b key={w}>{w}<i>—</i></b>)}</span>
            ))}
          </div>
        </section>

        {/* 2 — PRESENCE */}
        <section id="presence" className="presence" data-track data-reveal>
          <div className="presence-word" aria-hidden="true">Presence</div>
          <figure className="presence-photo reveal-img flashable">
            <Img photo={PHOTOS.presence} />
          </figure>
          <div className="presence-copy">
            <p className="label">I &nbsp;—&nbsp; Presence</p>
            <h2>
              <Lines lines={['Some people', 'are photographed.', 'Others are', 'pictured.']} />
            </h2>
            <ol className="notes">
              <li><b>i.</b> The silhouette arrives first.</li>
              <li><b>ii.</b> Stillness reads as certainty.</li>
              <li><b>iii.</b> Always a step out of reach.</li>
            </ol>
          </div>
          <figure className="presence-inset reveal-img" aria-hidden="true">
            <Img photo={PHOTOS.presenceInset} />
          </figure>
        </section>

        {/* 3 — IMAGE / PERSONA */}
        <section className="persona" data-track>
          <div className="persona-pin">
            <div className="persona-stage" data-reveal>
              <figure className="persona-photo">
                <Img photo={PHOTOS.persona} />
                <span className="echo e-red"><Img photo={PHOTOS.persona} /></span>
                <span className="echo e-blue"><Img photo={PHOTOS.persona} /></span>
              </figure>
              <div className="persona-type" aria-hidden="true">
                <span>Image</span>
                <span className="slash">/</span>
                <span>Persona</span>
              </div>
            </div>
            <div className="persona-copy" data-reveal>
              <p className="label">II &nbsp;—&nbsp; Image / Persona</p>
              <p className="persona-line">
                Look long enough and the light stays behind your eyes. <em>That trace is the subject.</em>
              </p>
            </div>
            <div className="persona-count" aria-hidden="true">
              <span>Exposure</span>
              <b><i>01</i><i>02</i><i>03</i></b>
            </div>
          </div>
        </section>

        {/* 4 — CONTACT SHEET */}
        <FilmStrip />

        {/* 5 — TRACKLIST */}
        <Record />

        {/* 6 — FASHION */}
        <section className="fashion" data-track data-reveal>
          <div className="fashion-word" aria-hidden="true">Tailored</div>
          <figure className="fashion-photo reveal-img">
            <Img photo={PHOTOS.fashion} />
          </figure>
          <figure className="fashion-inset reveal-img flashable">
            <Img photo={PHOTOS.fashionInset} />
          </figure>
          <div className="fashion-copy">
            <p className="label">V &nbsp;—&nbsp; Fashion / Influence</p>
            <blockquote>
              <Lines lines={['Style is the part', 'of the sound', 'you can see.']} />
            </blockquote>
            <dl className="materials">
              <div><dt>Silver</dt><dd>worn loud</dd></div>
              <div><dt>Wool</dt><dd>cut quiet</dd></div>
              <div><dt>Leather</dt><dd>never new</dd></div>
            </dl>
          </div>
        </section>

        {/* 7 — FINAL COVER */}
        <section className="final" data-track data-reveal>
          <figure className="final-photo reveal-img">
            <Img photo={PHOTOS.final} />
          </figure>
          <h2 className="final-title" aria-label="Afterimage">
            <span className="fa"><Letters word="After" step={0.06} /></span>
            <span className="fi"><Letters word="image" delay={0.3} step={0.06} /></span>
          </h2>
          <p className="final-line">The image remains.</p>
          <footer className="colophon">
            <span>Afterimage — an unofficial editorial concept. Not affiliated with A$AP Rocky or his labels.</span>
            <span className="credits">
              Photography via Wikimedia Commons, cropped and converted to black and white:{' '}
              {CREDITS.map((c, i) => (
                <span key={c.what}>
                  <a href={c.url} target="_blank" rel="noopener noreferrer">{c.who}</a>, “{c.what}”,{' '}
                  <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{c.license}</a>
                  {i < CREDITS.length - 1 ? ' · ' : '.'}
                </span>
              ))}{' '}
              Derivatives of CC BY-SA images are shared under the same licence.
            </span>
            <span className="colophon-links">
              <a href="#cover">Back to cover ↑</a>
              <a href="../">More work →</a>
            </span>
          </footer>
        </section>
      </main>
    </>
  );
}
