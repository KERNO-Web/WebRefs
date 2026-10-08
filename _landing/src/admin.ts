// Hidden admin at #/kerno-admin. Pin up to two projects, reorder the works,
// hide or bring them back. Edits collect in a draft and go out as one commit.
// Changes are committed to src/site-settings.json through the GitHub API with a
// fine-grained token that the owner pastes once; the token stays in this
// browser only and is never part of the site's code. Each save triggers the
// Pages workflow, which rebuilds the site in about two minutes.
import { PROJECTS } from './projects';
import { MAX_PINNED, REPO, SETTINGS, SETTINGS_PATH, normalize, type SiteSettings } from './settings';

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

const clone = (s: SiteSettings): SiteSettings => ({ featured: [...s.featured], order: [...s.order], hidden: [...s.hidden] });

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
  let draft: SiteSettings = clone(SETTINGS);
  let dragging = '';
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
      draft = clone(state);
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
      draft = clone(next);
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

  const dirty = () => JSON.stringify(draft) !== JSON.stringify(state);
  const title = (slug: string) => PROJECTS.find((p) => p.slug === slug)?.title ?? slug;
  const bySlugP = (slug: string) => PROJECTS.find((p) => p.slug === slug)!;

  /** pinned first, then everything else, each in saved order — as on the homepage */
  const groups = () => ({
    pinnedList: draft.order.filter((s) => draft.featured.includes(s)),
    others: draft.order.filter((s) => !draft.featured.includes(s)),
  });
  const groupOf = (slug: string) => (draft.featured.includes(slug) ? groups().pinnedList : groups().others);

  const listView = () => {
    const shown = draft.order.filter((s) => !draft.hidden.includes(s));
    const pinned = shown.filter((s) => draft.featured.includes(s));
    const rest = shown.filter((s) => !draft.featured.includes(s));
    const full = draft.featured.length >= MAX_PINNED;
    const dis = busy ? 'disabled' : '';
    const row = (slug: string) => {
      const p = bySlugP(slug);
      const isPinned = draft.featured.includes(slug);
      const hidden = draft.hidden.includes(slug);
      const g = groupOf(slug);
      const i = g.indexOf(slug);
      const place = isPinned
        ? `<span class="adm-place is-pin">Закреп ${pinned.indexOf(slug) + 1}</span>`
        : hidden
          ? '<span class="adm-place is-off">скрыт</span>'
          : `<span class="adm-place">${String(rest.indexOf(slug) + 1).padStart(2, '0')}</span>`;
      const pinBtn = isPinned
        ? `<button type="button" class="adm-btn is-on" data-unpin="${esc(slug)}" ${draft.featured.length <= 1 || busy ? 'disabled title="Хотя бы одна работа должна быть закреплена"' : ''}>Открепить</button>`
        : hidden
          ? ''
          : `<button type="button" class="adm-btn" data-pin="${esc(slug)}" ${full || busy ? `disabled title="Закрепить можно не больше ${MAX_PINNED}"` : ''}>Закрепить</button>`;
      const visBtn = hidden
        ? `<button type="button" class="adm-btn" data-show="${esc(slug)}" ${dis}>Вернуть</button>`
        : isPinned
          ? ''
          : `<button type="button" class="adm-btn is-quiet" data-hide="${esc(slug)}" ${dis}>Скрыть</button>`;
      return `
        <li class="adm-row${isPinned ? ' on' : ''}${hidden ? ' off' : ''}${dragging === slug ? ' is-dragging' : ''}" draggable="${busy ? 'false' : 'true'}" data-slug="${esc(slug)}">
          <span class="adm-handle" aria-hidden="true"><svg viewBox="0 0 12 18" width="12" height="18"><g fill="currentColor"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="3" cy="15" r="1.6"/><circle cx="9" cy="15" r="1.6"/></g></svg></span>
          ${place}
          <img src="${esc(p.thumbnail)}" alt="" loading="lazy" width="1200" height="630" />
          <div class="adm-meta">
            <b>${esc(p.title)}</b>
            <code>${esc(slug)}</code>
          </div>
          <div class="adm-row-actions">
            <span class="adm-move">
              <button type="button" class="adm-icon" data-up="${esc(slug)}" aria-label="Выше" title="Выше" ${i === 0 || busy ? 'disabled' : ''}><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg></button>
              <button type="button" class="adm-icon" data-down="${esc(slug)}" aria-label="Ниже" title="Ниже" ${i === g.length - 1 || busy ? 'disabled' : ''}><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3.5 8.5 8 13l4.5-4.5"/></svg></button>
            </span>
            ${pinBtn}
            ${visBtn}
          </div>
        </li>`;
    };

    return `
      <div class="adm-head">
        <p class="adm-kicker">Главная</p>
        <h1 class="adm-h">${pinned.map((s) => esc(title(s))).join(' + ')}</h1>
        <p class="adm-p">Закреплено ${pinned.length} из ${MAX_PINNED}, на главной ${shown.length} из ${PROJECTS.length} работ. Перетащите строки или двигайте стрелками — порядок здесь совпадает с порядком на сайте. Изменения уходят одним сохранением, сайт пересобирается примерно за 2 минуты.</p>
      </div>
      <p class="adm-group">Закреплены <span>— крупно в начале главной</span></p>
      <ol class="adm-list" data-list>
        ${groups().pinnedList.map(row).join('')}
      </ol>
      <p class="adm-group">Остальные работы <span>— в этом порядке под закреплёнными</span></p>
      <ol class="adm-list" data-list>
        ${groups().others.map(row).join('')}
      </ol>
      <div class="adm-bar${dirty() ? ' on' : ''}" role="region" aria-label="Несохранённые изменения">
        <span>Есть несохранённые изменения</span>
        <button type="button" class="btn btn-line" data-act="reset" ${dis}>Отменить</button>
        <button type="button" class="btn btn-accent" data-act="save" ${dis}>${busy ? 'Сохраняем…' : 'Сохранить'}</button>
      </div>`;
  };

  /** put `slug` right before or after `target` in the saved order */
  const place = (slug: string, target: string, after: boolean) => {
    if (slug === target) return;
    const order = draft.order.filter((s) => s !== slug);
    order.splice(order.indexOf(target) + (after ? 1 : 0), 0, slug);
    draft = normalize({ ...draft, order });
  };
  const step = (slug: string, dir: -1 | 1) => {
    const g = groupOf(slug);
    const next = g[g.indexOf(slug) + dir];
    if (next) place(slug, next, dir > 0);
  };

  const commitMessage = () => {
    const parts: string[] = [];
    if (JSON.stringify(draft.featured) !== JSON.stringify(state.featured)) parts.push(`pin ${draft.featured.join(', ')}`);
    if (JSON.stringify(draft.order) !== JSON.stringify(state.order)) parts.push('reorder works');
    const hid = draft.hidden.filter((s) => !state.hidden.includes(s));
    const shown = state.hidden.filter((s) => !draft.hidden.includes(s));
    if (hid.length) parts.push(`hide ${hid.join(', ')}`);
    if (shown.length) parts.push(`show ${shown.join(', ')}`);
    return `Homepage: ${parts.join('; ') || 'update'}`;
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
    const pick = (attr: string) => t.closest<HTMLElement>(`[data-${attr}]`)?.getAttribute(`data-${attr}`) ?? '';
    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    if (act === 'save' && dirty()) {
      save(draft, commitMessage(), 'Сохранено.');
      return;
    }
    if (act === 'reset') {
      draft = clone(state);
      render();
      return;
    }
    const pin = pick('pin');
    const unpin = pick('unpin');
    const hide = pick('hide');
    const show = pick('show');
    const up = pick('up');
    const down = pick('down');
    if (pin && draft.featured.length < MAX_PINNED) draft = normalize({ ...draft, featured: [...draft.featured, pin] });
    else if (unpin && draft.featured.length > 1) draft = normalize({ ...draft, featured: draft.featured.filter((s) => s !== unpin) });
    else if (hide) draft = normalize({ ...draft, hidden: [...draft.hidden, hide] });
    else if (show) draft = normalize({ ...draft, hidden: draft.hidden.filter((s) => s !== show) });
    else if (up) step(up, -1);
    else if (down) step(down, 1);
    else return;
    render();
    const again = root.querySelector<HTMLElement>(`[data-slug="${CSS.escape(up || down)}"] [data-${up ? 'up' : 'down'}]`);
    if ((up || down) && again && !again.hasAttribute('disabled')) again.focus();
  });

  // ---------- drag to reorder ----------
  let dropTarget: HTMLElement | null = null;
  let dropAfter = false;
  const clearDrop = () => {
    dropTarget?.classList.remove('drop-before', 'drop-after');
    dropTarget = null;
  };
  root.addEventListener('dragstart', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('.adm-row');
    if (!li || busy) return;
    dragging = li.dataset.slug!;
    e.dataTransfer?.setData('text/plain', dragging);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => li.classList.add('is-dragging'));
  });
  root.addEventListener('dragover', (e) => {
    if (!dragging) return;
    const li = (e.target as HTMLElement).closest<HTMLElement>('.adm-row');
    if (!li || li.dataset.slug === dragging) return;
    if (draft.featured.includes(li.dataset.slug!) !== draft.featured.includes(dragging)) return;
    e.preventDefault();
    const r = li.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2;
    if (dropTarget !== li || dropAfter !== after) {
      clearDrop();
      dropTarget = li;
      dropAfter = after;
      li.classList.add(after ? 'drop-after' : 'drop-before');
    }
  });
  root.addEventListener('drop', (e) => {
    if (!dragging || !dropTarget) return;
    e.preventDefault();
    place(dragging, dropTarget.dataset.slug!, dropAfter);
    clearDrop();
    dragging = '';
    render();
  });
  root.addEventListener('dragend', () => {
    clearDrop();
    if (dragging) {
      dragging = '';
      render();
    }
  });

  addEventListener('beforeunload', (e) => {
    if (loaded && dirty()) e.preventDefault();
  });

  render();
  if (token)
    load().then(() => {
      if (!loaded) token = '';
      render();
    });
}
