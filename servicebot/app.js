// Отвёртка: a fictional repair shop. The bot logic below is the same state
// machine a real Telegram bot runs; here the "server" is this page, so the
// client chat (left) and the master's panel (right) talk to each other live.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
const now = () => new Date().toTimeString().slice(0, 5);
const rub = (n) => n.toLocaleString('ru-RU').replace(/\s/g, ' ') + ' ₽';

/* ---------------- shop data ---------------- */
const ADDRESS = 'ул. Ленина, 112, вход со двора';
const HOURS = 'Пн-Сб 10:00-20:00, Вс 11:00-17:00';
const TYPES = {
  phone: { name: 'Смартфон', icon: 'ph-device-mobile', models: ['iPhone 13', 'Samsung A54', 'Redmi Note 12'] },
  laptop: { name: 'Ноутбук', icon: 'ph-laptop', models: ['MacBook Air M1', 'Lenovo IdeaPad 5', 'ASUS VivoBook'] },
  tablet: { name: 'Планшет', icon: 'ph-device-tablet', models: ['iPad 9', 'Galaxy Tab A8', 'Xiaomi Pad 6'] },
};
const ISSUES = {
  screen: 'Разбит экран',
  charge: 'Не заряжается',
  power: 'Не включается',
  water: 'Попала вода',
  other: 'Другое',
};
// [price, time, what the master usually finds]
const EST = {
  phone: { screen: [5900, 'около часа', 'замена дисплея'], charge: [1500, 'около часа', 'замена разъёма зарядки'], power: [2400, '1-2 дня', 'ремонт платы питания'], water: [1200, '1 день', 'чистка после воды'], other: [0, 'после диагностики', 'по результату диагностики'] },
  laptop: { screen: [8500, '1-2 дня', 'замена матрицы'], charge: [2900, '1 день', 'замена разъёма питания'], power: [3900, '2-3 дня', 'ремонт платы'], water: [2500, '2 дня', 'чистка после воды'], other: [0, 'после диагностики', 'по результату диагностики'] },
  tablet: { screen: [6900, '1 день', 'замена тачскрина'], charge: [1900, 'около часа', 'замена разъёма зарядки'], power: [2900, '1-2 дня', 'ремонт платы питания'], water: [1500, '1 день', 'чистка после воды'], other: [0, 'после диагностики', 'по результату диагностики'] },
};
const MODEL_SCREEN = { 'iPhone 13': 9900, 'Samsung A54': 7400, 'Redmi Note 12': 4900, 'MacBook Air M1': 24000, 'iPad 9': 6900 };
const PRICES = {
  phone: [['Замена экрана', 'от 3 900 ₽'], ['Замена аккумулятора', 'от 1 900 ₽'], ['Разъём зарядки', 'от 1 500 ₽'], ['Чистка после воды', 'от 1 200 ₽']],
  laptop: [['Чистка и термопаста', '2 500 ₽'], ['Замена матрицы', 'от 6 500 ₽'], ['Замена клавиатуры', 'от 3 200 ₽'], ['Установка Windows', '1 500 ₽']],
  tablet: [['Замена тачскрина', 'от 3 500 ₽'], ['Замена аккумулятора', 'от 2 400 ₽'], ['Разъём зарядки', 'от 1 900 ₽'], ['Прошивка', '1 200 ₽']],
};
const FLOW = ['new', 'accepted', 'diag', 'parts', 'repair', 'ready', 'given'];
const ST = { new: 'Новая', accepted: 'Принят', diag: 'Диагностика', parts: 'Ждём запчасть', repair: 'В ремонте', ready: 'Готов', given: 'Выдан' };

const orders = [
  { no: 2415, who: 'Тимур', device: 'Redmi Note 12', issue: 'Попала вода', slot: 'сдал сегодня в 11:20', status: 'diag', price: 1200 },
  { no: 2414, who: 'Валентина', device: 'iPad 9', issue: 'Разбит экран', slot: 'сдала вчера', status: 'parts', price: 6900 },
  { no: 2412, who: 'Константин', device: 'Lenovo IdeaPad 5', issue: 'Греется, шумит', slot: 'сдал 18 окт', status: 'ready', price: 2500 },
  { no: 2409, who: 'Марина', device: 'Samsung A54', issue: 'Не заряжается', slot: 'сдала 17 окт', status: 'repair', price: 1500 },
];
const inbox = [{ id: 1, who: 'Марина', text: 'Сколько стоит поменять стекло камеры на iPhone 14 Pro?', time: '10:42', mine: false, answered: false }];
const sent = [];
let seq = 2416;
let mine = null; // the visitor's own order

