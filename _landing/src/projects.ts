// The one place that describes the portfolio. The homepage grid, the pinned
// project and the admin panel all render from this list. To add a work, add an
// entry here; nothing else needs editing.

export interface Project {
  id: number;
  /** stable key, stored in Supabase as the pinned project */
  slug: string;
  title: string;
  description: string;
  /** preview image, 1200×630-ish */
  thumbnail: string;
  href: string;
  tags: string[];
  year: number;
  /** the project's own colour, used for small hover details on its card */
  accent?: string;
  /** external sites open in a new tab */
  external?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: 1,
    slug: 'roman',
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
    title: 'NEXUS Card',
    description: 'Продуктовый лендинг виртуальной карты для оплаты криптовалютой.',
    thumbnail: 'nexus/og.jpg',
    href: 'nexus/',
    tags: ['Финтех', 'Продукт', 'UI'],
    year: 2026,
    accent: '#5b8cff',
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
    title: 'FACEMAIL',
    description:
      'Приватный почтовый клиент: входящие, папки, панель чтения, тёмная и светлая темы. Здесь — урезанная демо-версия, полная работает на facemail.site.',
    thumbnail: 'facemail/og.jpg',
    href: 'facemail/',
    tags: ['Демо-версия', 'Веб-почта', 'UI', 'Продукт'],
    year: 2026,
    accent: '#5b93f5',
  },
  {
    id: 11,
    slug: 'brightline',
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
    title: 'Kvit',
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
