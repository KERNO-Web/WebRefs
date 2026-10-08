// Believable starting data for KERN Coffee Roasters: café orders and beans at
// the counter, gear and subscriptions through payment links, wholesale on
// invoices. Generated relative to "now" with a fixed seed, so every visitor
// gets the same shape of business with today already in progress.

import { getRates } from './rates';
import type { AssetId, DemoState, Invoice, Payment, PaymentLink, Text } from './model';
import { ASSETS, SESSION_MINUTES, assetById, fakeAddress, fakeHash, invoiceTotal, rid } from './model';

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const L = (ru: string, en: string): Text => ({ ru, en });

const CAFE: [Text, number][] = [
  [L('Флэт уайт и круассан', 'Flat white and croissant'), 520],
  [L('Капучино 0,3', 'Cappuccino, 300 ml'), 290],
  [L('Фильтр-кофе, 2 чашки', 'Filter coffee, 2 cups'), 480],
  [L('Раф и чизкейк', 'Raf coffee and cheesecake'), 640],
  [L('Эспрессо-тоник', 'Espresso tonic'), 340],
  [L('Завтрак: гранола и латте', 'Breakfast: granola and latte'), 690],
  [L('Воронка V60, Эфиопия', 'V60 pour-over, Ethiopia'), 420],
  [L('Два латте с собой', 'Two lattes to go'), 580],
];

