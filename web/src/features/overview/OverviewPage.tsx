import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Cpu, HardDrive, MemoryStick, Network, Power, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Badge, StatusDot } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card, CardHeader } from '../../components/Card'
import { Field, Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { DualSparkline, Sparkline } from '../../components/Sparkline'
import { UsageBar } from '../../components/UsageBar'
import { api } from '../../lib/api'
import { formatBps, formatBytes, formatDateTime, formatPercent, formatUptime } from '../../lib/format'
import { useAuth } from '../../stores/auth'
import { useUi } from '../../stores/ui'

export function OverviewPage() {
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const user = useAuth((s) => s.user)
  const q = useQuery({ queryKey: ['overview'], queryFn: api.overview, refetchInterval: 4000 })
  const data = q.data
  const [hostOpen, setHostOpen] = useState(false)
  const [timeOpen, setTimeOpen] = useState(false)
  const [powerOpen, setPowerOpen] = useState<'restart' | 'shutdown' | null>(null)
  const [hostname, setHostname] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [ntp, setNtp] = useState(true)
  const [ntpServer, setNtpServer] = useState('')
  const [delay, setDelay] = useState('0')

  const setHost = useMutation({
    mutationFn: () => api.setHostname(hostname),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Hostname updated' })
      setHostOpen(false)
      void qc.invalidateQueries({ queryKey: ['overview'] })
    },
  })
  const setTime = useMutation({
    mutationFn: () => api.setTimeConfig({ timezone, ntpEnabled: ntp, ntpServer }),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Time configuration saved' })
      setTimeOpen(false)
      void qc.invalidateQueries({ queryKey: ['overview'] })
    },
  })
  const power = useMutation({
    mutationFn: () => api.power(powerOpen!, Number(delay) || 0),
    onSuccess: (_, __, ctx) => {
      toast({ kind: 'warning', title: `${powerOpen === 'restart' ? 'Restart' : 'Shutdown'} scheduled` })
      setPowerOpen(null)
      void ctx
    },
  })
  const profile = useMutation({
    mutationFn: (p: string) => api.setProfile(p),
    onSuccess: () => toast({ kind: 'success', title: 'Performance profile updated' }),
  })

  if (!data) {
    return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="h-36 animate-pulse bg-[var(--muted)]" />)}</div>
  }

  const memPct = (data.memory.used / data.info.totalRamBytes) * 100
  const healthTone = data.health.overall

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--text-muted)]">System</p>
          <h2 className="text-xl font-semibold">{data.info.hostname}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              setHostname(data.info.hostname)
              setHostOpen(true)
            }}
          >
            Set hostname
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setTimezone(data.info.timezone)
              setNtp(data.info.ntpEnabled)
              setNtpServer(data.info.ntpServer)
              setTimeOpen(true)
            }}
          >
            Time & NTP
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPowerOpen('restart')}>
            <RotateCcw className="size-4" /> Restart
          </Button>
          <Button size="sm" variant="danger" onClick={() => setPowerOpen('shutdown')}>
            <Power className="size-4" /> Shutdown
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <HealthTile label="Failed services" value={data.health.failedServices} tone={data.health.failedServices ? 'crit' : 'ok'} />
        <HealthTile label="Pending updates" value={data.health.pendingUpdates} tone={data.health.pendingUpdates > 5 ? 'warn' : 'ok'} />
        <HealthTile label="Disk warnings" value={data.health.diskWarnings} tone={data.health.diskWarnings ? 'warn' : 'ok'} />
        <Card className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Overall health</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold capitalize">
              <StatusDot tone={healthTone} /> {healthTone === 'ok' ? 'Healthy' : healthTone === 'warn' ? 'Attention' : 'Critical'}
            </p>
          </div>
          <Badge tone={healthTone}>{healthTone.toUpperCase()}</Badge>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="CPU" description={`${data.info.cpuModel} · ${data.info.cores}c / ${data.info.threads}t`} />
          <div className="space-y-3 p-4">
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2 text-2xl font-semibold tabular">
                <Cpu className="size-5 text-emerald-400" /> {formatPercent(data.cpu.overall, 0)}
              </div>
              <span className="text-xs text-[var(--text-muted)]">last ~3 min</span>
            </div>
            <Sparkline data={data.cpu.history} formatter={(v) => formatPercent(v, 0)} />
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {data.cpu.perCore.map((c, i) => (
                <div key={i} className="space-y-1">
                  <UsageBar percent={c} />
                  <p className="text-center text-[10px] text-[var(--text-muted)] tabular">{Math.round(c)}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Memory" description={`${formatBytes(data.info.totalRamBytes)} total`} />
          <div className="space-y-3 p-4">
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2 text-2xl font-semibold tabular">
                <MemoryStick className="size-5 text-sky-400" /> {formatPercent(memPct, 0)}
              </div>
              <span className="text-xs text-[var(--text-muted)]">{formatBytes(data.memory.used)} used</span>
            </div>
            <Sparkline data={data.memory.history} color="#38bdf8" formatter={(v) => formatPercent(v, 0)} />
            <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <KV k="Available" v={formatBytes(data.memory.available)} />
              <KV k="Buffers" v={formatBytes(data.memory.buffers)} />
              <KV k="Cache" v={formatBytes(data.memory.cache)} />
              <KV k="Swap" v={`${formatBytes(data.memory.swapUsed)} / ${formatBytes(data.memory.swapTotal)}`} />
            </dl>
          </div>
        </Card>
        <Card>
          <CardHeader title="Disk I/O" description="Aggregated throughput" />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><HardDrive className="size-4 text-violet-400" /> Read {formatBps(data.diskIo.readBps)}</span>
              <span>Write {formatBps(data.diskIo.writeBps)}</span>
            </div>
            <DualSparkline data={data.diskIo.history} aLabel="Read" bLabel="Write" formatter={formatBps} />
            <div className="grid gap-2 text-xs">
              {data.diskIo.perDevice.map((d) => (
                <div key={d.name} className="flex justify-between text-[var(--text-muted)]">
                  <span className="font-mono">{d.name}</span>
                  <span className="tabular">{formatBps(d.readBps)} / {formatBps(d.writeBps)} · {d.readIops + d.writeIops} IOPS</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Network" description="RX / TX" />
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><Network className="size-4 text-sky-400" /> RX {formatBps(data.network.rxBps)}</span>
              <span>TX {formatBps(data.network.txBps)}</span>
            </div>
            <DualSparkline data={data.network.history} aLabel="RX" bLabel="TX" formatter={formatBps} />
            <div className="grid gap-2 text-xs">
              {data.network.perInterface.map((n) => (
                <div key={n.name} className="flex justify-between text-[var(--text-muted)]">
                  <span className="font-mono">{n.name}</span>
                  <span className="tabular">{formatBps(n.rxBps)} / {formatBps(n.txBps)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="System information"
          actions={
            <Select
              className="w-56"
              value={data.info.performanceProfile}
              onChange={(e) => profile.mutate(e.target.value)}
              aria-label="Performance profile"
            >
              <option value="balanced">balanced</option>
              <option value="throughput-performance">throughput-performance</option>
              <option value="latency-performance">latency-performance</option>
              <option value="powersave">powersave</option>
            </Select>
          }
        />
        <dl className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <KV k="OS" v={data.info.os} />
          <KV k="Kernel" v={data.info.kernel} />
          <KV k="Architecture" v={data.info.arch} />
          <KV k="Uptime" v={formatUptime(data.info.uptimeSeconds)} />
          <KV k="CPU" v={data.info.cpuModel} />
          <KV k="Memory" v={formatBytes(data.info.totalRamBytes)} />
          <KV k="Disks / NICs" v={`${data.info.diskCount} / ${data.info.nicCount}`} />
          <KV k="Timezone / NTP" v={`${data.info.timezone} · ${data.info.ntpEnabled ? data.info.ntpServer : 'off'}`} />
          <KV k="Last login" v={user ? `${formatDateTime(user.lastLogin)} from ${user.lastLoginFrom}` : '—'} />
          <KV k="This session" v={user ? formatDateTime(user.sessionStarted) : '—'} />
        </dl>
      </Card>

      <Modal
        open={hostOpen}
        title="Set hostname"
        onClose={() => setHostOpen(false)}
        footer={
          <>
            <Button onClick={() => setHostOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={setHost.isPending} onClick={() => setHost.mutate()}>Apply</Button>
          </>
        }
      >
        <Field label="Hostname" hint="Letters, digits, and hyphens. Requires confirmation.">
          <Input value={hostname} onChange={(e) => setHostname(e.target.value)} />
        </Field>
      </Modal>

      <Modal
        open={timeOpen}
        title="Time, timezone, NTP"
        onClose={() => setTimeOpen(false)}
        footer={
          <>
            <Button onClick={() => setTimeOpen(false)}>Cancel</Button>
            <Button variant="primary" loading={setTime.isPending} onClick={() => setTime.mutate()}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Timezone">
            <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney'].map((z) => (
                <option key={z}>{z}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ntp} onChange={(e) => setNtp(e.target.checked)} />
            Enable NTP
          </label>
          <Field label="NTP server">
            <Input value={ntpServer} onChange={(e) => setNtpServer(e.target.value)} disabled={!ntp} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!powerOpen}
        title={powerOpen === 'restart' ? 'Restart this server?' : 'Shut down this server?'}
        danger
        onClose={() => setPowerOpen(null)}
        footer={
          <>
            <Button onClick={() => setPowerOpen(null)}>Cancel</Button>
            <Button variant="danger" loading={power.isPending} onClick={() => power.mutate()}>
              Confirm
            </Button>
          </>
        }
      >
        <Field label="Delay (seconds)" hint="0 means immediately.">
          <Input type="number" min={0} value={delay} onChange={(e) => setDelay(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}

function HealthTile({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'crit' }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-2xl font-semibold tabular">
        <StatusDot tone={tone} /> {value}
      </p>
    </Card>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">{k}</dt>
      <dd className="mt-0.5 break-all">{v}</dd>
    </div>
  )
}
