// Verifies that every site-root asset referenced by the shipped pages actually exists.
//
// These paths are plain strings resolved at runtime, so nothing in the build catches a
// rename: /files/CV_ShayanDaneshvar_Apr2025.pdf stayed in v2's nav for months after the
// file became CV_ShayanDaneshvar.pdf, and the only symptom was a 404 on click.
//
// Scopes:
//   pages  hand-edited sources: v1, misc, redirect, and v2-source/src
//   build  the committed v2/ bundle that GitHub Pages actually serves
// Run: node scripts/check-asset-links.mjs [pages|build]   (default: both)

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))

const scope = process.argv[2] ?? 'all'
if (!['all', 'pages', 'build'].includes(scope)) {
  console.error(`Unknown scope "${scope}". Use pages, build, or omit for both.`)
  process.exit(2)
}
const wantPages = scope === 'all' || scope === 'pages'
const wantBuild = scope === 'all' || scope === 'build'

// Hand-edited pages, plus the v2 sources where these paths are written as literals.
const SCAN = wantPages ? ['v1/index.html', 'redirect.html', 'misc/index.html'] : []
const SCAN_DIRS = []
if (wantPages) SCAN_DIRS.push({ dir: 'v2-source/src', ext: ['.ts', '.tsx'], recurse: true })
// The built bundle is what Pages serves, so it gets checked too (after a build in CI).
if (wantBuild) {
  SCAN.push('v2/index.html', 'index.html')   // the root copy of the v2 shell
  SCAN_DIRS.push({ dir: 'v2/assets', ext: ['.js', '.css'] })
}

// Asset families that live at the repo root and are referenced by absolute or relative path.
const PATTERN = /(?:\.\.\/|\.\/)?\/?(?:files|images)\/[A-Za-z0-9._%+-]+|(?:\.\.\/|\.\/)?\/?photo\d*\.jpg/g

function filesToScan() {
  const out = SCAN.filter(f => fs.existsSync(path.join(root, f)))
  for (const { dir, ext, recurse } of SCAN_DIRS) {
    const abs = path.join(root, dir)
    if (!fs.existsSync(abs)) continue
    const walk = (rel) => {
      for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
        const next = path.join(rel, entry.name)
        if (entry.isDirectory()) { if (recurse) walk(next) }
        else if (ext.includes(path.extname(entry.name))) out.push(next)
      }
    }
    walk(dir)
  }
  return out
}

function resolveRef(ref, fromFile) {
  const clean = ref.replace(/^\.\//, '')
  if (clean.startsWith('/')) return path.join(root, clean.slice(1))
  if (clean.startsWith('../')) return path.resolve(root, path.dirname(fromFile), clean)
  return path.resolve(root, path.dirname(fromFile), clean)
}

const missing = new Map()   // "ref -> files that reference it"
let checked = 0

for (const file of filesToScan()) {
  const text = fs.readFileSync(path.join(root, file), 'utf8')
  const refs = new Set(text.match(PATTERN) ?? [])
  for (const ref of refs) {
    checked++
    if (!fs.existsSync(resolveRef(ref, file))) {
      if (!missing.has(ref)) missing.set(ref, [])
      missing.get(ref).push(file)
    }
  }
}

if (missing.size > 0) {
  console.error(`\nBroken asset links (${missing.size}):\n`)
  for (const [ref, where] of missing) {
    console.error(`  ${ref}`)
    console.error(`      referenced by: ${where.join(', ')}`)
    console.error(`      no such file in the repo\n`)
  }
  console.error('If a file was renamed, update the pages that point at it (v1 index.html,')
  console.error('misc/index.html and v2-source/src), then rebuild v2.\n')
  process.exit(1)
}

console.log(`All ${checked} asset references (${scope}) resolve to files in the repo.`)
