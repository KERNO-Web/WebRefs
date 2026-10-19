import { Index, sectionize } from './engine.js';
import { STAFF_DOCS, SITE_DOCS, STAFF_HINTS, SITE_HINTS } from './docs.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
const plural = (n, a, b, c) => {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c;
};

let toastTimer;
function toast(text, icon = 'ph-check-circle') {
  const t = $('#toast');
  t.innerHTML = '';
  t.append(Object.assign(el('i', `ph ${icon}`)), el('span', '', text));
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 3600);
}

/* ======================= staff mode ======================= */

const docs = [...STAFF_DOCS];
const scope = new Set(docs.map((d) => d.id));
const staffIx = new Index();
docs.forEach((d) => staffIx.add(d));

const feed = $('#feed');
const lib = $('#lib');
const viewer = $('#viewer');

function renderDocs(freshId) {
  const ul = $('#docs');
  ul.innerHTML = '';
  for (const d of docs) {
    const li = el('li');
    const lab = el('label', 'doc' + (d.id === freshId ? ' fresh' : ''));
    const cb = el('input');
    cb.type = 'checkbox';
    cb.checked = scope.has(d.id);
    cb.addEventListener('change', () => {
      cb.checked ? scope.add(d.id) : scope.delete(d.id);
      renderCount();
    });
    const box = el('span', 'box');
    box.append(el('i', 'ph ph-check'));
    const txt = el('span');
    txt.append(el('b', '', d.title), el('small', '', `${d.kind} · ${d.sections.length} ${plural(d.sections.length, 'пункт', 'пункта', 'пунктов')}`));
    lab.append(cb, box, txt);
    if (d.user) {
      const del = el('button', 'del');
      del.type = 'button';
      del.setAttribute('aria-label', `Убрать «${d.title}»`);
      del.append(el('i', 'ph ph-trash'));
      del.addEventListener('click', (e) => {
        e.preventDefault();
        docs.splice(docs.indexOf(d), 1);
        scope.delete(d.id);
        staffIx.remove(d.id);
        renderDocs();
      });
      lab.append(del);
    } else lab.append(el('span'));
    li.append(lab);
    ul.append(li);
  }
  renderCount();
}
function renderCount() {
  const n = scope.size;
  $('#libCount').textContent = `${n} ${plural(n, 'документ', 'документа', 'документов')}`;
}

function renderHints(list, box, onPick) {
  box.innerHTML = '';
  for (const h of list) {
    const b = el('button', 'hint', h);
    b.type = 'button';
    b.addEventListener('click', () => onPick(h));
    box.append(b);
  }
}

function scrollFeed(f = feed) {
  f.scrollTop = f.scrollHeight;
}

/** Types the answer parts in, then attaches citation buttons. */
async function typeAnswer(container, parts, onCite) {
  for (const p of parts) {
    const span = el('span');
    container.append(span);
    const words = p.text.split(' ');
    if (reduce) span.textContent = p.text;
    else {
      for (let i = 0; i < words.length; i += 2) {
        span.textContent = words.slice(0, i + 2).join(' ');
        await new Promise((r) => setTimeout(r, 28));
      }
    }
    if (onCite) {
      const c = el('button', 'cite', String(p.cite));
      c.type = 'button';
      c.dataset.n = p.cite;
      c.setAttribute('aria-label', `Источник ${p.cite}`);
      c.addEventListener('click', () => onCite(p.cite - 1, c));
      container.append(c, document.createTextNode(' '));
    } else container.append(document.createTextNode(' '));
  }
}

async function askStaff(question) {
  question = question.trim();
  if (!question) return;
  $('#hello')?.remove();
  feed.append(el('div', 'msg me', question));
  const sk = el('div', 'msg bot skel');
  sk.innerHTML = '<span></span><span></span><span></span>';
  const where = el('small');
  where.append(el('i', 'ph ph-magnifying-glass'), document.createTextNode(` Ищу в ${scope.size} ${plural(scope.size, 'документе', 'документах', 'документах')}`));
  sk.append(where);
  feed.append(sk);
  scrollFeed();
  $('#ask button').disabled = true;

  await wait(650 + Math.random() * 450);
  const res = scope.size ? staffIx.ask(question, scope) : null;
  sk.remove();

  const m = el('div', 'msg bot');
  feed.append(m);
  if (!res) {
    const miss = el('div', 'miss');
    const body = el('div');
    body.append(
      el('b', '', scope.size ? 'В документах этого нет' : 'Не выбран ни один документ'),
      el('p', '', scope.size
        ? 'Я отвечаю только по загруженным файлам и не придумываю. Попробуйте спросить иначе или уточните у отдела кадров.'
        : 'Отметьте хотя бы один документ слева, и я буду искать в нём.'),
    );
    miss.append(el('i', 'ph ph-file-dashed'), body);
    m.append(miss);
  } else {
    const ans = el('div', 'ans');
    m.append(ans);
    const srcs = el('div', 'srcs');
    const open = (idx) => {
      openSource(res.sources[idx]);
      m.querySelectorAll('.cite,.src').forEach((x) => x.classList.toggle('on', Number(x.dataset.n) === idx + 1));
    };
    await typeAnswer(ans, res.answer, (idx) => open(idx));
    res.sources.forEach((s, idx) => {
      const b = el('button', 'src');
      b.type = 'button';
      b.dataset.n = idx + 1;
      b.append(el('span', 'n', String(idx + 1)), el('i', 'ph ph-file-text'), el('b', '', s.doc.title), el('span', '', `п. ${s.i + 1}, ${s.sec.h}`));
      b.addEventListener('click', () => open(idx));
      srcs.append(b);
    });
    m.append(srcs);
    if (matchMedia('(min-width: 1181px)').matches) open(0);
  }
  $('#ask button').disabled = false;
  scrollFeed();
}

