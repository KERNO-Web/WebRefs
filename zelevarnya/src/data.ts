export type VesselKind = 'flask' | 'tumbler' | 'cloche' | 'vial' | 'goblet' | 'erlenmeyer' | 'bottle' | 'highball';

export interface Potion {
  id: string;
  num: string;
  name: string;
  vessel: VesselKind;
  base: string;
  serve: string;
  effect: string;
  price: number;
  glyphs: { g: string; label: string }[];
  zero?: boolean;
  shifts?: boolean;
}

export const POTIONS: Potion[] = [
  {
    id: 'invis', num: 'I', name: 'Зелье невидимости', vessel: 'flask',
    base: 'Джин на цветках анчана, тоник, лимон',
    serve: 'В колбе синий. Капните лимон, и он порозовеет прямо у вас в руке.',
    effect: 'на час перестаёте отвечать в рабочем чате',
    price: 650, shifts: true,
    glyphs: [{ g: 'water', label: 'джин' }, { g: 'moon', label: 'анчан' }, { g: 'air', label: 'тоник' }, { g: 'sun', label: 'лимон' }],
  },
  {
    id: 'dragon', num: 'II', name: 'Дыхание дракона', vessel: 'tumbler',
    base: 'Мескаль, перец чили, копчёный ананас',
    serve: 'Сверху пузырь дыма. Лопается, когда подносите бокал к губам.',
    effect: 'говорите тосты дольше, чем стоило бы',
    price: 720,
    glyphs: [{ g: 'fire', label: 'мескаль' }, { g: 'iron', label: 'чили' }, { g: 'sun', label: 'ананас' }, { g: 'air', label: 'дым' }],
  },
  {
    id: 'swamp', num: 'III', name: 'Отвар болотной ведьмы', vessel: 'cloche',
    base: 'Абсент, базилик, лайм, огурец',
    serve: 'Приносим под стеклянным колпаком, полным дыма розмарина.',
    effect: 'начинаете понимать, о чём квакают лягушки',
    price: 690,
    glyphs: [{ g: 'copper', label: 'абсент' }, { g: 'earth', label: 'базилик' }, { g: 'salt', label: 'лайм' }, { g: 'water', label: 'огурец' }],
  },
  {
    id: 'mermaid', num: 'IV', name: 'Слеза русалки', vessel: 'vial',
    base: 'Ром, голубой кюрасао, кокос',
    serve: 'В бокале кружится съедобный перламутр. Встряхните — закружится снова.',
    effect: 'тянет петь в караоке',
    price: 640,
    glyphs: [{ g: 'sulfur', label: 'ром' }, { g: 'water', label: 'кюрасао' }, { g: 'moon', label: 'кокос' }, { g: 'mercury', label: 'перламутр' }],
  },
  {
    id: 'mandrake', num: 'V', name: 'Эликсир мандрагоры', vessel: 'goblet',
    base: 'Бурбон, свёкла, имбирь, мёд',
    serve: 'В кубке, с корнем на шпажке. Корень не кричит, мы проверяли.',
    effect: 'хочется рассказать, как вы на самом деле',
    price: 680,
    glyphs: [{ g: 'sulfur', label: 'бурбон' }, { g: 'earth', label: 'свёкла' }, { g: 'fire', label: 'имбирь' }, { g: 'sun', label: 'мёд' }],
  },
  {
    id: 'powder', num: 'VI', name: 'Порох алхимика', vessel: 'erlenmeyer',
    base: 'Виски, кофе, апельсин',
    serve: 'Палочку корицы поджигаем у стола. Пахнет лавкой алхимика.',
    effect: 'усидите до закрытия',
    price: 700,
    glyphs: [{ g: 'antimony', label: 'виски' }, { g: 'earth', label: 'кофе' }, { g: 'sun', label: 'апельсин' }, { g: 'fire', label: 'корица' }],
  },
  {
    id: 'moonwater', num: 'VII', name: 'Лунная вода', vessel: 'bottle',
    base: 'Анчан, бузина, лимонад',
    serve: 'Без алкоголя. Тоже меняет цвет: капните лимон и смотрите.',
    effect: 'утром всё помните',
    price: 390, zero: true, shifts: true,
    glyphs: [{ g: 'moon', label: 'анчан' }, { g: 'copper', label: 'бузина' }, { g: 'air', label: 'лимонад' }, { g: 'sun', label: 'лимон' }],
  },
  {
    id: 'basilisk', num: 'VIII', name: 'Кровь василиска', vessel: 'highball',
    base: 'Зелёное яблоко, огурец, розмарин, содовая',
    serve: 'Без алкоголя. Кровь у василиска зелёная, это всем известно.',
    effect: 'взгляд становится тяжёлым, но добрым',
    price: 390, zero: true,
    glyphs: [{ g: 'earth', label: 'яблоко' }, { g: 'water', label: 'огурец' }, { g: 'iron', label: 'розмарин' }, { g: 'air', label: 'содовая' }],
  },
];

export interface Table { id: string; x: number; y: number; seats: number; shape: 'round' | 'long' | 'booth'; label: string; rune: string }

// Floor plan coordinates in a 1000 × 640 box.
export const TABLES: Table[] = [
  { id: 't1', x: 500, y: 330, seats: 6, shape: 'round', label: 'Стол у котла', rune: 'othala' },
  { id: 't2', x: 230, y: 175, seats: 2, shape: 'round', label: 'У окна', rune: 'ansuz' },
  { id: 't3', x: 340, y: 175, seats: 2, shape: 'round', label: 'У окна', rune: 'kenaz' },
  { id: 't4', x: 180, y: 430, seats: 4, shape: 'booth', label: 'Ниша алхимика', rune: 'perth' },
  { id: 't5', x: 180, y: 545, seats: 4, shape: 'booth', label: 'Ниша травника', rune: 'berkanan' },
  { id: 't6', x: 760, y: 470, seats: 8, shape: 'long', label: 'Длинный стол', rune: 'mannaz' },
  { id: 't7', x: 690, y: 175, seats: 2, shape: 'round', label: 'У стойки', rune: 'tiwaz' },
  { id: 't8', x: 800, y: 175, seats: 2, shape: 'round', label: 'У стойки', rune: 'sowilo' },
];
