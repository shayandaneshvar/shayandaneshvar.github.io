import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Both options point at the CV for now. When the one-page resume exists, drop it in
// files/ and change RESUME_FILE; nothing else here needs to move.
const CV_FILE = '/files/CV_ShayanDaneshvar.pdf'
const RESUME_FILE = CV_FILE

const options = [
  {
    label: 'Curriculum Vitae',
    note: 'The long form: publications, research, education and projects.',
    href: CV_FILE,
  },
  {
    label: 'Resume',
    note: 'The short form, aimed at industry roles.',
    href: RESUME_FILE,
  },
]

export default function ResumeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const firstRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    firstRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        role="dialog" aria-modal="true" aria-labelledby="resume-dialog-title"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 id="resume-dialog-title" className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>
            CV or resume?
          </h2>
          <button onClick={onClose} aria-label="Close"
            className="leading-none p-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text)' }}>
          Pick whichever is more useful. Both download as PDF.
        </p>

        <div className="space-y-3">
          {options.map((o, i) => (
            <a
              key={o.label}
              ref={i === 0 ? firstRef : undefined}
              href={o.href}
              download
              onClick={onClose}
              className="block rounded border px-4 py-3 transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-2)' }}
            >
              <span className="font-mono text-sm font-medium" style={{ color: 'var(--accent)' }}>{o.label}</span>
              <span className="block text-sm mt-0.5" style={{ color: 'var(--text)' }}>{o.note}</span>
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
