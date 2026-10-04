import sharp from 'sharp';
const R = 'raw/', O = 'public/assets/';
const W = 3840, H = 2160;
const crop = (f, x0, y0, x1, y1, w, out, q = 80) => sharp(R + f).extract({ left: Math.round(x0 * W), top: Math.round(y0 * H), width: Math.round((x1 - x0) * W), height: Math.round((y1 - y0) * H) }).resize({ width: w }).webp({ quality: q }).toFile(O + out);
await Promise.all([
  crop('re_key_wide.png', 0.36, 0, 1, 1, 2400, 'hero.webp', 78),
  crop('re_key_wide.png', 0.595, 0.09, 0.685, 0.34, 560, 'triss.webp'),
  crop('re_key_wide.png', 0.675, 0.12, 0.805, 0.53, 640, 'yennefer.webp'),
  crop('re_key_wide.png', 0.44, 0.47, 0.56, 0.82, 600, 'ciri.webp'),
  crop('re_key_wide.png', 0.52, 0.22, 0.76, 0.98, 900, 'geralt.webp'),
  sharp(R + 're_key_tall.png').extract({ left: 0, top: 0, width: 2160, height: 2300 }).resize({ width: 1100 }).webp({ quality: 76 }).toFile(O + 'hero-tall.webp'),
  sharp(R + 'bg_mountains.jpg').resize({ width: 1440 }).webp({ quality: 74 }).toFile(O + 'mist.webp'),
  ...['ss_fire', 'ss_skellige', 'ss_ciri', 'ss_fight', 'ss_sunset', 'ss_burning', 'ss_wildhunt', 'ss_moon'].map((n) => sharp(R + n + '.jpg').resize({ width: 1600 }).webp({ quality: 76 }).toFile(O + 'shot-' + n.replace('ss_', '') + '.webp')),
  sharp(R + 'wp_swords.png').resize({ width: 1600 }).webp({ quality: 78 }).toFile(O + 'swords.webp'),
  sharp(R + 'wp_ciri.png').resize({ width: 1600 }).webp({ quality: 78 }).toFile(O + 'ciri-wide.webp'),
  sharp(R + 'wp_fight.jpg').resize({ width: 1600 }).webp({ quality: 76 }).toFile(O + 'fight-wide.webp'),
  sharp(R + 'hero_wide.jpg').webp({ quality: 80 }).toFile(O + 'geralt-wide.webp'),
  sharp(R + 'logo.png').resize({ width: 640 }).webp({ quality: 90 }).toFile(O + 'logo.webp'),
]);
console.log('done');