/* ---------------- chat rendering ---------------- */
const feed = $('#feed');
let chain = Promise.resolve();

function ikbHTML(rows) {
  return `<div class="ikb">${rows.map((r) => `<div class="row">${r.map((b) => `<button type="button" data-a="${esc(b.a)}">${b.i ? `<i class="ph ${b.i}"></i>` : ''}${esc(b.t)}</button>`).join('')}</div>`).join('')}</div>`;
}
function add(side, html, ikb) {
  const m = document.createElement('div');
  m.className = `m ${side}`;
  const tick = side === 'out' ? ' <i class="ph ph-checks"></i>' : '';
  m.innerHTML = `<div class="b">${html}<span class="tm">${now()}${tick}</span></div>${ikb ? ikbHTML(ikb) : ''}`;
  feed.append(m);
  stick();
  if (sideHidden('client')) $('#dotClient').classList.add('on');
  return m;
}
function bot(html, opt = {}) {
  chain = chain.then(async () => {
    $('#tgStatus').textContent = 'печатает...';
    const t = document.createElement('div');
    t.className = 'm in';
    t.innerHTML = '<div class="b"><span class="typing"><i></i><i></i><i></i></span></div>';
    feed.append(t);
    stick();
    await wait(opt.delay ?? 520 + Math.min(900, html.length * 4));
    t.remove();
    $('#tgStatus').textContent = 'бот';
    add('in', html, opt.ikb);
    if ('kb' in opt) setKb(opt.kb);
  });
  return chain;
}
const me = (html) => add('out', html);
function stick() {
  feed.scrollTop = feed.scrollHeight;
  requestAnimationFrame(() => (feed.scrollTop = feed.scrollHeight));
}

const MAIN_KB = [
  { t: 'Сдать в ремонт', a: 'repair' },
  { t: 'Статус ремонта', a: 'status' },
  { t: 'Цены', a: 'prices' },
  { t: 'Адрес и часы', a: 'address' },
  { t: 'Написать мастеру', a: 'master', wide: true },
];
function setKb(list) {
  const kb = $('#replyKb');
  kb.classList.remove('collapsed');
  kb.innerHTML = (list || []).map((b) => `<button type="button" data-k="${b.a}" class="${b.wide ? 'wide' : ''}">${b.i ? `<i class="ph ${b.i}"></i> ` : ''}${esc(b.t)}</button>`).join('');
}
$('#kbToggle').addEventListener('click', () => {
  const kb = $('#replyKb');
  if (!kb.innerHTML) setKb(MAIN_KB);
  else kb.classList.toggle('collapsed');
});

/* ---------------- bot logic ---------------- */
let awaiting = null; // 'model' | 'issueText' | 'master'
let draft = null;

function start() {
  $('#start').hidden = true;
  feed.insertAdjacentHTML('beforeend', '<span class="day">Сегодня</span>');
  me('/start');
  bot('Здравствуйте, это сервисный центр <b>«Отвёртка»</b>. Чиним телефоны, ноутбуки и планшеты, диагностика бесплатно.<span class="note">Через меня можно сдать технику в ремонт, узнать цену и статус. Выберите в меню ниже.</span>', { kb: MAIN_KB });
}

