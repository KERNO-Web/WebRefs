// Short write-ups for the commercial works, keyed by project slug. A project
// listed here gets its own page at #/case/<slug>, and its card leads there
// instead of straight to the site. Plain facts only: what was asked, what was
// built, where it runs. Edit the copy here; nothing else needs touching.

export interface Case {
  /** one line under the title */
  lead: string;
  task: string;
  did: string[];
  stack: string[];
  result: string;
  /** label of the button that opens the live work */
  open?: string;
  /** a case told through its work: chapters of media instead of the plain
   *  task / did / result rows (main.ts renders whichever the case has) */
  chapters?: CaseChapter[];
  /** the opening loop under the head of a chapter case */
  hero?: CaseMedia;
  /** who made what, one line per part; keeps the authorship honest */
  credits?: { part: string; who: string }[];
  /** small print under the credits: where the recordings come from */
  note?: string;
}

/** a still or a short muted loop from public/ */
export interface CaseMedia {
  src: string;
  /** a loop gets its first frame as the poster; a still has none */
  poster?: string;
  w: number;
  h: number;
  alt: string;
  caption?: string;
  /** a phone screenshot gets the phone outline */
  phone?: boolean;
}

export type CaseBlock =
  /** one loop across the whole width */
  | { kind: 'band'; media: CaseMedia }
  /** the desktop screen with phone screens beside it */
  | { kind: 'devices'; desktop: CaseMedia; phones: CaseMedia[] }
  /** two rows of two, the wide one swapping sides */
  | { kind: 'grid'; items: CaseMedia[] }
  /** a big loop with a short annotated list beside it */
  | { kind: 'aside'; media: CaseMedia; title: string; points: string[]; flip?: boolean }
  /** a big loop with two stills stacked beside it */
  | { kind: 'trio'; media: CaseMedia; side: CaseMedia[] }
  /** ability panel widths without and with the mod, drawn to Dota's CSS proportions */
  | { kind: 'widths'; caption: string }
  /** real frames stacked on one another with guides on the matching edges (fractions of the width) */
  | { kind: 'aligned'; items: CaseMedia[]; edges: [number, number]; caption: string }
  | { kind: 'facts'; items: string[] };

export interface CaseChapter {
  id: string;
  title: string;
  lead: string;
  /** where it runs, one line */
  where?: string;
  blocks: CaseBlock[];
}

const EPC = 'cases/epc/';

