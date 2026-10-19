import { STAGES, SOURCES, MANAGERS, ROLES, AUTOMATIONS, seed, INCOMING } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const NB = ' ';
const money = (n) => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NB) + NB + '₽';
const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(2).replace('.', ',').replace(/0$/, '') + NB + 'млн' : Math.round(n / 1000) + NB + 'тыс.') + NB + '₽';
const plural = (n, a, b, c) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
};
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
function dayLabel(off) {
  if (off === 0) return 'сегодня';
  if (off === 1) return 'завтра';
  if (off === -1) return 'вчера';
  const d = new Date();
  d.setDate(d.getDate() + off);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
const lf = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const stageIdx = (id) => STAGES.findIndex((s) => s.id === id);
const stageName = (id) => (id === 'lost' ? 'Отказ' : STAGES[stageIdx(id)].name);

/* ---------------- state ---------------- */
const KEY = 'angara-crm-1';
function fresh() {
  return { deals: seed(), auto: Object.fromEntries(AUTOMATIONS.map((a) => [a.id, a.on])), role: 'owner', seq: 0, src: 'all' };
}
let S;
try {
  S = JSON.parse(localStorage.getItem(KEY)) || fresh();
} catch {
  S = fresh();
}
if (!S.deals?.length) S = fresh();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch {
    /* private mode: demo still works in memory */
  }
}
let view = 'board';
let query = '';
let openId = null;

const actor = () => (S.role === 'owner' ? 'owner' : ROLES.manager.manager);
const whoName = (w) => (w === 'system' ? 'Система' : w === 'owner' ? 'Ольга' : MANAGERS[w]?.short ?? w);
const visible = () =>
  S.deals.filter((d) => {
    if (S.role === 'manager' && d.manager !== ROLES.manager.manager) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return [d.name, d.product, d.phone, SOURCES[d.source].name].some((v) => v.toLowerCase().includes(q));
  });
const findDeal = (id) => S.deals.find((d) => d.id === id);

/* ---------------- toasts ---------------- */
function toast(title, text, icon = 'ph-check-circle') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<i class="ph-fill ${icon}"></i><div>${title ? `<b>${esc(title)}</b>` : ''}${esc(text)}</div>`;
  $('#toasts').append(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 260);
  }, 4200);
}

/* ---------------- deal mutations ---------------- */
function log(deal, text, who = actor()) {
  deal.history.push({ d: 0, who, text });
}
function addTask(deal, text, due) {
  deal.tasks.push({ id: `${deal.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, text, due, done: false });
}
function moveDeal(deal, stage) {
  if (deal.stage === stage) return;
  const from = deal.stage;
  deal.stage = stage;
  deal.moved = 0;
  log(deal, from === 'lost' ? `Вернули в работу: ${stageName(stage)}` : `Этап: ${stageName(stage)}`);
  const rule = AUTOMATIONS.find((a) => a.stage === stage);
  if (rule && S.auto[rule.id] && stage !== 'lost') {
    addTask(deal, rule.task, rule.due);
    log(deal, `Автоматизация поставила задачу: ${lf(rule.task)}`, 'system');
    toast('Автоматизация', `«${rule.task}» на ${dayLabel(rule.due)}, ${MANAGERS[deal.manager].short}`, 'ph-lightning');
  } else if (stage !== 'lost') toast('', `${deal.name.split(' ')[0]}: ${stageName(stage)}`);
  if (stage === 'done') toast('Выручка', `${money(deal.sum)} добавлено в отчёт месяца`, 'ph-chart-line-up');
  save();
  render();
}

