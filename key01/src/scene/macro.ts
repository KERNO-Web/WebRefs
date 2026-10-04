import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A single switch with its keycap, built in the same local units as the board
 * (origin under the key centre) so it can lift straight out of the Esc slot.
 */
export class MacroSwitch {
  readonly root = new THREE.Group();
  readonly parts: { cap: THREE.Object3D; stem: THREE.Group; spring: THREE.Mesh; top: THREE.Mesh; low: THREE.Group };
  private explode = 0;
  private press = 0;

  constructor(cap: THREE.Mesh, stemMat: THREE.Material) {
    const capClone = cap.clone();
    capClone.position.set(0, 0, 0);
    const capHolder = new THREE.Group();
    capHolder.add(capClone);
    capHolder.position.y = 1.3;

    const low = new THREE.Group();
    const lowBody = new THREE.Mesh(
      new RoundedBoxGeometry(0.62, 0.24, 0.62, 3, 0.05),
      new THREE.MeshPhysicalMaterial({ color: '#f4f1ea', roughness: 0.42, clearcoat: 0.3 }),
    );
    lowBody.position.y = 0.84;
    const pinMat = new THREE.MeshStandardMaterial({ color: '#d9b25a', metalness: 1, roughness: 0.25 });
    for (const [x, z] of [[-0.16, -0.1], [0.12, -0.18]]) {
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 12), pinMat);
      pin.position.set(x, 0.64, z);
      low.add(pin);
    }
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 24), lowBody.material);
    post.position.y = 0.66;
    low.add(lowBody, post);

    const top = new THREE.Mesh(
      new RoundedBoxGeometry(0.6, 0.22, 0.6, 3, 0.06),
      new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.42, clearcoat: 1, depthWrite: false }),
    );
    top.position.y = 1.07;

    // the spring: a helix swept into a thin steel tube
    const turns = 7;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= turns * 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.12, (i / (turns * 32)) * 0.36, Math.sin(a) * 0.12));
    }
    const spring = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 48, 0.014, 8),
      new THREE.MeshStandardMaterial({ color: '#e9e9ee', metalness: 1, roughness: 0.18 }),
    );
    spring.position.y = 0.8;

    const stem = new THREE.Group();
    const cross = new THREE.Mesh(mergeGeometries([new THREE.BoxGeometry(0.2, 0.2, 0.065), new THREE.BoxGeometry(0.065, 0.2, 0.2)]), stemMat);
    cross.position.y = 1.24;
    const slider = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.2, 0.34, 2, 0.03), stemMat);
    slider.position.y = 1.08;
    stem.add(cross, slider);

    for (const o of [lowBody, top, spring, cross, slider, capClone]) o.castShadow = true;
    this.root.add(low, spring, top, stem, capHolder);
    this.parts = { cap: capHolder, stem, spring, top, low };
  }

  setExplode(e: number) {
    this.explode = e;
  }

  setPress(p: number) {
    this.press = p;
  }

  update() {
    const e = this.explode;
    const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
    const lift = (i: number) => ease(THREE.MathUtils.clamp(e * 1.4 - i * 0.1, 0, 1));
    const travel = this.press * 0.2;
    this.parts.spring.position.y = 0.8 + lift(1) * 0.45;
    this.parts.spring.scale.y = 1 - (this.press * 0.45) * (1 - lift(1));
    this.parts.top.position.y = 1.07 + lift(2) * 1.05;
    this.parts.stem.position.y = lift(3) * 1.75 - travel;
    this.parts.cap.position.y = 1.3 + lift(4) * 2.55 - travel;
  }
}
