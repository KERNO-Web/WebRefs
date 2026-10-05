import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { COLORWAYS } from './colorways';
import { Keyboard, LAYERS, OUT_D, OUT_W, type LayerName } from './keyboard';
import { FIELD_D, FIELD_W, KEYS } from './layout';
import { MacroSwitch } from './macro';

/** Order in which the colorway section walks the collection. */
export const COLOR_ORDER = [1, 2, 3, 4, 5, 0];

interface Pose {
  x: number; // screen position, fraction of the visible width (0 = centre)
  y: number; // fraction of the visible height
  s: number; // board: width as a fraction of visible width · macro: keycap as a fraction of visible height
  rx: number;
  ry: number;
  rz: number;
  f: THREE.Vector3; // local point that lands on (x, y)
}

interface State {
  kb: Pose;
  explode: number;
  macro: Pose;
  mExplode: number;
  mPress: number;
  handoff: number;
  shadow: number;
  colorway: number;
  bg: string;
  /** how much of the caption scrim is up (details scene only) */
  scrim: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = THREE.MathUtils.lerp;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

const CENTER = new THREE.Vector3(0, 0.9, 0);
const MACRO_CENTER = new THREE.Vector3(0, 1.25, 0);

function P(x: number, y: number, s: number, rx: number, ry: number, rz: number, f = CENTER): Pose {
  return { x, y, s, rx, ry, rz, f: f.clone() };
}
function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    // scale interpolates geometrically so macro zooms feel even
    s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), t)),
    rx: lerp(a.rx, b.rx, t),
    ry: lerp(a.ry, b.ry, t),
    rz: lerp(a.rz, b.rz, t),
    f: a.f.clone().lerp(b.f, t),
  };
}
function lerpState(a: State, b: State, t: number): State {
  const ca = new THREE.Color(a.bg);
  return {
    kb: lerpPose(a.kb, b.kb, t),
    explode: lerp(a.explode, b.explode, t),
    macro: lerpPose(a.macro, b.macro, t),
    mExplode: lerp(a.mExplode, b.mExplode, t),
    mPress: lerp(a.mPress, b.mPress, t),
    handoff: lerp(a.handoff, b.handoff, t),
    shadow: lerp(a.shadow, b.shadow, t),
    colorway: t < 0.5 ? a.colorway : b.colorway,
    scrim: lerp(a.scrim, b.scrim, t),
    bg: '#' + ca.lerp(new THREE.Color(b.bg), t).getHexString(),
  };
}

interface Section {
  id: string;
  el: HTMLElement;
  top: number;
  height: number;
}

export interface StageHandles {
  destroy: () => void;
  tapMacro: () => void;
  scrollToColor: (i: number) => void;
}

