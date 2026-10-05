// Publishes the v2 app at the site root as well as at /v2/.
//
// Vite builds v2 with base '/v2/', so v2/index.html already points at /v2/assets/*.
// Copying that file to the repo root gives a second entry point that loads the same
// bundle: one build, one set of assets, served at both / and /v2/. Routing is hash
// based, so no server-side rewrite is needed at either path.
//
// Runs automatically after `npm run build` in v2-source.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const built = path.join(root, 'v2', 'index.html')
const CANONICAL = '<link rel="canonical" href="https://shayandaneshvar.com/" />'

if (!fs.existsSync(built)) {
  console.error('v2/index.html not found. Run the build first.')
  process.exit(1)
}

let html = fs.readFileSync(built, 'utf8')

// / and /v2/ serve identical markup, so point both at / for search engines.
if (!html.includes('rel="canonical"')) {
  html = html.replace('</head>', `    ${CANONICAL}\n  </head>`)
  fs.writeFileSync(built, html)
}

fs.writeFileSync(path.join(root, 'index.html'), html)
console.log('Root index.html updated from the v2 build (canonical -> /).')