/* ---------------- board ---------------- */
function cardFlags(d) {
  const open = d.tasks.filter((t) => !t.done);
  const late = open.find((t) => t.due < 0);
  if (late) return `<span class="flag late"><i class="ph ph-warning"></i><span>Просрочено: ${esc(lf(late.text))}</span></span>`;
  const today = open.find((t) => t.due === 0);
  if (today) return `<span class="flag today"><i class="ph ph-clock"></i><span>Сегодня: ${esc(lf(today.text))}</span></span>`;
  if (d.stage !== 'done' && d.moved <= -5) return `<span class="flag stale"><i class="ph ph-hourglass-medium"></i><span>Без движения ${-d.moved} ${plural(-d.moved, 'день', 'дня', 'дней')}</span></span>`;
  return '';
}
function cardHTML(d) {
  const src = SOURCES[d.source];
  return `<button class="card" data-id="${d.id}" type="button">
    <div class="top"><span class="name">${esc(d.name)}</span><span class="ava sm m-${d.manager}" title="${esc(MANAGERS[d.manager].name)}">${MANAGERS[d.manager].ini}</span></div>
    <span class="prod">${esc(d.product)}</span>
    ${cardFlags(d)}
    <div class="meta"><span class="src"><i class="ph ${src.icon}"></i>${src.name}</span><span class="money">${money(d.sum)}</span></div>
  </button>`;
}
function renderBoard() {
  const deals = visible();
  $('#v-board').innerHTML = STAGES.map((s) => {
    const list = deals.filter((d) => d.stage === s.id).sort((a, b) => b.moved - a.moved || b.id - a.id);
    const sum = list.reduce((a, d) => a + d.sum, 0);
    return `<div class="col" data-stage="${s.id}">
      <div class="col-head"><b>${s.name}</b><span class="n">${list.length}</span><span class="sum">${list.length ? short(sum) : ''}</span></div>
      ${list.length ? `<div class="col-list">${list.map(cardHTML).join('')}</div>` : `<div class="col-empty">${query ? 'Ничего не найдено' : 'Перетащите сюда сделку'}</div>`}
    </div>`;
  }).join('');
}

// Drag and drop with the mouse; on touch a tap opens the deal and the stage is changed there.
let drag = null;
$('#v-board').addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.card');
  if (!card || e.button !== 0) return;
  drag = { card, id: Number(card.dataset.id), x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', on: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag || !drag.mouse) return;
  if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
  if (!drag.on) {
    drag.on = true;
    const r = drag.card.getBoundingClientRect();
    drag.dx = drag.x - r.left;
    drag.dy = drag.y - r.top;
    drag.ghost = drag.card.cloneNode(true);
    drag.ghost.classList.add('ghost');
    drag.ghost.style.width = r.width + 'px';
    document.body.append(drag.ghost);
    drag.card.classList.add('dragging');
    document.body.style.cursor = 'grabbing';
  }
  drag.ghost.style.left = e.clientX - drag.dx + 'px';
  drag.ghost.style.top = e.clientY - drag.dy + 'px';
  const col = document.elementFromPoint(e.clientX, e.clientY)?.closest('.col');
  $$('.col').forEach((c) => c.classList.toggle('over', c === col));
});
window.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.on) return;
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 0);
  d.ghost.remove();
  document.body.style.cursor = '';
  const col = document.elementFromPoint(e.clientX, e.clientY)?.closest('.col');
  $$('.col').forEach((c) => c.classList.remove('over'));
  d.card.classList.remove('dragging');
  if (col) moveDeal(findDeal(d.id), col.dataset.stage);
});
let suppressClick = false;
$('#v-board').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card || suppressClick) return;
  openDeal(Number(card.dataset.id));
});

/* ---------------- drawer ---------------- */
function openDeal(id) {
  openId = id;
  renderDrawer();
  $('#scrim').hidden = false;
  const dr = $('#drawer');
  dr.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => dr.classList.add('open'));
}
function closeDeal() {
  openId = null;
  const dr = $('#drawer');
  dr.classList.remove('open');
  dr.setAttribute('aria-hidden', 'true');
  $('#scrim').hidden = true;
}
$('#scrim').addEventListener('click', closeDeal);
document.addEventListener('keydown', (e) => e.key === 'Escape' && openId && closeDeal());

