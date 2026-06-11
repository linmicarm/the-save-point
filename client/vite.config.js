/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  optimizeDeps: {
    include: ['emoji-mart', '@emoji-mart/data', '@emoji-mart/react'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,                 // skip CSS processing — not needed for logic tests
    include: ['src/**/*.test.{js,jsx}'],
  },
})
