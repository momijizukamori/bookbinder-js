import { defineConfig } from 'vite';
import version from 'vite-plugin-package-version';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
  base: process.env.BASE || 'https://momijizukamori.github.io/bookbinder-js/',
  test: {
    environment: 'jsdom',
  },
  plugins: [version(), injectHTML()],
});
