import { cn } from '../lib/cn'
import { usageTone } from '../lib/format'

export function UsageBar({
  percent,
  className,
}: {
  percent: number
  className?: string
}) {
  const tone = usageTone(percent)
  const color = {
    ok: 'bg-emerald-400',
    warn: 'bg-amber-400',
    crit: 'bg-red-500',
  }[tone]
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]', className)}
      role="meter"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  )
}
