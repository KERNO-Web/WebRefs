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
uniform float mw;

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
  // the name sits centred in the space above the bottom line; on a phone that
  // line is taller, so the name, and the clot with it, sit higher
  float lift = .02 + (1. - k) / .65 * .25;
  float T = t * .05;

  // folded space, gently: the edge drifts without turning into a stain
  vec2 q = vec2(fbm(p * 1.6 + T), fbm(p * 1.6 - T + 3.1));
  vec2 w = p + mix(.35, .5, k) * (q - .5);

  // one large clot right behind the name, breathing in place: it drifts a
  // little, two lobes orbit its centre so its outline keeps changing, and a
  // third leans toward the cursor once there is one
  vec2 C = vec2(.1 * k * sin(t * .07), lift + .04 * sin(t * .09));
  vec2 c1 = C + .16 * vec2(cos(t * .23), sin(t * .17));
  vec2 c2 = C + .2 * vec2(cos(t * .13 + 2.), sin(t * .19 + 1.));
  vec2 c3 = mix(C + vec2(-.06, -.1), m, .25 * mw);
  float f = exp(-dot(w - c1, w - c1) * 7.)
          + .7 * exp(-dot(w - c2, w - c2) * 9.5)
          + .55 * exp(-dot(w - c3, w - c3) * 12.);

  float folds = fbm(w * 3.4 - T * 2.) - .5;
  float v = f + .45 * folds;
  // no outline: a lit edge makes the mass read as a cell under a microscope
  float body = smoothstep(.12, 1.35, v);

  vec3 bg = vec3(.071, .071, .078);
  vec3 deep = vec3(.12, .03, .36);
  vec3 vio = vec3(.42, .28, 1.);
  vec3 lil = vec3(.82, .74, 1.);
  vec3 col = mix(bg, deep, smoothstep(.01, .5, f) * .85);
  // light and shade drift through the mass, so it reads as volume, not a flat fill
  float shade = fbm(w * 2.2 + vec2(T * 1.5, -T));
  col = mix(col, vio * (.55 + .8 * shade), body * .9);
  col += lil * smoothstep(.95, 1.6, v) * .22;

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
  const uMw = gl.getUniformLocation(prog, 'mw');

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

  // cursor in the shader's space: centred, y up, shorter side = 1; its pull
  // fades in only after a real mouse has moved, so touch screens never feel it
  const aim = { x: 0, y: 0 };
  const cur = { ...aim };
  let pull = 0;
  let pullTo = 0;
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      const b = box.getBoundingClientRect();
      const unit = Math.min(b.height, b.width / 1.1);
      aim.x = (e.clientX - b.left - b.width / 2) / unit;
      aim.y = (b.top + b.height / 2 - e.clientY) / unit;
      if (!pullTo) {
        pullTo = 1;
        cur.x = aim.x;
        cur.y = aim.y;
      }
    },
    { passive: true },
  );

  // a random start, so the mass is never caught in the same pose twice
  const t0 = performance.now() - Math.random() * 120_000;
  const draw = (now: number) => {
    cur.x += (aim.x - cur.x) * 0.02;
    cur.y += (aim.y - cur.y) * 0.02;
    pull += (pullTo - pull) * 0.01;
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uM, cur.x, cur.y);
    gl.uniform1f(uMw, pull);
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
