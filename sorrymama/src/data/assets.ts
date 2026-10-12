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
  terrace: { src: v('terrace-sky.webp'), src15x: v('terrace-sky-15x.webp'), src2x: v('terrace-sky-2x.webp'), w: 1440, h: 1820, focus: { x: 1000, y: 760 }, crown: { w: 600, h: 470 }, wordmark: { x: 205, y: 490, size: 155 } },
  front: { src: v('terrace-front.webp'), src15x: v('terrace-front-15x.webp'), src2x: v('terrace-front-2x.webp') },
  daySoft: { src: v('day-soft.webp') },
  // night master: 2× is Real-ESRGAN with the bartender patched back in from the original (no plastic face)
  lounge: { src: v('lounge-master.webp'), src15x: v('lounge-master-15x.webp'), src2x: v('lounge-master-2x.webp'), w: 1440, h: 2440, focus: { x: 760, y: 1150 }, canopy: { x: 760, y: 820 } },
  nightSoft: { src: v('night-soft.webp') },
  bloom: { src: v('bloom-source.webp'), w: 1440, h: 1800 },
  lanterns: { src: v('lounge-lanterns.webp'), src2x: v('lounge-lanterns-2x.webp'), w: 1440, h: 1800 },
  table: { src: v('terrace-table.webp'), w: 1080, h: 1400 },
  drink: { src: v('terrace-drink.webp'), w: 580, h: 860 },
  terraceEvening: { src: v('terrace-evening.webp'), w: 1440, h: 1800 },
  // 015: blue sofas, white tree, the car on the roof; neural 2×, black band and watermark cropped
  terraceDay: { src: v('terrace-day.webp'), src2x: v('terrace-day-2x.webp'), w: 1178, h: 740 },
  // 186: guest photo of a salad, used as «кухня» only; no dish name is claimed
  // the Arabic plov from the venue's own menu card (2GIS «Меню», 2025), neural 4×, portrait cut
  mainsDoor: { src: v('menu-door-mains.webp'), w: 639, h: 888 },
  kitchen: { src: v('menu-kitchen.webp'), src2x: v('menu-kitchen-2x.webp'), w: 1080, h: 1350 },
  terraceTree: { src: v('terrace-tree.webp'), w: 1440, h: 1800 },
  carClose: { src: v('terrace-car-close.webp'), w: 961, h: 1280 },
  cocktail: { src: v('lounge-cocktail.webp'), w: 1240, h: 1500 },
} as const;
