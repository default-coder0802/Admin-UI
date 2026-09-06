import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useUi } from '../stores/ui'
import { Button } from './Button'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: TriangleAlert,
}

export function Toasts() {
  const { toasts, dismissToast } = useUi()
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = icons[t.kind]
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.message && <p className="text-xs text-[var(--text-muted)]">{t.message}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
              <X className="size-3.5" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
