import { defineConfig } from 'vite'

export default defineConfig({
  base: '/bookbinder-js/',
  test: {
    environment: 'jsdom'
  }
})