export function createStage(canvas: HTMLCanvasElement): StageHandles | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.6 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;

  const FOV = 20;
  const DIST = 60;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 400);
  camera.position.set(0, 0, DIST);

  const kb = new Keyboard(renderer);
  scene.add(kb.root);

  // studio light that travels with the board, so it always reads the same way
  const key = new THREE.DirectionalLight('#fffaf2', 1.35);
  key.position.set(-5, 14, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -10.5, right: 10.5, top: 7, bottom: -7, near: 1, far: 40 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.025;
  key.shadow.radius = 4;
  kb.root.add(key, key.target);
  const rim = new THREE.DirectionalLight('#ffffff', 0.6);
  rim.position.set(8, 4, -10);
  kb.root.add(rim);

  const esc = kb.keyMeshes[0];
  const stemMat = kb.stems.material as THREE.Material;
  const macro = new MacroSwitch(esc, stemMat);
  macro.root.matrixAutoUpdate = false;
  macro.root.visible = false;
  scene.add(macro.root);
  const macroLight = new THREE.DirectionalLight('#fffaf2', 1.4);
  macroLight.position.set(-3, 6, 5);
  scene.add(macroLight);
  macroLight.visible = false;

  // focus points for the macro detail frames, in board-local space
  kb.root.updateMatrixWorld(true);
  const local = (o: THREE.Object3D, offset = new THREE.Vector3()) => kb.root.worldToLocal(o.localToWorld(offset.clone()));
  const hKey = kb.keyMeshes[KEYS.findIndex((k) => k.code === 'KeyH')];
  const FOCUS = {
    knob: local(kb.knob, new THREE.Vector3(0, 0.25, 0)),
    legend: local(hKey, new THREE.Vector3(-0.6, 0.45, 0.1)),
    corner: new THREE.Vector3(-OUT_W / 2 + 0.4, 1.0, OUT_D / 2 - 0.4),
    under: new THREE.Vector3(0, 0, 0.2),
  };
  const escLocal = new THREE.Vector3(KEYS[0].x + 0.5 - FIELD_W / 2, 0, KEYS[0].z + 0.5 - FIELD_D / 2);

  // ── layout / sections ──────────────────────────────────────────────
  let vw = innerWidth;
  let vh = innerHeight;
  let wide = vw / vh > 1.05;
  let sections: Section[] = [];
  const measure = () => {
    vw = innerWidth;
    vh = innerHeight;
    wide = vw / vh > 1.05;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    sections = [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((el) => ({
      id: el.dataset.scene!,
      el,
      top: el.offsetTop,
      height: el.offsetHeight,
    }));
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(document.body);
  addEventListener('resize', measure);

  const visH = () => 2 * DIST * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // ── the choreography ───────────────────────────────────────────────
  const hidden = P(0, -1.2, 0.2, 0.5, -0.5, 0, MACRO_CENTER);
  const base = (over: Partial<State>): State => ({
    kb: P(0, 0, 0.6, 0.6, -0.4, 0),
    explode: 0,
    macro: hidden,
    mExplode: 0,
    mPress: 0,
    handoff: 0,
    shadow: 1,
    colorway: 0,
    bg: '#f3f1ec',
    scrim: 0,
    ...over,
  });

  const scenes: Record<string, (p: number) => State> = {
    hero: () =>
      base({
        kb: wide ? P(0.13, -0.05, 0.58, 0.62, -0.46, 0.12) : P(0.04, -0.17, 1.32, 0.74, -0.42, 0.3),
        bg: '#f4f2ee',
      }),
    form: (p) => {
      const top = wide ? P(0.11, -0.01, 0.6 + p * 0.06, 1.3, 0, 0) : P(0, -0.16, 1.02, 1.3, 0, -Math.PI / 2);
      const low = wide ? P(0.02, -0.08, 0.98, 0.1, -0.64, 0.02) : P(0.18, -0.2, 1.9, 0.12, -0.72, 0);
      return base({ kb: lerpPose(top, low, smooth(0.4, 0.62, p)), bg: '#ece6db' });
    },
    press: (p) => {
      const out = smooth(0.06, 0.3, p);
      const kbPose = lerpPose(
        wide ? P(0.14, -0.14, 0.52, 0.8, -0.3, 0.06) : P(0, -0.12, 1.1, 0.85, -0.3, 0.12),
        wide ? P(0.14, -1.1, 0.62, 1.05, -0.3, 0.06) : P(0, -1.1, 1.3, 1.05, -0.3, 0.12),
        out,
      );
      const mExplode = smooth(0.24, 0.46, p) * (1 - smooth(0.5, 0.64, p));
      const q = clamp01((p - 0.64) / 0.3);
      const mPress = q > 0 && q < 1 ? 0.5 - 0.5 * Math.cos(q * Math.PI * 2 * 3) : 0;
      const spin = p * 1.1;
      const macroPose = wide
        ? P(0.17, -0.03, 0.34 - mExplode * 0.17, 0.42 + mExplode * 0.1, -0.75 + spin, 0.04, MACRO_CENTER.clone().setY(1.25 + mExplode * 1.3))
        : P(0, -0.15, 0.2 - mExplode * 0.085, 0.45 + mExplode * 0.1, -0.75 + spin, 0.04, MACRO_CENTER.clone().setY(1.25 + mExplode * 1.3));
      return base({ kb: kbPose, macro: macroPose, handoff: smooth(0.0, 0.22, p), mExplode, mPress, bg: '#fbe6de', shadow: 1 - out });
    },
    layers: (p) => {
      const e = smooth(0.06, 0.4, p) * (1 - smooth(0.6, 0.8, p));
      const spin = easeInOut(smooth(0.6, 0.9, p)) * Math.PI * 2;
      const f = CENTER.clone().setY(0.9 + 4.3 * e);
      const kbPose = wide
        ? P(-0.06 + e * 0.0, -0.03, 0.56 - e * 0.12, 0.6 - e * 0.2, -0.62 + e * 0.1 + spin, 0, f)
        : P(0, 0.08 - e * 0.04, 1.05 - e * 0.3, 0.72 - e * 0.22, -0.5 + spin, 0, f);
      return base({ kb: kbPose, explode: e, colorway: p > 0.78 ? 1 : 0, bg: '#ebeced' });
    },
    colors: (p) => {
      const idx = COLOR_ORDER[Math.min(5, Math.floor(p * 6))];
      const kbPose = wide ? P(0, -0.06, 0.55, 0.55, -0.62 + p * 1.0, 0.05) : P(0, -0.04, 1.12, 0.66, -0.4 + p * 0.6, 0.22);
      return base({ kb: kbPose, colorway: idx, bg: COLORWAYS[idx].bg });
    },
    details: (p) => {
      const frames = wide
        ? [
            P(0.2, 0.02, 5.2, 0.62, -0.55, 0.06, FOCUS.knob),
            P(0.2, 0.0, 4.2, 1.02, -0.28, -0.12, FOCUS.legend),
            P(0.18, -0.02, 2.6, 0.42, 0.7, 0.04, FOCUS.corner),
            P(0.14, 0.02, 0.62, -1.08, 0.22, Math.PI, FOCUS.under),
          ]
        : [
            P(0, 0.14, 9, 0.62, -0.55, 0.06, FOCUS.knob),
            P(0, 0.14, 7, 1.02, -0.28, -0.12, FOCUS.legend),
            P(0.05, 0.14, 4.6, 0.42, 0.7, 0.04, FOCUS.corner),
            P(-0.1, 0.17, 0.95, -1.08, 0.22, Math.PI, FOCUS.under),
          ];
      const fp = Math.min(p * 4, 3.999);
      const i = Math.floor(fp);
      const t = easeInOut(smooth(0.62, 1, fp - i));
      const pose = i < 3 ? lerpPose(frames[i], frames[i + 1], t) : frames[3];
      const under = i >= 2 ? (i === 2 ? t : 1) : 0;
      return base({ kb: pose, colorway: 4, bg: '#f3efe8', shadow: (1 - under) * (i >= 2 ? 0 : 1), scrim: 1 });
    },
    final: () =>
      base({
        kb: wide ? P(0.13, -0.2, 0.56, 0.98, -0.1, -0.16) : P(0, -0.2, 1.22, 1.02, 0, -0.42),
        bg: '#ff6a1a',
        shadow: 0.9,
      }),
  };

  const targetAt = (y: number): { state: State; active: string; progress: Record<string, number> } => {
    const progress: Record<string, number> = {};
    let state: State | null = null;
    let active = sections[0]?.id ?? 'hero';
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      const span = Math.max(1, s.height - vh);
      progress[s.id] = clamp01((y - s.top) / span);
      if (state) continue;
      const pinnedEnd = s.top + s.height - vh;
      if (y < s.top) {
        // only the very first section can be above us
        state = scenes[s.id](0);
        active = s.id;
      } else if (y <= pinnedEnd) {
        state = scenes[s.id](progress[s.id]);
        active = s.id;
      } else if (i < sections.length - 1 && y < sections[i + 1].top) {
        const n = sections[i + 1];
        const t = easeInOut(clamp01((y - pinnedEnd) / Math.max(1, n.top - pinnedEnd)));
        state = lerpState(scenes[s.id](1), scenes[n.id](0), t);
        active = t < 0.5 ? s.id : n.id;
      }
    }
    return { state: state ?? scenes[sections[sections.length - 1].id](1), active, progress };
  };

  // ── live state ─────────────────────────────────────────────────────
  let cur = targetAt(scrollY).state;
  const bgColor = new THREE.Color(cur.bg);
  let pointerX = 0;
  let pointerY = 0;
  let px = 0;
  let py = 0;
  const onPointer = (e: PointerEvent) => {
    pointerX = e.clientX / vw - 0.5;
    pointerY = e.clientY / vh - 0.5;
  };
  addEventListener('pointermove', onPointer, { passive: true });

  const macroTap = { p: 0, v: 0, until: 0 };
  const tapMacro = () => {
    macroTap.until = performance.now() + 110;
  };


  // colorway "hop": a little lift and turn every time the collection changes
  let hop = 0;
  let lastColor = cur.colorway;
  kb.setColorway(cur.colorway, true);


  // ── overlays projected from 3D ─────────────────────────────────────
  const labelEls = new Map<LayerName, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-layer]').forEach((el) => labelEls.set(el.dataset.layer as LayerName, el));
  const leader = document.querySelector<SVGSVGElement>('[data-leaders]');
  const measureEl = document.querySelector<HTMLElement>('[data-measure]');
  const v = new THREE.Vector3();
  const toScreen = (p: THREE.Vector3) => {
    p.project(camera);
    return { x: (p.x * 0.5 + 0.5) * vw, y: (-p.y * 0.5 + 0.5) * vh };
  };

  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler(0, 0, 0, 'ZXY');
  const tmpS = new THREE.Vector3();
  const applyPose = (obj: THREE.Object3D, pose: Pose, scaleFromHeight: boolean, extraY = 0) => {
    const h = visH();
    const w = h * camera.aspect;
    const scale = scaleFromHeight ? pose.s * h : (pose.s * w) / OUT_W;
    tmpE.set(pose.rx, pose.ry, pose.rz, 'ZXY');
    tmpQ.setFromEuler(tmpE);
    tmpS.setScalar(scale);
    const offset = pose.f.clone().multiplyScalar(scale).applyQuaternion(tmpQ);
    obj.position.set(pose.x * w, (pose.y + extraY) * h, 0).sub(offset);
    obj.quaternion.copy(tmpQ);
    obj.scale.copy(tmpS);
  };

  const smoothState = (target: State, k: number) => {
    const kp = (a: Pose, b: Pose) => {
      a.x = lerp(a.x, b.x, k);
      a.y = lerp(a.y, b.y, k);
      a.s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), k));
      a.rx = lerp(a.rx, b.rx, k);
      a.ry = lerp(a.ry, b.ry, k);
      a.rz = lerp(a.rz, b.rz, k);
      a.f.lerp(b.f, k);
    };
    kp(cur.kb, target.kb);
    kp(cur.macro, target.macro);
    cur.explode = lerp(cur.explode, target.explode, k);
    cur.mExplode = lerp(cur.mExplode, target.mExplode, k);
    cur.mPress = lerp(cur.mPress, target.mPress, Math.min(1, k * 1.6));
    cur.handoff = lerp(cur.handoff, target.handoff, k);
    cur.shadow = lerp(cur.shadow, target.shadow, k);
    cur.colorway = target.colorway;
    cur.scrim = target.scrim;
    cur.bg = target.bg;
  };

  const mA = new THREE.Matrix4();
  const mB = new THREE.Matrix4();
  const pa = new THREE.Vector3();
  const pb = new THREE.Vector3();
  const qa = new THREE.Quaternion();
  const qb = new THREE.Quaternion();
  const sa = new THREE.Vector3();
  const sb = new THREE.Vector3();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?still renders every frame at its exact scroll pose (used for stills / previews)
  const still = /[?&]still/.test(location.search);

  let last = performance.now();
  let raf = 0;
  let first = true;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    const { state: target, active, progress } = targetAt(scrollY);
    smoothState(target, first || reduce || still ? 1 : 1 - Math.exp(-dt * 7));
    first = false;

    // section progress → CSS, so the DOM choreography follows the same clock
    for (const s of sections) {
      const p = progress[s.id];
      s.el.style.setProperty('--p', p.toFixed(4));
      const steps = Number(s.el.dataset.steps);
      if (steps) s.el.dataset.step = String(Math.min(steps - 1, Math.floor(p * steps)));
    }
    document.documentElement.dataset.active = active;

    if (cur.colorway !== lastColor) {
      lastColor = cur.colorway;
      kb.setColorway(cur.colorway, still);
      if (active === 'colors' && !still) hop = 1;
    }
    hop = Math.max(0, hop - dt * 1.6);
    const hopLift = Math.sin((1 - hop) * Math.PI) * hop * 0.05;

    // board pose + pointer parallax + idle float
    px = lerp(px, pointerX, 1 - Math.exp(-dt * 3));
    py = lerp(py, pointerY, 1 - Math.exp(-dt * 3));
    const pose = { ...cur.kb, f: cur.kb.f };
    const calm = active === 'details' ? 0.25 : 1;
    pose.ry += px * 0.12 * calm + (active === 'colors' ? (1 - hop) * hop * 0.9 : 0);
    pose.rx += py * 0.08 * calm;
    if (active === 'final') pose.rz += Math.sin(time * 0.35) * 0.04;
    const bob = reduce ? 0 : Math.sin(time * 1.1) * 0.006 * calm;
    applyPose(kb.root, pose, false, bob + hopLift);
    kb.assembly.position.y = 0;
    kb.setExplode(cur.explode);
    (kb.shadow.material as THREE.MeshBasicMaterial).opacity = 0.5 * cur.shadow;
    kb.shadow.visible = cur.shadow > 0.01;

    kb.update(dt, now);
    kb.root.updateMatrixWorld(true);

    // macro switch: lifted from the Esc slot, then posed on its own
    const h = cur.handoff;
    macro.root.visible = h > 0.002;
    macroLight.visible = macro.root.visible;
    esc.visible = !macro.root.visible;
    if (macro.root.visible) {
      mA.copy(kb.layers.caps.matrixWorld).multiply(new THREE.Matrix4().makeTranslation(escLocal.x, 0, escLocal.z));
      const tmp = new THREE.Object3D();
      applyPose(tmp, cur.macro, true);
      tmp.updateMatrix();
      mB.copy(tmp.matrix);
      mA.decompose(pa, qa, sa);
      mB.decompose(pb, qb, sb);
      const t = easeInOut(h);
      pa.lerp(pb, t);
      qa.slerp(qb, t);
      sa.lerp(sb, t);
      macro.root.matrix.compose(pa, qa, sa);
      macro.root.matrixWorldNeedsUpdate = true;
      // a tap adds a spring on top of the scroll-driven press
      const tgt = now < macroTap.until ? 1 : 0;
      macroTap.v += ((tgt - macroTap.p) * 700 - macroTap.v * 30) * dt;
      macroTap.p += macroTap.v * dt;
      macro.setExplode(cur.mExplode * h);
      macro.setPress(Math.min(1.08, Math.max(cur.mPress, macroTap.p)));
      macro.update();
    }

    // page tint follows the stage
    bgColor.lerp(new THREE.Color(cur.bg), still ? 1 : 1 - Math.exp(-dt * 6));
    const hex = '#' + bgColor.getHexString();
    document.body.style.backgroundColor = hex;
    document.documentElement.style.setProperty('--bg', hex);
    document.documentElement.style.setProperty('--scrim', cur.scrim.toFixed(3));

    // exploded-view labels
    if (active === 'layers' && leader) {
      const pl = progress.layers ?? 0;
      const vis = smooth(0.3, 0.4, pl) * (1 - smooth(0.54, 0.6, pl));
      const pts = LAYERS.map((name) => toScreen(kb.layerAnchor(name, v)));
      const colX = Math.max(...pts.map((p) => p.x)) + (wide ? 64 : 12);
      // labels keep a minimum rhythm, working down from the keycaps
      const gap = wide ? 62 : 34;
      const ys = pts.map((p) => p.y);
      for (let i = LAYERS.length - 2; i >= 0; i--) ys[i] = Math.max(ys[i], ys[i + 1] + gap);
      let d = '';
      LAYERS.forEach((name, i) => {
        const el = labelEls.get(name);
        if (!el) return;
        const p = pts[i];
        // phones get a static list (see CSS); only desktop follows the layers
        const lx = Math.min(colX, vw - 280);
        el.style.transform = wide ? `translate(${lx}px, ${ys[i]}px)` : '';
        el.style.opacity = String(vis);
        if (wide) {
          const mx = lx - 34;
          d += `M${p.x + 6} ${p.y}H${mx}L${mx + 12} ${ys[i]}H${lx - 10}`;
        }
      });
      leader.querySelector('path')!.setAttribute('d', d);
      leader.style.opacity = String(wide ? vis : 0);
    }

    // top-view dimensions in the form scene
    const formSec = sections.find((x) => x.id === 'form');
    if (measureEl && (active !== 'form' || !formSec)) measureEl.style.opacity = '0';
    if (active === 'form' && measureEl && formSec) {
      const pf = progress.form ?? 0;
      // wait until the board has landed in its top view, then fade out on schedule
      const arrived = smooth(formSec.top - vh * 0.02, formSec.top + vh * 0.06, scrollY);
      const vis = arrived * (1 - smooth(0.26, 0.38, pf));
      const y = 1.22;
      const tl = toScreen(kb.root.localToWorld(v.set(-OUT_W / 2, y, -OUT_D / 2)));
      const tr = toScreen(kb.root.localToWorld(v.set(OUT_W / 2, y, -OUT_D / 2)));
      const br = toScreen(kb.root.localToWorld(v.set(OUT_W / 2, y, OUT_D / 2)));
      measureEl.style.setProperty('--ax', `${tl.x}px`);
      measureEl.style.setProperty('--ay', `${tl.y}px`);
      measureEl.style.setProperty('--bx', `${tr.x}px`);
      measureEl.style.setProperty('--by', `${tr.y}px`);
      measureEl.style.setProperty('--cx', `${br.x}px`);
      measureEl.style.setProperty('--cy', `${br.y}px`);
      measureEl.style.opacity = String(vis);
    }

    renderer.render(scene, camera);
    if (!canvas.classList.contains('ready')) canvas.classList.add('ready');
  };
  raf = requestAnimationFrame(frame);

  document.fonts?.ready.then(() => kb.redrawLegends());

  return {
    tapMacro,
    scrollToColor: (i: number) => {
      const s = sections.find((x) => x.id === 'colors');
      if (!s) return;
      const slot = COLOR_ORDER.indexOf(i);
      const span = s.height - vh;
      scrollTo({ top: s.top + span * ((slot + 0.5) / 6), behavior: 'smooth' });
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('resize', measure);
      removeEventListener('pointermove', onPointer);
      renderer.dispose();
    },
  };
}
