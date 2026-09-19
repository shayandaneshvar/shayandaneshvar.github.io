import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Photos, project images and the resume live at the repo root (shared with v1) and are
// referenced by absolute paths like /photo1.jpg. GitHub Pages serves them in production;
// this makes the dev server serve them too, so `npm run dev` shows them. Dev only.
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf',
}

function serveRepoRootAssets(): Plugin {
  return {
    name: 'serve-repo-root-assets',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '').split('?')[0])
        if (!/^\/(photo\d*\.jpg|images\/|files\/)/.test(url)) return next()
        const file = path.join(repoRoot, url)
        if (!file.startsWith(repoRoot) || !fs.existsSync(file)) return next()
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

export default defineConfig({
  base: '/v2/',
  build: {
    outDir: '../v2',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss(), serveRepoRootAssets()],
})
