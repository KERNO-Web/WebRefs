/*
 * Menu, transcribed from the 11 current menu cards in the venue's 2GIS «Меню» album
 * (owner uploads 19.02.2025, social posts 22.01.2026; research/2gis/menu/m01–m11, URLs in urls.txt).
 * Two older pages (m12 drinks board, m13 text menu, 2024) are left out as likely outdated.
 * Never invent dishes or prices: an item whose price is cut off on the card has `price: null`.
 *
 * Photos: cut from the same cards. A photo is attached only when it unambiguously shows that dish.
 *   'exact'  — the dish's own photo, or one plate in a group shot that is identifiable by its contents
 *              (soups, platters, the two-salad shots) — shown with the item
 *   'shared' — the dish is in a shot but cannot be told apart → not shown
 *   absent   — no usable photo (cropped off or covered by a label) → text-only card
 */
export type PhotoMatch = 'exact' | 'shared';
export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  weight?: string;
  price: number | null;
  variants?: { label: string; price: number }[];
  isNew?: boolean;
  photo?: { src: string; match: PhotoMatch };
};
export type MenuCategory = { id: string; category: string; items: MenuItem[] };

const p = (id: string) => ({ src: `./assets/venue/menu/${id}.webp`, match: 'exact' as const });

export const menu: MenuCategory[] = [
  {
    id: 'cold', category: 'Холодные закуски', items: [
      { id: 'fruit', name: 'Фруктовое ассорти', description: 'Яблоко, груша, виноград, апельсин, клубника, киви, ананас, мандарин', weight: '1000 г', price: 1500, photo: p('fruit') },
      { id: 'meat', name: 'Мясное ассорти', description: 'Рулет куриный, рулет из баранины, язык говяжий, ростбиф из телятины, каперсы, соус цезарь', weight: '310 г', price: 1500, photo: p('meat') },
      { id: 'veg', name: 'Овощное ассорти', description: 'Огурцы, томаты, болгарский перец, редис, сельдерей, зелень, сметанный соус', weight: '330 г', price: 590, photo: p('veg') },
      { id: 'kazy', name: 'Казы из конины', description: 'Отварная колбаса из конины', weight: '100 г', price: 650, photo: p('kazy') },
      { id: 'bruschetta-beef', name: 'Брускетта с ростбифом', description: 'Чиабатта, ростбиф из телятины, сыр страчателла, икра имитированная, томаты сушёные в масле, пармезан, лук резанец, растительное масло, салат фризе', weight: '200 г', price: 590, photo: p('bruschetta-beef') },
      { id: 'bruschetta-salmon', name: 'Брускетта с лососем', description: 'Чиабатта, сыр страчателла, икра имитированная, пармезан, лук резанец, растительное масло, салат фризе, лолло росса', weight: '150 г', price: 690, photo: p('bruschetta-salmon') },
      { id: 'vitello', name: 'Вителло тонато', description: 'Элегантная мясная закуска', price: null, isNew: true },
    ],
  },
  {
    id: 'hot-starters', category: 'Горячие закуски', items: [
      { id: 'khachapuri', name: 'Хачапури по-аджарски', description: 'Сытная выпечка с сыром и яйцом', price: null, photo: p('khachapuri') },
      { id: 'popcorn-shrimp', name: 'Попкорн из креветок в соусе том ям', description: 'Креветки тигровые, соус том ям, лук жареный, соль, специи, икра тобико', weight: '90 г', price: 590, photo: p('popcorn-shrimp') },
      { id: 'marrow', name: 'Мозговые косточки', description: 'Кости мозговые, соль, специи, зелёное масло, растительное масло, чиабатта', weight: '480 г', price: 600, photo: p('marrow') },
      { id: 'magadan', name: 'Жареные магаданские креветки с соусами тар-тар и том ям', description: 'Креветки, соус том ям, соус тар-тар, специи, лайм', price: null },
    ],
  },
  {
    id: 'salads', category: 'Салаты', items: [
      { id: 'burrata', name: 'Буррата с томатами и клубникой', description: 'Буррата, томаты, клубника, шпинат, руккола, фризе, лимонно-горчичный соус, бальзамик, фисташки', weight: '380 г', price: 850, photo: p('burrata') },
      { id: 'eggplant', name: 'Салат с хрустящими баклажанами', description: 'Микс салата, баклажаны, томаты черри, гранат, кедровые орехи, соус сладкий унаги, специи', weight: '240 г', price: 550, photo: p('eggplant') },
      { id: 'greek', name: 'Греческий салат', description: 'Огурцы, томаты, болгарский перец, листья салата, оливки, красный лук, бальзамический соус, маслины, сыр сиртаки, брынза, редис', weight: '230 г', price: 550, photo: p('greek') },
      { id: 'konina-salad', name: 'Салат с копчёной кониной, томатами и сыром фета', description: 'Микс салата, слайсы из конины, сливочный сыр, фета, голубика, огурцы, авокадо, томаты черри, медово-горчичный соус', weight: '140 г', price: 690, photo: p('konina-salad') },
      { id: 'shashlik-salad', name: 'Салат с говяжьим шашлычком гриль и овощами', description: 'Шпажка шашлыка, микс салата, томаты черри, огурцы, авокадо, лук, медово-горчичный соус, вешенки, болгарский перец', weight: '260 г', price: 790, photo: p('shashlik-salad') },
      { id: 'shrimp-salad', name: 'Фирменный салат с креветками, клубникой и вишнёвым соусом', description: 'Микс салата, креветки, авокадо, клубника, страчателла, вишнёвый соус, лимонно-горчичная заправка, фисташки, бальзамик', weight: '180 г', price: 750, photo: p('shrimp-salad') },
      { id: 'caesar', name: 'Цезарь с курицей или креветками', description: 'Обжаренное куриное филе или креветки, романо и айсберг, томаты черри, хрустящий тост, пармезан, соус цезарь', weight: '200 г', price: null, variants: [{ label: 'с курицей', price: 550 }, { label: 'с креветками', price: 650 }], photo: p('caesar') },
      { id: 'seafood-salad', name: 'Салат с морепродуктами, манго и страчателлой', description: 'Микс салата, креветки, мидии, кальмары, страчателла, манго, авокадо, тыквенные семечки, цитрусовый соус, фисташки, зелёное масло', weight: '170 г', price: 850, photo: p('seafood-salad') },
    ],
  },
  {
    id: 'soups', category: 'Супы', items: [
      { id: 'borscht', name: 'Борщ с телятиной и конским салом', description: 'Свекла, капуста, морковь, лук, телятина, конское сало, специи, зелёный лук, сметана', weight: '650 г', price: 590, photo: p('borscht') },
      { id: 'lagman', name: 'Суп лагман с телятиной и овощами', description: 'Лапша, пекинская капуста, чеснок, томаты, болгарский перец, сельдерей, телятина, омлет, перец чили, специи, зелень', weight: '540 г', price: 650, photo: p('lagman') },
      { id: 'tomyum', name: 'Том ям с морепродуктами и рисом', description: 'Креветки, мидии, кальмар, грибы эноки, томаты черри, вешенки, рис, кокосовое молоко, лайм, кунжут, укроп, петрушка, кинза, куриный бульон', weight: '620 г', price: 790, photo: p('tomyum') },
      { id: 'mushroom', name: 'Крем-суп из шампиньонов со сливками', description: 'Шампиньоны, картофель, лук, специи, сливки, сухарики, белые грибы', price: null, photo: p('mushroom') },
    ],
  },
  {
    id: 'poke', category: 'Поке', items: [
      { id: 'poke-shrimp', name: 'Поке с креветками', description: 'Тигровые креветки, салат чука, кукуруза, бобы эдамамэ, томаты черри, нори, ореховый соус, маринованный имбирь, кунжут, авокадо, соль', weight: '200 г', price: 790, photo: p('poke-shrimp') },
      { id: 'poke-salmon', name: 'Поке с лососем', description: 'Лосось слабой соли, авокадо, салат чука, кукуруза, томаты черри, нори, бобы эдамамэ, маринованный имбирь, ореховый соус', weight: '200 г', price: 950, photo: p('poke-salmon') },
    ],
  },
  {
    id: 'mains', category: 'Горячее', items: [
      { id: 'dolma', name: 'Долма с телятиной и сливочно-овощным соусом', description: 'Виноградные листья, фарш из телятины, рис, греческий мусс (лук и болгарский перец), зелёное масло, молодой картофель', weight: '220 г', price: 650, photo: p('dolma') },
      { id: 'plov-veal', name: 'Плов с телятиной', description: 'Рис, нут, изюм, телятина, казы из конины, морковь, гранат, перепелиное яйцо, лук резанец', weight: '400 г', price: 690, photo: p('plov-veal') },
      { id: 'beshbarmak', name: 'Бешбармак от Сорри Мама', description: 'Казахское блюдо с варёным тестом и тутырмой из конины, казы из конины, копчёная конина, лук и бульон', weight: '350 г', price: 790, photo: p('beshbarmak') },
      { id: 'duck', name: 'Утиная ножка конфи с бататом и вишнёвым соусом', description: 'Томлёная утиная ножка, запечённый батат, сливочно-вишнёвый соус', weight: '350 г', price: 790, photo: p('duck') },
      { id: 'curry-shrimp', name: 'Креветки карри с бурратой', description: 'Креветки, жаренные в соусе том ям, подаются с сыром буррата', weight: '490 г', price: 1200, photo: p('curry-shrimp') },
      { id: 'manty', name: 'Манты с телятиной', description: 'Классические манты с телятиной, луком и специями, подаются со сметаной', weight: '180 г', price: 690, photo: p('manty') },
      { id: 'plov-camel', name: 'Арабский плов с верблюдом и бараниной', description: 'Рис, морковь, мясо верблюда, баранина, долма из телятины, нут, айва, гранат, зелень', weight: '630 г', price: 900, photo: p('plov-camel') },
    ],
  },
];

/** The only photo a menu card may show next to a dish name. */
export const itemPhoto = (i: MenuItem) => (i.photo?.match === 'exact' ? i.photo.src : undefined);

/** «32 блюда», «21 блюдо», «35 блюд» */
export const dishesWord = (n: number) => {
  const d = n % 10, h = n % 100;
  return `${n} ${d === 1 && h !== 11 ? 'блюдо' : d >= 2 && d <= 4 && (h < 12 || h > 14) ? 'блюда' : 'блюд'}`;
};

/** When and where the menu was read, shown on the page. */
export const menuSourceNote = 'По фото меню в карточке 2ГИС (2025–2026). Цены и наличие уточняйте у официанта.';
