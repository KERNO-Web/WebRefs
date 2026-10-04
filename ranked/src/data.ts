import type { Txt } from './i18n';

export type GameId = 'cs2' | 'dota' | 'val' | 'lol' | 'gta';
export type Cat = 'rank' | 'calib' | 'wins' | 'coach' | 'other';

const r = (ru: string, en: string): Txt => ({ ru, en });

export type Game = { id: GameId; name: string; short: string; color: string; tile: string; mosaic: string };

export const GAMES: Game[] = [
  { id: 'cs2', name: 'Counter-Strike 2', short: 'CS2', color: '#f2a43a', tile: 'g-cs2', mosaic: 'm-cs2' },
  { id: 'dota', name: 'Dota 2', short: 'Dota 2', color: '#e5492f', tile: 'g-dota', mosaic: 'm-dota' },
  { id: 'val', name: 'Valorant', short: 'Valorant', color: '#ff4655', tile: 'g-val', mosaic: 'm-val' },
  { id: 'lol', name: 'League of Legends', short: 'LoL', color: '#c8aa6e', tile: 'g-lol', mosaic: 'm-lol' },
  { id: 'gta', name: 'GTA Online', short: 'GTA Online', color: '#f05bc5', tile: 'g-gta', mosaic: 'm-gta' },
];
export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!;

/* ---------- configurators ---------- */

export type Tier = { at: number; label?: string | Txt; color: string; icon?: string };

/** A number you climb: ELO, MMR, CS Rating, profile level. Price is the sum of per-unit rates across tiers. */
export type Rating = {
  kind: 'rating';
  unit: string | Txt;
  min: number;
  max: number;
  step: number;
  from: number;
  to: number;
  minGap: number;
  tiers: Tier[];
  rates: number[];
  perDay: number;
  chips: number[];
  /** FACEIT is read as levels ("FACEIT 5 → 7"), everything else by the number itself. */
  headline: 'tier' | 'value';
  prefix: string;
  badge: 'faceit' | 'medal' | 'stripe' | 'none';
};

/** Discrete ranks with emblems (Valorant, LoL). */
export type Ladder = { kind: 'ladder'; rungs: { label: Txt; color: string; icon: string }[]; steps: number[]; from: number; to: number; dayPerStep: number };

/** Matches, wins, hours, millions. */
export type Qty = { kind: 'qty'; question: Txt; unit: [Txt, Txt, Txt]; min: number; max: number; step: number; def: number; per: number; perDay: number; chips: number[] };

export type Extra = { id: string; label: Txt; pct: number };

export type Service = {
  id: string;
  game: GameId;
  cat: Cat;
  title: Txt;
  desc: Txt;
  rating: number;
  orders: number;
  sale?: number;
  modes?: boolean;
  extras: Extra[];
  includes: Txt[];
  cfg: Rating | Ladder | Qty;
};

const PRIORITY: Extra = { id: 'priority', label: r('Приоритетный старт', 'Priority start'), pct: 15 };
const STREAM: Extra = { id: 'stream', label: r('Трансляция игр', 'Live stream of the games'), pct: 10 };
const SCHEDULE: Extra = { id: 'schedule', label: r('Играть только в указанное время', 'Play only at set hours'), pct: 0 };
const RECORD: Extra = { id: 'record', label: r('Запись разбора', 'Recording of the session'), pct: 10 };

const U = {
  wins: [r('победа', 'win'), r('победы', 'wins'), r('побед', 'wins')] as [Txt, Txt, Txt],
  matches: [r('матч', 'match'), r('матча', 'matches'), r('матчей', 'matches')] as [Txt, Txt, Txt],
  hours: [r('час', 'hour'), r('часа', 'hours'), r('часов', 'hours')] as [Txt, Txt, Txt],
  heists: [r('ограбление', 'heist'), r('ограбления', 'heists'), r('ограблений', 'heists')] as [Txt, Txt, Txt],
  mil: [r('млн GTA$', 'M GTA$'), r('млн GTA$', 'M GTA$'), r('млн GTA$', 'M GTA$')] as [Txt, Txt, Txt],
  biz: [r('бизнес', 'business'), r('бизнеса', 'businesses'), r('бизнесов', 'businesses')] as [Txt, Txt, Txt],
  contracts: [r('контракт', 'contract'), r('контракта', 'contracts'), r('контрактов', 'contracts')] as [Txt, Txt, Txt],
};

