import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { objectVertex, objectFragment, dustVertex, dustFragment, finalPass } from './shaders';

export interface SceneState {
  stretch: number;
  pressure: number;
  cobalt: number;
  ghost: number;
  fracture: number;
  amber: number;
  white: number;
  dissolve: number;
  light: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  mouse: THREE.Vector2; // -1..1
  mouseStr: number;
}

export function createScene(canvas: HTMLCanvasElement, opts: { mobile: boolean; reduced: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !opts.mobile, powerPreference: 'high-performance', alpha: false });
  renderer.setClearColor(0x000000, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const maxDpr = opts.mobile ? 1.35 : 1.75;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0, 7);

  // cells for the fracture: fixed, roughly even directions
  const cells = [
    [0.15, 0.95, 0.2], [0.9, 0.25, 0.3], [-0.85, 0.35, 0.35], [0.35, -0.85, 0.4],
    [-0.4, -0.75, -0.5], [0.55, 0.1, -0.85], [-0.55, 0.2, -0.8],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());

  const shared = {
    uTime: { value: 0 },
    uStretch: { value: 0 },
    uPressure: { value: 0 },
    uFracture: { value: 0 },
    uBreath: { value: 1 },
    uMouse: { value: new THREE.Vector3(0, 0, 1) },
    uMouseStr: { value: 0 },
    uCells: { value: cells },
    uLightDir: { value: new THREE.Vector3(0.6, 0.7, 0.5).normalize() },
    uLight: { value: 0 },
    uCobalt: { value: 0 },
    uWhite: { value: 0 },
    uAmber: { value: 0 },
    uDissolve: { value: 1 },
    uGhost: { value: 0 },
  };

  let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, opts.mobile ? 40 : 88);
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo);

  const mat = new THREE.ShaderMaterial({
    uniforms: shared, vertexShader: objectVertex, fragmentShader: objectFragment, side: THREE.DoubleSide,
  });
  const object = new THREE.Mesh(geo, mat);
  // the shader displaces vertices far outside the unit sphere
  object.frustumCulled = false;

  const ghostUniforms = { ...shared, uTime: { value: 0 }, uMouseStr: { value: 0 } };
  const ghostMat = new THREE.ShaderMaterial({
    uniforms: ghostUniforms, vertexShader: objectVertex, fragmentShader: objectFragment,
    defines: { GHOST: '' }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const ghost = new THREE.Mesh(geo, ghostMat);
  ghost.frustumCulled = false;
  ghost.scale.setScalar(1.05);

  const group = new THREE.Group();
  group.add(object, ghost);
  scene.add(group);

  // inner light, visible through the fracture
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,240,215,1)');
    grd.addColorStop(0.25, 'rgba(255,200,140,0.45)');
    grd.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }));
  glow.scale.setScalar(1.6);
  group.add(glow);

  // dust
  const count = opts.mobile ? 220 : 640;
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    seed[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dustUniforms = { uTime: shared.uTime, uPixel: { value: 2 }, uLight: shared.uLight };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustUniforms, vertexShader: dustVertex, fragmentShader: dustFragment,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(dust);

  // post
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.42, 0.65, 0.78);
  composer.addPass(bloom);
  const final = new ShaderPass(finalPass);
  composer.addPass(final);
  composer.addPass(new OutputPass());

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.resolution.set(w * 0.5, h * 0.5);
    camera.aspect = w / h;
    // keep the object a similar visual size on narrow screens
    camera.position.z = 7 * (camera.aspect < 0.9 ? 1 + (0.9 - camera.aspect) * 1.5 : 1);
    camera.updateProjectionMatrix();
    dustUniforms.uPixel.value = dpr * (opts.mobile ? 2.2 : 2.6);
  };
  resize();

  const inv = new THREE.Quaternion();
  const mdir = new THREE.Vector3();
  let rotY = 0;
  const ghostLag = { x: 0, y: 0 };

  function render(t: number, dt: number, s: SceneState) {
    const speed = opts.reduced ? 0.3 : 1;
    shared.uTime.value = t * speed;
    ghostUniforms.uTime.value = (t - 0.9) * speed;
    shared.uStretch.value = s.stretch;
    shared.uPressure.value = s.pressure;
    shared.uFracture.value = s.fracture;
    shared.uCobalt.value = s.cobalt;
    shared.uWhite.value = s.white;
    shared.uAmber.value = s.amber;
    shared.uDissolve.value = s.dissolve;
    shared.uLight.value = s.light;
    shared.uGhost.value = s.ghost;
    shared.uMouseStr.value = s.mouseStr;
    ghostUniforms.uMouseStr.value = s.mouseStr * 0.6;

    // light follows the observer, slowly
    const L = shared.uLightDir.value;
    L.set(0.55 + s.mouse.x * 0.5, 0.65 + s.mouse.y * 0.35, 0.55).normalize();

    rotY += dt * 0.07 * speed;
    const k = 1 - Math.exp(-dt * 2.2);
    group.rotation.y += (rotY + s.mouse.x * 0.35 - group.rotation.y) * k;
    group.rotation.x += (-s.mouse.y * 0.22 + s.pressure * 0.15 - group.rotation.x) * k;
    group.position.x += (s.offsetX - group.position.x) * (1 - Math.exp(-dt * 1.6));
    group.position.y += (s.offsetY + Math.sin(t * 0.4 * speed) * 0.04 - group.position.y) * (1 - Math.exp(-dt * 1.6));
    group.scale.setScalar(s.scale);

    // ghost lags behind the object
    ghostLag.x += (s.mouse.x - ghostLag.x) * (1 - Math.exp(-dt * 0.8));
    ghostLag.y += (s.mouse.y - ghostLag.y) * (1 - Math.exp(-dt * 0.8));
    ghost.rotation.set(-(ghostLag.y - s.mouse.y) * 0.4, (ghostLag.x - s.mouse.x) * 0.5 - 0.08, 0);
    ghost.position.x = -0.06 - (s.mouse.x - ghostLag.x) * 0.3;
    ghost.visible = s.ghost > 0.003;

    // mouse direction in object space
    mdir.set(s.mouse.x * 1.4, s.mouse.y * 1.1, 0.75).normalize();
    inv.copy(group.quaternion).invert();
    shared.uMouse.value.copy(mdir.applyQuaternion(inv));

    glow.material.opacity = Math.min(0.5, s.fracture * 0.7) * s.light;
    glow.scale.setScalar(0.9 + s.fracture * 0.8);
    glow.visible = s.fracture > 0.01;

    camera.position.x += (s.mouse.x * 0.08 - camera.position.x) * k;
    camera.position.y += (s.mouse.y * 0.06 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);

    bloom.strength = 0.3 + s.fracture * 0.25 + s.white * 0.05;
    final.uniforms.uTime.value = opts.reduced ? 0 : t;
    final.uniforms.uAberration.value = 0.0009 + s.fracture * 0.0022;
    composer.render(dt);
  }

  return { render, resize, objectRotation: group.rotation, dispose: () => renderer.dispose() };
}
