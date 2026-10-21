// The clot behind the name: a violet mass of light that slowly folds into
// itself, seen through film grain. One fragment shader, no textures, no video.
// It leans a little toward the cursor, sleeps while the hero is off screen and
// stays a single still frame under reduced motion. Without WebGL the CSS light
// fields in ambient.css remain as they were.

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

const FRAG = `
precision highp float;
uniform vec2 r;
uniform float t;
uniform vec2 m;

// Dave Hoskins' hash: no sin(), no stripes at large coordinates
float h(vec2 p) {
  vec3 q = fract(p.xyx * .1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  // quintic fade: the cubic one leaves straight creases that read as hard facets
  f = f * f * f * (f * (f * 6. - 15.) + 10.);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + 1.), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0., a = .5;
  for (int i = 0; i < 5; i++) {
    v += a * n(p);
    // rotate every octave so the noise grid never shows as square corners
    p = mat2(.8, -.6, .6, .8) * p * 2.03 + vec2(1.7, 9.2);
    a *= .5;
  }
  return v;
}

void main() {
  // sized by the shorter side, so a phone gets a clot, not a flood; on narrow
  // screens the lobes also gather toward the middle
  vec2 p = (gl_FragCoord.xy - .5 * r) / min(r.y, r.x / 1.1);
  float k = clamp(r.x / r.y / 1.6, .35, 1.);
  // on a phone the name sits mid-screen with text under it: the clot rises into
  // the empty top half, so the name overlaps its lower edge and the text stays on dark
  float lift = (1. - k) / .65 * .3;
  float T = t * .05;

  // the space itself is folded, so the edge of the mass never holds a shape
  vec2 q = vec2(fbm(p * 1.6 + T), fbm(p * 1.6 - T + 3.1));
  vec2 w = p + mix(.4, .6, k) * (q - .5);

  // three lobes on unsynchronised paths; the third one follows the cursor
  vec2 c1 = vec2(-.34 * k + .12 * sin(t * .11), -.13 + lift + .08 * cos(t * .13));
  vec2 c2 = vec2(-.08 * k + .16 * cos(t * .07), .03 + lift + .07 * sin(t * .09));
  vec2 c3 = mix(vec2(-.24 * k, -.3 + lift), m, .3);
  float f = exp(-dot(w - c1, w - c1) * 11.)
          + .7 * exp(-dot(w - c2, w - c2) * 15.)
          + .5 * exp(-dot(w - c3, w - c3) * 17.);

  float folds = fbm(w * 3.4 - T * 2.) - .5;
  float v = f + .45 * folds;
  float body = smoothstep(.25, 1.3, v);
  float rim = smoothstep(.6, .78, v) - smoothstep(.78, 1.1, v);

  vec3 bg = vec3(.071, .071, .078);
  vec3 deep = vec3(.12, .03, .36);
  vec3 vio = vec3(.42, .28, 1.);
  vec3 lil = vec3(.82, .74, 1.);
  vec3 col = mix(bg, deep, smoothstep(.02, .45, f) * .9);
  col = mix(col, vio, body * .9);
  col += lil * (rim * .2 + smoothstep(1.1, 1.7, v) * .16);

  // film grain, re-rolled 24 times a second, heavier where there is light
  float g = h(gl_FragCoord.xy + mod(floor(t * 24.), 97.) * vec2(17.31, 41.7)) - .5;
  col += g * (.045 + .11 * body);

  gl_FragColor = vec4(col, 1.);
}`;

export function startHeroFx() {
  const box = document.querySelector<HTMLElement>('.hero-fx');
  const canvas = box?.querySelector('canvas');
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!box || !canvas || !gl) return;

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r');
  const uT = gl.getUniformLocation(prog, 't');
  const uM = gl.getUniformLocation(prog, 'm');

  // about 1.6 million pixels at most: a desktop gets one canvas pixel per CSS
  // pixel (coarse film grain, a light shader), a phone gets its retina density,
  // otherwise its 3× screen would blow every grain up into a visible square
  const size = () => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    const scale = Math.max(1, Math.min(devicePixelRatio, Math.sqrt(1.6e6 / Math.max(1, w * h))));
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uR, canvas.width, canvas.height);
  };
  size();
  new ResizeObserver(size).observe(box);

  // cursor in the shader's space: centred, y up, shorter side = 1
  // until the cursor moves it rests where the shader's third lobe rests
  const k = Math.min(Math.max(box.clientWidth / box.clientHeight / 1.6, 0.35), 1);
  const aim = { x: -0.24 * k, y: -0.3 + ((1 - k) / 0.65) * 0.3 };
  const cur = { ...aim };
  addEventListener(
    'pointermove',
    (e) => {
      const b = box.getBoundingClientRect();
      const unit = Math.min(b.height, b.width / 1.1);
      aim.x = (e.clientX - b.left - b.width / 2) / unit;
      aim.y = (b.top + b.height / 2 - e.clientY) / unit;
    },
    { passive: true },
  );

  // a random start, so the mass is never caught in the same pose twice
  const t0 = performance.now() - Math.random() * 120_000;
  const draw = (now: number) => {
    cur.x += (aim.x - cur.x) * 0.02;
    cur.y += (aim.y - cur.y) * 0.02;
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uM, cur.x, cur.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  document.documentElement.classList.add('has-fx');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(performance.now());
    return;
  }

  let raf = 0;
  let onScreen = true;
  const loop = (now: number) => {
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  const sync = () => {
    cancelAnimationFrame(raf);
    if (onScreen && !document.hidden) raf = requestAnimationFrame(loop);
  };
  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  }).observe(box);
  document.addEventListener('visibilitychange', sync);
}
