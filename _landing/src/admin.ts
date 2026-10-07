// Hidden admin panel at #/kerno-admin: sign in with Supabase Auth and choose
// which project is pinned on the homepage. Writes go through Row Level
// Security, so only accounts listed in portfolio_admins can change the row.
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { PROJECTS, DEFAULT_FEATURED } from './projects';
import { adminClient, readFeaturedSlug, supabaseConfigured } from './settings';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function mountAdmin(root: HTMLElement, onPinned: () => void) {
  let sb: SupabaseClient | null = null;
  let session: Session | null = null;
  let pinned = DEFAULT_FEATURED;
  let busy = '';
  let toast = '';
  let toastKind: 'ok' | 'err' = 'ok';
  let toastTimer = 0;

  const shell = (body: string) => `
    <div class="adm">
      <header class="adm-top wrap">
        <a class="brand" href="#" aria-label="KERNØ — на главную">
          <img src="kerno-avatar-dark.svg" width="32" height="32" alt="" />
          <span>KERN<span class="o">Ø</span></span>
        </a>
        <span class="adm-tag">Админка</span>
        <div class="adm-top-r">
          ${session ? `<span class="adm-user">${esc(session.user.email ?? '')}</span><button type="button" class="adm-link" data-act="logout">Выйти</button>` : ''}
          <a class="adm-link" href="#">← На сайт</a>
        </div>
      </header>
      <div class="wrap adm-body">${body}</div>
      <div class="adm-toast ${toast ? 'on' : ''} ${toastKind}" role="status">${esc(toast)}</div>
    </div>`;

  const setupView = () => `
    <h1 class="adm-h">Supabase не подключён</h1>
    <p class="adm-p">Главная сейчас показывает закреп по умолчанию: <b>${esc(DEFAULT_FEATURED)}</b>.
    Чтобы менять его отсюда, добавьте <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code>
    (локально — в <code>_landing/.env</code>, на GitHub Pages — в переменные репозитория) и выполните SQL из
    <code>_landing/README.md</code>.</p>`;

  const loginView = (error = '') => `
    <form class="adm-login" data-form="login">
      <h1 class="adm-h">Вход</h1>
      <label>Почта<input name="email" type="email" autocomplete="username" required value="${esc(lastEmail)}" /></label>
      <label>Пароль<input name="password" type="password" autocomplete="current-password" required /></label>
      ${error ? `<p class="adm-err">${esc(error)}</p>` : ''}
      <button class="btn btn-accent" type="submit" ${busy ? 'disabled' : ''}>${busy ? 'Входим…' : 'Войти'}</button>
    </form>`;

  const listView = () => {
    const cur = PROJECTS.find((p) => p.slug === pinned);
    return `
      <div class="adm-head">
        <p class="adm-kicker">Закреплённый проект</p>
        <h1 class="adm-h">${esc(cur?.title ?? pinned)}</h1>
        <p class="adm-p">Выберите работу, которая встанет первой на главной. Изменение видят все посетители сразу после обновления страницы.</p>
      </div>
      <ul class="adm-grid">
        ${PROJECTS.map((p) => {
          const on = p.slug === pinned;
          const loading = busy === p.slug;
          return `
          <li class="adm-item ${on ? 'on' : ''}">
            <img src="${esc(p.thumbnail)}" alt="" loading="lazy" width="1200" height="630" />
            <div class="adm-meta">
              <b>${esc(p.title)}</b>
              <code>${esc(p.slug)}</code>
              <span class="adm-tags">${p.tags.map(esc).join(' · ')}</span>
            </div>
            ${
              on
                ? '<span class="adm-state">Закреплено</span>'
                : `<button type="button" class="btn btn-line" data-pin="${esc(p.slug)}" ${busy ? 'disabled' : ''}>${loading ? 'Сохраняем…' : 'Закрепить на главной'}</button>`
            }
          </li>`;
        }).join('')}
      </ul>`;
  };

  let loginError = '';
  let lastEmail = '';
  const render = () => {
    if (!supabaseConfigured) root.innerHTML = shell(setupView());
    else if (!session) root.innerHTML = shell(loginView(loginError));
    else root.innerHTML = shell(listView());
  };

  const say = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    toast = msg;
    toastKind = kind;
    render();
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast = '';
      render();
    }, 3600);
  };

  root.addEventListener('submit', async (e) => {
    const form = e.target as HTMLFormElement;
    if (form.dataset.form !== 'login') return;
    e.preventDefault();
    sb ??= await adminClient();
    const data = new FormData(form);
    lastEmail = String(data.get('email'));
    busy = 'login';
    loginError = '';
    render();
    const { data: res, error } = await sb.auth.signInWithPassword({
      email: String(data.get('email')),
      password: String(data.get('password')),
    });
    busy = '';
    if (error) loginError = 'Не получилось войти: проверьте почту и пароль.';
    session = res.session;
    render();
  });

  root.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-act="logout"]') && sb) {
      await sb.auth.signOut();
      session = null;
      render();
      return;
    }
    const pinBtn = t.closest<HTMLButtonElement>('[data-pin]');
    if (!pinBtn || !sb || busy) return;
    const slug = pinBtn.dataset.pin!;
    busy = slug;
    render();
    const { data, error } = await sb
      .from('portfolio_settings')
      .update({ featured_project_slug: slug, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('featured_project_slug');
    busy = '';
    if (error || !data?.length) {
      say(error ? `Ошибка: ${error.message}` : 'Нет прав: этот аккаунт не добавлен в portfolio_admins.', 'err');
      return;
    }
    pinned = data[0].featured_project_slug;
    onPinned();
    say(`Готово: на главной теперь «${PROJECTS.find((p) => p.slug === pinned)?.title}»`);
  });

  render();
  if (!supabaseConfigured) return;

  (async () => {
    sb = await adminClient();
    const [{ data }, slug] = await Promise.all([sb.auth.getSession(), readFeaturedSlug(5000)]);
    pinned = slug;
    // already signed in from an earlier visit, or signed in while this loaded
    if (data.session && !session) {
      session = data.session;
      render();
    } else if (session) render();
    // re-render only when the signed-in user actually changes, so a stray
    // auth event never wipes what is being typed into the login form
    sb.auth.onAuthStateChange((_e, s) => {
      if ((s?.user.id ?? null) === (session?.user.id ?? null)) return;
      session = s;
      render();
    });
  })();
}
