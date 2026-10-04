// Ashima / Stefan Gustavson 3D simplex noise (MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

export const objectVertex = /* glsl */ `
${NOISE}
uniform float uTime;
uniform float uStretch;
uniform float uPressure;
uniform float uFracture;
uniform float uBreath;
uniform vec3 uMouse;
uniform float uMouseStr;
uniform vec3 uCells[7];

varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
varying float vBorder;
varying float vCell;

float field(vec3 p){
  float t = uTime * 0.11;
  vec3 w = p + 0.24 * vec3(snoise(p * 0.8 + t), snoise(p * 0.8 - t + 4.0), snoise(p * 0.8 + 9.0));
  float n = snoise(w * 0.9 + vec3(0.0, t, t * 0.7)) * 0.24;
  n += snoise(w * 1.9 - vec3(t * 1.3, 0.0, t)) * 0.07;
  n += snoise(p * 4.2 + t * 1.6) * (0.008 + 0.03 * uPressure);
  n += sin(uTime * 0.55) * 0.035 * uBreath;
  n += uPressure * 0.075 * sin(p.y * 13.0 - uTime * 2.1 + snoise(p * 1.4) * 2.2);
  float m = max(dot(p, uMouse), 0.0);
  n += pow(m, 7.0) * 0.24 * uMouseStr;
  return n;
}

vec3 deform(vec3 p){
  vec3 q = p * (1.0 + field(p));
  q.y *= 1.0 + 0.3 * uStretch - 0.26 * uPressure;
  q.xz *= 1.0 - 0.09 * uStretch + 0.14 * uPressure;
  float a = q.y * 0.45 * uStretch + sin(uTime * 0.17) * 0.12;
  float c = cos(a), s = sin(a);
  q.xz = mat2(c, -s, s, c) * q.xz;
  return q;
}

void main(){
  vec3 p = normalize(position);
  vec3 up = abs(p.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(p, up));
  vec3 t2 = cross(p, t1);
  float e = 0.012;
  vec3 q0 = deform(p);
  vec3 qa = deform(normalize(p + t1 * e));
  vec3 qb = deform(normalize(p + t2 * e));
  vec3 n = normalize(cross(qa - q0, qb - q0));
  if (dot(n, q0) < 0.0) n = -n;

  // fracture: voronoi on the sphere direction
  float d1 = 9.0, d2 = 9.0; int id = 0;
  for (int i = 0; i < 7; i++){
    float d = 1.0 - dot(p, uCells[i]);
    if (d < d1){ d2 = d1; d1 = d; id = i; }
    else if (d < d2){ d2 = d; }
  }
  vec3 dir = uCells[0];
  for (int i = 0; i < 7; i++){ if (i == id) dir = uCells[i]; }
  vBorder = d2 - d1;
  vCell = float(id);
  float f = uFracture;
  q0 += dir * f * (0.34 + 0.08 * sin(float(id) * 2.3 + uTime * 0.4));
  // slight independent rotation per piece
  float r = f * 0.12 * (mod(float(id), 2.0) * 2.0 - 1.0);
  float cr = cos(r), sr = sin(r);
  q0.xz = mat2(cr, -sr, sr, cr) * (q0.xz - dir.xz * f) + dir.xz * f;

  vObj = p;
  vec4 world = modelMatrix * vec4(q0, 1.0);
  vPosW = world.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

export const objectFragment = /* glsl */ `
${NOISE}
uniform float uTime;
uniform vec3 uLightDir;
uniform float uLight;
uniform float uCobalt;
uniform float uWhite;
uniform float uAmber;
uniform float uFracture;
uniform float uDissolve;
uniform float uGhost;

varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vObj;
varying float vBorder;
varying float vCell;

vec3 env(vec3 r, vec3 L){
  float y = r.y;
  vec3 c = mix(vec3(0.004), vec3(0.03), smoothstep(-0.7, 0.9, y));
  c += vec3(1.0, 0.98, 0.95) * pow(max(dot(r, L), 0.0), 40.0) * 3.2;
  c += vec3(1.0) * pow(max(dot(r, L), 0.0), 4.0) * 0.12;
  c += vec3(0.8, 0.85, 1.0) * pow(max(dot(r, normalize(vec3(-L.x, -0.2, -L.z))), 0.0), 6.0) * 0.12;
  c += vec3(0.9) * exp(-abs(y - 0.08) * 22.0) * 0.32;
  c += vec3(1.0) * smoothstep(0.86, 0.97, y) * 0.35;
  // long softbox strip
  float strip = smoothstep(0.035, 0.0, abs(r.x * 0.8 + r.z * 0.6 - 0.55)) * smoothstep(-0.2, 0.5, y);
  c += vec3(0.95) * strip * 0.5;
  return c;
}

