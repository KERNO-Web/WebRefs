import { pipeline } from '@huggingface/transformers';
import sharp from 'sharp';
const seg = await pipeline('background-removal', process.env.M || 'onnx-community/BiRefNet_lite-ONNX', { dtype: 'fp32' });
const items = [['tw3wh-ciri', 'ciri'], ['tw3wh-yennefer-of-vengerberg', 'yennefer'], ['tw3wh-triss-merigold', 'triss']];
for (const [src, out] of items) {
  const file = `raw/${src}.jpg`;
  const { width, height } = await sharp(file).metadata();
  const r0 = await seg(file); const res = Array.isArray(r0) ? r0[0] : r0;
  const rgba = Buffer.from(res.data);
  await sharp(rgba, { raw: { width: res.width, height: res.height, channels: res.channels } })
    .resize(width, height)
    .extract({ left: 0, top: 0, width, height: Math.round(height * 0.74) })
    .webp({ quality: 86, alphaQuality: 90 }).toFile(`public/assets/${out}.webp`);
  console.log(out, res.width, res.height, res.channels);
}
