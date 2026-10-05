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
const FRAUENFELD = 'SonusAA30';
const BP = 'PinkBeachPlanet';
const COMEUP = 'The Come Up Show';

export const PHOTOS = {
  hero: p('hero', '50% 18%', 'A$AP Rocky in a white suit at Cannes, 2025', CANNES),
  presence: p('presence', '50% 30%', 'A$AP Rocky kicking through smoke and flame on stage, Openair Frauenfeld 2025', FRAUENFELD),
  presenceInset: p('presence-inset', '50% 30%', 'A$AP Rocky at the microphone, Coachella 2012', COACHELLA),
  persona: p('persona', '46% 28%', 'A$AP Rocky smiling, SXSW 2019', SXSW),
  frames: [
    p('frame1', '32% 40%', 'A$AP Rocky gesturing on stage, SXSW 2019', SXSW),
    p('frame2', '50% 26%', 'A$AP Rocky performing, Coachella 2012', COACHELLA),
    p('frame3', '50% 30%', 'A$AP Rocky seated on stage, SXSW 2019', SXSW),
    p('frame4', '50% 28%', 'A$AP Rocky on stage under lights, Coachella 2012', COACHELLA),
    p('frame5', '50% 55%', 'A stadium crowd facing the stage, 2025', BP),
    p('frame6', '50% 40%', 'Detail: hand and rings on an armchair, SXSW 2019', SXSW),
  ],
  tracks: [
    p('t01', '50% 50%', 'Stage lights', BP),
    p('t02', '50% 50%', 'Earring', CANNES),
    p('t03', '50% 40%', 'Light beams', COACHELLA),
    p('t04', '50% 50%', 'Smoke and flame', FRAUENFELD),
    p('t05', '50% 40%', 'Megaphone', FRAUENFELD),
    p('t06', '50% 50%', 'Ring', SXSW),
    p('t07', '50% 50%', 'Belt buckle', CANNES),
    p('t08', '50% 40%', 'Microphone', COACHELLA),
    p('t09', '50% 60%', 'Name card', SXSW),
    p('t10', '50% 50%', 'Stadium screen', BP),
  ],
  fashion: p('fashion', '44% 50%', 'Detail: hand, ring and white tailoring', CANNES),
  fashionInset: p('fashion-inset', '50% 50%', 'Detail: plaid lining and a leather sole', SXSW),
  final: p('final', '50% 30%', 'A$AP Rocky in a hood, backlit, 2013', COMEUP),
};

const BYSA = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' };
const BY2 = { license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' };
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

/** Sources on Wikimedia Commons; images are cropped and converted to black and white. */
export const CREDITS = [
  { who: CANNES, what: 'A$AP Rocky at the 2025 Cannes Film Festival', url: commons('A$AP_Rocky_at_the_2025_Cannes_Film_Festival.jpg'), ...BYSA },
  { who: FRAUENFELD, what: 'A$AP Rocky am Openair Frauenfeld 2025', url: commons('A$AP_Rocky_am_Openair_Frauenfeld_2025.jpg'), ...BYSA },
  { who: BP, what: 'BP25 A$AP', url: commons('BP25_A$AP.jpg'), ...BYSA },
  { who: SXSW, what: 'South by Southwest 2019', url: commons('South_by_Southwest_2019_2_-_46628270334.jpg'), ...BY2 },
  { who: COMEUP, what: 'ASAP Rocky 2013 December', url: commons('ASAP_Rocky_2013_December.jpg'), ...BY2 },
  { who: COACHELLA, what: 'ASAP Rocky, Coachella 2012', url: commons('ASAP_Rocky_Coachella_2012_2.jpg'), ...BY2 },
];
