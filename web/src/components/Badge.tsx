import { cn } from '../lib/cn'

const tones = {
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  warn: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  crit: 'bg-red-500/15 text-red-300 border-red-500/30',
  info: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  muted: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  accent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

export function Badge({
  children,
  tone = 'muted',
  className,
}: {
  children: React.ReactNode
  tone?: keyof typeof tones
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ tone }: { tone: 'ok' | 'warn' | 'crit' | 'muted' }) {
  const color = {
    ok: 'bg-emerald-400',
    warn: 'bg-amber-400',
    crit: 'bg-red-400',
    muted: 'bg-slate-500',
  }[tone]
  return <span className={cn('inline-block size-2 rounded-full', color)} aria-hidden />
}
