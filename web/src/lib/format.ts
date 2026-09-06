export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : digits)} ${units[i]}`
}

export function formatBps(bps: number): string {
  return `${formatBytes(bps)}/s`
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n)
}

export function formatPercent(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDateTime(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(d)
}

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(ts))
}

export function relativeTime(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts).getTime() : ts
  const diff = Date.now() - d
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 48) return `${hr}h ago`
  const day = Math.round(hr / 24)
  return `${day}d ago`
}

export function usageTone(pct: number): 'ok' | 'warn' | 'crit' {
  if (pct >= 90) return 'crit'
  if (pct >= 75) return 'warn'
  return 'ok'
}
