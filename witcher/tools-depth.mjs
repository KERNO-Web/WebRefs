import { pipeline, RawImage } from '@huggingface/transformers';
import sharp from 'sharp';
const depth = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });
for (const [src, out] of [['public/assets/hero.webp', 'raw/hero-depth.webp'], ['public/assets/hero-tall.webp', 'raw/hero-tall-depth.webp']]) {
  const png = await sharp(src).png().toBuffer();
  const img = await RawImage.fromBlob(new Blob([png]));
  const { predicted_depth, depth: d } = await depth(img);
  const meta = await sharp(src).metadata();
  await sharp(Buffer.from(d.data), { raw: { width: d.width, height: d.height, channels: d.channels } })
    .resize(meta.width >> 1, meta.height >> 1).blur(1.2).webp({ quality: 90 }).toFile(out);
  console.log(out, d.width, d.height, predicted_depth.dims);
}
