import { createReadStream, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// In production every project is built next to this page, so cards point at
// ./<project>/og.jpg. In dev those files live in ../<project>/public/og.jpg.
function projectPreviews(): Plugin {
  return {
    name: 'project-previews',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/^\/([a-z0-9]+)\/og\.jpg$/);
        const file = m && resolve(__dirname, '..', m[1], 'public', 'og.jpg');
        if (!file || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'image/jpeg');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({ base: './', plugins: [projectPreviews()] });
