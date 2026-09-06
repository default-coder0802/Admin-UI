import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardHeader } from '../../components/Card'
import { Field, Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { UsageBar } from '../../components/UsageBar'
import { api } from '../../lib/api'
import { formatBytes, usageTone } from '../../lib/format'
import type { BlockDevice } from '../../lib/types'
import { useUi } from '../../stores/ui'

export function StoragePage() {
  const toast = useUi((s) => s.pushToast)
  const q = useQuery({ queryKey: ['storage'], queryFn: api.storage, refetchInterval: 5000 })
  const [selected, setSelected] = useState<string | null>(null)
  const [action, setAction] = useState<{ kind: string; target?: string } | null>(null)
  const [fs, setFs] = useState('ext4')
  const [mount, setMount] = useState('/mnt/data')
  const data = q.data
  const device = data?.devices.find((d) => d.id === selected)

  const tree = useMemo(() => {
    if (!data) return []
    return data.devices.filter((d) => !d.parent)
  }, [data])

  if (!data) return <Card className="h-64 animate-pulse bg-[var(--muted)]" />

  return (
    <div className="space-y-4">
      {data.warnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            {data.warnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card>
          <CardHeader
            title="Block devices"
            description="Disks, partitions, LVM, RAID"
            actions={
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAction({ kind: 'partition' })}>Create partition</Button>
                <Button size="sm" onClick={() => setAction({ kind: 'lvm' })}>New LV</Button>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Usage</th>
                  <th className="px-4 py-2">Mount</th>
                </tr>
              </thead>
              <tbody>
                {tree.map((d) => (
                  <DeviceRows
                    key={d.id}
                    device={d}
                    all={data.devices}
                    depth={0}
                    selected={selected}
                    onSelect={setSelected}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Details" description={device ? device.name : 'Select a device'} />
          <div className="space-y-3 p-4 text-sm">
            {!device && <p className="text-[var(--text-muted)]">Choose a storage object to inspect properties and actions.</p>}
            {device && (
              <>
                <dl className="grid grid-cols-2 gap-2">
                  <Item k="Type" v={device.type} />
                  <Item k="Size" v={formatBytes(device.size)} />
                  <Item k="Model" v={device.model ?? '—'} />
                  <Item k="Serial" v={device.serial ?? '—'} />
                  <Item k="Filesystem" v={device.fstype ?? '—'} />
                  <Item k="Mount" v={device.mountpoint ?? '—'} />
                </dl>
                {device.encrypted && <Badge tone="info">LUKS encrypted</Badge>}
                {device.degraded && <Badge tone="crit">Degraded</Badge>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={() => setAction({ kind: 'format', target: device.id })}>Format</Button>
                  <Button size="sm" onClick={() => setAction({ kind: 'mount', target: device.id })}>Mount / Unmount</Button>
                  <Button size="sm" variant="danger" onClick={() => setAction({ kind: 'destroy', target: device.id })}>
                    Destructive…
                  </Button>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Related logs filter: storage / kernel / udev</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Filesystems" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2">Mount</th>
                <th className="px-4 py-2">Device</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Used</th>
                <th className="px-4 py-2 w-48">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {data.filesystems.map((f) => (
                <tr key={f.mountpoint} className="border-t border-[var(--border)]">
                  <td className="px-4 py-2 font-mono">{f.mountpoint}</td>
                  <td className="px-4 py-2 font-mono text-[var(--text-muted)]">{f.device}</td>
                  <td className="px-4 py-2">{f.type}</td>
                  <td className="px-4 py-2 tabular">{formatBytes(f.used)} / {formatBytes(f.size)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <UsageBar percent={f.percent} />
                      <span className={`text-xs tabular ${usageTone(f.percent) === 'crit' ? 'text-red-400' : ''}`}>{f.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Volume groups" />
          <ul className="divide-y divide-[var(--border)] text-sm">
            {data.vgs.map((vg) => (
              <li key={vg.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{vg.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{vg.pvCount} PV · {vg.lvCount} LV</p>
                </div>
                <p className="text-xs tabular">{formatBytes(vg.free)} free of {formatBytes(vg.size)}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Logical volumes" />
          <ul className="divide-y divide-[var(--border)] text-sm">
            {data.lvs.map((lv) => (
              <li key={`${lv.vg}-${lv.name}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{lv.vg}/{lv.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{lv.mountpoint ?? 'unmounted'}</p>
                </div>
                <p className="text-xs tabular">{formatBytes(lv.size)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Modal
        open={!!action}
        title={actionTitle(action?.kind)}
        danger={action?.kind === 'destroy'}
        onClose={() => setAction(null)}
        footer={
          <>
            <Button onClick={() => setAction(null)}>Cancel</Button>
            <Button
              variant={action?.kind === 'destroy' ? 'danger' : 'primary'}
              onClick={() => {
                toast({ kind: 'success', title: 'Operation queued', message: 'Requires privilege check on the host.' })
                setAction(null)
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        {action?.kind === 'format' && (
          <Field label="Filesystem">
            <Select value={fs} onChange={(e) => setFs(e.target.value)}>
              {['ext4', 'xfs', 'btrfs', 'vfat', 'swap'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </Field>
        )}
        {action?.kind === 'mount' && (
          <Field label="Mount point" hint="Optionally persist in /etc/fstab.">
            <Input value={mount} onChange={(e) => setMount(e.target.value)} />
          </Field>
        )}
        {action?.kind === 'partition' && <p>Create a partition on unallocated space. This will modify the partition table.</p>}
        {action?.kind === 'lvm' && <p>Create a logical volume in vg0 using remaining free extents.</p>}
        {action?.kind === 'destroy' && <p>This action cannot be undone. Confirm you have backups before continuing.</p>}
      </Modal>
    </div>
  )
}

function actionTitle(kind?: string) {
  if (kind === 'format') return 'Format volume'
  if (kind === 'mount') return 'Mount filesystem'
  if (kind === 'partition') return 'Create partition'
  if (kind === 'lvm') return 'Create logical volume'
  if (kind === 'destroy') return 'Confirm destructive action'
  return 'Storage action'
}

function DeviceRows({
  device,
  all,
  depth,
  selected,
  onSelect,
}: {
  device: BlockDevice
  all: BlockDevice[]
  depth: number
  selected: string | null
  onSelect: (id: string) => void
}) {
  const children = all.filter((d) => d.parent === device.id)
  return (
    <>
      <tr
        className={`cursor-pointer border-t border-[var(--border)] hover:bg-[var(--muted)] ${selected === device.id ? 'bg-emerald-500/10' : ''}`}
        onClick={() => onSelect(device.id)}
      >
        <td className="px-4 py-2 font-mono" style={{ paddingLeft: 16 + depth * 16 }}>{device.name}</td>
        <td className="px-4 py-2"><Badge tone={device.type === 'raid' ? 'info' : 'muted'}>{device.type}</Badge></td>
        <td className="px-4 py-2 tabular">{formatBytes(device.size)}</td>
        <td className="px-4 py-2 w-40">{device.usage != null ? <UsageBar percent={device.usage} /> : '—'}</td>
        <td className="px-4 py-2 font-mono text-[var(--text-muted)]">{device.mountpoint ?? '—'}</td>
      </tr>
      {children.map((c) => (
        <DeviceRows key={c.id} device={c} all={all} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  )
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--text-muted)]">{k}</dt>
      <dd className="break-all">{v}</dd>
    </div>
  )
}
