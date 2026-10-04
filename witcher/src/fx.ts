/**
 * Full-screen atmosphere layer: drifting mist, rising embers and a little snow.
 * One fragment shader, no libraries. Intensities are driven per section.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uFog;
uniform float uEmber;
uniform float uSnow;
uniform vec2 uMouse;
uniform float uScroll;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }

// particles living in a scrolling grid of cells
vec3 particles(vec2 uv, float scale, float speed, float drift, float size, float seed, bool up){
  vec2 st = uv * scale;
  st.y += (up ? -1.0 : 1.0) * uTime * speed;
  st.x += sin(st.y * 0.35 + seed) * drift;
  vec2 id = floor(st), f = fract(st);
  float h = hash(id + seed);
  if (h > 0.22) return vec3(0.0);
  vec2 pos = vec2(hash(id + seed + 3.1), hash(id + seed + 7.7)) * 0.8 + 0.1;
  pos.x += sin(uTime * (0.6 + h * 2.0) + h * 30.0) * 0.18;
  float d = length(f - pos);
  float flick = 0.55 + 0.45 * sin(uTime * (3.0 + h * 9.0) + h * 40.0);
  float core = smoothstep(size, 0.0, d);
  float glow = smoothstep(size * 5.0, 0.0, d) * 0.25;
  return vec3(core + glow) * flick * (0.6 + h * 2.0);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 q = uv * asp;
  vec3 col = vec3(0.0);

  // mist: thick at the bottom and edges, cyan-white
  float t = uTime * 0.025;
  vec2 m = (uMouse - 0.5) * 0.04;
  float f1 = fbm(q * 1.6 + vec2(t * 2.0, -t) + m + vec2(0.0, uScroll * 0.2));
  float f2 = fbm(q * 3.2 - vec2(t * 3.0, t * 0.5) + f1);
  float band = smoothstep(0.9, 0.0, uv.y) * 0.65 + 0.35;
  float mist = smoothstep(0.35, 1.0, f2) * band;
  col += vec3(0.62, 0.85, 0.88) * mist * 0.32 * uFog;

  // embers rising from the bottom, hot orange to red
  vec3 e = particles(uv * asp, 9.0, 0.22, 0.35, 0.05, 1.0, true)
         + particles(uv * asp, 16.0, 0.34, 0.5, 0.06, 7.0, true) * 0.7
         + particles(uv * asp, 5.0, 0.12, 0.25, 0.035, 13.0, true) * 1.2;
  float emberMask = smoothstep(1.05, 0.0, uv.y) * 0.85 + 0.15;
  col += e.r * vec3(1.0, 0.42, 0.12) * emberMask * uEmber;

  // snow drifting down, pale
  float s = particles(uv * asp, 22.0, 0.05, 0.6, 0.06, 21.0, false).r * 0.5
          + particles(uv * asp, 12.0, 0.035, 0.4, 0.05, 31.0, false).r * 0.4;
  col += vec3(0.85, 0.93, 0.96) * s * uSnow * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

export interface FxLevels { fog: number; ember: number; snow: number }

export function startFx(canvas: HTMLCanvasElement, getLevels: () => FxLevels, reduced: boolean) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, antialias: false, alpha: false });
  if (!gl) return () => {};
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return () => {};
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uFog = U('uFog'), uEmber = U('uEmber'), uSnow = U('uSnow'), uMouse = U('uMouse'), uScroll = U('uScroll');

  const mobile = window.matchMedia('(max-width: 760px)').matches;
  const scale = mobile ? 0.5 : 0.62;
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(window.innerWidth * dpr * scale);
    canvas.height = Math.round(window.innerHeight * dpr * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const onMove = (e: PointerEvent) => { mouse.tx = e.clientX / window.innerWidth; mouse.ty = 1 - e.clientY / window.innerHeight; };
  window.addEventListener('pointermove', onMove, { passive: true });

  const lv = { fog: 0, ember: 0, snow: 0 };
  let raf = 0, last = performance.now(), time = 0, visible = true;
  const vis = () => { visible = document.visibilityState === 'visible'; };
  document.addEventListener('visibilitychange', vis);

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time = (time + dt * (reduced ? 0.15 : 1)) % 2000;
    const target = getLevels();
    const k = 1 - Math.exp(-dt * 2.5);
    lv.fog += (target.fog - lv.fog) * k;
    lv.ember += (target.ember - lv.ember) * k;
    lv.snow += (target.snow - lv.snow) * k;
    mouse.x += (mouse.tx - mouse.x) * k;
    mouse.y += (mouse.ty - mouse.y) * k;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uFog, lv.fog);
    gl.uniform1f(uEmber, reduced ? lv.ember * 0.4 : lv.ember);
    gl.uniform1f(uSnow, lv.snow);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, window.scrollY / window.innerHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', vis);
  };
}
