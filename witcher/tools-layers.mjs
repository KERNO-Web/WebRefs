import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';
const seg = await pipeline('background-removal', 'onnx-community/BiRefNet_lite-ONNX', { dtype: 'fp32' });
const T = Number(process.env.T || 0.78);
for (const [name, depthName] of [['hero', 'hero-depth'], ['hero-tall', 'hero-tall-depth']]) {
  const src = `public/assets/${name}.webp`;
  const { width: W, height: H } = await sharp(src).metadata();
  const rgb = await sharp(src).removeAlpha().raw().toBuffer();
  const depth = await sharp(`raw/${depthName}.webp`).resize(W, H).extractChannel(0).raw().toBuffer();
  const r0 = await seg(new Blob([await sharp(src).png().toBuffer()]));
  const res = Array.isArray(r0) ? r0[0] : r0;
  const fgA = await sharp(Buffer.from(res.data), { raw: { width: res.width, height: res.height, channels: res.channels } }).resize(W, H).extractChannel(3).raw().toBuffer();
  let lo = 255, hi = 0; for (const v of depth) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const N = W * H;
  const front = Buffer.alloc(N), mid = Buffer.alloc(N), hole = Buffer.alloc(N);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let i = 0; i < N; i++) {
    const fg = fgA[i] / 255, d = (depth[i] - lo) / (hi - lo);
    const near = ss(T - 0.03, T + 0.03, d);
    front[i] = Math.round(near * 255);
    mid[i] = Math.round(Math.min(1, fg * 1.3) * (1 - near) * 255);
    hole[i] = Math.round(Math.min(1, Math.max(fg * 1.4, near)) * 255);
  }
  // soften the inner seam between front and mid a little
  const frontS = await sharp(front, { raw: { width: W, height: H, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer();
  const holeD = await sharp(hole, { raw: { width: W, height: H, channels: 1 } }).blur(6).extractChannel(0).raw().toBuffer();

  // background: normalised-convolution inpaint of everything that is a character
  const keep = Buffer.alloc(N); for (let i = 0; i < N; i++) keep[i] = 255 - Math.min(255, holeD[i] * 1.6);
  const premul = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) for (let c = 0; c < 3; c++) premul[i * 3 + c] = Math.round(rgb[i * 3 + c] * keep[i] / 255);
  const blurPair = async (r) => [
    await sharp(premul, { raw: { width: W, height: H, channels: 3 } }).blur(r).raw().toBuffer(),
    await sharp(keep, { raw: { width: W, height: H, channels: 1 } }).blur(r).extractChannel(0).raw().toBuffer(),
  ];
  const [p1, k1] = await blurPair(Math.round(W / 40));
  const [p2, k2] = await blurPair(Math.round(W / 9));
  const back = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) {
    const k = keep[i] / 255, w1 = k1[i] / 255, w2 = k2[i] / 255;
    const t = Math.min(1, w1 / 0.2);
    for (let c = 0; c < 3; c++) {
      const f1 = w1 > 0.01 ? p1[i * 3 + c] / w1 : 0;
      const f2 = w2 > 0.005 ? p2[i * 3 + c] / w2 : rgb[i * 3 + c] * 0.3;
      const fill = Math.min(255, f1 * t + f2 * (1 - t));
      back[i * 3 + c] = Math.round(rgb[i * 3 + c] * k + fill * 0.42 * (1 - k));
    }
  }
  const rgba = (a) => { const o = Buffer.alloc(N * 4); for (let i = 0; i < N; i++) { o[i * 4] = rgb[i * 3]; o[i * 4 + 1] = rgb[i * 3 + 1]; o[i * 4 + 2] = rgb[i * 3 + 2]; o[i * 4 + 3] = a[i]; } return o; };
  await sharp(back, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 74 }).toFile(`public/assets/${name}-back.webp`);
  await sharp(rgba(mid), { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 82, alphaQuality: 90 }).toFile(`public/assets/${name}-mid.webp`);
  await sharp(rgba(frontS), { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 84, alphaQuality: 92 }).toFile(`public/assets/${name}-front.webp`);
  // preview
  const P = '/private/tmp/claude-501/-Users-sergey-mac-Vibecode-Examples/b51128de-1124-41ec-a182-04155ba8cdf0/scratchpad/prev/';
  const tile = async (buf, ch) => sharp(buf, { raw: { width: W, height: H, channels: ch } }).resize({ width: 420 }).flatten({ background: '#ff00ff' }).png().toBuffer();
  const tiles = [await tile(back, 3), await tile(rgba(mid), 4), await tile(rgba(frontS), 4)];
  const th = Math.round(H * 420 / W);
  await sharp({ create: { width: 1272, height: th, channels: 3, background: '#000' } }).composite(tiles.map((t, i) => ({ input: t, left: i * 426, top: 0 }))).jpeg().toFile(P + name + '-layers.jpg');
  console.log(name, 'done');
}