void main(){
  vec3 N = normalize(vNormalW);
  bool front = gl_FrontFacing;
  if (!front) N = -N;
  vec3 V = normalize(cameraPosition - vPosW);
  vec3 L = normalize(uLightDir);
  vec3 R = reflect(-V, N);
  float ndv = max(dot(N, V), 0.0);
  float fres = pow(1.0 - ndv, 3.0);

  // dissolve (opening + ending)
  float dn = snoise(vObj * 2.4 + vec3(0.0, uTime * 0.05, 0.0)) * 0.5 + 0.5;
  if (dn < uDissolve) discard;
  float edge = uDissolve > 0.001 ? 1.0 - smoothstep(uDissolve, uDissolve + 0.07, dn) : 0.0;

  // fracture gaps
  if (vBorder < uFracture * 0.07) discard;
  float seam = (1.0 - smoothstep(uFracture * 0.07, uFracture * 0.07 + 0.04, vBorder)) * uFracture;

#ifdef GHOST
  vec3 g = vec3(0.22, 0.38, 1.0) * fres * 1.6 + vec3(0.1, 0.18, 0.6) * pow(fres, 0.6) * 0.15;
  gl_FragColor = vec4(g * uGhost * uLight, 1.0);
  return;
#endif

  vec3 silver = vec3(0.78, 0.8, 0.83);
  vec3 cobalt = vec3(0.16, 0.3, 1.0);
  vec3 bone = vec3(0.95, 0.93, 0.88);
  vec3 tint = mix(silver, cobalt, uCobalt);
  tint = mix(tint, bone, uWhite);

  vec3 base = mix(vec3(0.035, 0.037, 0.04), vec3(0.02, 0.04, 0.12), uCobalt);
  float diff = max(dot(N, L), 0.0);
  vec3 col = base * (0.08 + diff);

  vec3 refl = env(R, L) * tint;
  col += refl * (0.6 + 0.4 * fres);

  // smoke: soft milky layer at grazing angles, drifting
  float smoke = snoise(vObj * 1.7 + vec3(uTime * 0.04, -uTime * 0.06, 0.0)) * 0.5 + 0.5;
  col += mix(vec3(0.5, 0.52, 0.56), cobalt * 0.6, uCobalt) * fres * smoke * 0.22;

  // anisotropic fabric-like streaks
  float fiber = snoise(vec3(vObj.x * 1.2, vObj.y * 22.0 + uTime * 0.2, vObj.z * 1.2)) * 0.5 + 0.5;
  col *= 0.9 + 0.18 * fiber * (1.0 - uWhite);

  vec3 rim = mix(silver * 0.5, vec3(1.0, 0.68, 0.32), uAmber);
  col += rim * fres * 0.55;

  // near white state: porcelain light
  vec3 white = bone * (0.62 + 0.38 * diff) + env(R, L) * 0.18 + fres * 0.15;
  col = mix(col, white, uWhite * 0.88);

  if (!front){
    col = vec3(0.012) + vec3(1.0, 0.78, 0.5) * uFracture * 0.07 * (0.3 + 0.7 * ndv);
  }

  // light between the pieces
  col += vec3(1.0, 0.72, 0.42) * pow(seam, 2.0) * 1.15;
  col += vec3(1.0, 0.92, 0.82) * edge * 2.2;

  gl_FragColor = vec4(col * uLight, 1.0);
}
`;

export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uPixel;
attribute float aSeed;
varying float vAlpha;
void main(){
  vec3 p = position;
  float t = uTime * 0.03;
  p.x += sin(t + aSeed * 6.28) * 0.35;
  p.y += mod(p.y + t * (0.2 + aSeed * 0.3) + 6.0, 12.0) - 6.0 - p.y;
  p.z += cos(t * 0.8 + aSeed * 4.0) * 0.3;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixel * (0.6 + aSeed * 1.6) * (6.0 / -mv.z);
  vAlpha = (0.15 + aSeed * 0.35) * smoothstep(14.0, 4.0, -mv.z);
}
`;

export const dustFragment = /* glsl */ `
uniform float uLight;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vec3(0.85, 0.84, 0.8) * a * vAlpha * uLight, 1.0);
}
`;

export const finalPass = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.04 },
    uAberration: { value: 0.0012 },
    uVignette: { value: 0.9 },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGrain;
uniform float uAberration;
uniform float uVignette;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5;
  vec2 off = c * uAberration * length(c) * 4.0;
  vec3 col;
  col.r = texture2D(tDiffuse, vUv + off).r;
  col.g = texture2D(tDiffuse, vUv).g;
  col.b = texture2D(tDiffuse, vUv - off).b;
  float v = smoothstep(0.95, 0.25, length(c) * uVignette);
  col *= mix(0.55, 1.0, v);
  float g = hash(vUv * 1000.0 + fract(uTime * 7.0)) - 0.5;
  col += g * uGrain * (0.35 + 0.65 * (1.0 - dot(col, vec3(0.33))));
  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`,
};
