/**
 * Liquid portrait: one photo drawn through a fragment shader.
 * A slow flow-field drifts the image like heat over skin; the cursor presses a soft lens into it
 * with a faint chromatic split at the rim. Falls back to the plain <img> when WebGL is missing.
 */
const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uIntro;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y, ri = uImg.x / uImg.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  return (uv - 0.5) * scale + mix(vec2(0.5), uFocus, 1.0 - scale) ;
}

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;
  float t = uTime * 0.06;

  // breathing zoom + slow liquid drift
  float zoom = 1.0 - 0.025 * (0.5 + 0.5 * sin(uTime * 0.25)) - 0.06 * (1.0 - uIntro);
  vec2 c = (uv - 0.5) * zoom + 0.5;
  vec2 flow = vec2(fbm(c * 2.6 + vec2(t, -t * 0.7)), fbm(c * 2.6 + vec2(4.1 - t * 0.8, 1.7 + t))) - 0.5;
  c += flow * 0.012;

  // cursor lens
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 d = (c - uMouse) * asp;
  float r = length(d);
  float lens = smoothstep(0.32, 0.0, r) * uHover;
  float ring = sin(r * 34.0 - uTime * 2.2) * exp(-r * 7.0) * uHover;
  vec2 push = normalize(d + 1e-5) / asp * (ring * 0.006) - (c - uMouse) * lens * 0.08;
  vec2 q = cover(c + push);

  float split = 0.0025 * lens + 0.0012 * abs(ring);
  vec3 col;
  col.r = texture2D(uTex, cover(c + push * 1.25 + vec2(split, 0.0))).r;
  col.g = texture2D(uTex, q).g;
  col.b = texture2D(uTex, cover(c + push * 0.8 - vec2(split, 0.0))).b;

  // a breath of light inside the lens
  col += vec3(0.09, 0.055, 0.05) * lens * lens;
  // vignette
  float v = smoothstep(1.15, 0.35, length((vUv - vec2(0.55, 0.5)) * vec2(1.1, 1.0)));
  col *= mix(0.55, 1.0, v);
  col *= uIntro;
  gl_FragColor = vec4(col, 1.0);
}`;

export function mountLiquid(canvas: HTMLCanvasElement, src: string, focus: [number, number], opts: { still?: boolean } = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) return null;
  const sh = (type: number, s: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const u = { res: U('uRes'), img: U('uImg'), focus: U('uFocus'), mouse: U('uMouse'), hover: U('uHover'), time: U('uTime'), intro: U('uIntro') };

  const tex = gl.createTexture();
  let ready = false;
  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform2f(u.img, image.naturalWidth, image.naturalHeight);
    ready = true;
    canvas.classList.add('ready');
  };
  image.src = src;
  gl.uniform2f(u.focus, focus[0], focus[1]);

  let mx = 0.62, my = 0.42, tx = mx, ty = my, hover = 0, th = 0, intro = 0, visible = true, raf = 0;
  const t0 = performance.now();
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.75);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.res, canvas.width, canvas.height);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    th = tx > -0.1 && tx < 1.1 && ty > -0.1 && ty < 1.1 ? 1 : 0;
  };
  const leave = () => { th = 0; };
  if (!opts.still) { addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', leave); }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); });
  io.observe(canvas);

  function draw(now: number) {
    raf = 0;
    if (!visible || document.hidden) return;
    mx += (tx - mx) * 0.07; my += (ty - my) * 0.07;
    hover += (th - hover) * 0.05;
    if (ready) intro = Math.min(1, intro + 0.012);
    gl!.uniform2f(u.mouse, mx, my);
    gl!.uniform1f(u.hover, hover);
    gl!.uniform1f(u.time, opts.still ? 0 : (now - t0) / 1000);
    gl!.uniform1f(u.intro, 1 - Math.pow(1 - intro, 3));
    if (ready) gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(draw);
  }
  const vis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(draw); };
  document.addEventListener('visibilitychange', vis);
  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    removeEventListener('pointermove', move);
    document.removeEventListener('pointerleave', leave);
    document.removeEventListener('visibilitychange', vis);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
