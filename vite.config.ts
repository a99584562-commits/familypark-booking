import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base: works locally and on GitHub Pages project sites.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5216, host: true },
  preview: { port: 5216, host: true },
})