function renderDrawer() {
  const d = findDeal(openId);
  if (!d) return closeDeal();
  const cur = stageIdx(d.stage);
  const src = SOURCES[d.source];
  const isOwner = S.role === 'owner';
  const next = d.stage !== 'lost' && cur < STAGES.length - 1 ? STAGES[cur + 1] : null;
  const tasks = [...d.tasks].sort((a, b) => a.done - b.done || a.due - b.due);
  $('#drawer').innerHTML = `
    <div class="d-head">
      <div class="row"><h2>${esc(d.name)}</h2><button class="x" data-act="close" aria-label="Закрыть"><i class="ph ph-x"></i></button></div>
      <div class="sub">
        <span><i class="ph ph-phone"></i>${esc(d.phone)}</span>
        <span><i class="ph ${src.icon}"></i>${src.name}</span>
        <span>№${d.id}, создана ${dayLabel(d.created)}</span>
      </div>
    </div>
    <div class="d-body">
      <section>
        <h3>${d.stage === 'lost' ? 'Сделка в отказе' : 'Этап'}</h3>
        <div class="steps">${STAGES.map((s, i) => `<button data-stage="${s.id}" class="${d.stage === 'lost' ? '' : i < cur ? 'past' : i === cur ? 'cur' : ''}">${s.name}</button>`).join('')}</div>
        <div class="steps-actions">
          ${next ? `<button class="btn" data-stage="${next.id}"><i class="ph ph-arrow-right"></i>${next.name}</button>` : ''}
          ${d.stage === 'lost' ? `<button class="btn" data-stage="new"><i class="ph ph-arrow-counter-clockwise"></i>Вернуть в работу</button>` : d.stage !== 'done' ? `<button class="lost-btn" data-act="lost">Клиент отказался</button>` : ''}
        </div>
      </section>
      <section class="fields">
        <label class="field">Сумма, ₽<input data-f="sum" inputmode="numeric" value="${d.sum.toLocaleString('ru-RU')}" /></label>
        <label class="field">Что делаем<input data-f="product" value="${esc(d.product)}" /></label>
        <label class="field">Менеджер${isOwner
          ? `<select data-f="manager">${Object.entries(MANAGERS).map(([k, m]) => `<option value="${k}" ${k === d.manager ? 'selected' : ''}>${m.name}</option>`).join('')}</select>`
          : `<span class="ro">${MANAGERS[d.manager].name}</span>`}</label>
        <label class="field">Источник<span class="ro">${src.name}</span></label>
      </section>
      <section>
        <h3>Задачи</h3>
        <div class="tasks">${tasks.length ? tasks.map((t) => `
          <label class="task ${t.done ? 'done' : ''}">
            <input type="checkbox" data-task="${t.id}" ${t.done ? 'checked' : ''} />
            <span class="t">${esc(t.text)}</span>
            <span class="due ${!t.done && t.due < 0 ? 'late' : ''}">${dayLabel(t.due)}</span>
          </label>`).join('') : '<p class="empty" style="padding:14px">Задач нет</p>'}</div>
        <form class="add-row" data-form="task">
          <input name="text" placeholder="Новая задача" maxlength="80" aria-label="Текст задачи" />
          <select name="due" aria-label="Срок"><option value="0">Сегодня</option><option value="1" selected>Завтра</option><option value="3">Через 3 дня</option><option value="7">Через неделю</option></select>
          <button class="btn" aria-label="Добавить задачу"><i class="ph ph-plus"></i></button>
        </form>
      </section>
      <section>
        <h3>История</h3>
        <form class="add-row" data-form="note" style="margin:0 0 14px">
          <input name="text" placeholder="Итог звонка или комментарий" maxlength="160" aria-label="Комментарий" />
          <button class="btn" aria-label="Сохранить комментарий"><i class="ph ph-paper-plane-right"></i></button>
        </form>
        <ol class="timeline">${[...d.history].reverse().map((h) => `
          <li><span class="dot ${h.who === 'system' ? 'sys' : ''}"><i class="ph ${h.who === 'system' ? 'ph-lightning' : 'ph-user'}"></i></span>
          <div><small>${whoName(h.who)}, ${dayLabel(h.d)}</small><p>${esc(h.text)}</p></div></li>`).join('')}</ol>
      </section>
    </div>`;
}

