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
  /** overrides the «Коммерческий проект / Авторский концепт» line, e.g. for an own working tool */
  label?: string;
  /** preview image, 1200×630-ish */
  thumbnail: string;
  href: string;
  tags: string[];
  /** homepage filter groups; one work can sit in several */
  cats: Cat[];
  year: number;
  /** the project's own colour, used for small hover details on its card */
  accent?: string;
  /** external sites open in a new tab */
  external?: boolean;
}

export type Cat = 'sites' | 'apps' | 'bots' | 'auto';

/** Filter chips on the homepage, in display order. */
export const CATS: { id: Cat; name: string }[] = [
  { id: 'sites', name: 'Сайты' },
  { id: 'apps', name: 'Продукты' },
  { id: 'bots', name: 'Боты' },
  { id: 'auto', name: 'Автоматизация' },
];

export const PROJECTS: Project[] = [
  {
    id: 18,
    slug: 'zelevarnya',
    cats: ['sites'],
    title: 'Зельеварня',
    description:
      'Коктейльный бар-гримуар. Первый экран — гравюра: каменная арка с рунами и щупальца. При прокрутке двери подвала распахиваются, и вы покадрово спускаетесь по ступеням прямо в бар. Дальше ритуал, меню и зал на крупных фото, бронь по схеме зала.',
    thumbnail: 'covers/zelevarnya.jpg',
    href: 'zelevarnya/',
    tags: ['Арт-дирекшн', 'Scroll-анимация', 'Бронь'],
    year: 2026,
    accent: '#7bd63a',
  },
  {
    id: 1,
    slug: 'roman',
    cats: ['sites'],
    real: true,
    title: 'Роман Переверзев',
    description: 'Персональный сайт о контенте, событиях и коммуникациях — с реальными работами, фото и контактами.',
    thumbnail: 'covers/roman.jpg',
    href: 'https://kerno-web.github.io/portfolio/',
    tags: ['Персональный бренд', 'React', 'Лендинг'],
    year: 2026,
    accent: '#e5383f',
    external: true,
  },
  {
    id: 2,
    slug: 'key01',
    cats: ['sites'],
    title: 'KEY/01',
    description: 'Яркий интерактивный showcase механической клавиатуры с 3D и анимацией.',
    thumbnail: 'covers/key01.jpg',
    href: 'key01/',
    tags: ['Three.js', '3D', 'Анимация'],
    year: 2026,
    accent: '#3d5bff',
  },
  {
    id: 3,
    slug: 'afterimage',
    cats: ['sites'],
    title: 'Afterimage',
    description: 'Экспериментальный editorial-сайт вокруг музыки, фотографии и типографики.',
    thumbnail: 'covers/afterimage.jpg',
    href: 'afterimage/',
    tags: ['Editorial', 'Фотография', 'Типографика'],
    year: 2026,
    accent: '#c9c9cf',
  },
  {
    id: 4,
    slug: 'noctis',
    cats: ['sites'],
    title: 'NOCTIS',
    description: 'Визуальная кампания вымышленного парфюмерного бренда.',
    thumbnail: 'covers/noctis.jpg',
    href: 'noctis/',
    tags: ['WebGL', 'Кампания', 'Моушн'],
    year: 2026,
    accent: '#c8a27a',
  },
  {
    id: 5,
    slug: 'null',
    cats: ['sites'],
    title: 'NULL',
    description: 'Абстрактный digital-объект и эксперимент с формой, движением и WebGL.',
    thumbnail: 'covers/null.jpg',
    href: 'null/',
    tags: ['Three.js', 'Шейдеры', 'Эксперимент'],
    year: 2026,
    accent: '#e9e6df',
  },
  {
    id: 6,
    slug: 'witcher',
    cats: ['sites'],
    title: 'Wild Hunt',
    description: 'Визуальный трибьют The Witcher 3.',
    thumbnail: 'covers/witcher.jpg',
    href: 'witcher/',
    tags: ['Трибьют', 'Атмосфера', 'Два языка'],
    year: 2026,
    accent: '#ff5a1f',
  },
  {
    id: 7,
    slug: 'ranked',
    cats: ['sites'],
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
    cats: ['apps'],
    title: 'TapShift',
    description: 'Интерактивный продукт крипто-карты: онбординг, кабинет, платежи, обмен и управление картой.',
    thumbnail: 'covers/nexus.jpg',
    href: 'nexus/',
    tags: ['Финтех', 'Продукт', 'UI'],
    year: 2026,
    accent: '#59d9ff',
  },
  {
    id: 9,
    slug: 'route',
    cats: ['apps'],
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
    cats: ['apps'],
    real: true,
    title: 'FACEMAIL',
    description:
      'Приватный почтовый клиент: входящие, папки, панель чтения, тёмная и светлая темы. Работает на facemail.site.',
    thumbnail: 'covers/facemail.jpg',
    href: 'https://facemail.site',
    tags: ['Веб-почта', 'UI', 'Продукт'],
    year: 2026,
    accent: '#5b93f5',
    external: true,
  },
  {
    id: 11,
    slug: 'brightline',
    cats: ['sites'],
    title: 'BRIGHTLINE',
    description: 'Сайт детейлинг-студии: до/после на одном кадре, услуги с ценами, реальные кейсы и запись на осмотр.',
    thumbnail: 'covers/brightline.jpg',
    href: 'brightline/',
    tags: ['Детейлинг', 'Локальный бизнес', 'Интерфейс'],
    year: 2026,
    accent: '#ff4d2e',
  },
  {
    id: 12,
    slug: 'kvit',
    cats: ['apps'],
    title: 'KVIT',
    description:
      'Приём криптовалюты для бизнеса: сайт продукта и рабочее демо — касса с QR, экран оплаты, счета, ссылки, возвраты и выплаты в USDT. Два языка, реальные курсы.',
    thumbnail: 'covers/kvit.jpg',
    href: 'kvit/',
    tags: ['Финтех', 'Продукт', 'Демо'],
    year: 2026,
    accent: '#0e7c6e',
  },
  {
    id: 13,
    slug: 'lumi',
    cats: ['sites', 'apps'],
    title: 'LUMI',
    description:
      'Сайт студии маникюра с онлайн-записью: прайс, работы по мастерам, запись только на реально свободные окна и кабинет мастера с графиком.',
    thumbnail: 'covers/lumi.jpg',
    href: 'https://kerno-web.github.io/nails-beauty/',
    tags: ['Бьюти', 'Онлайн-запись', 'Локальный бизнес'],
    year: 2026,
    accent: '#c9a49a',
    external: true,
  },
  {
    id: 14,
    slug: 'sorrymama',
    cats: ['sites'],
    real: true,
    title: 'SORRY MAMA',
    description:
      'Сайт рест-лаунжа в Казани: дневная терраса уходит в вечерний зал под цветущим деревом, меню с фото блюд и бронь стола.',
    thumbnail: 'covers/sorrymama.jpg',
    href: 'sorrymama/',
    tags: ['Ресторан', 'Локальный бизнес', 'Интерфейс'],
    year: 2026,
    accent: '#e4afb9',
  },
  {
    id: 15,
    slug: 'epc',
    cats: ['apps', 'sites'],
    real: true,
    title: 'Esports Pro Circuit',
    description:
      'Турнирная платформа по Dota 2: сезоны, сетки, матч-центр, ростеры, заявки команд и админка. Работает на epc-tournament.com.',
    thumbnail: 'covers/epc.jpg',
    href: 'https://epc-tournament.com',
    tags: ['Киберспорт', 'Платформа', 'Next.js'],
    year: 2026,
    accent: '#ff2a2a',
    external: true,
  },
  {
    id: 16,
    slug: 'orderradar',
    cats: ['bots', 'auto'],
    label: 'Рабочий Telegram-бот',
    title: 'Order Radar',
    description:
      'Telegram-бот, который каждые 5 минут обходит биржи и чаты, отсеивает мусор и присылает карточку заказа с готовым откликом.',
    thumbnail: 'covers/orderradar.jpg',
    href: 'orderradar/',
    tags: ['Telegram-бот', 'Парсинг', 'Python'],
    year: 2026,
    accent: '#3aa9e6',
  },
  {
    id: 22,
    slug: 'geekradar',
    cats: ['bots', 'auto'],
    label: 'Рабочий Telegram-бот',
    title: 'Geek Radar',
    description:
      'Радар гик-новостей для редактора игрового канала: опрашивает десятки источников, склеивает дубли в одну историю, отсеивает нишевое и присылает только то, что стоит поста.',
    thumbnail: 'covers/geekradar.jpg',
    href: 'geekradar/',
    tags: ['Telegram-бот', 'Парсинг', 'Python'],
    year: 2026,
    accent: '#ffd400',
  },
  {
    id: 17,
    slug: 'miniapp',
    cats: ['bots'],
    label: 'Telegram Mini App',
    title: 'Оранжерея',
    description:
      'Магазин цветов внутри Telegram: каталог, размеры и открытка с живой ценой, корзина, оформление и заказ менеджеру в бота.',
    thumbnail: 'covers/miniapp.jpg',
    href: 'https://kerno-web.github.io/tg-miniapp-shop/',
    tags: ['Mini App', 'E-commerce', 'React'],
    year: 2026,
    accent: '#d6482c',
    external: true,
  },
  {
    id: 19,
    slug: 'assistant',
    cats: ['auto', 'apps'],
    label: 'Рабочее демо',
    title: 'Справочная',
    description:
      'AI-ассистент по документам компании: отвечает сотрудникам и клиентам сайта со ссылкой на пункт регламента. Можно загрузить свой PDF и спросить по нему.',
    thumbnail: 'covers/assistant.jpg',
    href: 'assistant/',
    tags: ['AI-ассистент', 'Поиск по документам', 'Виджет'],
    year: 2026,
    accent: '#4dbb8f',
  },
  {
    id: 20,
    slug: 'crm',
    cats: ['auto', 'apps'],
    label: 'Рабочее демо',
    title: 'Ангара CRM',
    description:
      'Учёт заявок для мастерской кухонь: воронка с перетаскиванием, задачи, автоматизации на каждом этапе, отчёт по деньгам и права менеджера.',
    thumbnail: 'covers/crm.jpg',
    href: 'crm/',
    tags: ['CRM', 'Автоматизация', 'Отчёты'],
    year: 2026,
    accent: '#ff7547',
  },
  {
    id: 21,
    slug: 'servicebot',
    cats: ['bots', 'auto'],
    label: 'Рабочее демо',
    title: 'Отвёртка',
    description:
      'Telegram-бот сервисного центра: клиент сдаёт технику в ремонт и получает статусы, мастер ведёт заявки в панели, оплата и рассылка там же.',
    thumbnail: 'covers/servicebot.jpg',
    href: 'servicebot/',
    tags: ['Telegram-бот', 'Статусы ремонта', 'Оплата'],
    year: 2026,
    accent: '#4b9bf5',
  },
];

/** Pinned when Supabase is not configured or cannot be reached. */
export const DEFAULT_FEATURED = 'roman';

export const bySlug = (slug: string | null | undefined) => PROJECTS.find((p) => p.slug === slug);
