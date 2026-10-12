/*
 * Photo roles → files. Every file is a real photo of Sorry Mama from the venue's public 2GIS gallery
 * (guest uploads) or the owner's research pack; provenance and rights in research/ASSET_SELECTION.md.
 * Rights are NOT cleared: public/assets/venue is gitignored and must not be deployed until they are.
 * Box coordinates are in the file's own pixels.
 */
const v = (f: string) => `./assets/venue/${f}`;

export const assets = {
  // day master: original 1440 + Real-ESRGAN 2× (chosen over Lanczos at 100% crops, see docs/ASSET_SELECTION.md)
  terrace: { src: v('terrace-master.webp'), src2x: v('terrace-master-2x.webp'), w: 1440, h: 1820, focus: { x: 1000, y: 760 }, crown: { w: 600, h: 470 } },
  // one small branch of the same photograph, keyed, so a single letter can pass behind it (1x coords)
  branch: { src: v('terrace-branch-alpha.webp'), x: 735, y: 600, w: 140, h: 180 },
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
