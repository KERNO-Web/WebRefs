import { useEffect, useState } from 'react';
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

const FRAMES = [
  { label: 'Flash', note: '1/250 · f2.8' },
  { label: 'Motion', note: '1/30 · drag' },
  { label: 'Silence', note: '1/125 · f4' },
  { label: 'Control', note: '1/500 · f5.6' },
  { label: 'Presence', note: '1/60 · f2' },
];

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
          <span style={{ transitionDelay: `${0.08 * i}s` }}>{l}</span>
        </span>
      ))}
    </span>
  );
}

export default function App() {
  const [track, setTrack] = useState(0);
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
          <h1 className="cover-title" aria-label="Afterimage">
            <span className="w-after" aria-hidden="true">After</span>
            <span className="w-image" aria-hidden="true">
              Image
              <span className="ghost g1">Image</span>
              <span className="ghost g2">Image</span>
            </span>
          </h1>
          <figure className="cover-photo">
            <Img photo={PHOTOS.hero} eager />
          </figure>
          <p className="cover-kicker">A$AP Rocky &nbsp;/&nbsp; Unofficial concept editorial &nbsp;/&nbsp; 2026</p>
          <div className="cover-foot">
            <p className="cover-line">A portrait in light,<br />repeated until it stays.</p>
            <a className="enter" href="#presence">
              <span>Enter the issue</span>
              <i aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 2 — PRESENCE */}
        <section id="presence" className="presence" data-track data-reveal>
          <div className="presence-word" aria-hidden="true">Presence</div>
          <figure className="presence-photo reveal-img">
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
          </div>
        </section>

        {/* 4 — CONTACT SHEET */}
        <section className="sheet" data-track>
          <div className="sheet-head" data-reveal>
            <p className="label">III &nbsp;—&nbsp; Contact Sheet</p>
            <h2><Lines lines={['Five frames.', 'One is kept.']} /></h2>
          </div>
          <div className="frames">
            {PHOTOS.frames.map((ph, i) => (
              <figure key={ph.src} className={`frame f${i + 1}`} data-reveal>
                <div className="frame-img reveal-img">
                  <Img photo={ph} />
                  {i === 2 && (
                    <svg className="mark" viewBox="0 0 200 200" aria-hidden="true">
                      <path d="M100 14c52 2 86 34 84 84-2 54-42 90-90 88-48-2-80-40-78-88 2-46 38-80 92-82 14 0 26 4 34 8" />
                    </svg>
                  )}
                </div>
                <figcaption>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <b>{FRAMES[i].label}</b>
                  <em>{FRAMES[i].note}</em>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 5 — TRACKLIST */}
        <section className="tracks" data-track>
          <figure className="tracks-photo" aria-hidden="true">
            <Img photo={PHOTOS.frames[(track % 4) + 1]} />
          </figure>
          <div className="tracks-inner">
            <div className="tracks-head" data-reveal>
              <p className="label">IV &nbsp;—&nbsp; The Record</p>
              <h2><Lines lines={['Afterimage,', 'in ten exposures.']} /></h2>
              <p className="tracks-note">A fictional sequence. Read it like a contact sheet: left to right, light to dark.</p>
            </div>
            <ol className="tracklist" data-reveal onMouseLeave={() => setTrack(0)}>
              {TRACKS.map((t, i) => (
                <li key={t} onMouseEnter={() => setTrack(i)} className={i === track ? 'on' : ''} style={{ transitionDelay: `${i * 0.05}s` }}>
                  <span className="n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="t">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 6 — FASHION */}
        <section className="fashion" data-track data-reveal>
          <div className="fashion-word" aria-hidden="true">Tailored</div>
          <figure className="fashion-photo reveal-img">
            <Img photo={PHOTOS.fashion} />
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
            <span>After</span><span>image</span>
          </h2>
          <p className="final-line">The image remains.</p>
          <footer className="colophon">
            <span>Afterimage — an unofficial editorial concept. Not affiliated with A$AP Rocky or his labels.</span>
            {CREDITS.length > 0 && <span>Photography: {CREDITS.join(' · ')}</span>}
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