const cmdLabel = (a, label) => (a.startsWith('rate:') ? `Оценка: ${a.slice(5)} из 5` : label);
function act(a, label) {
  if (label) me(esc(cmdLabel(a, label)));
  const cut = a.indexOf(':');
  const cmd = cut < 0 ? a : a.slice(0, cut);
  const arg = cut < 0 ? '' : a.slice(cut + 1);
  if (cmd === 'repair') return askType();
  if (cmd === 'type') return askModel(arg);
  if (cmd === 'model') return gotModel(arg);
  if (cmd === 'issue') return gotIssue(arg);
  if (cmd === 'slot') return gotSlot(arg);
  if (cmd === 'contact') return gotContact();
  if (cmd === 'confirm') return confirmOrder();
  if (cmd === 'edit') return askType(true);
  if (cmd === 'status') return showStatus(arg ? Number(arg) : null);
  if (cmd === 'prices') return showPrices(arg);
  if (cmd === 'address') return showAddress();
  if (cmd === 'route') return bot(`Открываю маршрут: ${ADDRESS}. В рабочей версии кнопка ведёт в Яндекс Карты.`);
  if (cmd === 'master') {
    awaiting = 'master';
    return bot('Напишите вопрос одним сообщением, мастер ответит здесь же. Обычно в течение 10 минут.', { kb: MAIN_KB });
  }
  if (cmd === 'agree') return clientAgree(arg === 'yes');
  if (cmd === 'pay') return openPay();
  if (cmd === 'rate') return rate(Number(arg));
  if (cmd === 'promo') return askType();
}

function askType(again) {
  draft = {};
  awaiting = null;
  bot(again ? 'Хорошо, заполним заново. Что сломалось?' : 'Что сломалось?', {
    ikb: [
      Object.entries(TYPES).map(([k, t]) => ({ t: t.name, a: `type:${k}`, i: t.icon })),
    ],
  });
}
function askModel(type) {
  draft.type = type;
  awaiting = 'model';
  bot('Какая модель? Выберите или напишите сообщением.', { ikb: [TYPES[type].models.map((m) => ({ t: m, a: `model:${m}` }))] });
}
function gotModel(model) {
  draft.model = model;
  awaiting = null;
  bot(`${esc(model)}, понял. Что с ним?`, {
    ikb: [
      [{ t: ISSUES.screen, a: 'issue:screen' }, { t: ISSUES.charge, a: 'issue:charge' }],
      [{ t: ISSUES.power, a: 'issue:power' }, { t: ISSUES.water, a: 'issue:water' }],
      [{ t: 'Другое, опишу', a: 'issue:other' }],
    ],
  });
}
function gotIssue(key, text) {
  if (key === 'other' && !text) {
    awaiting = 'issueText';
    return bot('Опишите в двух словах, что происходит.');
  }
  awaiting = null;
  draft.issue = key;
  draft.issueText = text || ISSUES[key];
  let [price, time, what] = EST[draft.type][key];
  if (key === 'screen' && MODEL_SCREEN[draft.model]) price = MODEL_SCREEN[draft.model];
  draft.price = price;
  draft.what = what;
  const est = price
    ? `Предварительно это ${what}: <b>от ${rub(price)}</b>, срок ${time}. Точную цену мастер скажет после бесплатной диагностики, без вашего согласия ничего не делаем.`
    : 'Цену назовём после диагностики, она бесплатная и занимает до часа. Без вашего согласия ремонт не начнём.';
  bot(est);
  bot('Когда удобно принести?', {
    ikb: [
      [{ t: 'Сегодня до 20:00', a: 'slot:Сегодня до 20:00' }, { t: 'Завтра утром', a: 'slot:Завтра с 10:00' }],
      [{ t: 'Курьер заберёт, +300 ₽', a: 'slot:Курьер заберёт' }],
    ],
  });
}
function gotSlot(slot) {
  draft.slot = slot;
  bot('Оставьте номер, чтобы мастер мог позвонить, если что-то уточнить.', { kb: [{ t: 'Отправить номер телефона', a: 'contact', wide: true, i: 'ph-phone' }] });
}
function gotContact() {
  me('<div class="contact"><span class="ava"><i class="ph-fill ph-user"></i></span><div><b>Вы</b><small>+7 9•• •••-••-21</small></div></div>');
  draft.no = seq + 1;
  bot(
    `<span class="card-h"><i class="ph-fill ph-clipboard-text"></i>Проверьте заявку</span>
     <span class="lines">
       <span><em>Устройство</em>${esc(draft.model)}</span>
       <span><em>Проблема</em>${esc(draft.issueText)}</span>
       <span><em>Когда</em>${esc(draft.slot)}</span>
       <span><em>Оценка</em>${draft.price ? 'от ' + rub(draft.price) : 'после диагностики'}</span>
     </span>`,
    { ikb: [[{ t: 'Всё верно', a: 'confirm', i: 'ph-check' }, { t: 'Изменить', a: 'edit' }]], kb: MAIN_KB },
  );
}
function confirmOrder() {
  seq++;
  mine = { no: seq, who: 'Вы (демо)', device: draft.model, issue: draft.issueText, slot: draft.slot, status: 'new', price: draft.price || 2900, what: draft.what, mine: true, agreed: null, paid: false, rating: 0 };
  orders.unshift(mine);
  const where = draft.slot === 'Курьер заберёт' ? 'Курьер позвонит за 30 минут до приезда.' : `Ждём вас: ${ADDRESS}. ${HOURS}.`;
  bot(`Готово, заявка <b>№${mine.no}</b>. ${where}<span class="note">Статус ремонта буду присылать сюда. Переключитесь на сторону мастера, чтобы двигать заявку.</span>`, {
    ikb: [[{ t: 'Маршрут', a: 'route', i: 'ph-map-pin' }]],
  });
  renderOrders(mine.no);
  ping('admin', `Новая заявка №${mine.no}: ${mine.device}, ${mine.issue.toLowerCase()}`);
}