const BEANS: [Text, number][] = [
  [L('Эфиопия Иргачеффе, 250 г', 'Ethiopia Yirgacheffe, 250 g'), 1190],
  [L('Колумбия Уила, 1 кг', 'Colombia Huila, 1 kg'), 3490],
  [L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'), 1890],
  [L('Кения АА, 250 г', 'Kenya AA, 250 g'), 1390],
  [L('Дегустационный набор, 4 × 100 г', 'Tasting set, 4 × 100 g'), 1650],
  [L('Бразилия Серрадо, 1 кг', 'Brazil Cerrado, 1 kg'), 2490],
  [L('Гватемала Антигуа, 500 г', 'Guatemala Antigua, 500 g'), 1790],
];

const GEAR: [Text, number][] = [
  [L('Кемекс на 6 чашек', 'Chemex, 6 cups'), 6900],
  [L('Ручная кофемолка', 'Hand grinder'), 14900],
  [L('Чайник с гусиным носиком', 'Gooseneck kettle'), 4290],
  [L('Весы с таймером', 'Scale with timer'), 3290],
  [L('Аэропресс и фильтры', 'AeroPress with filters'), 4590],
];

const PEOPLE: Text[] = [
  L('Анна Ковалёва', 'Anna Kovaleva'),
  L('Дмитрий Орлов', 'Dmitry Orlov'),
  L('Мария Соколова', 'Maria Sokolova'),
  L('Илья Белов', 'Ilya Belov'),
  L('Екатерина Морозова', 'Ekaterina Morozova'),
  L('Артём Захаров', 'Artem Zakharov'),
  L('Ольга Никитина', 'Olga Nikitina'),
  L('Сергей Лебедев', 'Sergey Lebedev'),
  L('Полина Гусева', 'Polina Guseva'),
  L('Никита Фролов', 'Nikita Frolov'),
  L('Вера Ершова', 'Vera Ershova'),
  L('Тимур Алиев', 'Timur Aliev'),
];

const ASSET_WEIGHTS: [AssetId, number][] = [
  ['usdt_ton', 44],
  ['usdt_tron', 17],
  ['ton', 14],
  ['usdc_sol', 10],
  ['btc', 9],
  ['eth_base', 6],
];

const DAY = 86_400_000;
const MIN = 60_000;

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function createSeed(now = Date.now()): DemoState {
  const rnd = mulberry32(0x6b766974);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const weighted = <T,>(list: [T, number][]) => {
    const total = list.reduce((s, [, w]) => s + w, 0);
    let x = rnd() * total;
    for (const [v, w] of list) if ((x -= w) <= 0) return v;
    return list[0][0];
  };

  const rates = getRates();
  const today = startOfDay(now);
  const payments: Payment[] = [];

  const settle = (p: Payment, at: number, dayIndex: number) => {
    const asset = weighted(ASSET_WEIGHTS);
    const a = assetById(asset);
    // gentle drift so older days were paid at slightly different rates
    const drift = 1 + Math.sin(dayIndex * 1.7) * 0.012 + (rnd() - 0.5) * 0.004;
    const coinDrift = a.coin === 'usdt' || a.coin === 'usdc' ? drift : drift * (1 + (rnd() - 0.5) * 0.05);
    const rate = rates.rub[a.coin] * coinDrift;
    const f = 10 ** a.decimals;
    p.asset = asset;
    p.rate = rate;
    p.crypto = Math.ceil((p.amount / rate) * f) / f;
    p.networkFee = a.fee;
    p.usdt = +(p.amount / (rates.rub.usdt * drift)).toFixed(2);
    p.from = fakeAddress(asset, rnd);
    p.txHash = fakeHash(rnd);
    p.processingAt = at - Math.round(between(3, 40) * 1000);
    p.resolveAt = at;
    p.paidAt = at;
    p.status = 'paid';
  };

  const make = (amount: number, description: Text, source: Payment['source'], createdAt: number, extra: Partial<Payment> = {}): Payment => ({
    id: rid('pay', 10, rnd),
    amount,
    description,
    source,
    status: 'created',
    createdAt,
    expiresAt: createdAt + SESSION_MINUTES * MIN,
    refunds: [],
    ...extra,
  });

  // ---- payment links ----
  const links: PaymentLink[] = [
    {
      id: 'lnk_MORNING1KG',
      title: L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'),
      description: L('Обжарка под эспрессо, отправка в день заказа.', 'Espresso roast, shipped the day you order.'),
      amount: 1890,
      reusable: true,
      active: true,
      createdAt: today - 40 * DAY,
    },
    {
      id: 'lnk_BREWCLASS12',
      title: L('Мастер-класс по альтернативе', 'Manual brewing workshop'),
      description: L('Суббота, 12:00. Воронка, кемекс и аэропресс. Длительность 2 часа.', 'Saturday at noon. Pour-over, Chemex and AeroPress. Two hours.'),
      amount: 3500,
      reusable: true,
      active: true,
      createdAt: today - 9 * DAY,
    },
    {
      id: 'lnk_GIFT5000',
      title: L('Подарочный сертификат на 5 000 ₽', 'Gift card, 5,000 ₽'),
      description: L('Действует на зерно, напитки и оборудование 12 месяцев.', 'Valid for beans, drinks and gear for 12 months.'),
      amount: 5000,
      reusable: true,
      active: true,
      createdAt: today - 60 * DAY,
    },
    {
      id: 'lnk_RENTDEPOSIT',
      title: L('Предоплата: аренда кофемашины', 'Deposit: espresso machine rental'),
      description: L('Залог за двухгруппную машину на выездное мероприятие.', 'Deposit for a two-group machine for an off-site event.'),
      amount: 18000,
      reusable: false,
      active: false,
      createdAt: today - 6 * DAY,
    },
    {
      id: 'lnk_V60KIT',
      title: L('Набор для воронки V60', 'V60 brewing kit'),
      description: L('Воронка, 100 фильтров и 250 г зерна на выбор.', 'Dripper, 100 filters and 250 g of beans.'),
      amount: 2790,
      reusable: true,
      active: false,
      createdAt: today - 30 * DAY,
    },
  ];

  // ---- day-by-day sales ----
  const DAYS = 14;
  for (let d = DAYS - 1; d >= 0; d--) {
    const dayStart = today - d * DAY;
    const weekday = new Date(dayStart).getDay();
    const weekend = weekday === 0 || weekday === 6;
    let count = Math.round(weekend ? between(34, 44) : between(26, 36));
    const lastMoment = d === 0 ? now - 3 * MIN : dayStart + DAY - MIN;

    for (let i = 0; i < count; i++) {
      const roll = rnd();
      let p: Payment;
      if (roll < 0.52) {
        const [desc, price] = pick(CAFE);
        const t = dayStart + between(8, 21.5) * 60 * MIN;
        p = make(price, desc, 'pos', t);
      } else if (roll < 0.82) {
        const [desc, price] = pick(BEANS);
        const qty = rnd() < 0.18 ? 2 : 1;
        const viaLink = rnd() < 0.3;
        const t = dayStart + between(viaLink ? 7 : 9, viaLink ? 23.5 : 21) * 60 * MIN;
        p = make(price * qty, desc, viaLink ? 'link' : 'pos', t, viaLink ? { sourceId: 'lnk_MORNING1KG', customer: pick(PEOPLE) } : {});
        if (viaLink) p.description = links[0].title;
        if (viaLink) p.amount = links[0].amount;
      } else if (roll < 0.9) {
        const [desc, price] = pick(GEAR);
        const t = dayStart + between(10, 20.5) * 60 * MIN;
        p = make(price, desc, 'pos', t);
      } else if (roll < 0.95) {
        const link = rnd() < 0.5 ? links[1] : links[2];
        const t = dayStart + between(8, 23) * 60 * MIN;
        p = make(link.amount, link.title, 'link', t, { sourceId: link.id, customer: pick(PEOPLE) });
      } else {
        const t = dayStart + between(9, 21) * 60 * MIN;
        p = make(2490, L('Бразилия Серрадо, 1 кг', 'Brazil Cerrado, 1 kg'), 'pos', t);
      }

      if (p.createdAt > lastMoment) continue;
      const paidAt = p.createdAt + Math.round(between(25, 160) * 1000);
      const outcome = rnd();
      if (outcome < 0.035) {
        p.status = 'expired';
        p.closedAt = p.expiresAt;
        if (p.expiresAt > now) {
          p.status = 'pending';
          delete p.closedAt;
        }
      } else if (outcome < 0.055) {
        settle(p, paidAt, d);
        p.status = 'failed';
        p.failedAt = paidAt;
        delete p.paidAt;
        delete p.usdt;
        p.txHash = undefined;
      } else {
        if (paidAt > now) continue;
        settle(p, paidAt, d);
        if (d > 0 && outcome > 0.982) {
          const full = outcome > 0.991;
          const amount = full ? p.amount : Math.round(p.amount * 0.4);
          const at = paidAt + Math.round(between(1, 5) * 60 * MIN);
          if (at < now - 10 * MIN) {
            p.refunds.push({
              id: rid('ref', 10, rnd),
              amount,
              crypto: +((p.crypto! * amount) / p.amount).toFixed(assetById(p.asset).decimals),
              usdt: +((p.usdt! * amount) / p.amount).toFixed(2),
              reason: full
                ? L('Покупатель отказался от заказа', 'Customer cancelled the order')
                : L('Частично нет в наличии', 'Partly out of stock'),
              status: 'completed',
              createdAt: at,
              resolveAt: at + 4000,
              completedAt: at + 4000,
            });
            p.status = full ? 'refunded' : 'partial_refund';
          }
        }
      }
      payments.push(p);
    }
  }

  // one-off deposit link: paid once, so it's closed
  {
    const t = today - 5 * DAY + 14.3 * 60 * MIN;
    const p = make(18000, links[3].title, 'link', t, { sourceId: links[3].id, customer: L('Бюро «Север»', 'Sever Studio') });
    settle(p, t + 90_000, 5);
    payments.push(p);
    links[3].completedAt = p.paidAt;
  }

  // ---- invoices ----
  const inv = (n: number, customer: Text, email: string, items: Invoice['items'], created: number, dueDays: number, status: Invoice['status'], memo?: Text): Invoice => ({
    id: rid('inv', 10, rnd),
    number: `KC-${String(n).padStart(4, '0')}`,
    customer,
    email,
    items,
    memo,
    status,
    createdAt: created,
    sentAt: status === 'draft' ? undefined : created + 5 * MIN,
    dueAt: created + dueDays * DAY,
  });

  const invoices: Invoice[] = [
    inv(141, L('Кофейня «Сезон»', 'Sezon Coffee'), 'orders@sezon.cafe', [
      { title: L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'), qty: 12, price: 1590 },
      { title: L('Колумбия Уила, 1 кг', 'Colombia Huila, 1 kg'), qty: 5, price: 2990 },
    ], today - 12 * DAY + 11 * 60 * MIN, 7, 'paid'),
    inv(142, L('Отель «Волна»', 'Volna Hotel'), 'fb@volna-hotel.ru', [
      { title: L('Кофе-брейк на 40 гостей', 'Coffee break for 40 guests'), qty: 1, price: 38000 },
    ], today - 10 * DAY + 15 * 60 * MIN, 5, 'paid', L('Конференц-зал, 2 этаж. Подача в 11:00.', 'Conference hall, 2nd floor. Serve at 11:00.')),
    inv(143, L('Пекарня «Хлебный двор»', 'Khlebny Dvor Bakery'), 'zakaz@hlebdvor.ru', [
      { title: L('Бразилия Серрадо, 1 кг', 'Brazil Cerrado, 1 kg'), qty: 8, price: 2190 },
    ], today - 8 * DAY + 10 * 60 * MIN, 3, 'expired'),
    inv(144, L('Коворкинг «Точка»', 'Tochka Coworking'), 'office@tochka.space', [
      { title: L('Аренда кофемашины, октябрь', 'Espresso machine rental, October'), qty: 1, price: 18000 },
      { title: L('Обслуживание кофемашины', 'Machine servicing'), qty: 1, price: 6500 },
    ], today - 6 * DAY + 12 * 60 * MIN, 7, 'paid'),
    inv(145, L('Ресторан «Охра»', 'Okhra Restaurant'), 'bar@okhra.rest', [
      { title: L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'), qty: 6, price: 1590 },
      { title: L('Кения АА, 1 кг', 'Kenya AA, 1 kg'), qty: 2, price: 4890 },
    ], today - 4 * DAY + 16 * 60 * MIN, 5, 'cancelled', L('Заменён счётом KC-0147', 'Replaced by invoice KC-0147')),
    inv(146, L('Кофейня «Сезон»', 'Sezon Coffee'), 'orders@sezon.cafe', [
      { title: L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'), qty: 10, price: 1590 },
      { title: L('Гватемала Антигуа, 1 кг', 'Guatemala Antigua, 1 kg'), qty: 4, price: 3290 },
    ], today - 2 * DAY + 10 * 60 * MIN, 7, 'pending'),
    inv(147, L('Ресторан «Охра»', 'Okhra Restaurant'), 'bar@okhra.rest', [
      { title: L('Эспрессо-смесь «Утро», 1 кг', 'Morning espresso blend, 1 kg'), qty: 6, price: 1590 },
      { title: L('Кения АА, 1 кг', 'Kenya AA, 1 kg'), qty: 3, price: 4890 },
    ], today - 3 * DAY + 13 * 60 * MIN, 4, 'pending'),
    inv(148, L('Бюро «Север»', 'Sever Studio'), 'hello@sever.studio', [
      { title: L('Кофе-брейк на 15 гостей', 'Coffee break for 15 guests'), qty: 1, price: 14500 },
      { title: L('Бариста на мероприятие, 4 часа', 'Event barista, 4 hours'), qty: 1, price: 8000 },
    ], today - 30 * MIN, 10, 'draft'),
  ];

  for (const i of invoices) {
    if (i.status === 'expired') i.closedAt = i.dueAt;
    if (i.status === 'cancelled') i.closedAt = i.createdAt + 2 * DAY;
    if (i.status !== 'paid') continue;
    const created = i.sentAt! + Math.round(between(2, 40) * 60 * MIN);
    const p = make(invoiceTotal(i), { ru: `Счёт ${i.number}`, en: `Invoice ${i.number}` }, 'invoice', created, {
      sourceId: i.id,
      customer: i.customer,
    });
    settle(p, created + 70_000, Math.round((today - created) / DAY));
    i.paidAt = p.paidAt;
    i.paymentId = p.id;
    payments.push(p);
  }

  payments.sort((a, b) => b.createdAt - a.createdAt);

  return {
    v: 2,
    seededAt: now,
    merchant: {
      name: 'KERN Coffee Roasters',
      settleAsset: 'USDT',
      accepted: ASSETS.map((a) => a.id),
      feeRate: 0.009,
      payoutWallet: fakeAddress('usdt_ton', rnd),
      apiKey: 'sk_sandbox_' + fakeHash(rnd).slice(0, 32),
    },
    payments,
    invoices,
    links,
  };
}