const FACEIT_COLORS = ['#eeeeee', '#1ce400', '#1ce400', '#ffc800', '#ffc800', '#ffc800', '#ffc800', '#ff6309', '#ff6309', '#fe1f00'];
const FACEIT: Rating = {
  kind: 'rating', unit: 'ELO', min: 100, max: 2600, step: 10, from: 1120, to: 1450, minGap: 100,
  tiers: [100, 501, 751, 901, 1051, 1201, 1351, 1531, 1751, 2001].map((at, i) => ({ at, label: String(i + 1), color: FACEIT_COLORS[i] })),
  rates: [2.6, 3.0, 3.6, 4.3, 5.0, 5.6, 6.5, 8, 10.5, 13], perDay: 220, chips: [100, 300, 500],
  headline: 'tier', prefix: 'FACEIT', badge: 'faceit',
};
const PREMIER: Rating = {
  kind: 'rating', unit: 'CS Rating', min: 0, max: 33000, step: 250, from: 11000, to: 15000, minGap: 1000,
  tiers: [0, 5000, 10000, 15000, 20000, 25000, 30000].map((at, i) => ({ at, color: ['#b0c3d9', '#8cc6ff', '#6a7dff', '#c166ff', '#f03cff', '#eb4b4b', '#ffd700'][i] })),
  rates: [0.2, 0.25, 0.3, 0.4, 0.55, 0.8, 1.2], perDay: 3500, chips: [2000, 5000],
  headline: 'value', prefix: 'Premier', badge: 'stripe',
};
const DOTA_RANKS: [Txt, string][] = [
  [r('Рекрут', 'Herald'), '#8f7b5b'], [r('Страж', 'Guardian'), '#9ea3a5'], [r('Рыцарь', 'Crusader'), '#47b6a0'], [r('Герой', 'Archon'), '#3fa36d'],
  [r('Легенда', 'Legend'), '#d4a04a'], [r('Властелин', 'Ancient'), '#7c8ee8'], [r('Божество', 'Divine'), '#a7c2f0'], [r('Титан', 'Immortal'), '#e8613b'],
];
const MMR: Rating = {
  kind: 'rating', unit: 'MMR', min: 0, max: 8000, step: 50, from: 3200, to: 4500, minGap: 500,
  tiers: [0, 770, 1540, 2310, 3080, 3850, 4620, 5420].map((at, i) => ({ at, label: DOTA_RANKS[i][0], color: DOTA_RANKS[i][1], icon: `r/dota-${i + 1}` })),
  rates: [1.0, 1.1, 1.2, 1.35, 1.5, 1.8, 2.4, 3.4], perDay: 500, chips: [500, 1000, 1500],
  headline: 'value', prefix: '', badge: 'medal',
};

const VAL_RANKS: [Txt, string][] = [
  [r('Железо', 'Iron'), '#6b6b6b'], [r('Бронза', 'Bronze'), '#a0703c'], [r('Серебро', 'Silver'), '#c9cfd1'], [r('Золото', 'Gold'), '#e7b33c'],
  [r('Платина', 'Platinum'), '#3fb6c6'], [r('Алмаз', 'Diamond'), '#c88cf2'], [r('Расцвет', 'Ascendant'), '#3fbf7f'], [r('Бессмертие', 'Immortal'), '#e8455d'], [r('Радиант', 'Radiant'), '#fff1b8'],
];
const LOL_RANKS: [Txt, string][] = [
  [r('Железо', 'Iron'), '#8a7a74'], [r('Бронза', 'Bronze'), '#a8735a'], [r('Серебро', 'Silver'), '#a5b3c2'], [r('Золото', 'Gold'), '#d9a751'],
  [r('Платина', 'Platinum'), '#4fb7c2'], [r('Изумруд', 'Emerald'), '#2fbf73'], [r('Алмаз', 'Diamond'), '#7b8cf0'], [r('Мастер', 'Master'), '#b35fe0'],
];