function statusCard(o) {
  const i = FLOW.indexOf(o.status);
  return `<span class="card-h"><i class="ph-fill ph-wrench"></i>Заявка №${o.no}</span>
    ${esc(o.device)}, ${esc(o.issue.toLowerCase())}
    <span class="progress">${FLOW.slice(1).map((s, k) => `<i class="${k < i ? 'on' : ''}"></i>`).join('')}</span>
    Сейчас: <b>${ST[o.status]}</b>`;
}
function showStatus(no) {
  const o = no ? orders.find((x) => x.no === no) : mine;
  if (o) return bot(statusCard(o));
  bot('У вас пока нет заявок в работе. Номер есть на квитанции, можно проверить чужую для примера.', { ikb: [[{ t: 'Проверить №2409', a: 'status:2409' }]] });
}
function showPrices(type) {
  if (!type) return bot('Что смотрим?', { ikb: [Object.entries(TYPES).map(([k, t]) => ({ t: t.name, a: `prices:${k}`, i: t.icon }))] });
  bot(`<b>${TYPES[type].name}: популярные работы</b><span class="lines">${PRICES[type].map(([a, b]) => `<span><em>${a}</em>${b}</span>`).join('')}<span><em>Диагностика</em>бесплатно</span></span><span class="note">Гарантия на ремонт 90 дней.</span>`, {
    ikb: [[{ t: 'Сдать в ремонт', a: 'repair' }]],
  });
}
function showAddress() {
  bot(`<b>${ADDRESS}</b><br />${HOURS}<span class="note">Парковка у входа. Без записи, очередь обычно до 10 минут.</span>`, { ikb: [[{ t: 'Маршрут', a: 'route', i: 'ph-map-pin' }]] });
}

function freeText(text) {
  me(esc(text));
  if (awaiting === 'model') return gotModel(text.slice(0, 40));
  if (awaiting === 'issueText') return gotIssue('other', text.slice(0, 80));
  const t = text.toLowerCase();
  if (awaiting !== 'master') {
    if (/^\/start/.test(t)) return bot('Я на месте. Меню ниже.', { kb: MAIN_KB });
    if (/цен|стоит|сколько|прайс/.test(t) && !/статус/.test(t)) return showPrices();
    if (/адрес|где вы|часы|работаете|время работы/.test(t)) return showAddress();
    if (/статус|готов/.test(t)) return showStatus();
    if (/ремонт|сломал|разбил|разбит|почин|не работает/.test(t)) return askType();
  }
  awaiting = null;
  inbox.unshift({ id: Date.now(), who: 'Вы (демо)', text, time: now(), mine: true, answered: false });
  renderInbox();
  ping('admin', `Вопрос от клиента: «${text.slice(0, 50)}»`);
  bot('Передал вопрос мастеру, ответ придёт сюда. Можно переключиться на сторону мастера и ответить самому.');
}

function clientAgree(yes) {
  if (!mine) return;
  mine.agreed = yes;
  renderOrders();
  if (yes) {
    bot('Принято, начинаем. Напишу, когда будет готово.');
    ping('admin', `Клиент согласовал ремонт №${mine.no}`);
  } else {
    bot('Хорошо, мастер позвонит в течение 15 минут.');
    ping('admin', `Клиент просит позвонить по №${mine.no}`);
  }
}

