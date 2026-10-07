# KERNØ — главная портфолио

Vite + TypeScript, без фреймворка. Все работы описаны в одном месте:
`src/projects.ts`. Сетка, закреплённый проект и админка рендерятся из этого списка.

```bash
npm install
npm run dev
```

## Закреп на главной

Какая работа стоит первой, хранится в Supabase, в одной строке таблицы
`portfolio_settings`. Посетители только читают её; менять может только вошедший
администратор. Если Supabase не настроен или не ответил за 2,5 секунды,
закреплён проект из `DEFAULT_FEATURED` в `src/projects.ts`.

Скрытая админка: `…/WebRefs/#/kerno-admin` или **Cmd/Ctrl + Shift + K**.
Ссылки на неё на сайте нет.

### Настройка (один раз)

1. Создайте проект на supabase.com.
2. **SQL Editor** → выполните:

```sql
create table public.portfolio_settings (
  id int primary key default 1 check (id = 1),
  featured_project_slug text not null,
  updated_at timestamptz not null default now()
);
insert into public.portfolio_settings (id, featured_project_slug) values (1, 'roman');

-- who may change it
create table public.portfolio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.portfolio_settings enable row level security;
alter table public.portfolio_admins enable row level security;

-- everyone reads the pinned project
create policy "public read"
  on public.portfolio_settings for select
  using (true);

-- only listed admins update it
create policy "admins update"
  on public.portfolio_settings for update to authenticated
  using (exists (select 1 from public.portfolio_admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.portfolio_admins a where a.user_id = auth.uid()));

-- an admin can see their own row (nothing else is exposed)
create policy "self read"
  on public.portfolio_admins for select to authenticated
  using (user_id = auth.uid());
```

3. **Authentication → Users → Add user**: почта и пароль администратора.
   В **Authentication → Sign In / Providers** выключите «Allow new users to sign up»,
   чтобы никто не мог зарегистрироваться сам.
4. Добавьте этого пользователя в админы:

```sql
insert into public.portfolio_admins (user_id)
select id from auth.users where email = 'ВАША@ПОЧТА';
```

5. **Project Settings → API**: скопируйте Project URL и `anon` public key.
   - локально — в `_landing/.env` (см. `.env.example`);
   - для сайта — GitHub → репозиторий → **Settings → Secrets and variables →
     Actions → Variables**: `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`,
     затем перезапустите workflow «Deploy sites to GitHub Pages».

`anon`-ключ публичный по замыслу Supabase: без входа он даёт только чтение,
запись ограничена политиками выше. Service role key в сайт не попадает.
