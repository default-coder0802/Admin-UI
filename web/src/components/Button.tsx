import { cn } from '../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'

export function Button({
  children,
  className,
  variant = 'secondary',
  size = 'md',
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const variants: Record<Variant, string> = {
    primary:
      'bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-emerald-500/40',
    secondary:
      'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--muted)]',
    ghost: 'bg-transparent text-[var(--text)] hover:bg-[var(--muted)]',
    danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/40',
    outline:
      'bg-transparent border border-[var(--border)] text-[var(--text)] hover:bg-[var(--muted)]',
  }
  const sizes = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-10 px-3.5 text-sm gap-2',
    lg: 'h-11 px-4 text-sm gap-2',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
