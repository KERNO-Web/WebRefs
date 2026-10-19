export type VesselKind = 'flask' | 'tumbler' | 'cloche' | 'vial' | 'goblet' | 'erlenmeyer' | 'bottle' | 'highball';

export interface Credit { author: string; license: string; licenseUrl: string; source: string }

export interface Potion {
  id: string;
  num: string;
  name: string;
  /** engraved fallback if the photo fails to load */
  vessel: VesselKind;
  base: string;
  serve: string;
  effect: string;
  price: number;
  glyphs: { g: string; label: string }[];
  zero?: boolean;
  shifts?: boolean;
  /** menu photo public/potions/<id>.jpg, Wikimedia Commons */
  credit: Credit;
}

const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const BY4 = 'https://creativecommons.org/licenses/by/4.0/';
const BYSA4 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const BYSA2 = 'https://creativecommons.org/licenses/by-sa/2.0/';

export const POTIONS: Potion[] = [
  {
    id: 'invis', num: 'I', name: 'Зелье невидимости', vessel: 'flask',
    base: 'Джин на цветках анчана, лайм, соль на ободке',
    serve: 'Синий, как вечер перед полнолунием. Капните лимон, и он порозовеет прямо у вас в руке.',
    effect: 'на час перестаёте отвечать в рабочем чате',
    price: 650, shifts: true,
    glyphs: [{ g: 'water', label: 'джин' }, { g: 'moon', label: 'анчан' }, { g: 'salt', label: 'соль' }, { g: 'sun', label: 'лайм' }],
    credit: { author: 'Yuanbin Du (Unsplash)', license: 'CC0', licenseUrl: CC0, source: 'https://commons.wikimedia.org/wiki/File:Blue_cocktail_with_lime_(Unsplash).jpg' },
  },
  {
    id: 'dragon', num: 'II', name: 'Дыхание дракона', vessel: 'tumbler',
    base: 'Мескаль, перец чили, копчёный ананас',
    serve: 'Веточку розмарина поджигаем прямо в бокале. Пламя гаснет за пару секунд, дымок остаётся.',
    effect: 'говорите тосты дольше, чем стоило бы',
    price: 720,
    glyphs: [{ g: 'fire', label: 'мескаль' }, { g: 'iron', label: 'чили' }, { g: 'sun', label: 'ананас' }, { g: 'air', label: 'дым' }],
    credit: { author: 'Dktue', license: 'CC0', licenseUrl: CC0, source: 'https://commons.wikimedia.org/wiki/File:Brennender_Cocktail_im_Friedrichs_in_T%C3%BCbingen.jpg' },
  },
  {
    id: 'swamp', num: 'III', name: 'Отвар болотной ведьмы', vessel: 'cloche',
    base: 'Абсент, зелёный шартрез, лайм, базилик',
    serve: 'Бледно-зелёный, как туман над болотом. Колесо лайма на краю, чтобы ведьма не обиделась.',
    effect: 'начинаете понимать, о чём квакают лягушки',
    price: 690,
    glyphs: [{ g: 'copper', label: 'абсент' }, { g: 'earth', label: 'шартрез' }, { g: 'salt', label: 'лайм' }, { g: 'water', label: 'базилик' }],
    credit: { author: 'Paul Lowry', license: 'CC BY 4.0', licenseUrl: BY4, source: 'https://commons.wikimedia.org/wiki/File:Last_Word_cocktail,_Baton_Rouge_2025.jpg' },
  },
  {
    id: 'mermaid', num: 'IV', name: 'Слеза русалки', vessel: 'vial',
    base: 'Ром, голубой кюрасао, мята, лайм',
    serve: 'Колотый лёд и мята сверху, как водоросли на волне.',
    effect: 'тянет петь в караоке',
    price: 640,
    glyphs: [{ g: 'sulfur', label: 'ром' }, { g: 'water', label: 'кюрасао' }, { g: 'earth', label: 'мята' }, { g: 'salt', label: 'лайм' }],
    credit: { author: 'Be Hungry Cooking', license: 'CC BY-SA 4.0', licenseUrl: BYSA4, source: 'https://commons.wikimedia.org/wiki/File:Blue_Cocktail_by_be_hungry.jpg' },
  },
  {
    id: 'mandrake', num: 'V', name: 'Эликсир мандрагоры', vessel: 'goblet',
    base: 'Бурбон, свёкла, имбирь, мёд',
    serve: 'Рубиновый, на ободке соль со свёклой. Корень мандрагоры отдаём только по просьбе.',
    effect: 'хочется рассказать, как вы на самом деле',
    price: 680,
    glyphs: [{ g: 'sulfur', label: 'бурбон' }, { g: 'earth', label: 'свёкла' }, { g: 'fire', label: 'имбирь' }, { g: 'sun', label: 'мёд' }],
    credit: { author: 'Paul Lowry', license: 'CC BY 4.0', licenseUrl: BY4, source: 'https://commons.wikimedia.org/wiki/File:Vesuvius_Smoke_-_cocktail,_Baton_Rouge.jpg' },
  },
  {
    id: 'powder', num: 'VI', name: 'Порох алхимика', vessel: 'erlenmeyer',
    base: 'Виски, кофе, апельсиновая цедра',
    serve: 'Бокал окуриваем корицей у стола. Пахнет лавкой алхимика.',
    effect: 'усидите до закрытия',
    price: 700,
    glyphs: [{ g: 'antimony', label: 'виски' }, { g: 'earth', label: 'кофе' }, { g: 'sun', label: 'цедра' }, { g: 'fire', label: 'корица' }],
    credit: { author: 'Cory Doctorow', license: 'CC BY-SA 2.0', licenseUrl: BYSA2, source: 'https://commons.wikimedia.org/wiki/File:Smoked_Old_Fashioned,_Restaurant_R%27Evolution,_the_French_Quarter,_New_Orleans,_Louisiana.jpg' },
  },
  {
    id: 'moonwater', num: 'VII', name: 'Лунная вода', vessel: 'bottle',
    base: 'Анчан, бузина, лимонад, ягоды',
    serve: 'Без алкоголя. Тоже меняет цвет: капните лимон и смотрите.',
    effect: 'утром всё помните',
    price: 390, zero: true, shifts: true,
    glyphs: [{ g: 'moon', label: 'анчан' }, { g: 'copper', label: 'бузина' }, { g: 'air', label: 'лимонад' }, { g: 'earth', label: 'ягоды' }],
    credit: { author: 'Petrdolomicky', license: 'CC0', licenseUrl: CC0, source: 'https://commons.wikimedia.org/wiki/File:Cocktail_Blue_Lagoon_at_the_pitch_bar.jpg' },
  },
  {
    id: 'basilisk', num: 'VIII', name: 'Кровь василиска', vessel: 'highball',
    base: 'Зелёное яблоко, огурец, апельсин, содовая',
    serve: 'Без алкоголя. Кровь у василиска зелёная, это всем известно.',
    effect: 'взгляд становится тяжёлым, но добрым',
    price: 390, zero: true,
    glyphs: [{ g: 'earth', label: 'яблоко' }, { g: 'water', label: 'огурец' }, { g: 'sun', label: 'апельсин' }, { g: 'air', label: 'содовая' }],
    credit: { author: 'Raimond Spekking', license: 'CC BY-SA 4.0', licenseUrl: BYSA4, source: 'https://commons.wikimedia.org/wiki/File:Gr%C3%BCne_Wiese,_Cocktail-0492.jpg' },
  },
  {
    id: 'wyvern', num: 'IX', name: 'Глаз виверны', vessel: 'goblet',
    base: 'Бурбон, вишня, кленовый сироп, биттер',
    serve: 'На дне вишня. Смотрит на вас весь вечер, не моргая.',
    effect: 'замечаете то, чего не замечали',
    price: 710,
    glyphs: [{ g: 'sulfur', label: 'бурбон' }, { g: 'copper', label: 'вишня' }, { g: 'sun', label: 'клён' }, { g: 'antimony', label: 'биттер' }],
    credit: { author: 'daryl_mitchell', license: 'CC BY-SA 2.0', licenseUrl: BYSA2, source: 'https://commons.wikimedia.org/wiki/File:Smoked_Maple_Manhattan_(24426134971).jpg' },
  },
  {
    id: 'necro', num: 'X', name: 'Череп некроманта', vessel: 'goblet',
    base: 'Три рома, маракуйя, корица, огонь',
    serve: 'Подаём в черепе и поджигаем сверху. Пламя гаснет само, как только вы загадаете желание.',
    effect: 'наутро чувствуете себя восставшим',
    price: 760,
    glyphs: [{ g: 'sulfur', label: 'ром' }, { g: 'sun', label: 'маракуйя' }, { g: 'antimony', label: 'корица' }, { g: 'fire', label: 'огонь' }],
    credit: { author: 'Pitel', license: 'CC BY-SA 4.0', licenseUrl: BYSA4, source: 'https://commons.wikimedia.org/wiki/File:ZombieCocktail.jpg' },
  },
  {
    id: 'barrow', num: 'XI', name: 'Туман над курганом', vessel: 'cloche',
    base: 'Джин, огурец, лайм, мёд',
    serve: 'В стеклянном шаре на сухом льду. Туман стекает по столу и к вам в рукав.',
    effect: 'тянет рассказывать страшилки',
    price: 760,
    glyphs: [{ g: 'water', label: 'джин' }, { g: 'earth', label: 'огурец' }, { g: 'salt', label: 'лайм' }, { g: 'sun', label: 'мёд' }],
    credit: { author: 'Sumit Surai', license: 'CC BY-SA 4.0', licenseUrl: BYSA4, source: 'https://commons.wikimedia.org/wiki/File:Goblet_of_Fire_Cocktail.jpg' },
  },
  {
    id: 'salamander', num: 'XII', name: 'Пыльца саламандры', vessel: 'highball',
    base: 'Арбуз, клубника, перец чили, содовая',
    serve: 'Без алкоголя, но с характером. Острый ровно настолько, насколько обещает название.',
    effect: 'щёки горят, настроение тоже',
    price: 390, zero: true,
    glyphs: [{ g: 'water', label: 'арбуз' }, { g: 'copper', label: 'клубника' }, { g: 'iron', label: 'чили' }, { g: 'air', label: 'содовая' }],
    credit: { author: 'Joseph Gonzalez (Unsplash)', license: 'CC0', licenseUrl: CC0, source: 'https://commons.wikimedia.org/wiki/File:Macro_view_of_cocktail_(Unsplash).jpg' },
  },
];

