import { cn } from '../lib/cn'

export function Card({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions}
    </header>
  )
}
