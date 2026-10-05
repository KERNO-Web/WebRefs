import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COLORWAYS, type Colorway } from './colorways';
import { FIELD_D, FIELD_W, KEYS, KNOB, type KeyRole } from './layout';
import { badgeTexture, knurlTexture, legendAtlas, pcbTexture, plateAlpha, shadowTexture } from './textures';

export const BEZEL = 0.55;
export const OUT_W = FIELD_W + BEZEL * 2;
export const OUT_D = FIELD_D + BEZEL * 2;
const CASE_H = 1.18;
const SLOPE = Math.tan((4 * Math.PI) / 180);
const CAP_Y = 1.3;

export const LAYERS = ['case', 'foam', 'pcb', 'plate', 'switches', 'caps'] as const;
export type LayerName = (typeof LAYERS)[number];
const LIFT: Record<LayerName, number> = { case: 0, foam: 1.5, pcb: 3.0, plate: 4.5, switches: 6.1, caps: 8.0 };
const LAYER_Y: Record<LayerName, number> = { case: 0.75, foam: 0.42, pcb: 0.64, plate: 0.95, switches: 1.05, caps: 1.5 };

function roundedRect(w: number, d: number, r: number) {
  // true circular corners, so the case stays smooth in the macro shots
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -d / 2;
  const x1 = w / 2;
  const y1 = d / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Extrude a shape upward (+y) with a soft chamfer. */
function extrudeUp(shape: THREE.Shape, h: number, bevel: number, segs = 4, curveSegments = 10) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: segs,
    curveSegments,
  });
  g.rotateX(-Math.PI / 2);
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox!.min.y, 0);
  return g;
}

/** Keycap: a tapered, chamfered extrusion. Group 0 = top/bottom, group 1 = walls. */
function keycapGeometry(w: number) {
  const sw = w - 0.07;
  const sd = 0.93;
  const g = extrudeUp(roundedRect(sw, sd, 0.12), 0.46, 0.07, 4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const top = 0.46;
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getY(i) / top;
    const ix = 0.085 * t;
    const iz = 0.1 * t;
    pos.setX(i, pos.getX(i) * ((sw / 2 - ix) / (sw / 2)));
    // a touch more taper at the back, like a sculpted profile
    const z = pos.getZ(i);
    pos.setZ(i, z * ((sd / 2 - iz) / (sd / 2)) + 0.02 * t);
  }
  g.computeVertexNormals();
  return g;
}

function legendMaterial(atlas: THREE.Texture) {
  const m = new THREE.MeshPhysicalMaterial({ roughness: 0.5, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: 0.75 });
  const legend = new THREE.Color('#ffffff');
  m.userData.legend = legend;
  // keep the PHYSICAL/STANDARD defines, just switch on the uv varying
  const withDefines = m as unknown as { defines: Record<string, string> };
  withDefines.defines = { ...(withDefines.defines ?? {}), USE_UV: '' };
  m.onBeforeCompile = (s) => {
    s.uniforms.legendMap = { value: atlas };
    s.uniforms.legendColor = { value: legend };
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D legendMap;\nuniform vec3 legendColor;')
      .replace(
        '#include <map_fragment>',
        '#include <map_fragment>\nfloat la = texture2D(legendMap, vUv).a;\ndiffuseColor.rgb = mix(diffuseColor.rgb, legendColor, la);',
      );
  };
  m.customProgramCacheKey = () => 'key01-legend';
  return m;
}

interface Tween {
  mat: THREE.Material & { color: THREE.Color };
  pick: (c: Colorway) => string;
  target: THREE.Color;
}

export class Keyboard {
  readonly root = new THREE.Group();
  /** everything that floats above the contact shadow */
  readonly assembly = new THREE.Group();
  readonly inner = new THREE.Group();
  readonly layers = {} as Record<LayerName, THREE.Group>;
  readonly keyMeshes: THREE.Mesh[] = [];
  readonly knob = new THREE.Group();
  readonly shadow: THREE.Mesh;
  readonly stems: THREE.InstancedMesh;
  private readonly press = KEYS.map(() => ({ p: 0, v: 0, until: 0 }));
  private readonly tweens: Tween[] = [];
  private readonly caseMat: THREE.MeshPhysicalMaterial;
  private readonly legendMats: Record<KeyRole, THREE.MeshPhysicalMaterial>;
  private readonly badgeMat: THREE.MeshStandardMaterial;
  private metalTarget = 0.25;
  private explode = 0;
  private readonly legends: { redraw: () => void };
  colorway = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    const maxTex = renderer.capabilities.maxTextureSize;
    const small = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
    const atlas = legendAtlas(Math.min(maxTex, small ? 2560 : 4096));
    this.legends = atlas;
    atlas.tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    this.root.add(this.assembly);
    this.assembly.add(this.inner);
    this.inner.rotation.x = Math.atan(SLOPE);
    for (const name of LAYERS) {
      const g = new THREE.Group();
      g.name = name;
      this.layers[name] = g;
      (name === 'case' ? this.assembly : this.inner).add(g);
    }