function openSource(src) {
  $('#viewerEmpty').hidden = true;
  $('#viewerDoc').hidden = false;
  $('#vTitle').textContent = src.doc.title;
  $('#vMeta').textContent = `${src.doc.kind} · обновлён ${src.doc.updated}`;
  const body = $('#vBody');
  body.innerHTML = '';
  body.classList.add('focus');
  let target;
  src.doc.sections.forEach((s, i) => {
    const sec = el('section', 'sec' + (i === src.i ? ' hit' : ''));
    const h = el('h3');
    h.append(el('span', '', `${i + 1}.`), document.createTextNode(s.h));
    const p = el('p');
    if (i === src.i) {
      // wrap the quoted sentences in <mark>
      let rest = s.t;
      for (const q of src.marks) {
        const at = rest.indexOf(q);
        if (at < 0) continue;
        p.append(document.createTextNode(rest.slice(0, at)), el('mark', '', q));
        rest = rest.slice(at + q.length);
      }
      p.append(document.createTextNode(rest));
      target = sec;
    } else p.textContent = s.t;
    sec.append(h, p);
    body.append(sec);
  });
  viewer.classList.add('open');
  requestAnimationFrame(() => {
    body.scrollTop = Math.max(0, target.offsetTop - body.offsetTop - 16);
  });
}

$('#vClose').addEventListener('click', () => {
  viewer.classList.remove('open');
  $('#viewerDoc').hidden = true;
  $('#viewerEmpty').hidden = false;
  feed.querySelectorAll('.on').forEach((x) => x.classList.remove('on'));
});

$('#ask').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#q');
  if ($('#ask button').disabled) return;
  askStaff(q.value);
  q.value = '';
});

$('#libOpen').addEventListener('click', () => lib.classList.add('open'));
$('#libClose').addEventListener('click', () => lib.classList.remove('open'));

/* ---------- upload: the visitor tests on their own document ---------- */

const loaded = {};
function loadScript(src) {
  return (loaded[src] ??= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => fail(new Error('Не удалось загрузить модуль чтения файла'));
    document.head.append(s);
  }));
}

async function readFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'txt' || ext === 'md') return file.text();
  const buf = await file.arrayBuffer();
  if (ext === 'pdf') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    const pdfjs = window.pdfjsLib;
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const out = [];
    for (let p = 1; p <= Math.min(pdf.numPages, 80); p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      let line = '';
      let lastY;
      for (const it of tc.items) {
        const y = it.transform[5];
        if (lastY !== undefined && Math.abs(y - lastY) > 2) {
          out.push(line);
          line = '';
          if (Math.abs(y - lastY) > 18) out.push('');
        }
        line += it.str;
        lastY = y;
      }
      out.push(line, '');
    }
    return out.join('\n');
  }
  if (ext === 'docx') {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
    const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
    return r.value;
  }
  throw new Error('Этот формат не поддерживается, нужен PDF, DOCX или TXT');
}

async function addFile(file) {
  const drop = $('#drop');
  if (file.size > 15 * 1024 * 1024) return toast('Файл больше 15 МБ, для демо возьмите поменьше', 'ph-warning');
  drop.classList.add('busy');
  try {
    const text = await readFile(file);
    const sections = sectionize(text);
    if (!sections.length || text.trim().length < 80) throw new Error('В файле не нашлось текста. Если это скан, в рабочей версии подключается распознавание');
    const doc = {
      id: 'u' + Date.now(),
      title: file.name.replace(/\.[^.]+$/, ''),
      kind: file.name.split('.').pop().toUpperCase(),
      updated: 'только что',
      sections,
      user: true,
    };
    docs.unshift(doc);
    scope.add(doc.id);
    staffIx.add(doc);
    renderDocs(doc.id);
    lib.classList.remove('open');
    $('#hello')?.remove();
    const m = el('div', 'msg bot');
    const a = el('div', 'ans');
    a.textContent = `Прочитал «${doc.title}»: ${sections.length} ${plural(sections.length, 'фрагмент', 'фрагмента', 'фрагментов')}. Спросите что-нибудь по этому документу.`;
    const hints = el('div', 'hints');
    hints.style.marginTop = '12px';
    const picks = sections.filter((s) => s.h !== 'Начало документа').slice(0, 3).map((s) => `Что сказано про «${s.h.slice(0, 48)}»?`);
    renderHints(picks, hints, askStaff);
    m.append(a, hints);
    feed.append(m);
    scrollFeed();
    toast('Документ добавлен, ищу и по нему');
  } catch (err) {
    toast(err.message || 'Не получилось прочитать файл', 'ph-warning');
  } finally {
    drop.classList.remove('busy');
    $('#file').value = '';
  }
}

