export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-md text-xs text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--muted)] ${className ?? 'h-24'}`} />
}