export const SERVICES: Service[] = [
  /* ---------- CS2 ---------- */
  {
    id: 'cs2-faceit', game: 'cs2', cat: 'rank', rating: 4.9, orders: 1248, modes: true,
    title: r('Буст FACEIT', 'FACEIT boost'), desc: r('Подъём ELO и уровня FACEIT', 'Raise your FACEIT ELO and level'),
    extras: [PRIORITY, STREAM, { id: 'role', label: r('Играть на вашей позиции', 'Play your position'), pct: 10 }, SCHEDULE],
    includes: [
      r('Играет игрок с ELO заметно выше вашей цели', 'Played by someone well above your target ELO'),
      r('ELO после каждой сессии видно в заказе', 'ELO after every session shows in the order'),
      r('Можно поставить на паузу, если захотите сыграть сами', 'Pause any time you want to play yourself'),
      r('Цена фиксируется при оформлении', 'The price is locked at checkout'),
    ],
    cfg: FACEIT,
  },
  {
    id: 'cs2-premier', game: 'cs2', cat: 'rank', rating: 4.8, orders: 836, modes: true,
    title: r('Буст Premier', 'Premier boost'), desc: r('Поднимем CS Rating до нужной отметки', 'Raise your CS Rating to the mark you need'),
    extras: [PRIORITY, STREAM, SCHEDULE],
    includes: [r('Играем только Premier', 'Premier matches only'), r('Рейтинг после каждой сессии виден в заказе', 'Rating after every session shows in the order')],
    cfg: PREMIER,
  },
  {
    id: 'cs2-calib', game: 'cs2', cat: 'calib', rating: 4.8, orders: 412,
    title: r('Калибровочные матчи Premier', 'Premier placement matches'), desc: r('Сыграем нужное количество калибровочных матчей', 'We play the placement matches you have left'),
    extras: [PRIORITY, STREAM],
    includes: [r('Результат каждого матча — в заказе', 'Every match result shows in the order')],
    cfg: { kind: 'qty', question: r('Сколько матчей осталось?', 'How many matches are left?'), unit: U.matches, min: 1, max: 10, step: 1, def: 10, per: 99, perDay: 8, chips: [3, 5, 10] },
  },
  {
    id: 'cs2-wins', game: 'cs2', cat: 'wins', rating: 4.7, orders: 389, modes: true,
    title: r('Победы в FACEIT', 'FACEIT wins'), desc: r('Оплачиваете только нужное количество побед', 'You pay only for the wins you need'),
    extras: [PRIORITY, STREAM],
    includes: [r('Поражения не засчитываются в заказ', 'Losses do not count towards the order')],
    cfg: { kind: 'qty', question: r('Сколько побед нужно?', 'How many wins?'), unit: U.wins, min: 1, max: 30, step: 1, def: 5, per: 119, perDay: 8, chips: [3, 5, 10] },
  },
  {
    id: 'cs2-duo', game: 'cs2', cat: 'other', rating: 4.9, orders: 274,
    title: r('Игра в пати с бустером', 'Party with a booster'), desc: r('Играете сами вместе с сильным игроком', 'You play yourself, together with a strong player'),
    extras: [{ id: 'voice', label: r('Голосовая связь в Discord', 'Discord voice'), pct: 0 }, STREAM],
    includes: [r('Вы играете на своём аккаунте', 'You play on your own account'), r('Подсказки по ходу матча', 'Calls and tips during the match')],
    cfg: { kind: 'qty', question: r('Сколько матчей сыграть?', 'How many matches?'), unit: U.matches, min: 1, max: 20, step: 1, def: 3, per: 260, perDay: 6, chips: [3, 5, 10] },
  },
  {
    id: 'cs2-coach', game: 'cs2', cat: 'coach', rating: 5.0, orders: 158,
    title: r('Разбор игры', 'Game review'), desc: r('Разбор демо, ошибок и решений по ходу матча', 'Your demo, mistakes and in-round decisions'),
    extras: [RECORD],
    includes: [r('Разбор 1–2 ваших демо', '1–2 of your demos reviewed'), r('Короткий план, над чем работать', 'A short plan of what to work on')],
    cfg: { kind: 'qty', question: r('Сколько часов занятия?', 'How many hours?'), unit: U.hours, min: 1, max: 4, step: 1, def: 1, per: 1290, perDay: 0, chips: [] },
  },
  {
    id: 'cs2-xp', game: 'cs2', cat: 'other', rating: 4.7, orders: 205,
    title: r('Прокачка уровня профиля', 'Profile level'), desc: r('Поднимем уровень CS2 для еженедельного дропа', 'Level up your CS2 profile for the weekly drop'),
    extras: [PRIORITY],
    includes: [r('Играем казуальные режимы и Deathmatch', 'Casual modes and Deathmatch')],
    cfg: { kind: 'rating', unit: r('ур.', 'lvl'), min: 1, max: 40, step: 1, from: 1, to: 20, minGap: 5, tiers: [{ at: 1, color: '#5fd3e6' }], rates: [45], perDay: 10, chips: [10, 20], headline: 'value', prefix: '', badge: 'none' },
  },

  /* ---------- Dota 2 ---------- */
  {
    id: 'dota-mmr', game: 'dota', cat: 'rank', rating: 4.9, orders: 964, modes: true,
    title: r('Буст MMR', 'MMR boost'), desc: r('Поднимем рейтинг до нужной отметки', 'We raise your MMR to the mark you need'),
    extras: [PRIORITY, STREAM, { id: 'heroes', label: r('Играть выбранных героев', 'Play chosen heroes'), pct: 10 }, SCHEDULE],
    includes: [r('Играет игрок с рейтингом выше вашей цели', 'Played by someone above your target'), r('MMR после каждой сессии — в заказе', 'MMR after every session shows in the order'), r('Можно выбрать роль и героев', 'Pick the role and heroes')],
    cfg: MMR,
  },
  {
    id: 'dota-calib', game: 'dota', cat: 'calib', rating: 4.8, orders: 301,
    title: r('Калибровочные матчи', 'Calibration matches'), desc: r('Сыграем оставшиеся матчи калибровки', 'We play the calibration matches you have left'),
    extras: [PRIORITY, STREAM],
    includes: [r('Результат каждого матча — в заказе', 'Every match result shows in the order')],
    cfg: { kind: 'qty', question: r('Сколько матчей осталось?', 'How many matches are left?'), unit: U.matches, min: 1, max: 10, step: 1, def: 10, per: 149, perDay: 6, chips: [3, 5, 10] },
  },
  {
    id: 'dota-lp', game: 'dota', cat: 'wins', rating: 4.9, orders: 342,
    title: r('Выход из ЛП', 'Low Priority'), desc: r('Закроем нужное количество побед в Low Priority', 'We get the wins you need to leave Low Priority'),
    extras: [PRIORITY],
    includes: [r('Играем Single Draft, как требует ЛП', 'Single Draft, as Low Priority requires')],
    cfg: { kind: 'qty', question: r('Сколько побед в ЛП осталось?', 'How many Low Priority wins are left?'), unit: U.wins, min: 1, max: 10, step: 1, def: 3, per: 120, perDay: 6, chips: [1, 3, 5] },
  },
  {
    id: 'dota-behavior', game: 'dota', cat: 'other', rating: 4.7, orders: 186,
    title: r('Подъём порядочности', 'Behavior score'), desc: r('Поднимем показатель поведения до нужного значения', 'We raise your behavior score to the value you need'),
    extras: [PRIORITY],
    includes: [r('Спокойные матчи без репортов', 'Calm games, no reports')],
    cfg: { kind: 'rating', unit: r('очков', 'pts'), min: 0, max: 12000, step: 500, from: 6000, to: 10000, minGap: 1000, tiers: [{ at: 0, color: '#e5492f' }], rates: [0.25], perDay: 1500, chips: [2000, 4000], headline: 'value', prefix: '', badge: 'none' },
  },
  {
    id: 'dota-duo', game: 'dota', cat: 'other', rating: 4.8, orders: 133,
    title: r('Игра в пати с бустером', 'Party with a booster'), desc: r('Играете сами вместе с сильным игроком', 'You play yourself, together with a strong player'),
    extras: [{ id: 'voice', label: r('Голосовая связь в Discord', 'Discord voice'), pct: 0 }],
    includes: [r('Вы играете на своём аккаунте', 'You play on your own account')],
    cfg: { kind: 'qty', question: r('Сколько матчей сыграть?', 'How many matches?'), unit: U.matches, min: 1, max: 15, step: 1, def: 3, per: 220, perDay: 5, chips: [3, 5, 10] },
  },
  {
    id: 'dota-coach', game: 'dota', cat: 'coach', rating: 4.9, orders: 97,
    title: r('Разбор реплея', 'Replay review'), desc: r('Лайнинг, решения, тайминги и ошибки по вашей записи', 'Laning, decisions, timings and mistakes from your replay'),
    extras: [RECORD],
    includes: [r('Разбор 1–2 ваших реплеев', '1–2 of your replays reviewed')],
    cfg: { kind: 'qty', question: r('Сколько часов занятия?', 'How many hours?'), unit: U.hours, min: 1, max: 4, step: 1, def: 1, per: 1190, perDay: 0, chips: [] },
  },

  /* ---------- Valorant ---------- */
  {
    id: 'val-rank', game: 'val', cat: 'rank', rating: 4.8, orders: 642, sale: 0.15, modes: true,
    title: r('Буст ранга', 'Rank boost'), desc: r('От текущего ранга до нужного', 'From your current rank to the one you want'),
    extras: [PRIORITY, STREAM, { id: 'agents', label: r('Играть выбранных агентов', 'Play chosen agents'), pct: 10 }, SCHEDULE],
    includes: [r('Играет игрок уровня Бессмертие и выше', 'Played by Immortal and above'), r('Ранг после каждой сессии — в заказе', 'Rank after every session shows in the order')],
    cfg: { kind: 'ladder', rungs: VAL_RANKS.map(([label, color], i) => ({ label, color, icon: `r/val-${i + 1}` })), steps: [590, 690, 890, 1190, 1690, 2490, 3990, 7990], from: 3, to: 5, dayPerStep: 1.2 },
  },
  {
    id: 'val-calib', game: 'val', cat: 'calib', rating: 4.7, orders: 233,
    title: r('Калибровочные матчи', 'Placement matches'), desc: r('Сыграем оставшиеся placement-матчи', 'We play your remaining placement matches'),
    extras: [PRIORITY, STREAM],
    includes: [r('Результат каждого матча — в заказе', 'Every match result shows in the order')],
    cfg: { kind: 'qty', question: r('Сколько матчей осталось?', 'How many matches are left?'), unit: U.matches, min: 1, max: 5, step: 1, def: 5, per: 249, perDay: 5, chips: [] },
  },
  {
    id: 'val-wins', game: 'val', cat: 'wins', rating: 4.7, orders: 178, modes: true,
    title: r('Победы в рейтинговых', 'Competitive wins'), desc: r('Оплачиваете только нужное количество побед', 'You pay only for the wins you need'),
    extras: [PRIORITY, STREAM],
    includes: [r('Поражения не засчитываются в заказ', 'Losses do not count towards the order')],
    cfg: { kind: 'qty', question: r('Сколько побед нужно?', 'How many wins?'), unit: U.wins, min: 1, max: 20, step: 1, def: 5, per: 199, perDay: 5, chips: [3, 5, 10] },
  },
  {
    id: 'val-duo', game: 'val', cat: 'other', rating: 4.9, orders: 141,
    title: r('Дуо с бустером', 'Duo with a booster'), desc: r('Играете сами в пати с сильным игроком', 'You play yourself in a party with a strong player'),
    extras: [{ id: 'voice', label: r('Голосовая связь в Discord', 'Discord voice'), pct: 0 }],
    includes: [r('Вы играете на своём аккаунте', 'You play on your own account')],
    cfg: { kind: 'qty', question: r('Сколько матчей сыграть?', 'How many matches?'), unit: U.matches, min: 1, max: 15, step: 1, def: 3, per: 290, perDay: 5, chips: [3, 5, 10] },
  },
  {
    id: 'val-contract', game: 'val', cat: 'other', rating: 4.8, orders: 96,
    title: r('Прокачка контракта агента', 'Agent contract'), desc: r('Откроем агента или награды контракта', 'Unlock an agent or contract rewards'),
    extras: [PRIORITY],
    includes: [r('Играем быстрые режимы и Swiftplay', 'Unrated and Swiftplay')],
    cfg: { kind: 'qty', question: r('Сколько контрактов прокачать?', 'How many contracts?'), unit: U.contracts, min: 1, max: 5, step: 1, def: 1, per: 690, perDay: 1, chips: [] },
  },

  /* ---------- League of Legends ---------- */
  {
    id: 'lol-rank', game: 'lol', cat: 'rank', rating: 4.8, orders: 418, modes: true,
    title: r('Буст ранга', 'Rank boost'), desc: r('Одиночная/парная очередь, любой сервер', 'Solo/Duo queue, any server'),
    extras: [PRIORITY, STREAM, { id: 'role', label: r('Только ваша роль', 'Your role only'), pct: 10 }, SCHEDULE],
    includes: [r('Играет игрок уровня Мастер и выше', 'Played by Master and above'), r('LP после каждой сессии — в заказе', 'LP after every session shows in the order')],
    cfg: { kind: 'ladder', rungs: LOL_RANKS.map(([label, color], i) => ({ label, color, icon: `r/lol-${i + 1}` })), steps: [690, 790, 990, 1390, 1890, 2790, 4990], from: 2, to: 3, dayPerStep: 1.4 },
  },
  {
    id: 'lol-calib', game: 'lol', cat: 'calib', rating: 4.7, orders: 127,
    title: r('Калибровочные матчи', 'Placement games'), desc: r('Сыграем оставшиеся калибровочные матчи сезона', 'We play your remaining placement games'),
    extras: [PRIORITY],
    includes: [r('Результат каждого матча — в заказе', 'Every game result shows in the order')],
    cfg: { kind: 'qty', question: r('Сколько матчей осталось?', 'How many games are left?'), unit: U.matches, min: 1, max: 5, step: 1, def: 5, per: 199, perDay: 5, chips: [] },
  },
  {
    id: 'lol-wins', game: 'lol', cat: 'wins', rating: 4.7, orders: 112, modes: true,
    title: r('Победы', 'Wins'), desc: r('Нужное количество побед в рейтинговой очереди', 'Ranked wins, as many as you need'),
    extras: [PRIORITY],
    includes: [r('Поражения не засчитываются в заказ', 'Losses do not count towards the order')],
    cfg: { kind: 'qty', question: r('Сколько побед нужно?', 'How many wins?'), unit: U.wins, min: 1, max: 20, step: 1, def: 5, per: 179, perDay: 5, chips: [3, 5, 10] },
  },
  {
    id: 'lol-duo', game: 'lol', cat: 'other', rating: 4.8, orders: 88,
    title: r('Duo Queue с бустером', 'Duo Queue with a booster'), desc: r('Играете сами в паре с сильным игроком', 'You play yourself, paired with a strong player'),
    extras: [{ id: 'voice', label: r('Голосовая связь в Discord', 'Discord voice'), pct: 0 }],
    includes: [r('Вы играете на своём аккаунте', 'You play on your own account')],
    cfg: { kind: 'qty', question: r('Сколько игр сыграть?', 'How many games?'), unit: U.matches, min: 1, max: 15, step: 1, def: 3, per: 260, perDay: 5, chips: [3, 5, 10] },
  },
  {
    id: 'lol-coach', game: 'lol', cat: 'coach', rating: 4.9, orders: 64,
    title: r('Разбор игры', 'Game review'), desc: r('Волны, вардинг, тимфайты — по вашей записи', 'Waves, warding, teamfights — from your replay'),
    extras: [RECORD],
    includes: [r('Разбор 1–2 ваших игр', '1–2 of your games reviewed')],
    cfg: { kind: 'qty', question: r('Сколько часов занятия?', 'How many hours?'), unit: U.hours, min: 1, max: 4, step: 1, def: 1, per: 1090, perDay: 0, chips: [] },
  },

  /* ---------- GTA Online ---------- */
  {
    id: 'gta-money', game: 'gta', cat: 'other', rating: 4.8, orders: 523,
    title: r('Фарм GTA$', 'GTA$ farming'), desc: r('Заработаем нужную сумму через игровые активности', 'We earn the amount through regular in-game activities'),
    extras: [PRIORITY, STREAM],
    includes: [r('Ограбления, контракты и бизнесы', 'Heists, contracts and businesses'), r('ПК, PS5 и Xbox Series', 'PC, PS5 and Xbox Series')],
    cfg: { kind: 'qty', question: r('Сколько заработать?', 'How much to earn?'), unit: U.mil, min: 5, max: 50, step: 5, def: 10, per: 89, perDay: 6, chips: [5, 10, 25] },
  },
  {
    id: 'gta-rank', game: 'gta', cat: 'rank', rating: 4.7, orders: 211,
    title: r('Прокачка уровня', 'Rank leveling'), desc: r('Поднимем RP до нужного уровня', 'We raise your RP to the rank you need'),
    extras: [PRIORITY],
    includes: [r('Открываются оружие, транспорт и улучшения по уровню', 'Unlocks weapons, vehicles and upgrades by rank')],
    cfg: { kind: 'rating', unit: r('ур.', 'rank'), min: 1, max: 500, step: 1, from: 50, to: 100, minGap: 10, tiers: [{ at: 1, color: '#f05bc5' }, { at: 50, color: '#f05bc5' }, { at: 100, color: '#2ed6c7' }, { at: 200, color: '#ffb547' }], rates: [12, 9, 7, 6], perDay: 40, chips: [25, 50, 100], headline: 'value', prefix: '', badge: 'none' },
  },
  {
    id: 'gta-heist', game: 'gta', cat: 'other', rating: 4.9, orders: 176,
    title: r('Помощь с ограблениями', 'Heist help'), desc: r('Подготовки и финалы вместе с вами', 'Setups and finales together with you'),
    extras: [{ id: 'elite', label: r('Элитное испытание', 'Elite Challenge'), pct: 20 }],
    includes: [r('Голосовая связь во время ограбления', 'Voice chat during the heist')],
    cfg: { kind: 'qty', question: r('Сколько ограблений пройти?', 'How many heists?'), unit: U.heists, min: 1, max: 10, step: 1, def: 1, per: 490, perDay: 3, chips: [1, 3, 5] },
  },
  {
    id: 'gta-business', game: 'gta', cat: 'other', rating: 4.7, orders: 92,
    title: r('Прокачка бизнеса', 'Business setup'), desc: r('Закупка, улучшения и первые продажи', 'Supplies, upgrades and the first sales'),
    extras: [PRIORITY],
    includes: [r('Ночной клуб, бункер, агентство или автомастерская', 'Nightclub, bunker, agency or auto shop')],
    cfg: { kind: 'qty', question: r('Сколько бизнесов?', 'How many businesses?'), unit: U.biz, min: 1, max: 5, step: 1, def: 1, per: 990, perDay: 1, chips: [] },
  },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
export const servicesOf = (g: GameId) => SERVICES.filter((s) => s.game === g);

/* ---------- pricing ---------- */

export type Choice = { from: number; to: number; qty: number; mode: 'solo' | 'duo'; extras: string[] };

export const defaultChoice = (s: Service): Choice => ({
  from: s.cfg.kind === 'qty' ? 0 : s.cfg.from,
  to: s.cfg.kind === 'qty' ? 0 : s.cfg.to,
  qty: s.cfg.kind === 'qty' ? s.cfg.def : 0,
  mode: 'solo',
  extras: [],
});

const round10 = (n: number) => Math.round(n / 10) * 10;

export const tierIndex = (cfg: Rating, v: number) => {
  let i = 0;
  cfg.tiers.forEach((t, k) => { if (v >= t.at) i = k; });
  return i;
};

function ratingCost(cfg: Rating, a: number, b: number) {
  let sum = 0;
  for (let i = 0; i < cfg.tiers.length; i++) {
    const lo = Math.max(a, cfg.tiers[i].at);
    const hi = Math.min(b, i + 1 < cfg.tiers.length ? cfg.tiers[i + 1].at : Infinity);
    if (hi > lo) sum += (hi - lo) * cfg.rates[i];
  }
  return sum;
}

const span = (d: number): [number, number] => {
  const lo = Math.max(1, Math.floor(d));
  return [lo, Math.max(lo + 1, Math.ceil(d))];
};

function baseOf(s: Service, c: Choice) {
  const cfg = s.cfg;
  if (cfg.kind === 'rating') return { base: ratingCost(cfg, c.from, c.to), days: span((c.to - c.from) / cfg.perDay) };
  if (cfg.kind === 'ladder') return { base: cfg.steps.slice(c.from, c.to).reduce((a, b) => a + b, 0), days: span((c.to - c.from) * cfg.dayPerStep) };
  return { base: cfg.per * c.qty, days: cfg.perDay === 0 ? ([0, 0] as [number, number]) : span(c.qty / cfg.perDay) };
}

export function quote(s: Service, c: Choice) {
  const { base, days: d } = baseOf(s, c);
  let pct = 0;
  if (s.modes && c.mode === 'duo') pct += 30;
  for (const e of s.extras) if (c.extras.includes(e.id)) pct += e.pct;
  const full = round10(base * (1 + pct / 100));
  const price = s.sale ? round10(full * (1 - s.sale)) : full;
  let days = d;
  if (c.extras.includes('priority') && days[1] > 1) days = [Math.max(1, days[0] - 1), days[1] - 1];
  return { price, full, days };
}

/** Cheapest possible order, for "от …". */
export function fromPrice(s: Service) {
  const cfg = s.cfg;
  let c = defaultChoice(s);
  if (cfg.kind === 'rating') c = { ...c, from: cfg.min, to: cfg.min + cfg.minGap };
  if (cfg.kind === 'ladder') { const i = cfg.steps.indexOf(Math.min(...cfg.steps)); c = { ...c, from: i, to: i + 1 }; }
  if (cfg.kind === 'qty') c = { ...c, qty: cfg.min };
  return quote(s, c);
}

export const gameFrom = (g: GameId) => Math.min(...servicesOf(g).map((s) => fromPrice(s).price));

/* ---------- content ---------- */

export type Review = { nick: string; game: GameId; result: Txt; stars: number; text: Txt; when: Txt; hue: number };

export const REVIEWS: Review[] = [
  { nick: 'kerrigan_ok', game: 'cs2', result: r('FACEIT 6 → 8', 'FACEIT 6 → 8'), stars: 5, hue: 28, when: r('2 дня назад', '2 days ago'),
    text: r('Сделали за вечер, думал будет дольше. ELO после каждой катки было видно прямо в заказе.', 'Done in one evening, I expected longer. ELO after every match was right there in the order.') },
  { nick: 'Mavrik', game: 'dota', result: r('3 400 → 4 600 MMR', '3,400 → 4,600 MMR'), stars: 5, hue: 8, when: r('3 дня назад', '3 days ago'),
    text: r('Попросил играть только на керри — так и было. Винрейт после него нормальный.', 'Asked for carry only and that is what I got. Win rate stayed fine.') },
  { nick: 'sanya_ak47', game: 'cs2', result: r('Premier 11 400 → 15 200', 'Premier 11,400 → 15,200'), stars: 5, hue: 200, when: r('неделю назад', 'a week ago'),
    text: r('Заказал вечером, к утру уже было 15к. В поддержку писал один раз, ответили быстро.', 'Ordered in the evening, had 15k by morning. Messaged support once, quick reply.') },
  { nick: 'lunatic', game: 'val', result: r('Серебро → Платина', 'Silver → Platinum'), stars: 4, hue: 352, when: r('неделю назад', 'a week ago'),
    text: r('Вышло на день дольше, чем обещали, но предупредили заранее. В остальном всё чётко.', 'Took a day longer than promised, but they warned me upfront. Otherwise spot on.') },
  { nick: 'Ведьмачок', game: 'lol', result: r('Калибровка, 5 матчей', 'Placements, 5 games'), stars: 5, hue: 150, when: r('2 недели назад', '2 weeks ago'),
    text: r('4 из 5 побед, попал в Золото. Норм.', '4 out of 5 wins, landed in Gold. Solid.') },
  { nick: 'dexter', game: 'cs2', result: r('Разбор игры, 2 часа', 'Game review, 2 hours'), stars: 5, hue: 45, when: r('3 недели назад', '3 weeks ago'),
    text: r('Разобрали два моих демо на Mirage, нашёл кучу ошибок в позиционке. Реально полезно.', 'We went through two of my Mirage demos, found a ton of positioning mistakes. Actually useful.') },
  { nick: 'vinewood_boi', game: 'gta', result: r('Фарм, 25 млн GTA$', 'Farming, 25M GTA$'), stars: 5, hue: 315, when: r('месяц назад', 'a month ago'),
    text: r('Всё через ограбления и бизнесы, без всякой дичи. Купил наконец Oppressor.', 'All through heists and businesses, nothing shady. Finally bought the Oppressor.') },
];

export const TICKER: { game: GameId; text: Txt; ago: Txt }[] = [
  { game: 'cs2', text: r('FACEIT 5 → 7', 'FACEIT 5 → 7'), ago: r('2 мин назад', '2 min ago') },
  { game: 'dota', text: r('+1 000 MMR', '+1,000 MMR'), ago: r('6 мин назад', '6 min ago') },
  { game: 'val', text: r('Золото → Алмаз', 'Gold → Diamond'), ago: r('9 мин назад', '9 min ago') },
  { game: 'gta', text: r('10 млн GTA$', '10M GTA$'), ago: r('14 мин назад', '14 min ago') },
  { game: 'lol', text: r('Серебро → Золото', 'Silver → Gold'), ago: r('17 мин назад', '17 min ago') },
  { game: 'cs2', text: r('Калибровка Premier', 'Premier placements'), ago: r('21 мин назад', '21 min ago') },
  { game: 'dota', text: r('Выход из ЛП, 3 победы', 'Low Priority, 3 wins'), ago: r('26 мин назад', '26 min ago') },
  { game: 'cs2', text: r('Premier 9 000 → 13 000', 'Premier 9,000 → 13,000'), ago: r('32 мин назад', '32 min ago') },
];

export const BOOSTERS: Record<GameId, { nick: string; note: Txt; rating: number; orders: number }> = {
  cs2: { nick: 'n1ke_fpl', note: r('FACEIT 10 · 3 412 ELO', 'FACEIT 10 · 3,412 ELO'), rating: 4.9, orders: 1124 },
  dota: { nick: 'arteezy_fan', note: r('Титан · 9 100 MMR', 'Immortal · 9,100 MMR'), rating: 4.9, orders: 870 },
  val: { nick: 'sova.main', note: r('Радиант', 'Radiant'), rating: 4.8, orders: 512 },
  lol: { nick: 'mid_or_feed', note: r('Грандмастер', 'Grandmaster'), rating: 4.9, orders: 388 },
  gta: { nick: 'lsc_runner', note: r('Уровень 1 200', 'Rank 1,200'), rating: 4.8, orders: 641 },
};
