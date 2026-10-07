// Every photograph on the site, in one place. Each slot has a large file and a
// "-sm" file at half the size (see unsplash-credits.txt for sources). To rebrand
// the studio, replace the files in public/photos and adjust `pos` (the focal
// point the crops hold on to) and the alt text here.

export interface Photo {
  name: string;
  /** width of the large file; the small one is half */
  w: number;
  h: number;
  pos: string;
  /** focal point for narrow (portrait) screens */
  posMobile?: string;
  alt: string;
}

const p = (name: string, w: number, h: number, pos: string, alt: string, posMobile?: string): Photo => ({
  name,
  w,
  h,
  pos,
  alt,
  posMobile,
});

export const PHOTOS = {
  hero: p('hero', 2400, 1371, '50% 50%', 'Тёмный спорткар в студии, свет скользит по капоту', '46% 50%'),
  surface: p('surface', 1600, 2400, '50% 50%', 'Чёрный лак крупно: отражения ложатся на кузов без искажений'),
  transform: p('transform', 2400, 1600, '50% 50%', 'Крыло чёрного автомобиля после полировки', '38% 50%'),
  transformDull: p('transform-dull', 2400, 1600, '50% 50%', '', '38% 50%'),
  services: {
    wash: p('s-wash', 2400, 1600, '40% 50%', 'Микрофибра на капоте чёрного автомобиля'),
    polish: p('s-polish', 1800, 2400, '50% 40%', 'Мастер полирует кузов чёрного автомобиля'),
    ceramic: p('s-ceramic', 2400, 1600, '40% 50%', 'Фара и капот с керамическим покрытием, в лаке отражаются деревья'),
    film: p('s-film', 2400, 1354, '60% 50%', 'Мастер прикатывает защитную плёнку на фару'),
    interior: p('s-interior', 1600, 2400, '50% 60%', 'Кожаный салон с ромбовидной прострочкой'),
  },
  material: {
    paint: p('m-paint', 2400, 1600, '30% 50%', 'Кромка капота, глубокий тёмный лак'),
    light: p('m-light', 2400, 1800, '50% 50%', 'Светодиодная фара крупным планом'),
    wheel: p('m-wheel', 2400, 1600, '50% 50%', 'Спица литого диска и тормозной суппорт'),
  },
  work: {
    silver: p('g-silver', 2400, 1106, '50% 40%', 'Серебристый Porsche 911 в тёмной студии', '58% 50%'),
    studio: p('g-studio', 2400, 1600, '50% 58%', 'Серебристый Porsche 911 Turbo в светлом боксе'),
    front: p('g-front', 1350, 2400, '50% 50%', 'Передняя часть серебристого Porsche 911 GT3'),
    night: p('g-night', 1920, 2400, '50% 60%', 'Тёмный Porsche на брусчатке ночью'),
    garage: p('g-garage', 1599, 2400, '50% 66%', 'Тёмный автомобиль под лампами подземного паркинга', '50% 60%'),
  },
  final: p('final', 2400, 1600, '62% 50%', 'Силуэт чёрного автомобиля, в стекле отражаются деревья', '70% 50%'),
};

export const src = (ph: Photo, small = false) => `photos/${ph.name}${small ? '-sm' : ''}.webp`;
export const srcSet = (ph: Photo) => `${src(ph, true)} ${Math.round(ph.w / 2)}w, ${src(ph)} ${ph.w}w`;

export const CREDITS = [
  'Tuna Ekici',
  'Daniel Bayer',
  'Anshul Gurjar',
  'GoGoNano',
  'Zac Nielson',
  'Tobias Mockenhaupt',
  'Deniz Demirci',
  'Ján Vlačuha',
  'atelierbyvineeth',
  'Voicu Apostol',
  'Ian Edokov',
  'yokatan',
  'Yuvraj Singh',
  'Eddy Tilmant',
  'Ville Kaisla',
  'Pascal Garten',
  'Joel Durkee',
];