function openPay() {
  if (!mine || mine.paid) return;
  const pay = $('#pay');
  pay.hidden = false;
  pay.innerHTML = `<div class="sheet" role="dialog" aria-label="Оплата">
    <h3>Оплата ремонта №${mine.no}</h3>
    <span class="sum">${rub(mine.price)}</span>
    <div class="meth"><button type="button" aria-pressed="true" data-m="sbp"><i class="ph ph-qr-code"></i>СБП</button><button type="button" aria-pressed="false" data-m="card"><i class="ph ph-credit-card"></i>Карта</button></div>
    <button class="btn" type="button" data-pay>Оплатить ${rub(mine.price)}</button>
    <small>Демо: деньги не списываются. В рабочей версии подключается ЮKassa, Т-Банк или оплата внутри Telegram.</small>
    <button class="ghost" type="button" data-cancel>Отмена</button>
  </div>`;
}
$('#pay').addEventListener('click', async (e) => {
  const pay = $('#pay');
  if (e.target === pay || e.target.closest('[data-cancel]')) return (pay.hidden = true);
  const m = e.target.closest('[data-m]');
  if (m) return $$('[data-m]', pay).forEach((b) => b.setAttribute('aria-pressed', String(b === m)));
  const p = e.target.closest('[data-pay]');
  if (!p) return;
  p.disabled = true;
  p.textContent = 'Проводим оплату...';
  await wait(900);
  pay.hidden = true;
  mine.paid = true;
  renderOrders();
  bot(`Оплата прошла: ${rub(mine.price)}. Чек пришлю сюда, забрать устройство можно без очереди.`);
  ping('admin', `№${mine.no} оплачен онлайн, ${rub(mine.price)}`);
});

function rate(n) {
  if (!mine) return;
  mine.rating = n;
  renderOrders();
  bot(n >= 4 ? 'Спасибо. Будем рады отзыву на картах, это сильно помогает.' : 'Спасибо за честность. Руководитель свяжется с вами сегодня и разберётся.', n >= 4 ? { ikb: [[{ t: 'Оставить отзыв', a: 'route', i: 'ph-star' }]] } : {});
  ping('admin', `Оценка за №${mine.no}: ${n} из 5`);
}

/* status pushed from the master's panel */
function pushStatus(o) {
  if (!o.mine) {
    const text = { accepted: 'Приняли устройство', diag: 'Идёт диагностика', parts: 'Ждём запчасть', repair: 'Начали ремонт', ready: `Готово, к оплате ${rub(o.price)}`, given: 'Спасибо, что выбрали нас' }[o.status];
    return toast(`Бот написал клиенту (${o.who}): «${text}»`, 'ph-telegram-logo');
  }
  const msg = {
    accepted: [`Приняли ваш <b>${esc(o.device)}</b>. Мастер Илья посмотрит его в течение часа.`],
    diag: [`Диагностика готова: нужна ${esc(o.what || 'замена детали')}. Стоимость <b>${rub(o.price)}</b>, гарантия 90 дней. Делаем?`, [[{ t: 'Да, делайте', a: 'agree:yes', i: 'ph-check' }, { t: 'Позвоните мне', a: 'agree:no', i: 'ph-phone' }]]],
    parts: ['Нужная запчасть приедет завтра до 12:00. Как только поставим, напишу.'],
    repair: ['Начали ремонт.'],
    ready: [`<b>${esc(o.device)} готов.</b> К оплате ${rub(o.price)}. Забрать можно сегодня до 20:00, ${ADDRESS}.`, [[{ t: 'Оплатить онлайн', a: 'pay', i: 'ph-credit-card' }, { t: 'Маршрут', a: 'route', i: 'ph-map-pin' }]]],
    given: ['Спасибо, что выбрали «Отвёртку». Квитанция и гарантия на 90 дней сохранены в этом чате. Оцените ремонт:', [[1, 2, 3, 4, 5].map((n) => ({ t: String(n), a: `rate:${n}`, i: 'ph-star' }))]],
  }[o.status];
  if (msg) bot(msg[0], msg[1] ? { ikb: msg[1] } : {});
}