$('#drawer').addEventListener('click', (e) => {
  const d = findDeal(openId);
  const b = e.target.closest('button');
  if (!b || !d) return;
  if (b.dataset.act === 'close') return closeDeal();
  if (b.dataset.act === 'lost') {
    d.stage = 'lost';
    d.moved = 0;
    log(d, 'Клиент отказался');
    toast('', `${d.name.split(' ')[0]}: сделка ушла в отказ, причину можно записать в историю`, 'ph-x-circle');
    save();
    return render();
  }
  if (b.dataset.stage) moveDeal(d, b.dataset.stage);
});
$('#drawer').addEventListener('change', (e) => {
  const d = findDeal(openId);
  if (!d) return;
  const t = e.target;
  if (t.dataset.task) {
    const task = d.tasks.find((x) => x.id === t.dataset.task);
    task.done = t.checked;
    if (t.checked) log(d, `Выполнено: ${lf(task.text)}`);
  } else if (t.dataset.f === 'sum') {
    const v = Number(t.value.replace(/\D/g, ''));
    if (v && v !== d.sum) {
      log(d, `Сумма: ${money(d.sum)} → ${money(v)}`);
      d.sum = v;
    }
  } else if (t.dataset.f === 'product' && t.value.trim()) {
    d.product = t.value.trim();
  } else if (t.dataset.f === 'manager') {
    d.manager = t.value;
    log(d, `Сделку передали: ${MANAGERS[t.value].name}`);
    toast('Telegram', `${MANAGERS[t.value].short} получил(а) сделку «${d.name}»`, 'ph-telegram-logo');
  } else return;
  save();
  render();
});
$('#drawer').addEventListener('submit', (e) => {
  e.preventDefault();
  const d = findDeal(openId);
  const f = e.target;
  const text = f.elements.text.value.trim();
  if (!text) return f.elements.text.focus();
  if (f.dataset.form === 'task') addTask(d, text, Number(f.elements.due.value));
  else log(d, text);
  save();
  render();
  $(`#drawer [data-form="${f.dataset.form}"] input`)?.focus();
});

/* ---------------- tasks view ---------------- */
function openTasks() {
  return visible().flatMap((d) => d.tasks.filter((t) => !t.done).map((t) => ({ t, d })));
}
function renderTasks() {
  const all = openTasks();
  const groups = [
    ['late', 'Просрочено', all.filter((x) => x.t.due < 0)],
    ['today', 'Сегодня', all.filter((x) => x.t.due === 0)],
    ['tomorrow', 'Завтра', all.filter((x) => x.t.due === 1)],
    ['later', 'Дальше', all.filter((x) => x.t.due > 1)],
  ].filter((g) => g[2].length);
  $('#v-tasks').innerHTML = groups.length
    ? `<div class="tgroups">${groups.map(([k, name, list]) => `
      <section class="tgroup ${k}"><h2>${name}<span class="n">${list.length}</span></h2>
        <div class="tasks">${list.sort((a, b) => a.t.due - b.t.due).map(({ t, d }) => `
          <div class="task">
            <input type="checkbox" data-deal="${d.id}" data-task="${t.id}" aria-label="Выполнено" />
            <span class="t">${esc(t.text)}<br /><button class="client" data-open="${d.id}">${esc(d.name)}, ${esc(lf(d.product))}</button></span>
            <span class="due ${t.due < 0 ? 'late' : ''}">${dayLabel(t.due)}</span>
            <span class="ava sm m-${d.manager}" title="${esc(MANAGERS[d.manager].name)}">${MANAGERS[d.manager].ini}</span>
          </div>`).join('')}</div>
      </section>`).join('')}</div>`
    : `<div class="empty"><i class="ph ph-confetti"></i>Все задачи закрыты</div>`;
}
$('#v-tasks').addEventListener('change', (e) => {
  const t = e.target;
  if (!t.dataset.task) return;
  const d = findDeal(Number(t.dataset.deal));
  const task = d.tasks.find((x) => x.id === t.dataset.task);
  task.done = true;
  log(d, `Выполнено: ${lf(task.text)}`);
  t.closest('.task').style.opacity = '0.4';
  save();
  setTimeout(render, 350);
});
$('#v-tasks').addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]');
  if (b) openDeal(Number(b.dataset.open));
});

