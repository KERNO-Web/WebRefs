import { useEffect, useRef, useSyncExternalStore } from 'react';
import { COLORWAYS } from './scene/colorways';
import { COLOR_ORDER, createStage, type StageHandles } from './scene/stage';
import { PROFILES, synth } from './sound';
import Waveform from './Waveform';

const LAYER_COPY = [
  ['caps', '01', 'Keycaps', 'Dye-sublimated PBT, sculpted profile'],
  ['switches', '02', 'Switches', 'Hot-swap. Tactile, linear or silent'],
  ['plate', '03', 'Plate', 'Anodised aluminium, colour-matched'],
  ['pcb', '04', 'Board', 'USB-C, 2.4 GHz and Bluetooth'],
  ['foam', '05', 'Acoustic layer', 'Poron foam that takes the ring out'],
  ['case', '06', 'Case', 'Milled 6063 aluminium, 4° rake'],
] as const;

const DETAILS = [
  ['Knurled, not knobbed.', 'A solid aluminium dial with seventy-two machined ridges. Volume, scrub, zoom, brush size: whatever you map it to.'],
  ['Legends that never wear.', 'Dye-sublimated into thick PBT, so every letter is part of the key, not printed on top of it.'],
  ['Edges you can feel.', 'Every edge is chamfered, then finished by hand, so the aluminium catches light like a lens.'],
  ['Signed underneath.', 'Each case is engraved with its own number. Turn it over: this one is yours.'],
];

function useSynth() {
  return useSyncExternalStore(
    (f) => synth.subscribe(f),
    () => `${synth.enabled}|${synth.profile.id}`,
  );
}

function scrollToScene(id: string, at = 0) {
  const el = document.querySelector<HTMLElement>(`[data-scene="${id}"]`);
  if (!el) return;
  const span = Math.max(0, el.offsetHeight - innerHeight);
  scrollTo({ top: el.offsetTop + span * at, behavior: 'smooth' });
}