/* ---------------- admin panel ---------------- */
function tag(o) {
  const cls = o.status === 'ready' || o.status === 'given' ? 'done' : o.status === 'parts' || o.status === 'new' ? 'wait' : '';
  return `<span class="tag ${cls}">${ST[o.status]}</span>`;
}
function renderOrders(freshNo) {
  const box = $('#a-orders');
  box.innerHTML = `<p class="lead-p">Нажмите следующий статус: бот сам напишет клиенту. Заявка из чата клиента появится здесь сверху.</p>
  <div class="orders">${orders.map((o) => {
    const i = FLOW.indexOf(o.status);
    const notes = [];
    if (o.mine && o.agreed === true) notes.push('<span class="ok"><i class="ph ph-check-circle"></i>Клиент согласовал</span>');
    if (o.mine && o.agreed === false) notes.push('<span><i class="ph ph-phone"></i>Просит позвонить</span>');
    if (o.paid) notes.push('<span class="ok"><i class="ph ph-credit-card"></i>Оплачено онлайн</span>');
    if (o.rating) notes.push(`<span><i class="ph-fill ph-star"></i>Оценка ${o.rating} из 5</span>`);
    return `<article class="order ${o.mine ? 'mine' : ''} ${o.no === freshNo ? 'fresh' : ''}" data-no="${o.no}">
      <div class="o-top"><span class="no">№${o.no}</span><b>${esc(o.device)}</b>${tag(o)}</div>
      <div class="o-info"><span><i class="ph ph-user"></i>${esc(o.who)}</span><span><i class="ph ph-warning-circle"></i>${esc(o.issue)}</span><span><i class="ph ph-clock"></i>${esc(o.slot)}</span><span><i class="ph ph-currency-rub"></i>${rub(o.price)}</span>${notes.join('')}</div>
      <div class="o-flow">${FLOW.slice(1).map((s, k) => `<button type="button" data-st="${s}" class="${k + 1 < i ? 'past' : k + 1 === i ? 'cur' : ''}" ${k + 1 <= i ? 'disabled' : ''}>${ST[s]}</button>`).join('')}</div>
      ${o.mine && o.status === 'diag' && o.agreed == null ? '<span class="o-hint"><i class="ph ph-hourglass"></i>Ждём ответа клиента в чате</span>' : ''}
    </article>`;
  }).join('')}</div>`;
  $('#newCount').textContent = orders.filter((o) => o.status === 'new').length || '';
  if (freshNo) setTimeout(() => $(`.order[data-no="${freshNo}"]`)?.classList.remove('fresh'), 2600);
}
$('#a-orders').addEventListener('click', (e) => {
  const b = e.target.closest('[data-st]');
  if (!b) return;
  const o = orders.find((x) => x.no === Number(b.closest('.order').dataset.no));
  o.status = b.dataset.st;
  renderOrders();
  pushStatus(o);
  if (o.mine) ping('client', `Бот: ${ST[o.status]}`);
});

function renderInbox() {
  const open = inbox.filter((q) => !q.answered).length;
  $('#inboxCount').textContent = open || '';
  $('#a-inbox').innerHTML = inbox.length
    ? inbox.map((q) => `<div class="q ${q.answered ? 'answered' : ''}" data-id="${q.id}">
        <small>${esc(q.who)}, ${q.time}${q.answered ? ', отвечено' : ''}</small>
        <p>${esc(q.text)}</p>
        ${q.answered ? '' : `<div class="quick">${['Да, сделаем сегодня', 'Приносите, посмотрим бесплатно', 'Перезвоню через 5 минут'].map((t) => `<button type="button" data-q="${esc(t)}">${t}</button>`).join('')}</div>
        <form class="reply"><input name="r" placeholder="Ответ клиенту" aria-label="Ответ" /><button>Ответить</button></form>`}
      </div>`).join('')
    : '<div class="empty"><i class="ph ph-chats-circle"></i>Вопросов пока нет. Напишите боту что-нибудь своё, и вопрос придёт сюда.</div>';
}
function answer(id, text) {
  const q = inbox.find((x) => x.id === id);
  if (!q || !text.trim()) return;
  q.answered = true;
  renderInbox();
  if (q.mine) {
    add('in', `<span class="from">Мастер Илья</span>${esc(text)}`);
    ping('client', 'Мастер ответил');
  } else toast(`Ответ ушёл клиенту (${q.who}) в Telegram`, 'ph-telegram-logo');
}
$('#a-inbox').addEventListener('click', (e) => {
  const b = e.target.closest('[data-q]');
  if (b) answer(Number(b.closest('.q').dataset.id), b.dataset.q);
});
$('#a-inbox').addEventListener('submit', (e) => {
  e.preventDefault();
  answer(Number(e.target.closest('.q').dataset.id), e.target.elements.r.value);
});

