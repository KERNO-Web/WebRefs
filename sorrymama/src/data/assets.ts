/*
 * Photo roles → files. Every file is a real photo of Sorry Mama from the venue's public 2GIS gallery
 * (guest uploads) or the owner's research pack; provenance and rights in research/ASSET_SELECTION.md.
 * Rights are NOT cleared: public/assets/venue is gitignored and must not be deployed until they are.
 * Box coordinates are in the file's own pixels.
 */
const v = (f: string) => `./assets/venue/${f}`;

export const assets = {
  // day scene in two layers on the same 1440×1820 grid (2× files 2880×3640):
  // sky = the original photo with wires and bulbs removed; front = the owner's cut of the terrace,
  // wires and tree (Real-ESRGAN 4× → resampled), so the wordmark sits behind all of it
  terrace: { src: v('terrace-sky.webp'), src2x: v('terrace-sky-2x.webp'), w: 1440, h: 1820, focus: { x: 1000, y: 760 }, crown: { w: 600, h: 470 }, wordmark: { x: 205, y: 490, size: 155 } },
  front: { src: v('terrace-front.webp'), src2x: v('terrace-front-2x.webp') },
  daySoft: { src: v('day-soft.webp') },
  // night master: original only; the neural pass turned the bartender's face to plastic
  lounge: { src: v('lounge-master.webp'), w: 1440, h: 2440, focus: { x: 760, y: 1150 }, canopy: { x: 760, y: 820 } },
  nightSoft: { src: v('night-soft.webp') },
  bloom: { src: v('bloom-source.webp'), w: 1440, h: 1800 },
  lanterns: { src: v('lounge-lanterns.webp'), src2x: v('lounge-lanterns-2x.webp'), w: 1440, h: 1800 },
  canopy: { src: v('lounge-canopy.webp'), w: 1440, h: 1100 },
  table: { src: v('terrace-table.webp'), w: 1080, h: 1400 },
  drink: { src: v('terrace-drink.webp'), w: 580, h: 860 },
  terraceEvening: { src: v('terrace-evening.webp'), w: 1440, h: 1800 },
  terraceCar: { src: v('terrace-car.webp'), w: 1178, h: 800 },
  terraceTree: { src: v('terrace-tree.webp'), w: 1440, h: 1800 },
  carClose: { src: v('terrace-car-close.webp'), w: 961, h: 1280 },
  cocktail: { src: v('lounge-cocktail.webp'), w: 1240, h: 1500 },
} as const;
