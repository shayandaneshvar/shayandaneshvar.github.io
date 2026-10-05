import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const CV_FILE = '/files/CV_ShayanDaneshvar.pdf'
const RESUME_FILE = '/files/S_Shayan_Daneshvar_Resume.pdf'

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
            Resume
          </h2>
          <button onClick={onClose} aria-label="Close"
            className="leading-none p-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}>
            ✕
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text)' }}>
          One page, the short version aimed at engineering and research roles.
        </p>

        <a
          ref={firstRef}
          href={RESUME_FILE}
          download
          onClick={onClose}
          className="block w-full text-center font-mono text-sm px-4 py-3 rounded border transition-all duration-200 hover:opacity-85 hover:-translate-y-0.5"
          style={{ color: 'var(--bg)', backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' }}
        >
          Download resume (PDF)
        </a>

        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          After the academic record instead? The{' '}
          <a href={CV_FILE} download onClick={onClose}
            className="underline underline-offset-2 hover:opacity-80"
            style={{ color: 'var(--text)' }}>
            full CV
          </a>{' '}
          has the publications, research and education in full.
        </p>
      </motion.div>
    </motion.div>
  )
}
