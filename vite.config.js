import { defineConfig } from 'vite'

export default defineConfig({
  base: 'https://momijizukamori.github.io/bookbinder-js/',
  test: {
    environment: 'jsdom'
  }
})