$('#file').addEventListener('change', (e) => e.target.files[0] && addFile(e.target.files[0]));
const drop = $('#drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => e.dataTransfer.files[0] && addFile(e.dataTransfer.files[0]));
// a file dropped anywhere on the chat also works
feed.addEventListener('dragover', (e) => e.preventDefault());
feed.addEventListener('drop', (e) => { e.preventDefault(); e.dataTransfer.files[0] && addFile(e.dataTransfer.files[0]); });

renderDocs();
renderHints(STAFF_HINTS, $('#hints'), askStaff);

/* ======================= site widget mode ======================= */

const siteIx = new Index();
SITE_DOCS.forEach((d) => siteIx.add(d));
siteIx.add(STAFF_DOCS.find((d) => d.id === 'pretenzii'));
const wFeed = $('#wFeed');
let wBusy = false;

function botBubble(textOrNode) {
  const m = el('div', 'msg bot');
  if (typeof textOrNode === 'string') m.append(Object.assign(el('div', 'ans'), { textContent: textOrNode }));
  else m.append(textOrNode);
  wFeed.append(m);
  scrollFeed(wFeed);
  return m;
}

function leadForm(question) {
  const f = el('form', 'lead');
  f.noValidate = true;
  f.innerHTML = `
    <label>Как к вам обращаться<input name="name" autocomplete="name" required /></label>
    <label>Телефон<input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" required /></label>
    <span class="err" aria-live="polite"></span>
    <button type="submit">Жду звонка</button>`;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = f.elements.namedItem('name').value.trim();
    const digits = f.elements.namedItem('phone').value.replace(/\D/g, '');
    const err = f.querySelector('.err');
    if (!name) return (err.textContent = 'Напишите имя');
    if (digits.length < 10) return (err.textContent = 'Похоже, в номере не хватает цифр');
    f.replaceWith(Object.assign(el('div', 'ans'), { textContent: `${name}, передал вопрос менеджеру. В рабочее время перезвоним в течение 15 минут.` }));
    toast(`Заявка ушла менеджеру в Telegram: «${question.slice(0, 40)}»`, 'ph-telegram-logo');
  });
  return f;
}

async function askSite(question) {
  question = question.trim();
  if (!question || wBusy) return;
  wBusy = true;
  wFeed.append(el('div', 'msg me', question));
  const t = botBubble(Object.assign(el('span', 'typing'), { innerHTML: '<i></i><i></i><i></i>' }));
  await wait(700 + Math.random() * 400);
  t.remove();
  const res = siteIx.ask(question);
  const m = el('div', 'msg bot');
  wFeed.append(m);
  if (!res) {
    const a = el('div', 'ans', 'Точного ответа на сайте нет, а гадать не буду. Оставьте телефон, менеджер уточнит и перезвонит.');
    m.append(a, leadForm(question));
  } else {
    const a = el('div', 'ans');
    m.append(a);
    await typeAnswer(a, res.answer.slice(0, 1));
    const s = res.sources[0];
    const line = el('div', 'src-line');
    line.append(el('i', 'ph ph-file-text'), document.createTextNode(`${s.doc.title}, ${s.sec.h.toLowerCase()}`));
    m.append(line);
  }
  scrollFeed(wFeed);
  wBusy = false;
}

botBubble('Здравствуйте. Подскажу по срокам, ценам и возвратам. Что хотите отправить?');
renderHints(SITE_HINTS, $('#wHints'), askSite);
$('#wAsk').addEventListener('submit', (e) => {
  e.preventDefault();
  askSite($('#wq').value);
  $('#wq').value = '';
});
$('#wMin').addEventListener('click', () => ($('#widget').dataset.open = 'false'));
$('#wFab').addEventListener('click', () => {
  const w = $('#widget');
  w.dataset.open = w.dataset.open === 'true' ? 'false' : 'true';
});

/* ======================= modes ======================= */

function setMode(mode) {
  document.querySelectorAll('.modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
  $('#staff').hidden = mode !== 'staff';
  $('#site').hidden = mode !== 'site';
  history.replaceState(null, '', mode === 'site' ? '#site' : location.pathname);
}
document.querySelectorAll('.modes button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
if (location.hash === '#site') setMode('site');
