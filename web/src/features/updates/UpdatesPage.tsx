import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardHeader } from '../../components/Card'
import { formatBytes, formatDateTime } from '../../lib/format'
import { api } from '../../lib/api'
import { useUi } from '../../stores/ui'

export function UpdatesPage() {
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const q = useQuery({ queryKey: ['updates'], queryFn: api.updates })
  const hist = useQuery({ queryKey: ['update-history'], queryFn: api.history })
  const [local, setLocal] = useState<Record<string, boolean>>({})
  const [job, setJob] = useState<{ running: boolean; progress: number; log: string[] } | null>(null)

  const items = q.data?.items ?? []
  const selected = useMemo(
    () => items.filter((i) => (local[i.name] ?? i.selected)),
    [items, local],
  )

  const apply = useMutation({
    mutationFn: () => api.applyUpdates(selected.map((s) => s.name)),
    onSuccess: async (start) => {
      setJob(start)
      let current = start
      while (current.running) {
        current = await api.pollUpdates()
        setJob({ ...current, log: [...current.log] })
      }
      toast({ kind: 'success', title: 'Updates applied' })
      void qc.invalidateQueries({ queryKey: ['updates'] })
    },
  })
  const auto = useMutation({
    mutationFn: (enabled: boolean) => api.setAutoUpdates(enabled),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['updates'] }),
  })

  return (
    <div className="space-y-4">
      {q.data?.rebootRequired && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          A reboot is required to finish applying kernel updates.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="primary" disabled={!selected.length || job?.running} loading={apply.isPending || !!job?.running} onClick={() => apply.mutate()}>
          Update selected ({selected.length})
        </Button>
        <Button
          disabled={job?.running}
          onClick={() => {
            const next: Record<string, boolean> = {}
            items.forEach((i) => {
              next[i.name] = true
            })
            setLocal(next)
          }}
        >
          Select all
        </Button>
        <label className="ml-auto flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!q.data?.auto}
            onChange={(e) => auto.mutate(e.target.checked)}
            disabled={job?.running}
          />
          Automatic updates
        </label>
      </div>

      <Card>
        <CardHeader title="Available updates" description="PackageKit / apt abstraction" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2" />
                <th className="px-4 py-2">Package</th>
                <th className="px-4 py-2">Current</th>
                <th className="px-4 py-2">New</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.name} className="border-t border-[var(--border)] align-top">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={local[u.name] ?? u.selected}
                      disabled={job?.running}
                      onChange={(e) => setLocal((s) => ({ ...s, [u.name]: e.target.checked }))}
                      aria-label={`Select ${u.name}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-medium">{u.name}</p>
                    {u.changelog && <p className="text-xs text-[var(--text-muted)]">{u.changelog}</p>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{u.current}</td>
                  <td className="px-4 py-2 font-mono text-xs">{u.next}</td>
                  <td className="px-4 py-2 tabular">{formatBytes(u.size)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={u.severity === 'security' ? 'crit' : u.severity === 'bugfix' ? 'warn' : 'muted'}>{u.severity}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {job && (
        <Card>
          <CardHeader title="Update progress" />
          <div className="space-y-3 p-4">
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${job.progress}%` }} />
            </div>
            <pre className="max-h-48 overflow-auto rounded-lg bg-[var(--bg)] p-3 font-mono text-xs">{job.log.join('\n')}</pre>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="History" />
        <ul className="divide-y divide-[var(--border)] text-sm">
          {(hist.data ?? []).map((h) => (
            <li key={h.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p>{h.summary}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatDateTime(h.date)} · {h.count} packages</p>
              </div>
              <Badge tone={h.status === 'success' ? 'ok' : 'crit'}>{h.status}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
