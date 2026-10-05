import './base.css';
import './demo.css';

/* ===========================================================
   FACEMAIL demo — static front-end of the real mailbox UI.
   All data below is fictional. No backend, no accounts, no
   secrets: everything runs in the browser.
   =========================================================== */

const ME = 'alex@facemail.site';

// Fictional messages. `body` is trusted demo HTML (we authored it).
const MESSAGES = [
  {
    id: 'm1', folder: 'inbox', pinned: true, read: false,
    name: 'Команда FACEMAIL', email: 'team@facemail.site',
    to: ['Алекс Морган <alex@facemail.site>'],
    subject: 'Добро пожаловать в FACEMAIL 👋',
    date: '5 окт, 14:32',
    body: `<p>Привет, Алекс!</p>
      <p>Это ваш новый приватный ящик. Никакой рекламы, трекеров и чужих глаз —
      только вы и ваши письма.</p>
      <p>Пара вещей, которые стоит попробовать прямо сейчас:</p>
      <p>— загляните в папки слева;<br>— откройте любое письмо;<br>— переключите светлую и тёмную тему вверху справа.</p>
      <p><a class="mb-btn" href="#" data-demo-action="Настройки ящика">Настроить ящик</a></p>
      <hr>
      <p class="mb-muted">Вы получили это письмо, потому что создали ящик на facemail.site.</p>`,
  },
  {
    id: 'm2', folder: 'inbox', pinned: false, read: false,
    name: 'Анна Ковалёва', email: 'anna.kovaleva@facemail.site',
    to: ['alex@facemail.site'],
    subject: 'Макеты лендинга — финальная версия',
    date: '5 окт, 11:07',
    attachment: 'landing-final-v3.fig',
    body: `<p>Алекс, привет!</p>
      <p>Прикрепила финальные макеты лендинга — поправила отступы в hero-секции
      и собрала тёмную тему, как договаривались.</p>
      <p>Глянь, пожалуйста, до созвона в 16:00. Если ок — отдаю в вёрстку.</p>
      <p>Спасибо!<br>Аня</p>`,
  },
  {
    id: 'm3', folder: 'inbox', pinned: false, read: true,
    name: 'GitHub', email: 'noreply@github.com',
    to: ['alex@facemail.site'],
    subject: '[facemail] Deploy to production succeeded',
    date: '5 окт, 09:50',
    body: `<p>Your workflow <b>Deploy</b> completed successfully.</p>
      <p>Commit <code>3288a72</code> · branch <code>main</code> · 44s</p>
      <p><a href="#" data-demo-action="GitHub">View run on GitHub →</a></p>`,
  },
  {
    id: 'm4', folder: 'inbox', pinned: false, read: true,
    name: 'Stripe', email: 'receipts@stripe.com',
    to: ['alex@facemail.site'],
    subject: 'Квитанция об оплате — 1 290 ₽',
    date: '4 окт, 19:22',
    body: `<p>Спасибо за оплату.</p>
      <p><b>Сумма:</b> 1 290,00 ₽<br><b>Тариф:</b> FACEMAIL Pro, месяц<br><b>Способ:</b> карта •• 4242</p>
      <p><a href="#" data-demo-action="Квитанция">Скачать квитанцию (PDF)</a></p>`,
  },
  {
    id: 'm5', folder: 'inbox', pinned: false, read: true,
    name: 'Поддержка FACEMAIL', email: 'support@facemail.site',
    to: ['alex@facemail.site'],
    subject: 'Ваш тикет #1024 решён',
    date: '3 окт, 16:41',
    body: `<p>Здравствуйте!</p>
      <p>Мы включили двухфакторную защиту на вашем аккаунте, как вы просили.
      Тикет закрыт — но если что-то ещё, просто ответьте на это письмо.</p>
      <p>Хорошего дня,<br>команда поддержки</p>`,
  },
  {
    id: 'm6', folder: 'inbox', pinned: false, read: true,
    name: 'Хабр Дайджест', email: 'digest@habr.com',
    to: ['alex@facemail.site'],
    subject: 'Лучшее за неделю: 12 статей',
    date: '2 окт, 08:00',
    body: `<p>Подборка самого интересного за неделю — от разбора новых CSS-фич
      до истории одного провального релиза.</p>
      <p><a href="#" data-demo-action="Хабр">Открыть дайджест →</a></p>`,
  },
  {
    id: 's1', folder: 'sent', pinned: false, read: true,
    name: 'Алекс Морган', email: ME,
    to: ['client@studio.example'],
    subject: 'Re: Правки по проекту',
    date: '5 окт, 12:15',
    body: `<p>Добрый день!</p>
      <p>Все правки внёс, обновлённую сборку выложил на стейджинг. Жду обратной связи.</p>
      <p>С уважением,<br>Алекс</p>`,
  },
  {
    id: 's2', folder: 'sent', pinned: false, read: true,
    name: 'Алекс Морган', email: ME,
    to: ['anna.kovaleva@facemail.site'],
    subject: 'Готово, смотри',
    date: '4 окт, 20:03',
    body: `<p>Аня, выложил компоненты в общий репозиторий. Глянь ветку <code>feature/cards</code>.</p>`,
  },
  {
    id: 'd1', folder: 'drafts', pinned: false, read: true,
    name: 'Черновик', email: '',
    to: ['—'],
    subject: 'План на спринт (черновик)',
    date: '5 окт, 13:40',
    body: `<p>Цели на двухнедельный спринт:</p>
      <p>1. Закрыть онбординг…<br>2. Починить поиск по письмам…</p>`,
  },
  {
    id: 'j1', folder: 'spam', pinned: false, read: true,
    name: 'MEGA PRIZE', email: 'winner@prize-247.example',
    to: ['alex@facemail.site'],
    subject: '🎉 ВЫ ВЫИГРАЛИ iPhone 16 PRO !!!',
    date: '3 окт, 02:14',
    body: `<p>ПОЗДРАВЛЯЕМ!!! Ваш адрес выбран случайно среди миллиона.
      Заберите приз, перейдя по ссылке в течение 24 часов…</p>
      <p class="mb-muted">Это письмо помечено как спам — ссылки обезврежены.</p>`,
  },
];

