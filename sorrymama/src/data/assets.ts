/*
 * Photo roles → files. Every file is a real photo of Sorry Mama from the venue's public 2GIS gallery
 * (guest uploads) or the owner's research pack; provenance and rights in research/ASSET_SELECTION.md.
 * Rights are NOT cleared: public/assets/venue is gitignored and must not be deployed until they are.
 * Box coordinates are in the file's own pixels.
 */
const v = (f: string) => `./assets/venue/${f}`;

export const assets = {
  terrace: { src: v('terrace-master.webp'), w: 1440, h: 1820, focus: { x: 1000, y: 760 } },
  // the same terrace photograph's crown, cut out so the wordmark can pass behind it
  crown: { src: v('terrace-crown-alpha.webp'), x: 690, y: 480, w: 660, h: 680 },
  lounge: { src: v('lounge-master.webp'), w: 1440, h: 2440, focus: { x: 760, y: 1150 } },
  bloom: { src: v('bloom-source.webp'), w: 1440, h: 1800 },
  // lit petals and fairy lights of the lounge tree, keyed from its dark room
  curtain: { src: v('bloom-curtain-alpha.webp'), w: 1440, h: 1180 },
  lanterns: { src: v('lounge-lanterns.webp'), w: 1440, h: 1800 },
  terraceEvening: { src: v('terrace-evening.webp'), w: 1440, h: 1800 },
  terraceCar: { src: v('terrace-car.webp'), w: 1178, h: 800 },
  terraceTree: { src: v('terrace-tree.webp'), w: 1440, h: 1800 },
  carClose: { src: v('terrace-car-close.webp'), w: 961, h: 1280 },
  cocktail: { src: v('lounge-cocktail.webp'), w: 1240, h: 1500 },
} as const;