export default function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<StageHandles | null>(null);
  const synthKey = useSynth();
  const soundOn = synthKey.startsWith('true');

  useEffect(() => {
    stage.current = createStage(canvas.current!);
    return () => stage.current?.destroy();
  }, []);

  const toggleSound = () => {
    synth.setEnabled(!synth.enabled);
    if (synth.enabled) synth.play();
  };

  return (
    <>
      <canvas ref={canvas} className="stage" aria-hidden="true" />

      <header className="nav">
        <a className="mark" href="#" onClick={(e) => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); }}>
          KEY<span>/</span>01
        </a>
        <nav className="links" aria-label="Sections">
          <button onClick={() => scrollToScene('form')}>Object</button>
          <button onClick={() => scrollToScene('press')}>Feel</button>
          <button onClick={() => scrollToScene('layers', 0.45)}>Layers</button>
          <button onClick={() => scrollToScene('colors', 0.05)}>Colour</button>
          <button onClick={() => scrollToScene('sound')}>Sound</button>
        </nav>
        <div className="nav-right">
          <button className={`sound-toggle ${soundOn ? 'on' : ''}`} onClick={toggleSound} aria-pressed={soundOn}>
            <span className="bars" aria-hidden="true"><i /><i /><i /></span>
            {soundOn ? 'Sound on' : 'Sound off'}
          </button>
          <a className="back" href="../">Portfolio</a>
        </div>
      </header>

      <main>
        {/* 1 — HERO */}
        <section className="scene hero" data-scene="hero">
          <div className="giant hero-giant" aria-hidden="true">KEY/01</div>
          <div className="hero-copy">
            <p className="eyebrow">KEY/01 · Modular 75% keyboard</p>
            <h1>
              Built to<br />be <em>felt.</em>
            </h1>
            <p className="lede">A modular mechanical keyboard for people who care about colour, sound and precision.</p>
            <div className="ctas">
              <button className="btn primary" onClick={() => scrollToScene('form')}>Explore the object</button>
              <button className="btn ghost" onClick={() => scrollToScene('layers', 0.45)}>
                See the layers <span aria-hidden="true">↓</span>
              </button>
            </div>
          </div>
          <p className="hint"><kbd>A</kbd> Try typing. It is listening.</p>
        </section>

        {/* 2 — FORM */}
        <section className="scene form" data-scene="form">
          <div className="sticky">
            <div className="form-a">
              <p className="eyebrow">01 · Form</p>
              <h2>An object,<br />not an accessory.</h2>
              <p className="body">Sixteen units wide, low and calm. Drawn to sit in your field of view like something you chose, not something you put up with.</p>
            </div>
            <div className="measure" data-measure aria-hidden="true">
              <span className="m-w"><b>326 mm</b></span>
              <span className="m-d"><b>140 mm</b></span>
            </div>
            <div className="form-b">
              <div className="deg">4°</div>
              <div>
                <h3>A gentle rake, machined in.</h3>
                <p className="body">The case leans toward you by four degrees, so your wrists rest and the board meets your hands halfway.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3 — PRESS */}
        <section className="scene press" data-scene="press">
          <div className="sticky back" aria-hidden="true">
            <div className="giant press-giant">press</div>
          </div>
          <div className="sticky">
            <div className="press-copy">
              <div className="step s0">
                <p className="eyebrow">02 · Feel</p>
                <h2>It starts with<br />a single key.</h2>
              </div>
              <div className="step s1">
                <p className="eyebrow">Inside one switch</p>
                <h2>Five parts.<br />One motion.</h2>
                <p className="body">Cap, stem, spring, housing, contacts. Each one shaped for the half second your finger is down.</p>
              </div>
              <div className="step s2">
                <p className="eyebrow">Designed resistance</p>
                <h2>A soft bump.<br />Then release.</h2>
                <p className="body">Four millimetres of travel, a rounded tactile peak halfway, and a return that feels the same on the ten-thousandth press.</p>
              </div>
            </div>
            <button className="tap" onPointerDown={() => stage.current?.tapMacro()}>
              <span>Press it</span>
            </button>
          </div>
        </section>

        {/* 4 — LAYERS */}
        <section className="scene layers" data-scene="layers">
          <div className="sticky">
            <div className="layers-head">
              <p className="eyebrow">03 · Construction</p>
              <h2>Six layers,<br />tuned like an instrument.</h2>
            </div>
            <svg className="leaders" data-leaders aria-hidden="true"><path /></svg>
            {LAYER_COPY.map(([id, n, name, line], i) => (
              <div key={id} className="layer-label" data-layer={id} style={{ '--i': i } as React.CSSProperties}>
                <span className="n">{n}</span>
                <span className="t"><b>{name}</b><span>{line}</span></span>
              </div>
            ))}
            <div className="layers-end">
              <p className="eyebrow">…and back together</p>
              <h2>Now in <em>Coral.</em></h2>
            </div>
          </div>
        </section>

        {/* 5 — COLOURWAYS */}
        <section className="scene colors" data-scene="colors" data-steps="6">
          <div className="sticky back" aria-hidden="true">
            <div className="names">
              {COLOR_ORDER.map((i) => (
                <div key={i} className="giant cw-name" style={{ color: COLORWAYS[i].ink }}>{COLORWAYS[i].name}</div>
              ))}
            </div>
          </div>
          <div className="sticky">
            <div className="colors-copy">
              <p className="eyebrow">04 · Colour</p>
              <h2>Six colourways.<br />One collection.</h2>
            </div>
            <div className="cw-notes">
              {COLOR_ORDER.map((i, slot) => (
                <p key={i} className="cw-note" data-slot={slot}>
                  <b style={{ color: COLORWAYS[i].ink }}>{COLORWAYS[i].name}</b> {COLORWAYS[i].note}
                </p>
              ))}
            </div>
            <div className="chips" role="tablist" aria-label="Colourways">
              {COLOR_ORDER.map((i) => (
                <button key={i} className="chip" role="tab" onClick={() => stage.current?.scrollToColor(i)} aria-label={COLORWAYS[i].name}>
                  <span className="sw" style={{ background: `linear-gradient(135deg, ${COLORWAYS[i].caseColor} 0 50%, ${COLORWAYS[i].mod} 50% 82%, ${COLORWAYS[i].accent} 82%)` }} />
                  <span className="cn">{COLORWAYS[i].name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — SOUND */}
        <section className="scene sound" data-scene="sound">
          <div className="sound-inner">
            <div className="sound-head">
              <p className="eyebrow">05 · Sound</p>
              <h2>Pick a voice.</h2>
              <p className="body">Swap switches and foams in a minute, no solder. Four voices to start with:</p>
              <button className={`btn ${soundOn ? 'ghost' : 'primary'} small`} onClick={toggleSound}>
                {soundOn ? 'Sound is on' : 'Turn sound on'}
              </button>
            </div>
            <div className="voices">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  className={`voice ${synthKey.endsWith(p.id) ? 'active' : ''}`}
                  onClick={() => {
                    synth.setProfile(p);
                    dispatchEvent(new CustomEvent('key01:demo'));
                  }}
                >
                  <span className="vn">{p.name}</span>
                  <span className="vl">{p.line}</span>
                </button>
              ))}
            </div>
            <Waveform />
          </div>
        </section>

        {/* 7 — DETAILS */}
        <section className="scene details" data-scene="details" data-steps="4">
          <div className="sticky">
            <div className="details-copy">
              <p className="eyebrow">06 · Details</p>
              {DETAILS.map(([t, b], i) => (
                <div key={t} className="detail" data-slot={i}>
                  <span className="dn">0{i + 1} / 04</span>
                  <h3>{t}</h3>
                  <p className="body">{b}</p>
                </div>
              ))}
            </div>
            <div className="ticks" aria-hidden="true">
              {DETAILS.map(([t], i) => <i key={t} data-slot={i} />)}
            </div>
          </div>
        </section>

        {/* 8 — FINAL */}
        <section className="scene final" data-scene="final">
          <div className="giant final-giant" aria-hidden="true">touch</div>
          <div className="final-copy">
            <h2>Designed<br />to be touched.</h2>
            <div className="ctas">
              <button className="btn light" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}>Start again <span aria-hidden="true">↑</span></button>
              <a className="btn ghost-light" href="../">More work <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <footer className="foot">
            <span>KEY/01 is a fictional product, designed and built as a portfolio piece.</span>
            <span>© 2026</span>
          </footer>
        </section>
      </main>
    </>
  );
}
