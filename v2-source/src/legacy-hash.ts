// v2 moved to the site root, so plain "#anchor" URLs that used to resolve against the old
// root page now reach the hash router, which reads them as unknown routes and bounces to
// the home page. Links like shayandaneshvar.com/#reflection-removal-with-mamba were shared
// before the move, so they get sorted out here, before React mounts.
//
//   #/...            a router path, left alone
//   #projects        a section that still exists in v2, scrolled to after mount
//   #dapixi          a v1-only anchor, sent to /v1/#dapixi where the content lives

const V2_SECTIONS = new Set([
  'about', 'experience', 'education', 'publications', 'projects', 'blog', 'contact',
])

let pendingSection: string | null = null

export function resolveLegacyHash() {
  const { hash, pathname, search } = window.location
  const toHome = () => window.history.replaceState(null, '', `${pathname}${search}#/`)

  if (!hash || hash === '#') return toHome()
  if (hash.startsWith('#/')) return

  const id = hash.slice(1).split(/[?&]/)[0]
  if (V2_SECTIONS.has(id)) {
    pendingSection = id
    return toHome()
  }
  // Anything else belongs to the legacy page.
  window.location.replace(`/v1/#${id}`)
}

// Read once: the home page consumes it on mount and scrolls there.
export function takePendingSection(): string | null {
  const section = pendingSection
  pendingSection = null
  return section
}