/* ---------------- clients ---------------- */
function clientRows() {
  return visible().filter((d) => S.src === 'all' || d.source === S.src).sort((a, b) => b.created - a.created);
}
function renderClients() {
  const rows = clientRows();
  $('#v-clients').innerHTML = `
    <div class="tools">
      <div class="chips">${[['all', 'Все'], ...Object.entries(SOURCES).map(([k, s]) => [k, s.name])]
        .map(([k, n]) => `<button class="chip" data-src="${k}" aria-pressed="${S.src === k}">${n}</button>`).join('')}</div>
      <button class="btn ghost" id="csv"><i class="ph ph-microsoft-excel-logo"></i><span>Выгрузить в Excel</span></button>
    </div>
    ${rows.length ? `<table class="table">
      <thead><tr><th>Клиент</th><th>Телефон</th><th>Источник</th><th>Что делаем</th><th>Этап</th><th>Менеджер</th><th class="money">Сумма</th></tr></thead>
      <tbody>${rows.map((d) => `<tr data-open="${d.id}">
        <td class="b">${esc(d.name)}</td>
        <td class="hide-m">${esc(d.phone)}</td>
        <td class="hide-m">${SOURCES[d.source].name}</td>
        <td>${esc(d.product)}</td>
        <td><span class="st ${d.stage}">${stageName(d.stage)}</span></td>
        <td class="hide-m">${MANAGERS[d.manager].short}</td>
        <td class="money">${money(d.sum)}</td>
      </tr>`).join('')}</tbody></table>` : `<div class="empty"><i class="ph ph-magnifying-glass"></i>Под фильтр никто не подходит</div>`}`;
}
$('#v-clients').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-src]');
  if (chip) {
    S.src = chip.dataset.src;
    save();
    return renderClients();
  }
  if (e.target.closest('#csv')) return exportCSV();
  const tr = e.target.closest('[data-open]');
  if (tr) openDeal(Number(tr.dataset.open));
});
function exportCSV() {
  const head = ['Номер', 'Клиент', 'Телефон', 'Источник', 'Что делаем', 'Этап', 'Менеджер', 'Сумма'];
  const lines = clientRows().map((d) => [d.id, d.name, d.phone, SOURCES[d.source].name, d.product, stageName(d.stage), MANAGERS[d.manager].name, d.sum]);
  const csv = '﻿' + [head, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `angara-klienty-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('', `Выгружено ${lines.length} ${plural(lines.length, 'строка', 'строки', 'строк')}, файл открывается в Excel`, 'ph-microsoft-excel-logo');
}

/* ---------------- report ---------------- */
function renderReport() {
  const deals = visible();
  const isOwner = S.role === 'owner';
  const done = deals.filter((d) => d.stage === 'done' && d.moved >= -30);
  const revenue = done.reduce((a, d) => a + d.sum, 0);
  const active = deals.filter((d) => !['done', 'lost'].includes(d.stage));
  const pipe = active.reduce((a, d) => a + d.sum, 0);
  const signed = deals.filter((d) => stageIdx(d.stage) >= stageIdx('contract')).length;
  const decided = deals.filter((d) => d.stage !== 'new').length;
  const conv = decided ? Math.round((signed / decided) * 100) : 0;
  const lock = '<b><i class="ph ph-lock-simple"></i>Видно владельцу</b>';

  const reached = STAGES.map((s, i) => ({ name: s.name, n: deals.filter((d) => (d.stage === 'lost' ? i <= 1 : stageIdx(d.stage) >= i)).length }));
  const maxR = Math.max(1, ...reached.map((r) => r.n));
  const bySrc = Object.entries(SOURCES).map(([k, s]) => {
    const list = deals.filter((d) => d.source === k);
    return { name: s.name, n: list.length, rev: list.filter((d) => d.stage === 'done').reduce((a, d) => a + d.sum, 0) };
  }).sort((a, b) => b.n - a.n);
  const maxS = Math.max(1, ...bySrc.map((s) => s.n));
  const mgrs = Object.entries(MANAGERS)
    .filter(([k]) => isOwner || k === ROLES.manager.manager)
    .map(([k, m]) => {
      const list = S.deals.filter((d) => d.manager === k);
      return { k, m, work: list.filter((d) => !['done', 'lost'].includes(d.stage)).length, rev: list.filter((d) => d.stage === 'done' && d.moved >= -30).reduce((a, d) => a + d.sum, 0), late: list.flatMap((d) => d.tasks).filter((t) => !t.done && t.due < 0).length };
    });

  $('#v-report').innerHTML = `
    <div class="kpis">
      <div class="kpi hero ${isOwner ? '' : 'locked'}"><small>Выручка за 30 дней</small>${isOwner ? `<b>${money(revenue)}</b><span>${done.length} ${plural(done.length, 'кухня установлена', 'кухни установлены', 'кухонь установлено')}</span>` : lock}</div>
      <div class="kpi ${isOwner ? '' : 'locked'}"><small>В работе</small>${isOwner ? `<b>${short(pipe)}</b>` : `<b style="color:var(--ink);font-size:26px">${active.length}</b>`}<span>${active.length} ${plural(active.length, 'сделка', 'сделки', 'сделок')} в воронке</span></div>
      <div class="kpi ${isOwner ? '' : 'locked'}"><small>Средний чек</small>${isOwner ? `<b>${done.length ? money(revenue / done.length) : '0'}</b><span>по установленным</span>` : lock}</div>
      <div class="kpi"><small>Заявка → договор</small><b>${conv}%</b><span>${signed} из ${decided} обработанных</span></div>
    </div>
    <div class="panels">
      <section class="panel"><h2>Воронка: сколько дошло до этапа</h2>
        <div class="bars">${reached.map((r, i) => `<div class="bar-row"><span class="lbl">${r.name}</span><span class="fill" style="width:${(r.n / maxR) * 100}%;animation-delay:${i * 50}ms"></span><span class="v">${r.n}</span></div>`).join('')}</div>
      </section>
      <section class="panel"><h2>Откуда приходят клиенты</h2>
        <div class="bars">${bySrc.map((s, i) => `<div class="bar-row"><span class="lbl">${s.name}</span><span class="fill alt" style="width:${(s.n / maxS) * 100}%;animation-delay:${i * 50}ms"></span><span class="v">${s.n} ${plural(s.n, 'заявка', 'заявки', 'заявок')}${isOwner && s.rev ? ` / ${short(s.rev)}` : ''}</span></div>`).join('')}</div>
      </section>
      <section class="panel wide"><h2>Менеджеры</h2>
        <div class="mgrs">${mgrs.map(({ k, m, work, rev, late }) => `<div class="mgr"><span class="ava m-${k}">${m.ini}</span><div><b>${m.name}</b><small>${work} в работе${isOwner ? `, выручка ${short(rev)}` : ''}${late ? `, просрочено задач: ${late}` : ', без просрочек'}</small></div></div>`).join('')}</div>
      </section>
    </div>`;
}

/* ---------------- automations ---------------- */
function renderAuto() {
  const icons = { lead: 'ph-telegram-logo', stale: 'ph-hourglass-medium', done: 'ph-star' };
  $('#v-auto').innerHTML = `
    <p class="rules-note">Рутину, которую менеджер забывает, делает система. Правила включаются и выключаются без программиста. Попробуйте перевести сделку на следующий этап и посмотрите, какая задача появится.</p>
    <div class="rules">${AUTOMATIONS.map((a) => `
      <div class="rule ${S.auto[a.id] ? '' : 'off'}">
        <span class="ic"><i class="ph ${icons[a.id] || 'ph-lightning'}"></i></span>
        <div><b>${esc(a.when)}</b><p>${esc(a.then)}</p></div>
        <label class="switch"><input type="checkbox" data-rule="${a.id}" ${S.auto[a.id] ? 'checked' : ''} ${S.role === 'owner' ? '' : 'disabled'} aria-label="${esc(a.when)}" /><span></span></label>
      </div>`).join('')}</div>
    ${S.role === 'owner' ? '' : '<p class="rules-note" style="margin-top:14px">Менять правила может только владелец.</p>'}`;
}
$('#v-auto').addEventListener('change', (e) => {
  const id = e.target.dataset.rule;
  if (!id) return;
  S.auto[id] = e.target.checked;
  save();
  renderAuto();
  toast('', e.target.checked ? 'Правило включено' : 'Правило выключено', 'ph-lightning');
});

/* ---------------- incoming lead ---------------- */
$('#simulate').addEventListener('click', () => {
  const [name, product, source, sum, comment] = INCOMING[S.seq % INCOMING.length];
  S.seq++;
  const id = Math.max(...S.deals.map((d) => d.id)) + 1;
  const newCount = S.deals.filter((d) => d.stage === 'new').length;
  const manager = S.role === 'manager' ? ROLES.manager.manager : newCount % 2 ? 'marina' : 'alexey';
  const deal = { id, name, product, sum, source, manager, stage: 'new', created: 0, moved: 0, phone: `+7 9${10 + (id % 80)} ••• ${String(id).slice(-2)} ${String(id * 7).slice(-2)}`, tasks: [], history: [] };
  deal.history.push({ d: 0, who: 'system', text: `Заявка, источник: ${SOURCES[source].name}. Комментарий: «${comment}»` });
  S.deals.push(deal);
  const inTime = new Date(Date.now() + 15 * 60000).toTimeString().slice(0, 5);
  if (S.auto.lead) {
    addTask(deal, 'Перезвонить по заявке', 0);
    toast(`Telegram · бот Ангары → ${MANAGERS[manager].short}`, `Новая заявка: ${name.split(' ')[0]}, ${lf(product)}. Перезвонить до ${inTime}`, 'ph-telegram-logo');
  } else toast('', 'Заявка в воронке. Уведомление выключено в автоматизациях', 'ph-bell-slash');
  query = '';
  $('#search').value = '';
  save();
  setView('board');
  const card = $(`.card[data-id="${id}"]`);
  card?.classList.add('flash');
  card?.closest('.col')?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
});

/* ---------------- new deal modal ---------------- */
const dlg = $('#newDeal');
$('#addDeal').addEventListener('click', () => {
  $('#newForm').reset();
  $('#newErr').textContent = '';
  dlg.showModal();
});
$('#newCancel').addEventListener('click', () => dlg.close());
$('#newForm').addEventListener('submit', (e) => {
  const f = e.target.elements;
  const name = f.name.value.trim();
  const product = f.product.value.trim();
  if (!name || !product) {
    e.preventDefault();
    $('#newErr').textContent = !name ? 'Укажите клиента' : 'Напишите, что делаем';
    return;
  }
  const id = Math.max(...S.deals.map((d) => d.id)) + 1;
  const manager = S.role === 'manager' ? ROLES.manager.manager : 'alexey';
  S.deals.push({ id, name, product, sum: Number(f.sum.value.replace(/\D/g, '')) || 0, source: f.source.value, manager, stage: 'new', created: 0, moved: 0, phone: '+7 9•• ••• •• ••', tasks: [], history: [{ d: 0, who: actor(), text: 'Сделку создали вручную' }] });
  save();
  setView('board');
  $(`.card[data-id="${id}"]`)?.classList.add('flash');
  toast('', `Сделка «${name}» создана`);
});

/* ---------------- shell ---------------- */
const TITLES = { board: 'Воронка', tasks: 'Задачи', clients: 'Клиенты', report: 'Отчёт', auto: 'Автоматизации' };
function setView(v) {
  view = v;
  $$('.nav button').forEach((b) => (b.dataset.view === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $$('.view').forEach((s) => (s.hidden = s.id !== `v-${v}`));
  $('#title').textContent = TITLES[v];
  render();
}
function render() {
  const badge = openTasks().filter((x) => x.t.due <= 0).length;
  $('#taskBadge').textContent = badge || '';
  const me = ROLES[S.role];
  $('#meAva').textContent = me.ini;
  $('#meName').textContent = me.name;
  $('#meRole').textContent = me.role;
  $$('[data-role]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.role === S.role)));
  $('#scope').hidden = S.role === 'owner';
  ({ board: renderBoard, tasks: renderTasks, clients: renderClients, report: renderReport, auto: renderAuto })[view]();
  if (openId) renderDrawer();
}
$$('.nav button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$$('[data-role]').forEach((b) =>
  b.addEventListener('click', () => {
    S.role = b.dataset.role;
    save();
    closeDeal();
    render();
    toast('', S.role === 'owner' ? 'Вы смотрите как владелец: все сделки и деньги' : 'Вы смотрите как менеджер Алексей: только свои сделки', 'ph-user-switch');
  }),
);
$('#search').addEventListener('input', (e) => {
  query = e.target.value.trim();
  render();
});
$('#reset').addEventListener('click', () => {
  S = fresh();
  save();
  closeDeal();
  setView('board');
  toast('', 'Демо сброшено к исходным данным', 'ph-arrow-counter-clockwise');
});

render();
