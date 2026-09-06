import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardHeader } from '../../components/Card'
import { Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { api, UNIT_TYPES } from '../../lib/api'
import type { SystemdUnit, UnitType } from '../../lib/types'
import { useUi } from '../../stores/ui'

const actions = ['start', 'stop', 'restart', 'reload', 'enable', 'disable', 'mask', 'unmask'] as const

export function ServicesPage() {
  const [params] = useSearchParams()
  const highlight = params.get('failed')
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const q = useQuery({ queryKey: ['services'], queryFn: api.services, refetchInterval: 8000 })
  const [type, setType] = useState<UnitType | 'all'>('all')
  const [state, setState] = useState<'all' | 'active' | 'inactive' | 'failed'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(highlight ? 'redis-server.service' : null)
  const [confirm, setConfirm] = useState<{ id: string; action: string } | null>(null)

  const detail = useQuery({
    queryKey: ['service', selected],
    queryFn: () => api.service(selected!),
    enabled: !!selected,
  })

  const rows = useMemo(() => {
    let list = q.data ?? []
    if (type !== 'all') list = list.filter((u) => u.type === type)
    if (state !== 'all') list = list.filter((u) => u.activeState === state)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((u) => u.name.includes(s) || u.description.toLowerCase().includes(s))
    }
    return list
  }, [q.data, type, state, search])

  const failed = (q.data ?? []).filter((u) => u.activeState === 'failed')

  const act = useMutation({
    mutationFn: () => api.serviceAction(confirm!.id, confirm!.action),
    onSuccess: () => {
      toast({ kind: 'success', title: `Unit ${confirm?.action}` })
      setConfirm(null)
      void qc.invalidateQueries({ queryKey: ['services'] })
      void qc.invalidateQueries({ queryKey: ['service', selected] })
    },
  })

  return (
    <div className="space-y-4">
      {failed.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {failed.length} failed unit{failed.length > 1 ? 's' : ''}: {failed.map((u) => u.name).join(', ')}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search units" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-36" value={type} onChange={(e) => setType(e.target.value as UnitType | 'all')}>
          <option value="all">All types</option>
          {UNIT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Select className="w-36" value={state} onChange={(e) => setState(e.target.value as typeof state)}>
          <option value="all">All states</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="failed">failed</option>
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Load</th>
                  <th className="px-4 py-2">Active</th>
                  <th className="px-4 py-2">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className={`cursor-pointer border-t border-[var(--border)] hover:bg-[var(--muted)] ${selected === u.id ? 'bg-emerald-500/10' : ''}`}
                    onClick={() => setSelected(u.id)}
                  >
                    <td className="px-4 py-2">
                      <p className="font-mono text-xs">{u.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{u.description}</p>
                    </td>
                    <td className="px-4 py-2 text-xs">{u.loadState}</td>
                    <td className="px-4 py-2"><StateBadge unit={u} /></td>
                    <td className="px-4 py-2 text-xs">{u.masked ? 'masked' : u.enabled ? 'enabled' : 'disabled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title={detail.data?.name ?? 'Unit details'} description={detail.data?.description} />
          <div className="space-y-3 p-4 text-sm">
            {!selected && <p className="text-[var(--text-muted)]">Select a unit.</p>}
            {detail.data && (
              <>
                <div className="flex flex-wrap gap-1">
                  {actions.map((a) => (
                    <Button key={a} size="sm" onClick={() => setConfirm({ id: detail.data.id, action: a })}>
                      {a}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {detail.data.fragmentPath} {detail.data.overridden ? '(overridden)' : ''}
                </p>
                <p className="text-xs">Requires: {detail.data.requires.join(', ') || '—'}</p>
                <p className="text-xs">Wants: {detail.data.wants.join(', ') || '—'}</p>
                <Link className="text-xs text-emerald-400 underline" to={`/logs?unit=${encodeURIComponent(detail.data.name)}`}>
                  Open related logs
                </Link>
                <pre className="max-h-64 overflow-auto rounded-lg bg-[var(--bg)] p-3 font-mono text-[11px]">{detail.data.unitFile}</pre>
              </>
            )}
          </div>
        </Card>
      </div>

      <Modal
        open={!!confirm}
        title={`${confirm?.action} ${confirm?.id}?`}
        danger={confirm?.action === 'mask' || confirm?.action === 'stop'}
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant={confirm?.action === 'mask' ? 'danger' : 'primary'} loading={act.isPending} onClick={() => act.mutate()}>
              Confirm
            </Button>
          </>
        }
      >
        <p>This operation is audited. Masking or disabling critical services can lock you out.</p>
      </Modal>
    </div>
  )
}

function StateBadge({ unit }: { unit: SystemdUnit }) {
  const tone = unit.activeState === 'failed' ? 'crit' : unit.activeState === 'active' ? 'ok' : 'muted'
  return <Badge tone={tone}>{unit.activeState} / {unit.subState}</Badge>
}
