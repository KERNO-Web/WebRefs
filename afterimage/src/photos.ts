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

export const PHOTOS = {
  hero: p('hero', '50% 28%', 'A$AP Rocky, portrait'),
  presence: p('presence', '50% 20%', 'A$AP Rocky, full figure'),
  persona: p('persona', '50% 32%', 'A$AP Rocky, close portrait'),
  frames: [
    p('frame1', '50% 40%', 'Frame 01'),
    p('frame2', '50% 30%', 'Frame 02'),
    p('frame3', '50% 35%', 'Frame 03'),
    p('frame4', '50% 25%', 'Frame 04'),
    p('frame5', '50% 40%', 'Frame 05'),
  ],
  fashion: p('fashion', '50% 50%', 'Detail: jewellery and tailoring'),
  final: p('final', '50% 26%', 'A$AP Rocky, final portrait'),
};

export const CREDITS: string[] = [];