const AUD = { all: ['Все клиенты', 214], apple: ['Клиенты с iPhone', 86], old: ['Не были больше года', 41] };
function renderBroadcast() {
  $('#a-broadcast').innerHTML = `<form class="bc" id="bc">
    <p class="lead-p" style="margin:0">Рассылка уходит тем, кто запускал бота. Без спама в личку и без покупных баз.</p>
    <label>Кому<select name="aud">${Object.entries(AUD).map(([k, [n, c]]) => `<option value="${k}">${n}, ${c}</option>`).join('')}</select></label>
    <label>Текст<textarea name="text" rows="4" maxlength="400">До конца ноября замена аккумулятора на iPhone со скидкой 15%. Работа 40 минут, гарантия 90 дней.</textarea></label>
    <button class="primary">Отправить</button>
    <div class="hist">${sent.map((s) => `<div><small>${s.time}, ${s.aud}</small>${esc(s.text)}</div>`).join('')}</div>
  </form>`;
}
$('#a-broadcast').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const text = f.text.value.trim();
  if (!text) return f.text.focus();
  const [n, c] = AUD[f.aud.value];
  sent.unshift({ time: now(), aud: `${n.toLowerCase()}, ${c}`, text });
  renderBroadcast();
  toast(`Рассылка ушла: ${c} получателей`, 'ph-megaphone');
  if ($('#start').hidden) {
    add('in', `${esc(text)}`, [[{ t: 'Записаться', a: 'promo' }]]);
    ping('client', 'Пришла рассылка');
  }
});

/* ---------------- toasts, sides ---------------- */
function toast(text, icon = 'ph-bell') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="ph-fill ${icon}"></i><span>${esc(text)}</span>`;
  $('#toasts').append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 260);
  }, 3600);
}
const sideHidden = (side) => matchMedia('(max-width: 980px)').matches && $('.stage').dataset.side !== side;
function ping(side, text) {
  if (!sideHidden(side)) return;
  $(side === 'admin' ? '#dotAdmin' : '#dotClient').classList.add('on');
  toast(side === 'admin' ? `Мастеру: ${text}` : text, side === 'admin' ? 'ph-wrench' : 'ph-telegram-logo');
}
$$('.switch button').forEach((b) =>
  b.addEventListener('click', () => {
    const side = b.dataset.side;
    $('.stage').dataset.side = side;
    $$('.switch button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $(side === 'admin' ? '#dotAdmin' : '#dotClient').classList.remove('on');
    if (side === 'client') feed.scrollTop = feed.scrollHeight;
  }),
);
$$('.a-tabs button').forEach((b) =>
  b.addEventListener('click', () => {
    $$('.a-tabs button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $$('.a-body').forEach((x) => (x.hidden = x.id !== `a-${b.dataset.tab}`));
  }),
);

/* ---------------- input wiring ---------------- */
feed.addEventListener('click', (e) => {
  const b = e.target.closest('.ikb button');
  if (!b || b.disabled) return;
  const a = b.dataset.a;
  // one-shot buttons lock after use, like a bot editing its message
  if (!/^(route|status|prices:)/.test(a)) $$('button', b.closest('.ikb')).forEach((x) => (x.disabled = true));
  act(a, b.textContent.trim());
});
$('#replyKb').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  if (b.dataset.k === 'contact') {
    setKb(MAIN_KB);
    return act('contact');
  }
  act(b.dataset.k, b.textContent.trim());
});
$('#input').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = $('#msg').value.trim();
  if (!v) return;
  $('#msg').value = '';
  if (!$('#start').hidden) start();
  freeText(v);
});
$('#startBtn').addEventListener('click', start);
$('#reset').addEventListener('click', () => location.reload());

renderOrders();
renderInbox();
renderBroadcast();