const FOLDERS = {
  inbox: 'Входящие',
  sent: 'Отправленные',
  drafts: 'Черновики',
  spam: 'Спам',
};

let currentFolder = 'inbox';
let selectedId = null;

const $ = (sel) => document.querySelector(sel);
const listRoot = $('#list-root');
const pane = $('#message-pane');
const folderTitle = $('#folder-title');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function folderMessages(folder) {
  const items = MESSAGES.filter((m) => m.folder === folder);
  // Pinned first, otherwise keep authored order (newest first).
  return items.sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

function renderList() {
  const items = folderMessages(currentFolder);
  const isOutgoing = currentFolder === 'sent' || currentFolder === 'drafts';

  if (items.length === 0) {
    listRoot.innerHTML =
      '<div class="message-list-scroll"><table class="message-list"><tbody>' +
      '<tr><td colspan="3" style="padding:24px;color:var(--muted)">В этой папке пусто.</td></tr>' +
      '</tbody></table></div>';
    return;
  }

  const rows = items.map((m) => {
    const party = isOutgoing
      ? 'Кому: ' + escapeHtml(m.to.join(', '))
      : escapeHtml(m.name || m.email);
    const unread = !m.read ? ' unread' : '';
    const selected = m.id === selectedId ? ' is-selected' : '';
    const star = m.pinned ? '★' : '☆';
    const pinnedClass = m.pinned ? ' is-pinned' : '';
    return `
      <tr class="row-link${unread}${selected}" data-id="${m.id}">
        <td class="message-list-party">${party}</td>
        <td class="message-list-subject">
          <div class="message-subject-content">
            <button class="pin-button${pinnedClass}" data-pin="${m.id}" title="Закрепить" aria-label="Закрепить">${star}</button>
            <a href="#" class="subject-link">${escapeHtml(m.subject)}</a>
          </div>
        </td>
        <td class="message-list-date">${escapeHtml(m.date)}</td>
      </tr>`;
  }).join('');

  listRoot.innerHTML =
    '<div class="message-list-scroll"><table class="message-list"><thead><tr>' +
    '<th class="message-list-party"></th><th class="message-list-subject"></th><th class="message-list-date"></th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function renderEmptyPane() {
  pane.innerHTML =
    '<div class="message-pane-empty"><div>' +
    '<img class="empty-mascot" src="hero-mailbox.png" alt="">' +
    '<p>Выберите письмо, чтобы прочитать его здесь.</p>' +
    '</div></div>';
}

function renderPane(m) {
  const fromLine = m.email
    ? `${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;`
    : escapeHtml(m.name);
  const attachment = m.attachment
    ? `<div class="demo-attachment">📎 ${escapeHtml(m.attachment)}</div>`
    : '';
  pane.innerHTML = `
    <h1>${escapeHtml(m.subject)}</h1>
    <p class="message-meta">От: ${fromLine}</p>
    <p class="message-meta">Кому: ${escapeHtml(m.to.join(', '))}</p>
    <p class="message-meta">Дата: ${escapeHtml(m.date)}</p>
    <div class="message-body-html">${m.body}</div>
    ${attachment}
    <p style="margin-top:24px">
      <a href="#" data-demo-action="Переслать">Переслать</a>
      &middot;
      <a href="#" data-demo-action="Удалить">Удалить</a>
      ${m.folder === 'inbox' ? '&middot; <a href="#" data-demo-action="В спам">В спам</a>' : ''}
    </p>`;
}

function openMessage(id) {
  const m = MESSAGES.find((x) => x.id === id);
  if (!m) return;
  m.read = true;
  selectedId = id;
  renderList();
  renderPane(m);
  updateCounts();
}

function selectFolder(folder) {
  currentFolder = folder;
  selectedId = null;
  folderTitle.textContent = FOLDERS[folder];
  document.querySelectorAll('#folder-nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.folder === folder);
  });
  renderList();
  renderEmptyPane();
}

