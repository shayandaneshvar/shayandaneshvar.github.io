// v2 moved to the site root, so plain "#anchor" URLs that used to resolve against the old
// root page now reach the hash router, which reads them as unknown routes and bounces to
// the home page. Links like shayandaneshvar.com/#reflection-removal-with-mamba were shared
// before the move, so they get sorted out here, before React mounts.
//
//   #/...            a router path, left alone
//   #projects        a section that still exists in v2, scrolled to after mount
//   #dapixi          a project v2 also lists, scrolled to on the v2 projects section
//   #image2          no v2 equivalent, sent to /v1/#image2 where the content lives

import { PROJECT_ANCHORS } from './data/projects'

const V2_SECTIONS = new Set([
  'about', 'experience', 'education', 'publications', 'projects', 'blog', 'contact',
])

// v1 spelled a couple of things differently.
const ALIASES: Record<string, string> = { publication: 'publications' }

const V2_TARGETS = new Set([...V2_SECTIONS, ...PROJECT_ANCHORS])

let pendingSection: string | null = null

export function resolveLegacyHash() {
  const { hash, pathname, search } = window.location
  const toHome = () => window.history.replaceState(null, '', `${pathname}${search}#/`)

  if (!hash || hash === '#') return toHome()
  if (hash.startsWith('#/')) return

  const raw = hash.slice(1).split(/[?&]/)[0]
  const id = ALIASES[raw] ?? raw
  if (V2_TARGETS.has(id)) {
    pendingSection = id
    return toHome()
  }
  // Only things v2 does not have (photos, stray markers) fall back to the legacy page.
  window.location.replace(`/v1/#${raw}`)
}

// A hash-only change does not reload the page, so the startup pass above never sees it:
// pasting an old link while the site is open would leave the router to bounce it to the
// home page. Reloading keeps the anchor in the URL and sends it back through that pass.
// Registered before the router's own listener, so it wins.
export function watchLegacyHash() {
  window.addEventListener('hashchange', () => {
    const { hash } = window.location
    if (!hash || hash === '#' || hash.startsWith('#/')) return
    window.location.reload()
  })
}

/** Non-destructive read, for components that need to prepare before the scroll. */
export function peekPendingSection(): string | null {
  return pendingSection
}

// Read once: the home page consumes it on mount and scrolls there.
export function takePendingSection(): string | null {
  const section = pendingSection
  pendingSection = null
  return section
}
