import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/v2/',
  build: {
    outDir: '../v2',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
})
