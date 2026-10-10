// The one place that describes the portfolio. The homepage grid, the pinned
// project and the admin panel all render from this list. To add a work, add an
// entry here; nothing else needs editing.

export interface Project {
  id: number;
  /** stable key, stored in Supabase as the pinned project */
  slug: string;
  title: string;
  description: string;
  /** shipped for a real person or business; everything else is a self-initiated concept */
  real?: boolean;
  /** preview image, 1200×630-ish */
  thumbnail: string;
  href: string;
  tags: string[];
  year: number;
  /** the project's own colour, used for small hover details on its card */
  accent?: string;
  /** external sites open in a new tab */
  external?: boolean;
  /**
   * The preview's own quiet idle behaviour on the homepage (see ambient.css).
   * Each work gets a different one, so no two cards move alike.
   */
  idle?: Idle;
}

export type Idle =
  | 'breathe' // photo breathes, a warm light gathers by the red folder now and then
  | 'haze' // smoke drifts, the frame barely shifts against it
  | 'tonal' // a soft highlight wanders over the object
  | 'sweep' // a reflection crosses the card from time to time
  | 'depth' // the frame floats a pixel or two
  | 'crop' // the crop slides very slowly
  | 'streak' // a light line runs along the bodywork from time to time
  | 'ember' // warm light rises and falls at the bottom
  | 'glow' // a soft teal light travels across the panel
  | 'shade'; // a soft shadow band slides down the interface

export const PROJECTS: Project[] = [
  {
    id: 1,
    slug: 'roman',
    idle: 'breathe',
    real: true,
    title: 'Роман Переверзев',
    description: 'Персональный сайт о контенте, событиях и коммуникациях — с реальными работами, фото и контактами.',
    thumbnail: 'previews/roman.jpg',
    href: 'https://kerno-web.github.io/portfolio/',
    tags: ['Персональный бренд', 'React', 'Лендинг'],
    year: 2026,
    accent: '#e5383f',
    external: true,
  },
  {
    id: 2,
    slug: 'key01',
    idle: 'depth',
    title: 'KEY/01',
    description: 'Яркий интерактивный showcase механической клавиатуры с 3D и анимацией.',
    thumbnail: 'key01/og.jpg',
    href: 'key01/',
    tags: ['Three.js', '3D', 'Анимация'],
    year: 2026,
    accent: '#3d5bff',
  },
  {
    id: 3,
    slug: 'afterimage',
    idle: 'crop',
    title: 'Afterimage',
    description: 'Экспериментальный editorial-сайт вокруг музыки, фотографии и типографики.',
    thumbnail: 'afterimage/og.jpg',
    href: 'afterimage/',
    tags: ['Editorial', 'Фотография', 'Типографика'],
    year: 2026,
    accent: '#c9c9cf',
  },
  {
    id: 4,
    slug: 'noctis',
    idle: 'haze',
    title: 'NOCTIS',
    description: 'Визуальная кампания вымышленного парфюмерного бренда.',
    thumbnail: 'noctis/og.jpg',
    href: 'noctis/',
    tags: ['WebGL', 'Кампания', 'Моушн'],
    year: 2026,
    accent: '#c8a27a',
  },
  {
    id: 5,
    slug: 'null',
    idle: 'tonal',
    title: 'NULL',
    description: 'Абстрактный digital-объект и эксперимент с формой, движением и WebGL.',
    thumbnail: 'null/og.jpg',
    href: 'null/',
    tags: ['Three.js', 'Шейдеры', 'Эксперимент'],
    year: 2026,
    accent: '#e9e6df',
  },
  {
    id: 6,
    slug: 'witcher',
    idle: 'ember',
    title: 'Wild Hunt',
    description: 'Визуальный трибьют The Witcher 3.',
    thumbnail: 'witcher/og.jpg',
    href: 'witcher/',
    tags: ['Трибьют', 'Атмосфера', 'Два языка'],
    year: 2026,
    accent: '#ff5a1f',
  },
  {
    id: 7,
    slug: 'ranked',
    title: 'RANKED',
    description: 'Концепт игрового сервиса с акцентом на каталоге и визуальном стиле.',
    thumbnail: 'ranked/og.jpg',
    href: 'ranked/',
    tags: ['E-commerce', 'Каталог', 'UI'],
    year: 2026,
    accent: '#ffd447',
  },
  {
    id: 8,
    slug: 'nexus',
    idle: 'sweep',
    title: 'TapShift',
    description: 'Интерактивный продукт крипто-карты: онбординг, кабинет, платежи, обмен и управление картой.',
    thumbnail: 'nexus/og.jpg',
    href: 'nexus/',
    tags: ['Финтех', 'Продукт', 'UI'],
    year: 2026,
    accent: '#59d9ff',
  },
  {
    id: 9,
    slug: 'route',
    title: 'ROUTE',
    description: 'Спокойный трекер посылок: реальная карта, фото товаров, статусы.',
    thumbnail: 'route/og.jpg',
    href: 'route/',
    tags: ['Сервис', 'Карта', 'Интерфейс'],
    year: 2026,
    accent: '#2ca07a',
  },
  {
    id: 10,
    slug: 'facemail',
    idle: 'shade',
    real: true,
    title: 'FACEMAIL',
    description:
      'Приватный почтовый клиент: входящие, папки, панель чтения, тёмная и светлая темы. Работает на facemail.site.',
    thumbnail: 'previews/facemail.jpg',
    href: 'https://facemail.site',
    tags: ['Веб-почта', 'UI', 'Продукт'],
    year: 2026,
    accent: '#5b93f5',
    external: true,
  },
  {
    id: 11,
    slug: 'brightline',
    idle: 'streak',
    title: 'BRIGHTLINE',
    description: 'Сайт детейлинг-студии: до/после на одном кадре, услуги с ценами, реальные кейсы и запись на осмотр.',
    thumbnail: 'brightline/og.jpg',
    href: 'brightline/',
    tags: ['Детейлинг', 'Локальный бизнес', 'Интерфейс'],
    year: 2026,
    accent: '#ff4d2e',
  },
  {
    id: 12,
    slug: 'kvit',
    idle: 'glow',
    title: 'KVIT',
    description:
      'Приём криптовалюты для бизнеса: сайт продукта и рабочее демо — касса с QR, экран оплаты, счета, ссылки, возвраты и выплаты в USDT. Два языка, реальные курсы.',
    thumbnail: 'kvit/og.jpg',
    href: 'kvit/',
    tags: ['Финтех', 'Продукт', 'Демо'],
    year: 2026,
    accent: '#0e7c6e',
  },
];

/** Pinned when Supabase is not configured or cannot be reached. */
export const DEFAULT_FEATURED = 'roman';

export const bySlug = (slug: string | null | undefined) => PROJECTS.find((p) => p.slug === slug);
