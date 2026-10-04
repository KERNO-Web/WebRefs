import * as THREE from 'three';
import { FIELD_D, FIELD_W, KEYS } from './layout';

const LEGEND_FONT = '"Instrument Sans", "Helvetica Neue", Arial, sans-serif';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

/**
 * One sheet that is literally the key field seen from above: every legend is
 * drawn where its key sits, so keycap UVs are just their top-view coordinates.
 * Glyphs are white on transparent; the shader tints them per colorway.
 */
export function legendAtlas(maxSize: number) {
  const P = Math.min(256, Math.floor(maxSize / FIELD_W));
  const [c, g] = canvas(FIELD_W * P, Math.round(FIELD_D * P));
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;

  const draw = () => {
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff';
    g.textBaseline = 'middle';
    for (const k of KEYS) {
      if (!k.label) continue;
      const x0 = k.x * P;
      const y0 = k.z * P;
      const cx = (k.x + k.w / 2) * P;
      const cy = (k.z + 0.5) * P;
      const single = k.label.length === 1 && !/[←↑→↓]/.test(k.label);
      if (k.sub) {
        g.textAlign = 'center';
        g.font = `600 ${P * 0.22}px ${LEGEND_FONT}`;
        g.fillText(k.sub, cx, cy - P * 0.16);
        g.font = `600 ${P * 0.27}px ${LEGEND_FONT}`;
        g.fillText(k.label, cx, cy + P * 0.14);
      } else if (single) {
        g.textAlign = 'center';
        g.font = `600 ${P * 0.4}px ${LEGEND_FONT}`;
        g.fillText(k.label, cx, cy - P * 0.02);
      } else if (/^F\d+$/.test(k.label) || /[←↑→↓]/.test(k.label) || k.label === 'esc') {
        g.textAlign = 'center';
        g.font = `600 ${P * (k.label.length > 2 ? 0.22 : 0.26)}px ${LEGEND_FONT}`;
        g.fillText(k.label, cx, cy);
      } else {
        // modifiers: quiet lowercase in the lower-left, the way a designed set reads
        g.textAlign = 'left';
        g.font = `600 ${P * 0.19}px ${LEGEND_FONT}`;
        g.fillText(k.label, x0 + P * 0.2, y0 + P * 0.68);
      }
    }
    // a small homing bar on F and J
    for (const k of KEYS) {
      if (k.code !== 'KeyF' && k.code !== 'KeyJ') continue;
      const cx = (k.x + k.w / 2) * P;
      const y = (k.z + 0.78) * P;
      g.fillRect(cx - P * 0.09, y, P * 0.18, P * 0.025);
    }
    // the space bar carries the only wordmark on the board
    const sp = KEYS.find((k) => k.code === 'Space')!;
    g.textAlign = 'right';
    g.font = `600 ${P * 0.13}px ${LEGEND_FONT}`;
    g.fillText('KEY/01', (sp.x + sp.w) * P - P * 0.28, (sp.z + 0.68) * P);
    tex.needsUpdate = true;
  };
  draw();
  return { tex, redraw: draw };
}

/** Grayscale PCB artwork; the material color tints it per colorway. */
export function pcbTexture(w: number, d: number) {
  const P = 64;
  const [c, g] = canvas(Math.round(w * P), Math.round(d * P));
  const ox = ((w - FIELD_W) / 2) * P;
  const oz = ((d - FIELD_D) / 2) * P;
  g.fillStyle = '#c9c9c9';
  g.fillRect(0, 0, c.width, c.height);
  // traces
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const y = Math.random() * c.height;
    let x = Math.random() * c.width * 0.3;
    g.beginPath();
    g.moveTo(x, y);
    let yy = y;
    for (let s = 0; s < 4; s++) {
      x += 30 + Math.random() * 160;
      g.lineTo(x, yy);
      const dy = (Math.random() - 0.5) * 60;
      g.lineTo(x + Math.abs(dy), yy + dy);
      x += Math.abs(dy);
      yy += dy;
    }
    g.stroke();
  }
  for (const k of KEYS) {
    const cx = ox + (k.x + k.w / 2) * P;
    const cy = oz + (k.z + 0.5) * P;
    // hot-swap socket
    g.fillStyle = '#4a4a4a';
    g.beginPath();
    g.roundRect(cx - P * 0.28, cy + P * 0.02, P * 0.5, P * 0.26, 3);
    g.fill();
    // pads
    g.fillStyle = '#f2f2f2';
    for (const [dx, dy] of [[-0.22, -0.2], [0.13, -0.27], [0, 0]]) {
      g.beginPath();
      g.arc(cx + dx * P, cy + dy * P, dx === 0 ? 5 : 3.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  // controller block and a little silk screen
  g.fillStyle = '#3a3a3a';
  g.fillRect(ox + 13.2 * P, oz + 0.05 * P, 1.1 * P, 0.6 * P);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.font = `600 ${P * 0.2}px ${LEGEND_FONT}`;
  g.textBaseline = 'middle';
  g.fillText('KEY/01  REV.C  HOTSWAP', ox + 0.2 * P, oz / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Alpha map for the switch plate: a sheet with one square cut per switch. */
export function plateAlpha(w: number, d: number) {
  const P = 64;
  const [c, g] = canvas(Math.round(w * P), Math.round(d * P));
  const ox = ((w - FIELD_W) / 2) * P;
  const oz = ((d - FIELD_D) / 2) * P;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#000';
  const s = 0.735 * P;
  for (const k of KEYS) {
    const cx = ox + (k.x + k.w / 2) * P;
    const cy = oz + (k.z + 0.5) * P;
    g.fillRect(cx - s / 2, cy - s / 2, s, s);
    if (k.w >= 2) {
      // stabilizer cut-outs
      const off = k.w >= 6 ? 2.5 : 0.62;
      for (const sx of [-1, 1]) g.fillRect(cx + sx * off * P - 0.18 * P, cy - 0.3 * P, 0.36 * P, 0.6 * P);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/** Soft contact shadow, baked once. */
export function shadowTexture() {
  const [c, g] = canvas(512, 256);
  g.filter = 'blur(26px)';
  g.fillStyle = 'rgba(0,0,0,0.9)';
  g.beginPath();
  g.roundRect(70, 64, 372, 128, 40);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/** Engraved badge for the underside. */
export function badgeTexture() {
  const [c, g] = canvas(1024, 384);
  g.fillStyle = '#ffffff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `700 150px "Bricolage Grotesque", ${LEGEND_FONT}`;
  g.fillText('KEY/01', 512, 160);
  g.font = `500 34px ${LEGEND_FONT}`;
  g.fillText('MODULAR 75%  ·  6063 ALUMINIUM  ·  N°0001', 512, 280);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  // seen from below, so mirror it to read correctly
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(-1, -1);
  return tex;
}

/** Bump map with 72 rounded ridges around the knob. */
export function knurlTexture() {
  const [c, g] = canvas(1152, 8);
  const ridge = c.width / 72;
  for (let i = 0; i < 72; i++) {
    const grad = g.createLinearGradient(i * ridge, 0, (i + 1) * ridge, 0);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.5, '#fff');
    grad.addColorStop(1, '#000');
    g.fillStyle = grad;
    g.fillRect(i * ridge, 0, ridge, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
