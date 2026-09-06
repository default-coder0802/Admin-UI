import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, StatusDot } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardHeader } from '../../components/Card'
import { Field, Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { DualSparkline } from '../../components/Sparkline'
import { api } from '../../lib/api'
import { formatBps } from '../../lib/format'
import type { Nic } from '../../lib/types'
import { useUi } from '../../stores/ui'

export function NetworkingPage() {
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const q = useQuery({ queryKey: ['network'], queryFn: api.network, refetchInterval: 4000 })
  const overview = useQuery({ queryKey: ['overview'], queryFn: api.overview, refetchInterval: 4000 })
  const [edit, setEdit] = useState<Nic | null>(null)
  const [zone, setZone] = useState('public')
  const [port, setPort] = useState('')
  const data = q.data

  const save = useMutation({
    mutationFn: () => api.saveNic(edit!.name, edit!),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Interface updated' })
      setEdit(null)
      void qc.invalidateQueries({ queryKey: ['network'] })
    },
  })
  const fw = useMutation({
    mutationFn: (enabled: boolean) => api.toggleFirewall(enabled),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['network'] }),
  })
  const addPort = useMutation({
    mutationFn: () => api.addFirewallPort(zone, port),
    onSuccess: () => {
      setPort('')
      void qc.invalidateQueries({ queryKey: ['network'] })
    },
  })

  if (!data) return <Card className="h-64 animate-pulse bg-[var(--muted)]" />
  const currentZone = data.firewall.zones.find((z) => z.name === zone) ?? data.firewall.zones[0]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Throughput" description="Aggregate RX / TX" />
        <div className="p-4">
          <DualSparkline data={overview.data?.network.history ?? []} aLabel="RX" bLabel="TX" formatter={formatBps} />
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.interfaces.map((nic) => (
          <Card key={nic.name} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-2 font-mono text-sm font-semibold">
                  <StatusDot tone={!nic.up ? 'muted' : nic.errors ? 'warn' : 'ok'} />
                  {nic.name}
                </p>
                <p className="text-xs capitalize text-[var(--text-muted)]">{nic.type} · MTU {nic.mtu}</p>
              </div>
              <Badge tone={nic.up ? 'ok' : 'muted'}>{nic.up ? 'up' : 'down'}</Badge>
            </div>
            <dl className="mt-3 space-y-1 text-xs">
              <p>MAC {nic.mac}</p>
              <p>{nic.ipv4.join(', ') || 'no IPv4'}</p>
              <p className="text-[var(--text-muted)]">{nic.ipv6.join(', ') || 'no IPv6'}</p>
              <p>{nic.method.toUpperCase()} {nic.gateway ? `via ${nic.gateway}` : ''}</p>
              <p className="tabular">RX {formatBps(nic.rxBps)} · TX {formatBps(nic.txBps)}</p>
              {(nic.errors > 0 || nic.drops > 0 || !nic.carrier) && (
                <p className="text-amber-300">errors {nic.errors} · drops {nic.drops} · carrier {nic.carrier ? 'ok' : 'lost'}</p>
              )}
            </dl>
            {nic.type !== 'loopback' && (
              <Button className="mt-3" size="sm" onClick={() => setEdit({ ...nic })}>
                Configure
              </Button>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Firewall"
            actions={
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={data.firewall.enabled}
                  onChange={(e) => fw.mutate(e.target.checked)}
                />
                Enabled
              </label>
            }
          />
          <div className="space-y-3 p-4">
            <Field label="Zone">
              <Select value={currentZone.name} onChange={(e) => setZone(e.target.value)}>
                {data.firewall.zones.map((z) => (
                  <option key={z.name}>{z.name}</option>
                ))}
              </Select>
            </Field>
            <p className="text-xs text-[var(--text-muted)]">Target {currentZone.target} · ifaces {currentZone.interfaces.join(', ') || '—'}</p>
            <div className="flex flex-wrap gap-1">
              {currentZone.services.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
              {currentZone.ports.map((p) => (
                <Badge key={p} tone="info">{p}</Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input placeholder="443/tcp" value={port} onChange={(e) => setPort(e.target.value)} />
              <Button size="sm" variant="primary" disabled={!port} loading={addPort.isPending} onClick={() => addPort.mutate()}>
                Add port
              </Button>
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Routing table" />
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2">Destination</th>
                <th className="px-4 py-2">Gateway</th>
                <th className="px-4 py-2">Iface</th>
                <th className="px-4 py-2">Metric</th>
              </tr>
            </thead>
            <tbody>
              {data.routes.map((r) => (
                <tr key={`${r.destination}-${r.iface}`} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 font-mono">{r.destination}</td>
                  <td className="px-4 py-2 font-mono">{r.gateway}</td>
                  <td className="px-4 py-2 font-mono">{r.iface}</td>
                  <td className="px-4 py-2 tabular">{r.metric}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal
        open={!!edit}
        title={`Configure ${edit?.name ?? ''}`}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button onClick={() => setEdit(null)}>Cancel</Button>
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>
              Apply
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-3">
            <Field label="Method">
              <Select value={edit.method} onChange={(e) => setEdit({ ...edit, method: e.target.value as Nic['method'] })}>
                <option value="dhcp">DHCP</option>
                <option value="static">Static</option>
                <option value="disabled">Disabled</option>
              </Select>
            </Field>
            <Field label="IPv4 address">
              <Input
                value={edit.ipv4[0] ?? ''}
                onChange={(e) => setEdit({ ...edit, ipv4: e.target.value ? [e.target.value] : [] })}
                disabled={edit.method !== 'static'}
              />
            </Field>
            <Field label="Gateway">
              <Input value={edit.gateway ?? ''} onChange={(e) => setEdit({ ...edit, gateway: e.target.value })} disabled={edit.method !== 'static'} />
            </Field>
            <Field label="DNS servers" hint="Comma-separated">
              <Input value={edit.dns.join(', ')} onChange={(e) => setEdit({ ...edit, dns: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