export interface Table {
  id: string; x: number; y: number; seats: number;
  shape: 'round' | 'long' | 'booth' | 'bar';
  label: string; rune: string;
  /** cursed table: drawn, but never bookable */
  cursed?: boolean;
}

// Floor plan coordinates in a 1000 × 700 box.
export const TABLES: Table[] = [
  { id: 'cauldron', x: 500, y: 330, seats: 8, shape: 'round', label: 'Стол у котла', rune: 'othala' },
  { id: 'win1', x: 190, y: 108, seats: 2, shape: 'round', label: 'У окна, I', rune: 'ansuz' },
  { id: 'win2', x: 300, y: 108, seats: 2, shape: 'round', label: 'У окна, II', rune: 'kenaz' },
  { id: 'win3', x: 410, y: 108, seats: 2, shape: 'round', label: 'У окна, III', rune: 'wunjo' },
  { id: 'fire', x: 180, y: 240, seats: 4, shape: 'round', label: 'У камина', rune: 'sowilo' },
  { id: 'circle', x: 318, y: 316, seats: 4, shape: 'round', label: 'Ведьмин круг', rune: 'perth' },
  { id: 'moon', x: 690, y: 330, seats: 4, shape: 'round', label: 'Лунный стол', rune: 'jera' },
  { id: 'library', x: 160, y: 410, seats: 2, shape: 'round', label: 'В библиотеке', rune: 'laguz' },
  { id: 'cellar', x: 380, y: 480, seats: 2, shape: 'round', label: 'У погреба', rune: 'eihwaz' },
  { id: 'lab', x: 700, y: 505, seats: 4, shape: 'round', label: 'У перегонного куба', rune: 'ingwaz' },
  { id: 'bar', x: 760, y: 158, seats: 4, shape: 'bar', label: 'За стойкой', rune: 'tiwaz' },
  { id: 'nook1', x: 900, y: 290, seats: 4, shape: 'booth', label: 'Ниша травника', rune: 'berkanan' },
  { id: 'nook2', x: 900, y: 410, seats: 4, shape: 'booth', label: 'Ниша алхимика', rune: 'hagalaz' },
  { id: 'nook3', x: 900, y: 530, seats: 4, shape: 'booth', label: 'Ниша звездочёта', rune: 'dagaz' },
  { id: 'crypt', x: 175, y: 598, seats: 10, shape: 'long', label: 'Склеп, отдельный зал', rune: 'mannaz' },
  { id: 'xiii', x: 575, y: 492, seats: 2, shape: 'round', label: 'Стол XIII', rune: 'thurisaz', cursed: true },
];
