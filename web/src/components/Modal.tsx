import { X } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from './Button'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  danger,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
  footer?: React.ReactNode
  danger?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 m-3 w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className={`text-sm font-semibold ${danger ? 'text-red-300' : ''}`}>{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </header>
        <div className="px-4 py-4 text-sm">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-[var(--border)] px-4 py-3">{footer}</footer>
        )}
      </div>
    </div>
  )
}
