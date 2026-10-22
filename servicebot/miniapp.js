// Отвёртка Mini App: the same service the bot gives, as an app. Prices and
// estimates are the bot's own (app.js), so both variants say the same thing.
const TYPES = { phone: 'Смартфон', laptop: 'Ноутбук', tablet: 'Планшет' };
const ISSUES = { screen: 'Разбит экран', charge: 'Не заряжается', power: 'Не включается', water: 'Попала вода' };
// [price from, time, what the master usually finds]
const EST = {
  phone: { screen: [5900, 'около часа', 'замена дисплея'], charge: [1500, 'около часа', 'замена разъёма зарядки'], power: [2400, '1-2 дня', 'ремонт платы питания'], water: [1200, '1 день', 'чистка после воды'] },
  laptop: { screen: [8500, '1-2 дня', 'замена матрицы'], charge: [2900, '1 день', 'замена разъёма питания'], power: [3900, '2-3 дня', 'ремонт платы'], water: [2500, '2 дня', 'чистка после воды'] },
  tablet: { screen: [6900, '1 день', 'замена тачскрина'], charge: [1900, 'около часа', 'замена разъёма зарядки'], power: [2900, '1-2 дня', 'ремонт платы питания'], water: [1500, '1 день', 'чистка после воды'] },
};
const PRICES = {
  phone: [['Замена экрана', 'от 3 900 ₽'], ['Замена аккумулятора', 'от 1 900 ₽'], ['Разъём зарядки', 'от 1 500 ₽'], ['Чистка после воды', 'от 1 200 ₽']],
  laptop: [['Чистка и термопаста', '2 500 ₽'], ['Замена матрицы', 'от 6 500 ₽'], ['Замена клавиатуры', 'от 3 200 ₽'], ['Установка Windows', '1 500 ₽']],
  tablet: [['Замена тачскрина', 'от 3 500 ₽'], ['Замена аккумулятора', 'от 2 400 ₽'], ['Разъём зарядки', 'от 1 900 ₽'], ['Прошивка', '1 200 ₽']],
};
const ICON = { phone: 'ph-device-mobile', laptop: 'ph-laptop', tablet: 'ph-device-tablet' };
// the tickets the master's board shows in the bot demo; `at` is the index in STEPS
const TICKETS = {
  2415: { device: 'Redmi Note 12', issue: 'Попала вода', at: 1, price: '1 200 ₽', when: 'сдан сегодня в 11:20' },
  2414: { device: 'iPad 9', issue: 'Разбит экран', at: 2, price: '6 900 ₽', when: 'сдан вчера' },
  2412: { device: 'Lenovo IdeaPad 5', issue: 'Греется, шумит', at: 4, price: '2 500 ₽', when: 'сдан 18 окт' },
  2409: { device: 'Samsung A54', issue: 'Не заряжается', at: 3, price: '1 500 ₽', when: 'сдан 17 окт' },
};
const STEPS = [['Принят', 'квитанция выдана'], ['Диагностика', 'мастер смотрит, что сломалось'], ['Ждём запчасть', 'заказали, привезут 1-2 дня'], ['В ремонте', 'мастер чинит'], ['Готов', 'можно забирать'], ['Выдан', '']];

const $ = (s, r = document) => r.querySelector(s);
const rub = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
const pick = {};
const mainBtn = $('#mainBtn');

// tabs
document.querySelectorAll('.tabs button').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach((x) => (x === b ? x.setAttribute('aria-current', 'page') : x.removeAttribute('aria-current')));
    document.querySelectorAll('.pane').forEach((p) => (p.hidden = p.dataset.pane !== b.dataset.tab));
    mainBtn.hidden = b.dataset.tab !== 'repair' || !pick.slot || !$('#done').hidden;
  }),
);

// repair: three picks, each opens the next step
document.querySelectorAll('.chips').forEach((group) =>
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    group.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    pick[group.dataset.pick] = b.dataset.v;
    const next = document.querySelector(`.step[data-after="${group.dataset.pick}"]`);
    if (next) next.classList.add('open');
    renderEstimate();
  }),
);
function renderEstimate() {
  const est = $('#estimate');
  if (!pick.type || !pick.issue) return (est.hidden = true);
  const [price, time, what] = EST[pick.type][pick.issue];
  est.hidden = false;
  est.innerHTML = `<small>ориентир по цене</small><p class="sum">от ${rub(price)}</p><p>${TYPES[pick.type]}, ${ISSUES[pick.issue].toLowerCase()}: обычно это ${what}, занимает ${time}. Диагностика бесплатно.</p>`;
  mainBtn.hidden = !pick.slot;
}
mainBtn.addEventListener('click', () => {
  const done = $('#done');
  done.hidden = false;
  done.innerHTML = `<p class="ok"><i class="ph-fill ph-check-circle"></i>Заявка принята</p><small>квитанция</small><p class="no">№2416</p><p>${TYPES[pick.type]}, ${ISSUES[pick.issue].toLowerCase()} · ${pick.slot}. Статус пришлём в этот чат, номер можно проверить во вкладке «Статус».</p>`;
  mainBtn.hidden = true;
  done.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// status by ticket number
function track(no) {
  const t = TICKETS[no];
  const box = $('#track');
  if (!t) return (box.innerHTML = `<p class="empty">Квитанции №${no} не нашли. Номер стоит в правом верхнем углу квитанции.</p>`);
  box.innerHTML = `<div class="ticket"><small>квитанция №${no}</small><h3>${t.device}</h3><p class="meta">${t.issue} · ${t.when} · ${t.price}</p><ol class="line">${STEPS.map(
    ([name, note], i) => `<li class="${i < t.at ? 'past' : i === t.at ? 'cur' : ''}">${name}${i === t.at && note ? `<small>${note}</small>` : ''}</li>`,
  ).join('')}</ol></div>`;
}
$('#lookup').addEventListener('submit', (e) => {
  e.preventDefault();
  track($('#no').value.trim());
});
track('2414');

// prices
$('#prices').innerHTML = Object.entries(PRICES)
  .map(([k, rows]) => `<div class="price-group"><h3><i class="ph ${ICON[k]}"></i>${TYPES[k]}</h3><ul>${rows.map(([n, p]) => `<li>${n}<b>${p}</b></li>`).join('')}</ul></div>`)
  .join('');
