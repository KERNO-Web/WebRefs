# KERNØ — главная портфолио

Vite + TypeScript, без фреймворка.

- `src/projects.ts` — все работы: название, описание, превью, ссылка, теги.
  Новую работу добавляют сюда.
- `src/site-settings.json` — что показывать: закреплённая работа (`featured`)
  и скрытые (`hidden`, по slug). Файл вшивается в сборку, поэтому главная
  не ждёт сети.

```bash
npm install
npm run dev
```

## Админка

`…/WebRefs/#/kerno-admin` или **Cmd/Ctrl + Shift + K**. Ссылки на неё на сайте нет.

Там можно закрепить работу, убрать её с главной и вернуть обратно. Админка
сохраняет `src/site-settings.json` в репозиторий через GitHub API, после чего
workflow «Deploy sites to GitHub Pages» пересобирает сайт (около 2 минут).

Вход — fine-grained токен GitHub (создаётся один раз):
Settings → Developer settings → Fine-grained tokens → Generate new token →
Repository access: Only select repositories → **WebRefs** →
Permissions: **Contents: Read and write**.
Токен вставляется в админке и хранится только в localStorage этого браузера;
в код сайта он не попадает. Чтобы отозвать доступ, удалите токен на GitHub.
