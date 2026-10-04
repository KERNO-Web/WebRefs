import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ru';
const KEY = 'nexus-card-lang';
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
  'How it works': 'Как это работает', Controls: 'Управление', Activity: 'Операции', Home: 'Главная', Card: 'Карта',
  'Switch language': 'Переключить язык',
  'Spend crypto': 'Тратьте крипту', 'like money.': 'как деньги.',
  'Top up with USDT. Use one virtual card for everyday online payments.': 'Пополняйте в USDT. Платите одной виртуальной картой за всё онлайн.',
  'Get a demo card': 'Получить демо-карту', 'See how it works': 'Как это работает',
  'Card balance': 'Баланс карты', 'Top up': 'Пополнить', Exchange: 'Обмен', Freeze: 'Заморозить', Unfreeze: 'Разморозить', Details: 'Реквизиты',
  VIRTUAL: 'ВИРТУАЛЬНАЯ', VALID: 'ДО', Frozen: 'Заморожена', Active: 'Активна',
  'Crypto in. Card out.': 'Крипта на входе. Карта на выходе.',
  'Send USDT': 'Отправьте USDT', 'From any wallet or exchange, on TRON, Ethereum or Solana.': 'С любого кошелька или биржи, в сети TRON, Ethereum или Solana.',
  'Get dollars': 'Получите доллары', 'Crypto lands as a regular balance on your card. 1 USDT = $1.': 'Крипта становится обычным балансом карты. 1 USDT = $1.',
  'Pay anywhere': 'Платите где угодно', 'Use the card online, in apps and subscriptions.': 'Карта работает онлайн, в приложениях и подписках.',
  'Your card, your rules': 'Ваша карта, ваши правила',
  'Every switch below is live. Try a purchase and see what the card does.': 'Все переключатели работают. Попробуйте оплату и посмотрите, что сделает карта.',
  'Freeze card': 'Заморозить карту', 'Blocks every payment instantly. Unfreeze any time.': 'Мгновенно блокирует все платежи. Разморозить можно в любой момент.',
  'Online payments': 'Онлайн-платежи', 'Turn off when you are not shopping.': 'Отключайте, когда ничего не покупаете.',
  'Monthly limit': 'Лимит в месяц', '{spent} of {limit} spent this month': 'Потрачено {spent} из {limit} в этом месяце',
  'Try a payment': 'Попробовать оплату', 'Pay {amount} to {merchant}': 'Оплатить {amount} в {merchant}',
  'Approved': 'Одобрено', 'Declined: card is frozen': 'Отклонено: карта заморожена', 'Declined: online payments are off': 'Отклонено: онлайн-платежи выключены',
  'Declined: over the monthly limit': 'Отклонено: превышен лимит', 'Declined: not enough balance': 'Отклонено: недостаточно средств',
  'Recent activity': 'Последние операции', Today: 'Сегодня', Yesterday: 'Вчера', Declined: 'Отклонено',
  Subscription: 'Подписка', 'Hotel, Lisbon': 'Отель, Лиссабон', Games: 'Игры', Ride: 'Поездка', 'Top up ': 'Пополнение',
  Movies: 'Фильмы', 'App Store': 'App Store',
  // sheets
  'Top up card': 'Пополнить карту', 'Choose asset': 'Актив', Network: 'Сеть', Amount: 'Сумма', 'Network fee': 'Комиссия сети',
  'You get': 'Зачислим', 'Estimated balance': 'Баланс после', Continue: 'Продолжить', 'Sending…': 'Отправляем…', 'Balance updated': 'Баланс обновлён',
  'Demo only. No real crypto is sent.': 'Только демо. Настоящая крипта не отправляется.',
  From: 'Отдаёте', To: 'Получаете', Rate: 'Курс', Convert: 'Обменять', 'Swap direction': 'Поменять направление',
  'Not enough balance': 'Недостаточно средств', Done: 'Готово',
  'Card details': 'Реквизиты карты', 'Card number': 'Номер карты', Expiry: 'Срок', Show: 'Показать', Hide: 'Скрыть', Copy: 'Копировать', Copied: 'Скопировано',
  Pockets: 'Счета', Close: 'Закрыть', 'Card is frozen': 'Карта заморожена',
  'A frontend demo for a portfolio. No real cards, wallets or payments.': 'Фронтенд-демо для портфолио. Никаких настоящих карт, кошельков и платежей.',
  'Reset demo': 'Сбросить демо', 'Card ready': 'Карта готова', 'Your demo card is ready below.': 'Ваша демо-карта уже ниже.',
};

export type T = (s: string, v?: Record<string, string | number>) => string;
export function useI18n() {
  const lang = useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, () => current);
  const t: T = (s, v) => {
    let r = lang === 'ru' ? RU[s] ?? s : s;
    if (v) for (const k in v) r = r.split(`{${k}}`).join(String(v[k]));
    return r;
  };
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US';
  const money = (n: number, cur: 'USD' | 'EUR' = 'USD', sign = false) => {
    const s = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sym = cur === 'USD' ? '$' : '€';
    return (sign ? (n > 0 ? '+' : n < 0 ? '−' : '') : n < 0 ? '−' : '') + sym + s;
  };
  return { lang, t, locale, money };
}