    const tween = <M extends THREE.Material & { color: THREE.Color }>(mat: M, pick: (c: Colorway) => string) => {
      this.tweens.push({ mat, pick, target: new THREE.Color(pick(COLORWAYS[0])) });
      mat.color.set(pick(COLORWAYS[0]));
      return mat;
    };

    // ── case: wedge-shaped frame + floor ───────────────────────────
    this.caseMat = tween(
      new THREE.MeshPhysicalMaterial({ roughness: 0.34, metalness: 0.25, clearcoat: 0.35, clearcoatRoughness: 0.25 }),
      (c) => c.caseColor,
    );
    const outer = roundedRect(OUT_W, OUT_D, 0.42);
    const frameShape = roundedRect(OUT_W, OUT_D, 0.42);
    frameShape.holes.push(roundedRect(FIELD_W + 0.16, FIELD_D + 0.16, 0.12) as unknown as THREE.Path);
    const frame = extrudeUp(frameShape, CASE_H, 0.08, 10, 40);
    const floor = extrudeUp(outer, 0.3, 0.06, 6, 40);
    for (const g of [frame, floor]) {
      const p = g.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + -SLOPE * p.getZ(i) * (p.getY(i) / CASE_H));
      g.computeVertexNormals();
    }
    const caseMesh = new THREE.Mesh(mergeGeometries([frame, floor]), this.caseMat);
    caseMesh.castShadow = caseMesh.receiveShadow = true;
    this.layers.case.add(caseMesh);

    // USB-C port on the back wall, rubber feet and an engraved badge underneath
    const port = new THREE.Mesh(
      new RoundedBoxGeometry(0.5, 0.17, 0.1, 3, 0.07),
      new THREE.MeshStandardMaterial({ color: '#2a2a2e', roughness: 0.5 }),
    );
    port.position.set(-5.2, 0.62 + SLOPE * (OUT_D / 2) * 0.5, -OUT_D / 2 + 0.03);
    this.layers.case.add(port);
    const footMat = new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.9 });
    for (const [x, z, w] of [[-7.4, -3.2, 2.6], [7.4, -3.2, 2.6], [-7.4, 3.25, 1.2], [7.4, 3.25, 1.2]]) {
      const foot = new THREE.Mesh(new RoundedBoxGeometry(w, 0.08, 0.5, 2, 0.04), footMat);
      foot.position.set(x, -0.03, z);
      this.layers.case.add(foot);
    }
    this.badgeMat = new THREE.MeshStandardMaterial({
      map: badgeTexture(),
      transparent: true,
      roughness: 0.6,
      metalness: 0.2,
      depthWrite: false,
    });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 2.0), this.badgeMat);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0, -0.004, 0.2);
    this.layers.case.add(badge);

    // ── acoustic foam ──────────────────────────────────────────────
    const foamMat = tween(new THREE.MeshStandardMaterial({ roughness: 1 }), (c) => c.foam);
    const foam = new THREE.Mesh(new RoundedBoxGeometry(FIELD_W + 0.1, 0.3, FIELD_D + 0.1, 3, 0.06), foamMat);
    foam.position.y = 0.42;
    foam.castShadow = foam.receiveShadow = true;
    this.layers.foam.add(foam);

    // ── PCB ────────────────────────────────────────────────────────
    const pcbMat = tween(new THREE.MeshStandardMaterial({ map: pcbTexture(FIELD_W + 0.1, FIELD_D + 0.1), roughness: 0.45, metalness: 0.1 }), (c) => c.pcb);
    const pcbEdge = tween(new THREE.MeshStandardMaterial({ roughness: 0.5 }), (c) => c.pcb);
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(FIELD_W + 0.1, 0.06, FIELD_D + 0.1), [pcbEdge, pcbEdge, pcbMat, pcbEdge, pcbEdge, pcbEdge]);
    pcb.position.y = 0.64;
    pcb.castShadow = pcb.receiveShadow = true;
    this.layers.pcb.add(pcb);

    // ── plate ──────────────────────────────────────────────────────
    const plateMat = tween(
      new THREE.MeshPhysicalMaterial({
        alphaMap: plateAlpha(FIELD_W + 0.1, FIELD_D + 0.1),
        alphaTest: 0.5,
        side: THREE.DoubleSide,
        metalness: 0.55,
        roughness: 0.3,
        clearcoat: 0.3,
      }),
      (c) => c.plate,
    );
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_W + 0.1, FIELD_D + 0.1), plateMat);
    plate.rotation.x = -Math.PI / 2;
    plate.position.y = 0.95;
    plate.castShadow = plate.receiveShadow = true;
    this.layers.plate.add(plate);

    // ── switches (instanced) ───────────────────────────────────────
    const n = KEYS.length;
    const housingLow = new THREE.InstancedMesh(
      new RoundedBoxGeometry(0.62, 0.22, 0.62, 2, 0.04),
      new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.5 }),
      n,
    );
    const housingTop = new THREE.InstancedMesh(
      new RoundedBoxGeometry(0.6, 0.2, 0.6, 2, 0.05),
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.12, transparent: true, opacity: 0.55, clearcoat: 1 }),
      n,
    );
    const stemGeo = mergeGeometries([new THREE.BoxGeometry(0.2, 0.2, 0.065), new THREE.BoxGeometry(0.065, 0.2, 0.2)]);
    const stemMat = tween(new THREE.MeshStandardMaterial({ roughness: 0.35 }), (c) => c.stem);
    this.stems = new THREE.InstancedMesh(stemGeo, stemMat, n);
    const m = new THREE.Matrix4();
    KEYS.forEach((k, i) => {
      const x = k.x + k.w / 2 - FIELD_W / 2;
      const z = k.z + 0.5 - FIELD_D / 2;
      housingLow.setMatrixAt(i, m.makeTranslation(x, 0.84, z));
      housingTop.setMatrixAt(i, m.makeTranslation(x, 1.06, z));
      this.stems.setMatrixAt(i, m.makeTranslation(x, 1.24, z));
    });
    for (const im of [housingLow, housingTop, this.stems]) {
      im.castShadow = true;
      this.layers.switches.add(im);
    }

    // ── keycaps ────────────────────────────────────────────────────
    this.legendMats = {
      alpha: legendMaterial(atlas.tex),
      mod: legendMaterial(atlas.tex),
      accent: legendMaterial(atlas.tex),
    };
    const sideMats = {
      alpha: new THREE.MeshPhysicalMaterial({ roughness: 0.55, envMapIntensity: 0.75 }),
      mod: new THREE.MeshPhysicalMaterial({ roughness: 0.55, envMapIntensity: 0.75 }),
      accent: new THREE.MeshPhysicalMaterial({ roughness: 0.55, envMapIntensity: 0.75 }),
    };
    for (const role of ['alpha', 'mod', 'accent'] as const) {
      tween(this.legendMats[role], (c) => c[role]);
      tween(sideMats[role], (c) => c[role]);
    }
    const capCache = new Map<number, THREE.ExtrudeGeometry>();
    for (const k of KEYS) {
      if (!capCache.has(k.w)) capCache.set(k.w, keycapGeometry(k.w));
      const g = capCache.get(k.w)!.clone();
      const cx = k.x + k.w / 2;
      const cz = k.z + 0.5;
      const pos = g.attributes.position;
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (cx + pos.getX(i)) / FIELD_W, 1 - (cz + pos.getZ(i)) / FIELD_D);
      }
      const mesh = new THREE.Mesh(g, [this.legendMats[k.role], sideMats[k.role]]);
      mesh.position.set(cx - FIELD_W / 2, CAP_Y, cz - FIELD_D / 2);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.key = k;
      this.keyMeshes.push(mesh);
      this.layers.caps.add(mesh);
    }

    // ── knob ───────────────────────────────────────────────────────
    const knobMat = tween(
      new THREE.MeshPhysicalMaterial({ metalness: 0.85, roughness: 0.28, clearcoat: 0.4 }),
      (c) => c.accent,
    );
    const body = new THREE.CylinderGeometry(0.41, 0.42, 0.8, 128, 1);
    knobMat.bumpMap = knurlTexture();
    knobMat.bumpScale = 4;
    const knobCap = tween(new THREE.MeshPhysicalMaterial({ metalness: 0.85, roughness: 0.28, clearcoat: 0.4 }), (c) => c.accent);
    const knobBody = new THREE.Mesh(body, [knobMat, knobCap, knobCap]);
    knobBody.castShadow = true;
    const capTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.395, 0.06, 96),
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0.9, roughness: 0.18 }),
    );
    capTop.position.y = 0.42;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 24), new THREE.MeshStandardMaterial({ color: '#16161a' }));
    dot.position.set(0, 0.455, -0.24);
    this.knob.add(knobBody, capTop, dot);
    this.knob.position.set(KNOB.x - FIELD_W / 2, CAP_Y + 0.3, KNOB.z - FIELD_D / 2);
    this.layers.caps.add(this.knob);

    // ── contact shadow ─────────────────────────────────────────────
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(OUT_W / 0.72, OUT_D / 0.48),
      new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.5, color: '#2b2620' }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -0.06;
    this.shadow.renderOrder = -1;
    this.root.add(this.shadow);

    this.setColorway(0, true);
  }

  redrawLegends() {
    this.legends.redraw();
  }

  setColorway(i: number, instant = false) {
    const idx = ((i % COLORWAYS.length) + COLORWAYS.length) % COLORWAYS.length;
    this.colorway = idx;
    const c = COLORWAYS[idx];
    for (const t of this.tweens) {
      t.target.set(t.pick(c));
      if (instant) t.mat.color.copy(t.target);
    }
    this.legendMats.alpha.userData.target = new THREE.Color(c.legendAlpha);
    this.legendMats.mod.userData.target = new THREE.Color(c.legendMod);
    this.legendMats.accent.userData.target = new THREE.Color(c.legendAccent);
    this.metalTarget = c.caseMetal;
    if (instant) {
      for (const role of ['alpha', 'mod', 'accent'] as const) {
        (this.legendMats[role].userData.legend as THREE.Color).copy(this.legendMats[role].userData.target);
      }
      this.caseMat.metalness = c.caseMetal;
    }
  }

  setExplode(e: number) {
    this.explode = e;
  }

  pressKey(index: number, hold = 0.09) {
    const s = this.press[index];
    if (!s) return;
    s.until = performance.now() + hold * 1000;
  }

  /** Layer anchor at the right edge of a layer, in world space. */
  layerAnchor(name: LayerName, out: THREE.Vector3) {
    const x = name === 'case' ? OUT_W / 2 : FIELD_W / 2 + 0.05;
    out.set(x, LAYER_Y[name], 0);
    return this.layers[name].localToWorld(out);
  }

  update(dt: number, now: number) {
    const k = 1 - Math.exp(-dt * 5);
    for (const t of this.tweens) t.mat.color.lerp(t.target, k);
    for (const role of ['alpha', 'mod', 'accent'] as const) {
      const mat = this.legendMats[role];
      if (mat.userData.target) (mat.userData.legend as THREE.Color).lerp(mat.userData.target, k);
    }
    this.caseMat.metalness += (this.metalTarget - this.caseMat.metalness) * k;
    this.badgeMat.color.copy(this.caseMat.color).multiplyScalar(0.6);

    // staggered lift from the top down: the keycaps leave first and every
    // layer starts after the one above it, so a layer can never pass through
    // its neighbour (it also starts later and travels less far)
    const e = this.explode;
    const top = LAYERS.length - 1;
    LAYERS.forEach((name, i) => {
      const local = THREE.MathUtils.clamp(e * 1.6 - (top - i) * 0.12, 0, 1);
      const eased = local < 0.5 ? 4 * local ** 3 : 1 - (-2 * local + 2) ** 3 / 2;
      this.layers[name].position.y = LIFT[name] * eased;
    });

    // key presses: a stiff spring so every press has a little rebound
    const m = new THREE.Matrix4();
    let dirty = false;
    this.press.forEach((s, i) => {
      const target = now < s.until ? 1 : 0;
      if (target === 0 && s.p === 0 && s.v === 0) return;
      const acc = (target - s.p) * 900 - s.v * 38;
      s.v += acc * dt;
      s.p += s.v * dt;
      if (target === 0 && Math.abs(s.p) < 0.002 && Math.abs(s.v) < 0.02) {
        s.p = 0;
        s.v = 0;
      }
      const depth = THREE.MathUtils.clamp(s.p, -0.25, 1.1) * 0.17;
      const mesh = this.keyMeshes[i];
      mesh.position.y = CAP_Y - depth;
      const key = KEYS[i];
      this.stems.setMatrixAt(i, m.makeTranslation(key.x + key.w / 2 - FIELD_W / 2, 1.24 - depth, key.z + 0.5 - FIELD_D / 2));
      dirty = true;
    });
    if (dirty) this.stems.instanceMatrix.needsUpdate = true;
  }
}
