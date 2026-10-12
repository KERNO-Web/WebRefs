import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// two pages: the landing and the full menu
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { rollupOptions: { input: { main: 'index.html', menu: 'menu.html' } } },
});
