import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  css: {
    postcss: null,
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    cors: true,
  },
});
