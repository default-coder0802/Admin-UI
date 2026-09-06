import { useQuery } from '@tanstack/react-query'
import { Pause, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { LogEntry, LogPriority } from '../../lib/types'

const priLabels = ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug']

export function LogsPage() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [priority, setPriority] = useState<LogPriority | 'all'>('all')
  const [since, setSince] = useState('7d')
  const [unit, setUnit] = useState(params.get('unit') ?? '')
  const [follow, setFollow] = useState(true)
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const [rows, setRows] = useState<LogEntry[]>([])
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const q = useQuery({
    queryKey: ['logs', debounced, priority, since, unit],
    queryFn: () =>
      api.logs({
        query: debounced,
        priority,
        since,
        unit: unit || undefined,
      }),
  })

  useEffect(() => {
    if (q.data) setRows(q.data)
  }, [q.data])

  useEffect(() => {
    if (!follow) return
    const id = window.setInterval(() => {
      void api.followLogs(rows[0]?.cursor).then((fresh) => {
        if (fresh.length) setRows((prev) => [...fresh, ...prev].slice(0, 500))
      })
    }, 2500)
    return () => window.clearInterval(id)
  }, [follow, rows])

  const visible = useMemo(() => rows, [rows])

  function exportLogs(kind: 'text' | 'json') {
    const blob = new Blob(
      [
        kind === 'json'
          ? JSON.stringify(visible, null, 2)
          : visible.map((l) => `${new Date(l.timestamp).toISOString()} ${priLabels[l.priority]} ${l.identifier}: ${l.message}`).join('\n'),
      ],
      { type: kind === 'json' ? 'application/json' : 'text/plain' },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `journal.${kind === 'json' ? 'json' : 'log'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input className="max-w-sm" placeholder="Search journal" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select className="w-36" value={String(priority)} onChange={(e) => setPriority(e.target.value === 'all' ? 'all' : (Number(e.target.value) as LogPriority))}>
          <option value="all">All priorities</option>
          {priLabels.map((p, i) => (
            <option key={p} value={i}>
              {p} and worse
            </option>
          ))}
        </Select>
        <Select className="w-36" value={since} onChange={(e) => setSince(e.target.value)}>
          <option value="1h">Last hour</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
        </Select>
        <Input className="w-48" placeholder="Unit filter" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <Button size="sm" onClick={() => setFollow((f) => !f)}>
          {follow ? <Pause className="size-4" /> : <Play className="size-4" />} {follow ? 'Pause' : 'Follow'}
        </Button>
        <Button size="sm" onClick={() => exportLogs('text')}>Export text</Button>
        <Button size="sm" onClick={() => exportLogs('json')}>Export JSON</Button>
      </div>
      <Card className="min-h-0 flex-1 overflow-hidden">
        <div ref={scroller} className="h-full overflow-auto font-mono text-xs">
          {visible.map((l) => (
            <button
              key={l.cursor}
              className={`flex w-full gap-3 border-b border-[var(--border)] px-3 py-1.5 text-left hover:bg-[var(--muted)] ${priClass(l.priority)}`}
              onClick={() => setSelected(l)}
            >
              <span className="w-36 shrink-0 text-[var(--text-muted)]">{formatDateTime(l.timestamp)}</span>
              <span className="w-16 shrink-0 uppercase">{priLabels[l.priority]}</span>
              <span className="w-40 shrink-0 truncate text-[var(--text-muted)]">{l.identifier}</span>
              <span className="min-w-0 flex-1 truncate">{l.message}</span>
            </button>
          ))}
        </div>
      </Card>
      <Modal open={!!selected} title="Log entry" onClose={() => setSelected(null)}>
        {selected && (
          <dl className="space-y-2 font-mono text-xs">
            {Object.entries(selected.fields ?? { MESSAGE: selected.message, PRIORITY: String(selected.priority) }).map(([k, v]) => (
              <div key={k}>
                <dt className="text-[var(--text-muted)]">{k}</dt>
                <dd className="break-all">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  )
}

function priClass(p: LogPriority) {
  if (p <= 2) return 'bg-red-500/10 text-red-200'
  if (p === 3) return 'text-red-300'
  if (p === 4) return 'text-amber-200'
  return ''
}
