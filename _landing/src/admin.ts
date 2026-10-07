// Hidden admin at #/kerno-admin. Pin a project or hide one from the homepage.
// Changes are committed to src/site-settings.json through the GitHub API with a
// fine-grained token that the owner pastes once; the token stays in this
// browser only and is never part of the site's code. Each save triggers the
// Pages workflow, which rebuilds the site in about two minutes.
import { PROJECTS } from './projects';
import { REPO, SETTINGS, SETTINGS_PATH, normalize, type SiteSettings } from './settings';

const TOKEN_KEY = 'kerno-admin-gh-token';
const API = `https://api.github.com/repos/${REPO}/contents/${SETTINGS_PATH}`;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
};
const writeToken = (t: string) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: the token simply is not remembered */
  }
};

const b64encode = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const b64decode = (s: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)));

async function gh(token: string, init?: RequestInit) {
  const res = await fetch(init ? API : `${API}?ref=main&t=${Date.now()}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (res.status === 401) throw new Error('Токен не подходит или истёк.');
  if (res.status === 403 || res.status === 404)
    throw new Error('У токена нет доступа к репозиторию WebRefs (нужно Contents: Read and write).');
  if (res.status === 409) throw new Error('Файл только что изменился. Обновите страницу и повторите.');
  if (!res.ok) throw new Error(`GitHub ответил ${res.status}.`);
  return res.json();
}

export function mountAdmin(root: HTMLElement) {
  let token = readToken();
  let state: SiteSettings = SETTINGS;
  let sha = '';
  let loaded = false;
  let busy = false;
  let error = '';
  let toast = '';
  let toastErr = false;
  let toastTimer = 0;

  const say = (msg: string, isErr = false) => {
    toast = msg;
    toastErr = isErr;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast = '';
      render();
    }, 5200);
  };

  const load = async () => {
    error = '';
    try {
      const file = await gh(token);
      sha = file.sha;
      state = normalize(JSON.parse(b64decode(file.content)));
      loaded = true;
    } catch (e) {
      error = (e as Error).message;
      loaded = false;
    }
  };

  const save = async (next: SiteSettings, message: string, done: string) => {
    busy = true;
    render();
    try {
      const body = JSON.stringify(next, null, 2) + '\n';
      const res = await gh(token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: b64encode(body), sha, branch: 'main' }),
      });
      sha = res.content.sha;
      state = next;
      say(`${done} Сайт обновится примерно через 2 минуты.`);
    } catch (e) {
      say((e as Error).message, true);
    }
    busy = false;
    render();
  };

  const tokenView = () => `
    <form class="adm-login" data-form="token">
      <h1 class="adm-h">Вход</h1>
      <p class="adm-p">Нужен токен GitHub, который может менять только репозиторий WebRefs. Создаётся один раз:</p>
      <ol class="adm-steps">
        <li>Откройте <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub → Fine-grained token</a>.</li>
        <li>Repository access → <b>Only select repositories</b> → <b>WebRefs</b>.</li>
        <li>Permissions → <b>Contents: Read and write</b>. Больше ничего не нужно.</li>
        <li>Generate token — и вставьте его сюда.</li>
      </ol>
      <label>Токен<input name="token" type="password" autocomplete="off" spellcheck="false" required placeholder="github_pat_…" /></label>
      ${error ? `<p class="adm-err">${esc(error)}</p>` : ''}
      <button class="btn btn-accent" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Проверяем…' : 'Войти'}</button>
      <p class="adm-note">Токен хранится только в этом браузере.</p>
    </form>`;

  const listView = () => {
    const cur = PROJECTS.find((p) => p.slug === state.featured);
    const shown = PROJECTS.length - state.hidden.length;
    return `
      <div class="adm-head">
        <p class="adm-kicker">Закреплённый проект</p>
        <h1 class="adm-h">${esc(cur?.title ?? state.featured)}</h1>
        <p class="adm-p">На главной ${shown} из ${PROJECTS.length} работ. Изменения сохраняются в репозиторий, сайт пересобирается сам примерно за 2 минуты.</p>
      </div>
      <ul class="adm-grid">
        ${PROJECTS.map((p) => {
          const pinned = p.slug === state.featured;
          const hidden = state.hidden.includes(p.slug);
          const dis = busy ? 'disabled' : '';
          return `
          <li class="adm-item ${pinned ? 'on' : ''} ${hidden ? 'off' : ''}">
            <img src="${esc(p.thumbnail)}" alt="" loading="lazy" width="1200" height="630" />
            <div class="adm-meta">
              <b>${esc(p.title)}${hidden ? ' <span class="adm-hidden">скрыт</span>' : ''}</b>
              <code>${esc(p.slug)}</code>
              <span class="adm-tags">${p.tags.map(esc).join(' · ')}</span>
            </div>
            <div class="adm-actions">
              ${
                pinned
                  ? '<span class="adm-state">Закреплено</span>'
                  : hidden
                    ? `<button type="button" class="btn btn-line" data-show="${esc(p.slug)}" ${dis}>Вернуть на сайт</button>`
                    : `<button type="button" class="btn btn-line" data-pin="${esc(p.slug)}" ${dis}>Закрепить</button>
                       <button type="button" class="btn btn-line btn-quiet" data-hide="${esc(p.slug)}" ${dis}>Убрать с сайта</button>`
              }
            </div>
          </li>`;
        }).join('')}
      </ul>`;
  };

  const render = () => {
    const signedIn = Boolean(token) && loaded;
    const body = signedIn ? listView() : token && !error ? '<p class="adm-p">Загружаем…</p>' : tokenView();
    root.innerHTML = `
      <div class="adm">
        <header class="adm-top wrap">
          <a class="brand" href="#" aria-label="KERNØ — на главную">
            <img src="kerno-avatar-dark.svg" width="32" height="32" alt="" />
            <span>KERN<span class="o">Ø</span></span>
          </a>
          <span class="adm-tag">Админка</span>
          <div class="adm-top-r">
            ${signedIn ? '<button type="button" class="adm-link" data-act="logout">Выйти</button>' : ''}
            <a class="adm-link" href="#">← На сайт</a>
          </div>
        </header>
        <div class="wrap adm-body">${body}</div>
        <div class="adm-toast ${toast ? 'on' : ''} ${toastErr ? 'err' : ''}" role="status">${esc(toast)}</div>
      </div>`;
  };

  root.addEventListener('submit', async (e) => {
    const form = e.target as HTMLFormElement;
    if (form.dataset.form !== 'token') return;
    e.preventDefault();
    token = String(new FormData(form).get('token')).trim();
    busy = true;
    render();
    await load();
    busy = false;
    if (loaded) writeToken(token);
    else token = '';
    render();
  });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-act="logout"]')) {
      writeToken('');
      token = '';
      loaded = false;
      render();
      return;
    }
    if (busy) return;
    const title = (slug: string) => PROJECTS.find((p) => p.slug === slug)?.title ?? slug;
    const pin = t.closest<HTMLElement>('[data-pin]')?.dataset.pin;
    const hide = t.closest<HTMLElement>('[data-hide]')?.dataset.hide;
    const show = t.closest<HTMLElement>('[data-show]')?.dataset.show;
    if (pin) save({ ...state, featured: pin }, `Homepage: pin ${pin}`, `Закреплено: «${title(pin)}».`);
    else if (hide && confirm(`Убрать «${title(hide)}» с главной? Вернуть можно здесь же.`))
      save({ ...state, hidden: [...state.hidden, hide] }, `Homepage: hide ${hide}`, `«${title(hide)}» убран с главной.`);
    else if (show)
      save(
        { ...state, hidden: state.hidden.filter((s) => s !== show) },
        `Homepage: show ${show}`,
        `«${title(show)}» снова на главной.`,
      );
  });

  render();
  if (token)
    load().then(() => {
      if (!loaded) token = '';
      render();
    });
}
