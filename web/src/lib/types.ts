export type HealthLevel = 'ok' | 'warn' | 'crit'

export interface UserSession {
  username: string
  fullName: string
  uid: number
  groups: string[]
  isAdmin: boolean
  lastLogin: string
  lastLoginFrom: string
  sessionStarted: string
}

export interface SystemInfo {
  hostname: string
  os: string
  kernel: string
  arch: string
  cpuModel: string
  cores: number
  threads: number
  uptimeSeconds: number
  totalRamBytes: number
  diskCount: number
  nicCount: number
  timezone: string
  ntpEnabled: boolean
  ntpServer: string
  performanceProfile: string
}

export interface HealthSummary {
  failedServices: number
  pendingUpdates: number
  diskWarnings: number
  overall: HealthLevel
}

export interface MetricPoint {
  t: number
  v: number
}

export interface DualMetricPoint {
  t: number
  a: number
  b: number
}

export interface CpuMetrics {
  overall: number
  perCore: number[]
  history: MetricPoint[]
}

export interface MemoryMetrics {
  used: number
  available: number
  buffers: number
  cache: number
  swapUsed: number
  swapTotal: number
  history: MetricPoint[]
}

export interface DiskIoMetrics {
  readBps: number
  writeBps: number
  readIops: number
  writeIops: number
  perDevice: Array<{
    name: string
    readBps: number
    writeBps: number
    readIops: number
    writeIops: number
  }>
  history: DualMetricPoint[]
}

export interface NetworkMetrics {
  rxBps: number
  txBps: number
  perInterface: Array<{
    name: string
    rxBps: number
    txBps: number
  }>
  history: DualMetricPoint[]
}

export interface OverviewSnapshot {
  info: SystemInfo
  health: HealthSummary
  cpu: CpuMetrics
  memory: MemoryMetrics
  diskIo: DiskIoMetrics
  network: NetworkMetrics
}

export interface BlockDevice {
  id: string
  name: string
  type: 'disk' | 'part' | 'lvm' | 'raid' | 'loop' | 'crypt'
  size: number
  model?: string
  serial?: string
  fstype?: string
  mountpoint?: string
  usage?: number
  parent?: string
  children?: string[]
  encrypted?: boolean
  degraded?: boolean
}

export interface Filesystem {
  device: string
  mountpoint: string
  type: string
  size: number
  used: number
  available: number
  percent: number
}

export interface VolumeGroup {
  name: string
  size: number
  free: number
  pvCount: number
  lvCount: number
}

export interface LogicalVolume {
  name: string
  vg: string
  size: number
  used?: number
  mountpoint?: string
}

export interface StorageSnapshot {
  devices: BlockDevice[]
  filesystems: Filesystem[]
  vgs: VolumeGroup[]
  lvs: LogicalVolume[]
  warnings: string[]
}

export interface Nic {
  name: string
  type: 'ethernet' | 'wifi' | 'bridge' | 'bond' | 'vlan' | 'loopback'
  up: boolean
  carrier: boolean
  mac: string
  mtu: number
  ipv4: string[]
  ipv6: string[]
  method: 'dhcp' | 'static' | 'disabled'
  gateway?: string
  dns: string[]
  search: string[]
  rxBps: number
  txBps: number
  errors: number
  drops: number
}

export interface FirewallZone {
  name: string
  target: string
  services: string[]
  ports: string[]
  interfaces: string[]
  sources: string[]
}

export interface FirewallState {
  enabled: boolean
  defaultZone: string
  zones: FirewallZone[]
}

export interface Route {
  destination: string
  gateway: string
  iface: string
  metric: number
}

export interface NetworkSnapshot {
  interfaces: Nic[]
  firewall: FirewallState
  routes: Route[]
}

export interface Account {
  username: string
  uid: number
  gid: number
  fullName: string
  home: string
  shell: string
  groups: string[]
  locked: boolean
  expired: boolean
  lastLogin?: string
  sshKeys: number
  system: boolean
}

export interface Group {
  name: string
  gid: number
  members: string[]
  system: boolean
}

export type UnitType =
  | 'service'
  | 'timer'
  | 'socket'
  | 'target'
  | 'path'
  | 'mount'
  | 'slice'
  | 'scope'

export interface SystemdUnit {
  id: string
  name: string
  description: string
  type: UnitType
  loadState: string
  activeState: 'active' | 'inactive' | 'failed' | 'activating' | 'deactivating'
  subState: string
  enabled: boolean
  masked: boolean
  user: boolean
}

export interface UnitDetail extends SystemdUnit {
  fragmentPath: string
  overridden: boolean
  requires: string[]
  wants: string[]
  conflicts: string[]
  recentLogs: LogEntry[]
  unitFile: string
}

export type LogPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface LogEntry {
  cursor: string
  timestamp: number
  priority: LogPriority
  unit?: string
  identifier: string
  message: string
  pid?: number
  hostname?: string
  fields?: Record<string, string>
}

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'dir' | 'symlink'
  size: number
  modified: number
  mode: string
  owner: string
  group: string
  mime?: string
  hidden: boolean
}

export interface FilePreview {
  kind: 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary'
  content?: string
  url?: string
}

export interface PackageUpdate {
  name: string
  current: string
  next: string
  size: number
  severity: 'security' | 'bugfix' | 'enhancement' | 'other'
  changelog?: string
  selected: boolean
}

export interface UpdateHistoryItem {
  id: string
  date: string
  count: number
  status: 'success' | 'failed'
  summary: string
}

export interface Toast {
  id: string
  kind: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}
