import { rng } from './ink';

// Aged parchment, painted once on a canvas as a seamless tile: mottled
// tone, fibres, water stains with dark tide-lines, a mug ring, foxing and
// grain. Exposed as --paper so the body, book pages and the slip share it.
const S = 1024;

function valueNoise(res: number, grid: number, r: () => number): Float32Array {
  const g = Array.from({ length: grid * grid }, r);
  const out = new Float32Array(res * res);
  const sm = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < res; y++) {
    for (let x = 0; x < res; x++) {
      const fx = (x / res) * grid, fy = (y / res) * grid;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = sm(fx - x0), ty = sm(fy - y0);
      const at = (i: number, j: number) => g[((j + grid) % grid) * grid + ((i + grid) % grid)];
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
      out[y * res + x] = a + (b - a) * ty;
    }
  }
  return out;
}

// Draw fn at (x, y) and at its wrapped copies so the tile has no seams.
function wrap(x: number, y: number, rad: number, fn: (x: number, y: number) => void) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
    const X = x + dx, Y = y + dy;
    if (X + rad < 0 || X - rad > S || Y + rad < 0 || Y - rad > S) continue;
    fn(X, Y);
  }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rad: number, r: () => number) {
  ctx.beginPath();
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = rad * (0.75 + r() * 0.4 + 0.15 * Math.sin(a * 3 + rad));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export async function paintPaper() {
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const r = rng(1913);

  ctx.fillStyle = '#e4cfa3';
  ctx.fillRect(0, 0, S, S);

  // Mottled tone: dark and light clouds at several scales.
  const res = 256;
  const small = document.createElement('canvas');
  small.width = small.height = res;
  const sctx = small.getContext('2d')!;
  const img = sctx.createImageData(res, res);
  const n1 = valueNoise(res, 4, r), n2 = valueNoise(res, 9, r), n3 = valueNoise(res, 22, r);
  for (let i = 0; i < res * res; i++) {
    const v = n1[i] * 0.5 + n2[i] * 0.33 + n3[i] * 0.17;
    const d = v - 0.5;
    if (d > 0) { img.data[i * 4] = 96; img.data[i * 4 + 1] = 60; img.data[i * 4 + 2] = 22; img.data[i * 4 + 3] = Math.min(255, d * 2.4 * 255 * 0.55); }
    else { img.data[i * 4] = 250; img.data[i * 4 + 1] = 238; img.data[i * 4 + 2] = 205; img.data[i * 4 + 3] = Math.min(255, -d * 2.4 * 255 * 0.5); }
  }
  sctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, S, S);

  // Fibres: short, mostly horizontal strands, dark and light.
  for (let i = 0; i < 4200; i++) {
    const x = r() * S, y = r() * S, len = 6 + r() * 26, a = (r() - 0.5) * 0.7;
    const dark = r() > 0.4;
    ctx.strokeStyle = dark ? `rgba(92,60,24,${0.05 + r() * 0.09})` : `rgba(255,248,226,${0.08 + r() * 0.12})`;
    ctx.lineWidth = 0.5 + r() * 0.9;
    const bend = (r() - 0.5) * 3;
    wrap(x, y, len, (X, Y) => {
      ctx.beginPath();
      ctx.moveTo(X, Y);
      ctx.quadraticCurveTo(X + Math.cos(a) * len * 0.5, Y + Math.sin(a) * len * 0.5 + bend, X + Math.cos(a) * len, Y + Math.sin(a) * len);
      ctx.stroke();
    });
  }

  // Water stains: pale pool with a dark tide-line.
  for (let i = 0; i < 7; i++) {
    const x = r() * S, y = r() * S, rad = 60 + r() * 150;
    const a1 = 0.06 + r() * 0.06, a2 = 0.16 + r() * 0.12, lw = 1.5 + r() * 2;
    wrap(x, y, rad * 1.3, (X, Y) => {
      ctx.save();
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = `rgba(150,100,40,${a1})`;
      blob(ctx, X, Y, rad, rng(i * 7 + 1)); ctx.fill();
      ctx.filter = 'blur(1.5px)';
      ctx.strokeStyle = `rgba(110,66,22,${a2})`;
      ctx.lineWidth = lw;
      blob(ctx, X, Y, rad, rng(i * 7 + 1)); ctx.stroke();
      ctx.restore();
    });
  }

  // A mug ring, broken in places.
  const mx = S * 0.72, my = S * 0.3;
  wrap(mx, my, 90, (X, Y) => {
    ctx.save();
    ctx.filter = 'blur(1px)';
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = `rgba(105,60,20,${0.12 + k * 0.05})`;
      ctx.lineWidth = 4 - k;
      ctx.beginPath();
      ctx.arc(X + k, Y - k, 74 - k * 2, 0.3 + k * 0.4, Math.PI * 1.7 + k * 0.3);
      ctx.stroke();
    }
    ctx.restore();
  });

  // Foxing: rusty specks.
  for (let i = 0; i < 260; i++) {
    const x = r() * S, y = r() * S, rad = 0.6 + Math.pow(r(), 3) * 6, al = 0.18 + r() * 0.3;
    wrap(x, y, rad * 2, (X, Y) => {
      const g = ctx.createRadialGradient(X, Y, 0, X, Y, rad * 1.8);
      g.addColorStop(0, `rgba(120,64,20,${al})`);
      g.addColorStop(1, 'rgba(120,64,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(X - rad * 2, Y - rad * 2, rad * 4, rad * 4);
    });
  }

  // Grain
  const all = ctx.getImageData(0, 0, S, S);
  for (let i = 0; i < all.data.length; i += 4) {
    const k = (r() - 0.5) * 18;
    all.data[i] += k; all.data[i + 1] += k; all.data[i + 2] += k * 0.8;
  }
  ctx.putImageData(all, 0, 0);

  const blobUrl = await new Promise<string>((res) => c.toBlob((b) => res(URL.createObjectURL(b!)), 'image/jpeg', 0.86));
  document.documentElement.style.setProperty('--paper', `url(${blobUrl})`);
  document.documentElement.classList.add('paper-ready');
}