function updateCounts() {
  const unread = MESSAGES.filter((m) => m.folder === 'inbox' && !m.read).length;
  const pill = document.querySelector('[data-folder-count="inbox"]');
  if (pill) {
    pill.textContent = unread ? String(unread) : '';
    pill.classList.toggle('has-unread', unread > 0);
  }
}

/* --- Toast for actions that don't exist in a static demo --- */
let toastTimer;
function toast(label) {
  const el = $('#toast');
  el.textContent = `«${label}» — это демо, действие отключено`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 200);
  }, 2200);
}

/* --- Theme toggle (dark default) --- */
const THEME_KEY = 'facemail-demo-theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = $('#theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
}

/* --- Event wiring --- */
document.addEventListener('click', (e) => {
  // Folder nav
  const folderLink = e.target.closest('#folder-nav a');
  if (folderLink) {
    e.preventDefault();
    selectFolder(folderLink.dataset.folder);
    return;
  }
  // Pin toggle (before row click)
  const pin = e.target.closest('[data-pin]');
  if (pin) {
    e.preventDefault();
    e.stopPropagation();
    const m = MESSAGES.find((x) => x.id === pin.dataset.pin);
    if (m) { m.pinned = !m.pinned; renderList(); }
    return;
  }
  // Message row
  const row = e.target.closest('tr.row-link');
  if (row) {
    e.preventDefault();
    openMessage(row.dataset.id);
    return;
  }
  // Theme
  if (e.target.closest('#theme-toggle')) {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return;
  }
  // Disabled demo actions
  const demo = e.target.closest('[data-demo-action]');
  if (demo) {
    e.preventDefault();
    toast(demo.dataset.demoAction);
  }
});

/* --- Init --- */
let saved = 'dark';
try { saved = localStorage.getItem(THEME_KEY) || 'dark'; } catch { /* ignore */ }
applyTheme(saved);
selectFolder('inbox');
updateCounts();
