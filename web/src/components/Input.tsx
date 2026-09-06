import { cn } from '../lib/cn'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-[var(--text-muted)]">{hint}</span>}
      {error && (
        <span className="block text-xs text-red-400" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] placeholder:text-slate-500 focus:border-emerald-500',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-32 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--text)]',
        className,
      )}
      {...props}
    />
  )
}
