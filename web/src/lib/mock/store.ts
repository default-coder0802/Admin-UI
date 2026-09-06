import {
  accounts as seedAccounts,
  devices as seedDevices,
  fileContents as seedFileContents,
  filesystems as seedFilesystems,
  firewall as seedFirewall,
  generateLogs,
  groups as seedGroups,
  listDir,
  lvs as seedLvs,
  nics as seedNics,
  normalizePath,
  packageUpdates as seedUpdates,
  routes as seedRoutes,
  systemInfo as seedInfo,
  unitFiles,
  units as seedUnits,
  updateHistory,
  vgs as seedVgs,
} from './seed'
import type {
  Account,
  DualMetricPoint,
  FileEntry,
  Group,
  HealthSummary,
  LogEntry,
  MetricPoint,
  Nic,
  OverviewSnapshot,
  PackageUpdate,
  SystemdUnit,
  UnitDetail,
} from '../types'

const HISTORY = 48

function series(base: number, amp: number, t0: number): MetricPoint[] {
  const pts: MetricPoint[] = []
  for (let i = HISTORY - 1; i >= 0; i -= 1) {
    const noise = Math.sin(i / 3.4) * amp * 0.4 + ((i * 17) % 7) - 3
    pts.push({ t: t0 - i * 4000, v: clamp(base + noise, 1, 99) })
  }
  return pts
}

