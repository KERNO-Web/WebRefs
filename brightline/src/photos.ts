// Every photograph on the site. Each slot has a large file and a "-sm" file at
// half the size. To put a real studio's work here: replace the files in
// public/photos, keep the names, and update the sizes, focal points and alt text.

export interface Photo {
  name: string;
  w: number;
  h: number;
  /** CSS object-position: the point a crop holds on to */
  pos: string;
  /** focal point on narrow portrait screens */
  posM?: string;
  alt: string;
}

const p = (name: string, w: number, h: number, pos: string, alt: string, posM?: string): Photo => ({
  name,
  w,
  h,
  pos,
  alt,
  posM,
});

export const PHOTOS = {
  hero: p('hero', 2340, 3681, '50% 82%', 'Белый Audi Q7 в боксе, на капоте отражаются линейные лампы', '42% 76%'),
  before: p('ba-before', 2400, 2083, '50% 50%', 'Тот же кузов до полировки: мутный лак и голограммы', '30% 50%'),
  after: p('ba-after', 2400, 2083, '50% 50%', 'Чёрный Mercedes-Benz после полировки, ровные отражения ламп', '30% 50%'),
  services: {
    polish: p('s-polish', 2400, 1600, '40% 50%', 'Мастер полирует капот чёрного автомобиля'),
    coat: p('s-coat', 1600, 2400, '50% 45%', 'Синий BMW после нанесения керамики, отражения в боксе'),
    film: p('s-film', 2400, 1360, '55% 50%', 'Мастер оклеивает фару антигравийной плёнкой'),
    interior: p('s-interior', 1920, 2400, '50% 60%', 'Очистка руля микрофиброй'),
  },
  process: {
    inspect: p('p-inspect', 2358, 2395, '58% 52%', 'Мастер с налобным фонарём осматривает лак у фары'),
    correct: p('p-correct', 2400, 1600, '45% 50%', 'Полировка капота у фары'),
    protect: p('p-protect', 2400, 1597, '55% 45%', 'Нанесение защитного состава на передний бампер'),
  },
  works: {
    bmw: p('w-bmw', 2800, 1890, '50% 55%', 'Чёрный BMW M5 в боксе после выдачи'),
    bmwDetail: p('w-bmw-d', 2400, 1600, '50% 55%', 'Фара и капот BMW после полировки'),
    gle: p('w-gle', 2400, 1600, '50% 62%', 'Mercedes-Benz GLE в сатиновой плёнке, вид сбоку'),
    gleDetail: p('w-gle-d', 2400, 1600, '45% 45%', 'Фара GLE и матовая плёнка на крыле'),
    gleRear: p('w-gle-r', 1600, 2400, '60% 45%', 'Заднее крыло GLE в сатиновой плёнке'),
    rs6: p('w-rs6', 2400, 1597, '42% 52%', 'Чёрный Audi RS6 Avant в светлом боксе'),
    rs6Detail: p('w-rs6-d', 1500, 1200, '50% 50%', 'Заднее колесо и фонарь RS6 крупно'),
  },
  cta: p('cta', 2400, 1600, '40% 60%', 'Серый Mercedes-Benz E-Class в боксе студии'),
};

export const src = (ph: Photo, small = false) => `photos/${ph.name}${small ? '-sm' : ''}.webp`;
export const srcSet = (ph: Photo) => `${src(ph, true)} ${Math.round(ph.w / 2)}w, ${src(ph)} ${ph.w}w`;

export const CREDITS = [
  'Mohammad Aqhib',
  'Vladyslav Lytvyshchenko',
  'Vitali Adutskevich',
  'Winston Tjia',
  'Deniz Demirci',
  'Muhammad Saad',
  'serjan midili',
  'Rana Singh',
  'Eyosias G',
  'Lukáš Parničan',
];
