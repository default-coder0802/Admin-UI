import { mock } from './mock/store'
import type {
  Account,
  FileEntry,
  Group,
  LogEntry,
  LogPriority,
  Nic,
  OverviewSnapshot,
  PackageUpdate,
  StorageSnapshot,
  SystemdUnit,
  UnitDetail,
  UnitType,
  UserSession,
} from './types'

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms))

export const api = {
  async login(username: string, password: string): Promise<UserSession> {
    await delay(420)
    if (!username || !password) throw new Error('Username and password are required')
    if (password.length < 3) throw new Error('Invalid credentials')
    mock.session.username = username
    mock.session.fullName = username === 'admin' ? 'Alex Rivera' : username
    return mock.session
  },

  async session(): Promise<UserSession> {
    await delay(80)
    return mock.session
  },

  async logout() {
    await delay(80)
  },

  async overview(): Promise<OverviewSnapshot> {
    await delay(90)
    return mock.tickOverview()
  },

  async setHostname(hostname: string) {
    await delay(200)
    mock.info.hostname = hostname
  },

  async setTimeConfig(payload: { timezone: string; ntpEnabled: boolean; ntpServer: string }) {
    await delay(200)
    mock.info.timezone = payload.timezone
    mock.info.ntpEnabled = payload.ntpEnabled
    mock.info.ntpServer = payload.ntpServer
  },

  async setProfile(profile: string) {
    await delay(200)
    mock.info.performanceProfile = profile
  },

  async power(action: 'restart' | 'shutdown', delaySec: number) {
    await delay(200)
    return { action, delaySec, scheduled: true }
  },

  async storage(): Promise<StorageSnapshot> {
    await delay(120)
    return mock.storageSnapshot()
  },

  async network() {
    await delay(120)
    return mock.networkSnapshot()
  },

  async saveNic(name: string, patch: Partial<Nic>) {
    await delay(220)
    const nic = mock.nics.find((n) => n.name === name)
    if (!nic) throw new Error('Interface not found')
    Object.assign(nic, patch)
    return nic
  },

  async toggleFirewall(enabled: boolean) {
    await delay(160)
    mock.firewall.enabled = enabled
    return mock.firewall
  },

  async addFirewallPort(zone: string, port: string) {
    await delay(160)
    const z = mock.firewall.zones.find((x) => x.name === zone)
    if (!z) throw new Error('Zone not found')
    if (!z.ports.includes(port)) z.ports.push(port)
    return mock.firewall
  },

  async removeFirewallPort(zone: string, port: string) {
    await delay(160)
    const z = mock.firewall.zones.find((x) => x.name === zone)
    if (!z) throw new Error('Zone not found')
    z.ports = z.ports.filter((p) => p !== port)
    return mock.firewall
  },

  async accounts(): Promise<{ users: Account[]; groups: Group[] }> {
    await delay(120)
    return { users: mock.accounts, groups: mock.groups }
  },

  async saveAccount(user: Partial<Account> & { username: string; password?: string }) {
    await delay(240)
    const existing = mock.accounts.find((a) => a.username === user.username)
    if (existing) {
      Object.assign(existing, user)
      return existing
    }
    const created: Account = {
      username: user.username,
      uid: 1100 + mock.accounts.length,
      gid: 1100 + mock.accounts.length,
      fullName: user.fullName ?? '',
      home: user.home ?? `/home/${user.username}`,
      shell: user.shell ?? '/bin/bash',
      groups: user.groups ?? [user.username],
      locked: false,
      expired: false,
      sshKeys: 0,
      system: false,
    }
    mock.accounts.push(created)
    return created
  },

  async deleteAccount(username: string) {
    await delay(200)
    mock.accounts = mock.accounts.filter((a) => a.username !== username)
  },

  async saveGroup(group: Partial<Group> & { name: string }) {
    await delay(200)
    const existing = mock.groups.find((g) => g.name === group.name)
    if (existing) {
      Object.assign(existing, group)
      return existing
    }
    const created: Group = {
      name: group.name,
      gid: 2000 + mock.groups.length,
      members: group.members ?? [],
      system: false,
    }
    mock.groups.push(created)
    return created
  },

  async deleteGroup(name: string) {
    await delay(180)
    mock.groups = mock.groups.filter((g) => g.name !== name)
  },

  async services(): Promise<SystemdUnit[]> {
    await delay(100)
    return mock.units
  },

  async service(id: string): Promise<UnitDetail> {
    await delay(120)
    const d = mock.unitDetail(id)
    if (!d) throw new Error('Unit not found')
    return d
  },

  async serviceAction(id: string, action: string) {
    await delay(280)
    return mock.actUnit(id, action)
  },

  async logs(params: {
    query?: string
    priority?: LogPriority | 'all'
    unit?: string
    since?: string
    cursor?: string
  }): Promise<LogEntry[]> {
    await delay(90)
    let rows = mock.logs.slice()
    if (params.unit) rows = rows.filter((l) => l.unit === params.unit)
    if (params.priority !== undefined && params.priority !== 'all') {
      const maxPri = params.priority
      rows = rows.filter((l) => l.priority <= maxPri)
    }
    if (params.query) {
      const q = params.query.toLowerCase()
      rows = rows.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          (l.unit ?? '').toLowerCase().includes(q) ||
          l.identifier.toLowerCase().includes(q),
      )
    }
    if (params.since === '1h') rows = rows.filter((l) => l.timestamp > Date.now() - 3600_000)
    if (params.since === 'today') {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      rows = rows.filter((l) => l.timestamp >= start.getTime())
    }
    if (params.since === '7d') rows = rows.filter((l) => l.timestamp > Date.now() - 7 * 86400_000)
    return rows
  },

  async followLogs(cursor?: string) {
    await delay(40)
    return mock.followLog(cursor)
  },

  async files(path: string, hidden: boolean): Promise<FileEntry[]> {
    await delay(80)
    return mock.listFiles(path, hidden)
  },

  async readFile(path: string) {
    await delay(80)
    return mock.readFile(path)
  },

  async writeFile(path: string, content: string) {
    await delay(160)
    mock.writeFile(path, content)
  },

  async mkdir(path: string, name: string) {
    await delay(120)
    return mock.mkdir(path, name)
  },

  async mkfile(path: string, name: string) {
    await delay(120)
    return mock.mkfile(path, name)
  },

  async rename(path: string, name: string) {
    await delay(120)
    mock.renameFile(path, name)
  },

  async remove(paths: string[]) {
    await delay(160)
    mock.deleteFiles(paths)
  },

  async chmod(paths: string[], mode: string) {
    await delay(140)
    mock.chmod(paths, mode)
  },

  async updates(): Promise<{ items: PackageUpdate[]; rebootRequired: boolean; auto: boolean }> {
    await delay(140)
    return { items: mock.updates, rebootRequired: mock.rebootRequired, auto: mock.autoUpdates }
  },

  async history() {
    await delay(120)
    return mock.history
  },

  async applyUpdates(names: string[]) {
    await delay(160)
    return mock.applyUpdates(names)
  },

  async pollUpdates() {
    await delay(240)
    return mock.pollUpdates()
  },

  async setAutoUpdates(enabled: boolean) {
    await delay(120)
    mock.autoUpdates = enabled
  },
}

export const UNIT_TYPES: UnitType[] = [
  'service',
  'timer',
  'socket',
  'target',
  'path',
  'mount',
  'slice',
  'scope',
]
