import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ru';
const KEY = 'w3-lang';
let current: Lang = (() => { try { return localStorage.getItem(KEY) === 'ru' ? 'ru' : 'en'; } catch { return 'en'; } })();
document.documentElement.lang = current;
const subs = new Set<() => void>();
export function setLang(l: Lang) {
  current = l;
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  subs.forEach((f) => f());
}

const RU: Record<string, string> = {
  World: 'Мир', Witcher: 'Ведьмак', Fate: 'Судьба', Moments: 'Кадры', Choices: 'Выбор', 'Switch language': 'Переключить язык',
  'A visual tribute': 'Визуальный трибьют',
  'A world carved by steel, fire and fate.': 'Мир, высеченный сталью, огнём и судьбой.',
  'Monsters for coin, kings at war and a daughter hunted by the Wild Hunt. Walk the Continent once more.':
    'Чудовища за звонкую монету, короли на войне и дочь, за которой идёт Дикая Охота. Пройдите Континент ещё раз.',
  'Begin the Hunt': 'Начать охоту', 'View Gallery': 'Галерея',
  'A land of war, myth and ruin': 'Земля войны, мифов и руин',
  'Burned villages and drowned gods. Elves who remember, kings who forget. On the Continent, beauty and rot grow from the same soil.':
    'Сожжённые деревни и утонувшие боги. Эльфы, которые помнят, и короли, которые забывают. На Континенте красота и гниль растут из одной земли.',
  Velen: 'Велен', Skellige: 'Скеллиге', 'White Orchard': 'Белый Сад', 'The Northern War': 'Северная война',
  'Swamps, gallows and hungry crows.': 'Болота, виселицы и голодные вороны.',
  'Isles of salt, storm and old gods.': 'Острова соли, шторма и старых богов.',
  'Where the road home begins.': 'Здесь начинается дорога домой.',
  'Nilfgaard marches. The North burns.': 'Нильфгаард наступает. Север горит.',
  'Neither man nor monster': 'Ни человек, ни чудовище',
  'Mutated as a child, trained to kill what others fear to name. Geralt of Rivia takes the contract, keeps the code and pays for both.':
    'Мутант с детства, обученный убивать то, что другие боятся назвать. Геральт из Ривии берёт заказ, держит кодекс и платит за оба.',
  Steel: 'Сталь', Silver: 'Серебро', Signs: 'Знаки', Contracts: 'Заказы',
  'For bandits, soldiers and men who forgot they are men.': 'Для бандитов, солдат и людей, которые забыли, что они люди.',
  'For wraiths, drowners and everything born of the Conjunction.': 'Для призраков, утопцев и всего, что родилось из Сопряжения сфер.',
  'Five simple gestures. Fire, force, shield, trap, will.': 'Пять простых жестов. Огонь, удар, щит, ловушка, воля.',
  'A notice board, a fair price, a beast nobody else would face.': 'Доска объявлений, честная цена и тварь, с которой больше никто не справится.',
  'Destiny never walks alone': 'Судьба не ходит в одиночку',
  'Three women shape the path. One he raised, one he loves, one he could have chosen.':
    'Три женщины определяют путь. Одну он вырастил, другую любит, третью мог бы выбрать.',
  Ciri: 'Цири', Yennefer: 'Йеннифэр', Triss: 'Трисс',
  'Child of the Elder Blood': 'Дитя Старшей Крови', 'Sorceress of Vengerberg': 'Чародейка из Венгерберга', 'Merigold the Fearless': 'Меригольд Бесстрашная',
  'She can step between worlds. She cannot step away from her blood.': 'Она умеет шагать между мирами. Но не может уйти от своей крови.',
  'Lilac and gooseberries. A wish that bound two lives together.': 'Сирень и крыжовник. Желание, связавшее две жизни.',
  'Fire in her hands, Novigrad at her back, and a heart she never hid.': 'Огонь в ладонях, Новиград за спиной и сердце, которое она не прятала.',
  Destiny: 'Судьба', Memory: 'Память', Loss: 'Утрата', Love: 'Любовь', Magic: 'Магия', War: 'Война',
  'Moments that stay': 'Кадры, которые остаются',
  Hunt: 'Охота', Blood: 'Кровь', Frost: 'Мороз', Fire: 'Огонь',
  'The riders in the frost are never far behind.': 'Всадники во льду никогда не отстают.',
  'Every fight is settled at arm’s length.': 'Каждый бой решается на длину клинка.',
  'Cold breath of the Wild Hunt.': 'Холодное дыхание Дикой Охоты.',
  'Where the war has already been.': 'Там, где уже прошла война.',
  'A girl who outruns her own fate.': 'Девушка, которая обгоняет собственную судьбу.',
  'Every contract has a price.': 'У каждого заказа есть цена.',
  'Every choice leaves a ghost.': 'Каждый выбор оставляет призрака.',
  'There are no clean endings here. Mercy can doom a village and cruelty can save one. You decide, then you live with it.':
    'Чистых концов здесь нет. Милосердие может погубить деревню, а жестокость спасти. Вы решаете и потом с этим живёте.',
  'Monster contracts': 'Заказы на чудовищ', 'Moral weight': 'Моральный вес', 'Consequence': 'Последствия',
  'Study the beast, brew the oils, then earn your coin.': 'Изучи тварь, свари масла, потом заработай монету.',
  'Lesser evils, greater evils, and rarely a good option.': 'Меньшее зло, большее зло и редко хороший вариант.',
  'Decisions return hours later, wearing a different face.': 'Решения возвращаются через часы, уже с другим лицом.',
  'A cursed creature begs you to spare it.': 'Проклятое существо умоляет пощадить его.',
  Spare: 'Пощадить', Kill: 'Убить',
  'It lives. Weeks later, the village it promised to protect is empty.': 'Оно живёт. Через несколько недель деревня, которую оно обещало защищать, пустеет.',
  'It dies. The curse passes to the child who found you the contract.': 'Оно умирает. Проклятие переходит к ребёнку, который принёс тебе заказ.',
  'Choose again': 'Выбрать снова',
  'Steel for humans. Silver for monsters.': 'Сталь для людей. Серебро для чудовищ.',
  'The path never ends. It only waits for you to walk it again.': 'Путь не кончается. Он лишь ждёт, когда вы пройдёте его снова.',
  'Return to the Continent': 'Вернуться на Континент',
  'Fan-made visual tribute for a portfolio. Not affiliated with CD PROJEKT RED.': 'Фанатский визуальный трибьют для портфолио. Не связан с CD PROJEKT RED.',
  'The Witcher® is a trademark of CD PROJEKT S.A. Game imagery © CD PROJEKT RED.': 'The Witcher® является товарным знаком CD PROJEKT S.A. Игровые изображения © CD PROJEKT RED.',
  'Skip to content': 'Перейти к содержимому',
};

export function useI18n() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const t = (s: string) => (lang === 'ru' ? RU[s] ?? s : s);
  return { lang, t };
}
