import sharp from 'sharp';
const src = '/private/tmp/claude-501/-Users-sergey-mac-Vibecode-Examples/b51128de-1124-41ec-a182-04155ba8cdf0/images/3.png';
const signs = [['yrden', 87, 0.3, 105], ['axii', 253, 0.62, 120], ['quen', 421, 0.55, 150], ['aard', 590, 0.55, 150], ['igni', 759, 0.55, 150]];
const S = 116, CY = 104;
const prev = [];
for (const [name, cx, ST, VT] of signs) {
  const { data, info } = await sharp(src).extract({ left: cx - S / 2, top: CY - S / 2, width: S, height: S }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = Buffer.alloc(S * S);
  for (let i = 0; i < S * S; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx ? (mx - mn) / mx : 0;
    // solid glyph body: strongly saturated and bright; drop the soft glow and sparks
    const v = Math.min(1, Math.max(0, (sat - ST) / 0.2)) * Math.min(1, Math.max(0, (mx - VT) / 50));
    a[i] = Math.round(v * 255);
  }
  // remove tiny specks: blur + threshold, then upscale smoothly
  const mask = await sharp(a, { raw: { width: S, height: S, channels: 1 } }).median(name === 'aard' || name === 'quen' ? 3 : 5).resize(S * 4, S * 4, { kernel: 'lanczos3' }).blur(1.2).linear(2.2, -150).extractChannel(0).raw().toBuffer();
  const W = S * 4;
  const rgba = Buffer.alloc(W * W * 4);
  for (let i = 0; i < W * W; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 255; rgba[i * 4 + 3] = mask[i]; }
  await sharp(rgba, { raw: { width: W, height: W, channels: 4 } }).trim({ threshold: 1 }).png().toFile(`public/assets/signs/${name}.png`);
  prev.push(await sharp(`public/assets/signs/${name}.png`).resize(160, 160, { fit: 'contain', background: '#000' }).flatten({ background: '#202428' }).png().toBuffer());
}
await sharp({ create: { width: 5 * 170, height: 170, channels: 3, background: '#000' } }).composite(prev.map((b, i) => ({ input: b, left: i * 170 + 5, top: 5 }))).png().toFile('/private/tmp/claude-501/-Users-sergey-mac-Vibecode-Examples/b51128de-1124-41ec-a182-04155ba8cdf0/scratchpad/prev/signs-mask.png');
console.log('ok');
