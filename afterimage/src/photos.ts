// Every photograph on the site, in one place. Swap a file in public/photos
// and adjust its focal point here; layouts crop around `pos`.

export interface Photo {
  src: string;
  /** CSS object-position: where the crop should hold on to */
  pos: string;
  alt: string;
  credit?: string;
}

const p = (name: string, pos: string, alt: string, credit?: string): Photo => ({
  src: `photos/${name}.jpg`,
  pos,
  alt,
  credit,
});

const CANNES = 'Gabriel Hutchinson';
const SXSW = 'DannyB Photos';
const COACHELLA = 'David Hwang';

export const PHOTOS = {
  hero: p('hero', '50% 18%', 'A$AP Rocky in a white suit at Cannes, 2025', CANNES),
  presence: p('presence', '50% 12%', 'A$AP Rocky, full figure, Cannes 2025', CANNES),
  persona: p('persona', '50% 34%', 'A$AP Rocky, close portrait, Cannes 2025', CANNES),
  frames: [
    p('frame1', '32% 40%', 'A$AP Rocky gesturing on stage, SXSW 2019', SXSW),
    p('frame2', '50% 26%', 'A$AP Rocky performing, Coachella 2012', COACHELLA),
    p('frame3', '50% 38%', 'A$AP Rocky laughing, SXSW 2019', SXSW),
    p('frame4', '50% 28%', 'A$AP Rocky at the microphone, Coachella 2012', COACHELLA),
    p('frame5', '62% 50%', 'A$AP Rocky on stage under lights, Coachella 2012', COACHELLA),
  ],
  fashion: p('fashion', '44% 50%', 'Detail: hand, ring and white tailoring', CANNES),
  final: p('final', '46% 30%', 'A$AP Rocky smiling, SXSW 2019', SXSW),
};

/** Sources on Wikimedia Commons; images are cropped and converted to black and white. */
export const CREDITS = [
  {
    who: CANNES,
    what: 'A$AP Rocky at the 2025 Cannes Film Festival',
    license: 'CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:A$AP_Rocky_at_the_2025_Cannes_Film_Festival.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    who: SXSW,
    what: 'South by Southwest 2019',
    license: 'CC BY 2.0',
    url: 'https://commons.wikimedia.org/wiki/File:South_by_Southwest_2019_2_-_46628270334.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    who: COACHELLA,
    what: 'ASAP Rocky, Coachella 2012',
    license: 'CC BY 2.0',
    url: 'https://commons.wikimedia.org/wiki/File:ASAP_Rocky_Coachella_2012_2.jpg',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
];
