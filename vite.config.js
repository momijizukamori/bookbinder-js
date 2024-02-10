import { defineConfig } from 'vite';
import version from 'vite-plugin-package-version';

export default defineConfig({
  base: 'https://momijizukamori.github.io/bookbinder-js/',
  test: {
    environment: 'jsdom',
  },
  plugins: [version()]
});