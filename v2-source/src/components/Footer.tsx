export default function Footer() {
  return (
    <footer className="py-8 text-center border-t" style={{ borderColor: 'var(--border)' }}>
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        Designed and built by{' '}
        <a
          href="https://github.com/shayandaneshvar"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--accent)' }}
        >
          Shay Daneshvar
        </a>
      </p>
    </footer>
  )
}