export const CASES: Record<string, Case> = {
  epc: {
    lead: 'Турнирная платформа, графика трансляций и мод интерфейса Dota 2 для третьего сезона EPC.',
    task:
      'Организаторам нужен был свой сайт сезона: где и когда играют, кто с кем, какой счёт, кто прошёл дальше и куда подать заявку. До этого всё жило в гугл-таблице и постах.',
    did: [
      'Сезоны, группы и сетка плей-офф. Таблица очков считается сама: 2:0 даёт три очка, тай-брейки по правилам турнира.',
      'Матч-центр, страницы команд с ростерами, заявки на участие.',
      'Админка с черновиком: правки видны только организаторам, пока их не опубликуют.',
      'Синхронизация с таблицей организаторов: расписание и счёт подтягиваются раз в минуту, сокращения названий команд узнаются\u00a0сами.',
      'Telegram-бот для организаторов.',
      'Для зрителей из России сайт открывается через отдельный сервер в Москве, без VPN.',
    ],
    stack: ['Next.js', 'PostgreSQL', 'Prisma', 'Docker', 'Telegram Bot API'],
    result: 'Расписание, сетка, матчи и заявки сезона собраны на одном сайте вместо таблиц и постов.',
    open: 'Открыть epc-tournament.com',
    hero: {
      src: EPC + 'game.mp4',
      poster: EPC + 'game.webp',
      w: 1920,
      h: 1080,
      alt: 'Игровой HUD EPC Season 3 поверх матча Dota 2',
      caption: 'Игровой HUD Season 3 поверх матча: счёт, драфт, карточка игрока, партнёры. В углу по очереди сменяются SEASON 3 и знак EPC.',
    },
    chapters: [
      {
        id: 'platform',
        title: 'Турнирная платформа',
        lead: 'Свой сайт сезона вместо гугл-таблицы и постов в чатах: где и когда играют, кто с кем, какой счёт и куда подать заявку.',
        blocks: [
          {
            kind: 'devices',
            desktop: { src: EPC + 'site-home.webp', w: 2160, h: 1350, alt: 'Главная страница epc-tournament.com на компьютере' },
            phones: [
              { src: EPC + 'm-home.webp', w: 780, h: 1688, alt: 'Главная страница на телефоне', phone: true },
              { src: EPC + 'm-match.webp', w: 780, h: 1688, alt: 'Матч-центр на телефоне', phone: true },
            ],
          },
          {
            kind: 'grid',
            items: [
              { src: EPC + 'site-groups.webp', w: 2160, h: 960, alt: 'Групповой этап Season 2', caption: 'Группы. Очки считаются сами: 2:0 даёт три очка, тай-брейки по правилам турнира.' },
              { src: EPC + 'site-match.webp', w: 2160, h: 1500, alt: 'Матч-центр финала Season 2', caption: 'Матч-центр: счёт серии, пики и баны, статистика игроков по каждой карте.' },
              { src: EPC + 'site-lineup.webp', w: 2160, h: 1140, alt: 'Команды и ростеры Season 2', caption: 'Команды сезона и их ростеры с ролями.' },
              { src: EPC + 'site-bracket.webp', w: 2160, h: 780, alt: 'Сетка плей-офф Season 2', caption: 'Сетка плей-офф с результатами серий.' },
            ],
          },
          {
            kind: 'facts',
            items: [
              'Заявки команд на участие прямо на сайте.',
              'Админка с черновиком: правки видят только организаторы, пока их не опубликуют.',
              'Синхронизация с таблицей организаторов: расписание и счёт подтягиваются раз в минуту, сокращения названий команд узнаются\u00a0сами.',
              'Telegram-бот для организаторов.',
              'Для зрителей из России сайт открывается через отдельный сервер в Москве, без VPN.',
              'Стек: Next.js, PostgreSQL, Prisma, Docker, Telegram\u00a0Bot\u00a0API.',
            ],
          },
        ],
      },
      {
        id: 'broadcast',
        title: 'Графика трансляций Season 3',
        lead: 'Эфирные сцены для OBS и HUD для LHM.gg, который сам берёт из Dota 2 пики, баны, героев и счёт. Макеты нарисовал дизайнер EPC, я их анимировал, собрал и связал с сайтом.',
        where: 'HUD отдаётся архивом для LHM.gg, остальные сцены подключаются в OBS ссылкой из админки.',
        blocks: [
          {
            kind: 'band',
            media: {
              src: EPC + 'draft.mp4',
              poster: EPC + 'draft.webp',
              w: 1920,
              h: 364,
              alt: 'Экран пиков и банов: выбор героя и открытие пика',
              caption: 'Пики и баны. Таймер, резерв и порядок приходят из игры. Бан гаснет в чёрно-белый со вспышкой, пик открывается шторкой с искрами.',
            },
          },
          {
            kind: 'aside',
            media: {
              src: EPC + 'flow.mp4',
              poster: EPC + 'flow.webp',
              w: 1600,
              h: 900,
              alt: 'Переход из игры в итоговую таблицу через стингер',
              caption: 'После конца карты HUD сам уходит через стингер в итоговую таблицу матча.',
            },
            title: 'Стингер и нагрузка',
            points: [
              'Стингер EPC: фигуры фирменного паттерна собирают логотип и рассыпаются от центра к краям. Один переход на все сцены OBS и внутри HUD.',
              'В OBS в странице живёт только сцена в эфире, скрытые пики больше не крутят видео всю игру.',
              'Паттерн и центр экрана пиков рисуются на canvas с частотой 15\u00a0кадров в секунду.',
              'Видео героев ужаты с 1440 до 480\u00a0пикселей.',
            ],
          },
          {
            kind: 'trio',
            media: {
              src: EPC + 'schedule.mp4',
              poster: EPC + 'schedule.webp',
              w: 1600,
              h: 900,
              alt: 'Сцена расписания с результатами и ближайшими матчами',
              caption: 'Расписание берёт данные с сайта: организатор правит матчи в админке, жмёт «Опубликовать», и обновляются и сайт, и оверлей. На записи скрытый тестовый турнир.',
            },
            side: [
              { src: EPC + 'casters.webp', w: 1600, h: 900, alt: 'Экран кастеров', caption: 'Экран кастеров. Камеры встают в окна рамок.' },
              { src: EPC + 'stats.webp', w: 1600, h: 900, alt: 'Итоговая таблица матча', caption: 'Итоговая таблица: K/D/A, предметы, нейтралка и золото.' },
            ],
          },
        ],
      },
      {
        id: 'mod',
        title: 'Мод интерфейса Dota 2',
        lead: 'У Инвокера, Кез и ещё нескольких героев способностей больше, и нижняя панель Доты становится шире. Из-за этого рамка HUD прыгала от героя к герою. Мод EPC\u00a0Fixed\u00a0Abilities держит панель одной ширины: у героев с шестью и больше способностями иконки просто мельче.',
        where: 'Стоит на ПК кастера вместе с HUD, к нему есть гайд по установке.',
        blocks: [
          {
            kind: 'widths',
            caption: 'Схема, пропорции по стилям самой Доты: способность 58 пикселей, блок сфер Инвокера 80.',
          },
          {
            kind: 'aligned',
            items: [
              { src: EPC + 'mod-alch.webp', w: 1260, h: 220, alt: 'Алхимик: нижняя панель с модом под рамкой HUD' },
              { src: EPC + 'mod-invoker.webp', w: 1260, h: 220, alt: 'Инвокер: нижняя панель с модом под рамкой HUD' },
              { src: EPC + 'mod-kez.webp', w: 1260, h: 220, alt: 'Кез: нижняя панель с модом под рамкой HUD' },
            ],
            edges: [317 / 1260, 757 / 1260],
            caption: 'Кадры из игры с модом и HUD: Алхимик, Инвокер, Кез. Края полосок здоровья и маны совпадают до 1–2\u00a0пикселей, рамка стоит на месте.',
          },
        ],
      },
    ],
    credits: [
      { part: 'Платформа epc-tournament.com', who: 'Разработка: KERNØ. Фирменный стиль и арт: EPC.' },
      { part: 'Графика трансляций', who: 'Макеты графики: дизайнер EPC. Анимация, сборка, HUD для LHM.gg и связь с сайтом: KERNØ.' },
      { part: 'Мод Dota 2 и гайд для кастеров', who: 'Разработка: KERNØ.' },
    ],
    note: 'Скриншоты сайта сняты с завершённого Season 2. В записях эфирной графики данные тестовые, они сделаны с публичных превью. Логотипы и арт принадлежат EPC.',
  },
  facemail: {
    lead: 'Своя почта на своём домене: веб-клиент, почтовый сервер и поддержка.',
    task:
      'Сделать почту, которой можно пользоваться каждый день: свой домен и сервер, без рекламы, с нормальным интерфейсом и поддержкой, до которой легко достучаться.',
    did: [
      'Веб-клиент: входящие, папки, панель чтения, тёмная и светлая темы.',
      'Свой почтовый сервер вместо чужого сервиса, с настройкой доставки писем.',
      'Вход с подтверждением через Telegram.',
      'Поддержка: обращения из Telegram-бота и формы на сайте попадают в одну очередь.',
      'Админка и журнал событий: видно, кто и когда входил и что менялось.',
    ],
    stack: ['Django', 'PostgreSQL', 'Stalwart Mail', 'Docker', 'Caddy'],
    result: 'Свой домен, свой почтовый сервер, веб-клиент и поддержка собраны в один продукт.',
    open: 'Открыть facemail.site',
  },
  roman: {
    lead: 'Личный сайт специалиста по контенту, событиям и коммуникациям.',
    task:
      'Роману нужна была одна ссылка, которую можно отправить вместо резюме и презентации: кто он, что делал и как с ним связаться.',
    did: [
      'Первый экран с фото и коротким рассказом о себе.',
      'Реальные работы: фото и видео с событий, которые прислал сам Роман.',
      'Контакты, до которых не нужно листать весь сайт.',
      'Плавный скролл и аккуратная адаптация под телефон.',
    ],
    stack: ['React', 'TypeScript', 'Vite'],
    result: 'Опубликован, обновления выходят на сайт автоматически.',
    open: 'Открыть сайт',
  },
  sorrymama: {
    lead: 'Сайт рест-лаунжа в Казани: днём терраса, вечером зал под цветущим деревом.',
    task:
      'Показать, что Sorry Mama — два места в одном: дневная терраса и вечерний лаунж. И дать гостю главное: меню и бронь стола.',
    did: [
      'Первый экран-переход: цветы закрывают название, и при скролле день сменяется ночью.',
      'Только настоящие фото заведения, без стоковых картинок.',
      'Меню перенесено с актуальных карточек заведения: без выдуманных блюд и цен, отдельной страницей с фото.',
      'Форма брони стола: гости, имя, телефон.',
    ],
    stack: ['TypeScript', 'Vite', 'GSAP', 'Canvas'],
    result: 'Сайт собран и опубликован, меню и бронь вынесены в шапку отдельными кнопками.',
    open: 'Открыть сайт',
  },
};
