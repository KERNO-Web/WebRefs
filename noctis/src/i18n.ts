import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ru';
const KEY = 'noctis-lang';
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
  'The Muse': 'Муза', 'The Object': 'Объект', Notes: 'Ноты', Frames: 'Кадры', Film: 'Фильм',
  'Eau de Parfum · Campaign N°1': 'Парфюмерная вода · Кампания N°1',
  'The night': 'У ночи', 'has a body.': 'есть тело.',
  'A scent of smoke, velvet and warm skin. Made for the hours after the light is gone.': 'Аромат дыма, бархата и тёплой кожи. Для часов, когда свет уже ушёл.',
  'Enter the campaign': 'Войти в кампанию', 'View the film': 'Смотреть фильм', Scroll: 'Вниз',
  'Paris · Autumn — Winter': 'Париж · Осень — Зима',
  'I — The Muse': 'I — Муза', 'Presence': 'Присутствие', 'before speech.': 'раньше слов.',
  'She is not a face but a weather. You notice her the way you notice the night has started: all at once, and only afterwards.': 'Она — не лицо, а погода. Её замечаешь так же, как наступление ночи: сразу и только потом.',
  'Skin and shadow': 'Кожа и тень', 'Stillness': 'Тишина', 'Aura': 'Аура',
  'II — The Object': 'II — Объект', 'Obsidian glass.': 'Обсидиановое стекло.', 'A warm heart.': 'Тёплое сердце.',
  'Smoked glass, poured by hand': 'Дымчатое стекло, выдутое вручную', 'Chrome cap, cold to the touch': 'Хромированная крышка, холодная на ощупь',
  '75 ml · Eau de Parfum': '75 мл · Парфюмерная вода', 'Move to turn the light': 'Ведите курсором, чтобы повернуть свет',
  'III — Notes of the Night': 'III — Ноты ночи',
  Smoke: 'Дым', Velvet: 'Бархат', Ember: 'Угли', Skin: 'Кожа', Silk: 'Шёлк', Shadow: 'Тень', Glass: 'Стекло', Afterlight: 'Послесвет',
  'A haze that stays after the candle.': 'Дымка, что остаётся после свечи.',
  'Wine-dark, warm under the hand.': 'Цвета вина, тёплый под ладонью.',
  'Heat that glows without a flame.': 'Жар, что светится без пламени.',
  'The note that belongs to you.': 'Нота, которая принадлежит вам.',
  'Cool at first, then slowly warm.': 'Сначала прохладный, потом тёплый.',
  'Everything the light forgot.': 'Всё, что забыл свет.',
  'Cold reflections, held still.': 'Холодные отражения, застывшие.',
  'What the moon leaves on water.': 'То, что луна оставляет на воде.',
  'IV — Campaign Frames': 'IV — Кадры кампании', 'Every frame,': 'Каждый кадр —', 'a held breath.': 'задержанное дыхание.',
  Veil: 'Вуаль', Touch: 'Касание', Ritual: 'Ритуал', Midnight: 'Полночь',
  'V — The Film': 'V — Фильм',
  'She arrives after midnight.': 'Она приходит после полуночи.',
  'Blue hour stays on her skin.': 'Синий час остаётся на её коже.',
  'Glass remembers the heat.': 'Стекло помнит тепло.',
  'And then — only the scent.': 'А потом — только аромат.',
  'The night leaves a trace.': 'Ночь оставляет след.', 'Wear the night.': 'Носите ночь.',
  'Discover Noctis': 'Открыть Noctis', 'Back to the beginning': 'Вернуться к началу',
  'NOCTIS is a fictional campaign made as a portfolio piece. Photography from Unsplash.': 'NOCTIS — вымышленная кампания, сделанная для портфолио. Фотографии — Unsplash.',
  'Switch language': 'Сменить язык',
};

export function useT() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const t = (s: string) => (lang === 'ru' ? RU[s] ?? s : s);
  return { lang, t };
}
