import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import { getPost } from '../blog/posts'

// Shared shell for every blog post: nav, back link, tags, title, byline, footer.
// The intro paragraph(s) go in `intro`, the post body in children.
export default function BlogPostLayout({ slug, intro, children }: {
  slug: string; intro: React.ReactNode; children: React.ReactNode
}) {
  const post = getPost(slug)

  useEffect(() => {
    document.title = `${post.title} | Shayan Daneshvar`
    return () => { document.title = 'Shayan Daneshvar' }
  }, [post.title])

  return (
    <div className="relative">
      <Nav />
      <main className="mx-auto max-w-[1200px] px-6 md:px-12 pt-28 pb-24">

        {/* Breadcrumb: returns to the blog section, not the top of the home page */}
        <Link to="/" state={{ scrollTo: 'blog' }}
          className="font-mono text-sm inline-flex items-center gap-2 mb-8 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Portfolio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span key={tag} className="font-mono text-xs px-3 py-1 rounded-full border"
                style={{ color: 'var(--accent)', borderColor: 'var(--accent-40)' }}>
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4"
            style={{ color: 'var(--text-bright)' }}>
            {post.title}
          </h1>
          <div className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--text)' }}>
            {intro}
          </div>
          <p className="font-mono text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            {post.date} · S. Shayan Daneshvar
          </p>
        </div>

        {children}
      </main>
      <Footer />
    </div>
  )
}