function dual(baseA: number, baseB: number, t0: number): DualMetricPoint[] {
  const pts: DualMetricPoint[] = []
  for (let i = HISTORY - 1; i >= 0; i -= 1) {
    pts.push({
      t: t0 - i * 4000,
      a: Math.max(0, baseA + Math.sin(i / 2.2) * baseA * 0.35),
      b: Math.max(0, baseB + Math.cos(i / 2.8) * baseB * 0.4),
    })
  }
  return pts
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

class MockBackend {
  info = { ...seedInfo }
  accounts: Account[] = seedAccounts.map((a) => ({ ...a, groups: [...a.groups] }))
  groups: Group[] = seedGroups.map((g) => ({ ...g, members: [...g.members] }))
  units: SystemdUnit[] = seedUnits.map((u) => ({ ...u }))
  logs: LogEntry[] = generateLogs(280)
  nics: Nic[] = seedNics.map((n) => ({ ...n, ipv4: [...n.ipv4], ipv6: [...n.ipv6], dns: [...n.dns], search: [...n.search] }))
  firewall = structuredClone(seedFirewall)
  routes = seedRoutes.map((r) => ({ ...r }))
  devices = seedDevices.map((d) => ({ ...d }))
  filesystems = seedFilesystems.map((f) => ({ ...f }))
  vgs = seedVgs.map((v) => ({ ...v }))
  lvs = seedLvs.map((l) => ({ ...l }))
  updates: PackageUpdate[] = seedUpdates.map((u) => ({ ...u }))
  history = updateHistory.map((h) => ({ ...h }))
  files: Record<string, string> = { ...seedFileContents }
  extraFiles: Record<string, FileEntry[]> = {}
  session = {
    username: 'admin',
    fullName: 'Alex Rivera',
    uid: 1000,
    groups: ['admin', 'sudo', 'adm'],
    isAdmin: true,
    lastLogin: '2026-09-06T08:12:11Z',
    lastLoginFrom: '10.8.12.90',
    sessionStarted: new Date().toISOString(),
  }
  autoUpdates = true
  rebootRequired = true
  updateJob: { running: boolean; progress: number; log: string[] } = {
    running: false,
    progress: 0,
    log: [],
  }
  clipboard: { mode: 'copy' | 'cut'; paths: string[] } | null = null
  cpuBase = 27
  memUsed = 61.4 * 1024 ** 3

  tickOverview(): OverviewSnapshot {
    const now = Date.now()
    this.cpuBase = clamp(this.cpuBase + (Math.random() - 0.48) * 4, 8, 82)
    const perCore = Array.from({ length: 8 }, (_, i) =>
      clamp(this.cpuBase + Math.sin(now / 4000 + i) * 12 + (i % 3) * 4, 2, 96),
    )
    const memPct = (this.memUsed / this.info.totalRamBytes) * 100
    const health: HealthSummary = {
      failedServices: this.units.filter((u) => u.activeState === 'failed').length,
      pendingUpdates: this.updates.length,
      diskWarnings: this.filesystems.filter((f) => f.percent >= 85).length,
      overall: 'ok',
    }
    if (health.failedServices > 0 || health.diskWarnings > 0) health.overall = 'warn'
    if (health.failedServices > 2 || health.diskWarnings > 1) health.overall = 'crit'

    this.info.uptimeSeconds += 4
    const rx = this.nics.filter((n) => n.name !== 'lo').reduce((s, n) => s + n.rxBps, 0)
    const tx = this.nics.filter((n) => n.name !== 'lo').reduce((s, n) => s + n.txBps, 0)

    return {
      info: { ...this.info },
      health,
      cpu: {
        overall: this.cpuBase,
        perCore,
        history: series(this.cpuBase, 14, now),
      },
      memory: {
        used: this.memUsed,
        available: this.info.totalRamBytes - this.memUsed,
        buffers: 4.2 * 1024 ** 3,
        cache: 18.6 * 1024 ** 3,
        swapUsed: 1.1 * 1024 ** 3,
        swapTotal: 8 * 1024 ** 3,
        history: series(memPct, 6, now),
      },
      diskIo: {
        readBps: 18_400_000,
        writeBps: 6_200_000,
        readIops: 420,
        writeIops: 188,
        perDevice: [
          { name: 'sda', readBps: 4_200_000, writeBps: 1_800_000, readIops: 140, writeIops: 70 },
          { name: 'md0', readBps: 14_200_000, writeBps: 4_400_000, readIops: 280, writeIops: 118 },
        ],
        history: dual(18_400_000, 6_200_000, now),
      },
      network: {
        rxBps: rx,
        txBps: tx,
        perInterface: this.nics
          .filter((n) => n.name !== 'lo')
          .map((n) => ({ name: n.name, rxBps: n.rxBps, txBps: n.txBps })),
        history: dual(rx, tx, now),
      },
    }
  }

  storageSnapshot() {
    return {
      devices: this.devices,
      filesystems: this.filesystems,
      vgs: this.vgs,
      lvs: this.lvs,
      warnings: this.filesystems
        .filter((f) => f.percent >= 85)
        .map((f) => `${f.mountpoint} is ${f.percent}% full`),
    }
  }

  networkSnapshot() {
    return {
      interfaces: this.nics,
      firewall: this.firewall,
      routes: this.routes,
    }
  }

  unitDetail(id: string): UnitDetail | undefined {
    const unit = this.units.find((u) => u.id === id)
    if (!unit) return undefined
    return {
      ...unit,
      fragmentPath: `/lib/systemd/system/${unit.name}`,
      overridden: unit.name === 'nginx.service',
      requires: unit.type === 'service' ? ['network.target'] : [],
      wants: unit.enabled ? ['multi-user.target'] : [],
      conflicts: [],
      recentLogs: this.logs.filter((l) => l.unit === unit.name).slice(0, 12),
      unitFile: unitFiles[unit.name] ?? `# unit file for ${unit.name}\n`,
    }
  }

  actUnit(id: string, action: string) {
    const unit = this.units.find((u) => u.id === id)
    if (!unit) throw new Error('Unit not found')
    if (action === 'start') {
      unit.activeState = 'active'
      unit.subState = 'running'
    } else if (action === 'stop') {
      unit.activeState = 'inactive'
      unit.subState = 'dead'
    } else if (action === 'restart') {
      unit.activeState = 'active'
      unit.subState = 'running'
    } else if (action === 'reload') {
      unit.subState = unit.activeState === 'active' ? 'running' : unit.subState
    } else if (action === 'enable') {
      unit.enabled = true
    } else if (action === 'disable') {
      unit.enabled = false
    } else if (action === 'mask') {
      unit.masked = true
      unit.activeState = 'inactive'
      unit.enabled = false
    } else if (action === 'unmask') {
      unit.masked = false
    }
    return unit
  }

  listFiles(path: string, showHidden: boolean): FileEntry[] {
    const p = normalizePath(path)
    const extras = this.extraFiles[p] ?? []
    const base = listDir(p, true)
    const merged = [...base]
    for (const e of extras) {
      if (!merged.some((x) => x.name === e.name)) merged.push(e)
    }
    return showHidden ? merged : merged.filter((e) => !e.hidden)
  }

  readFile(path: string) {
    const p = normalizePath(path)
    return this.files[p] ?? `# contents of ${p}\n(no preview available in this session)\n`
  }

  writeFile(path: string, content: string) {
    this.files[normalizePath(path)] = content
  }

  mkdir(path: string, name: string) {
    const parent = normalizePath(path)
    const full = normalizePath(`${parent}/${name}`)
    const entry: FileEntry = {
      name,
      path: full,
      type: 'dir',
      size: 4096,
      modified: Date.now(),
      mode: 'drwxr-xr-x',
      owner: 'admin',
      group: 'admin',
      hidden: name.startsWith('.'),
    }
    this.extraFiles[parent] = [...(this.extraFiles[parent] ?? []), entry]
    this.extraFiles[full] = this.extraFiles[full] ?? []
    return entry
  }

  mkfile(path: string, name: string) {
    const parent = normalizePath(path)
    const full = normalizePath(`${parent}/${name}`)
    const entry: FileEntry = {
      name,
      path: full,
      type: 'file',
      size: 0,
      modified: Date.now(),
      mode: '-rw-r--r--',
      owner: 'admin',
      group: 'admin',
      mime: 'text/plain',
      hidden: name.startsWith('.'),
    }
    this.extraFiles[parent] = [...(this.extraFiles[parent] ?? []), entry]
    this.files[full] = ''
    return entry
  }

  renameFile(path: string, nextName: string) {
    const p = normalizePath(path)
    const parent = p === '/' ? '/' : p.slice(0, p.lastIndexOf('/')) || '/'
    const extras = this.extraFiles[parent] ?? []
    const found = extras.find((e) => e.path === p)
    if (found) {
      found.name = nextName
      found.path = normalizePath(`${parent}/${nextName}`)
    }
    if (this.files[p] !== undefined) {
      this.files[normalizePath(`${parent}/${nextName}`)] = this.files[p]
    }
  }

  deleteFiles(paths: string[]) {
    for (const path of paths) {
      const p = normalizePath(path)
      const parent = p === '/' ? '/' : p.slice(0, p.lastIndexOf('/')) || '/'
      this.extraFiles[parent] = (this.extraFiles[parent] ?? []).filter((e) => e.path !== p)
    }
  }

  chmod(paths: string[], mode: string) {
    for (const path of paths) {
      const p = normalizePath(path)
      const parent = p === '/' ? '/' : p.slice(0, p.lastIndexOf('/')) || '/'
      const extras = this.extraFiles[parent] ?? []
      const found = extras.find((e) => e.path === p)
      if (found) found.mode = mode
    }
  }

  followLog(lastCursor?: string): LogEntry[] {
    if (!lastCursor) return this.logs.slice(0, 40)
    const idx = this.logs.findIndex((l) => l.cursor === lastCursor)
    if (idx <= 0) {
      const newest: LogEntry = {
        cursor: `s=${Date.now().toString(16)}`,
        timestamp: Date.now(),
        priority: 6,
        unit: 'sshd.service',
        identifier: 'sshd',
        message: `Accepted publickey for admin from 10.8.12.${40 + (Date.now() % 50)} port ${50000 + (Date.now() % 999)} ssh2`,
        pid: 1400 + (Date.now() % 200),
        hostname: 'srv-prod-01',
      }
      this.logs.unshift(newest)
      return [newest]
    }
    return this.logs.slice(0, idx)
  }

  applyUpdates(names: string[]) {
    this.updateJob = { running: true, progress: 8, log: ['Reading package lists...', `Selected ${names.length} packages`] }
    return this.updateJob
  }

  pollUpdates() {
    if (!this.updateJob.running) return this.updateJob
    this.updateJob.progress = Math.min(100, this.updateJob.progress + 18)
    const steps = [
      'Preparing packages...',
      'Unpacking linux-image-amd64...',
      'Setting up openssl (3.0.15-1)...',
      'Processing triggers for man-db...',
      'Done.',
    ]
    const i = Math.min(steps.length - 1, Math.floor(this.updateJob.progress / 22))
    if (!this.updateJob.log.includes(steps[i])) this.updateJob.log.push(steps[i])
    if (this.updateJob.progress >= 100) {
      this.updateJob.running = false
      this.updates = this.updates.filter((u) => !u.selected)
      this.rebootRequired = true
    }
    return this.updateJob
  }
}

export const mock = new MockBackend()
