import type {
  Account,
  BlockDevice,
  FileEntry,
  Filesystem,
  Group,
  LogEntry,
  LogPriority,
  LogicalVolume,
  Nic,
  PackageUpdate,
  Route,
  SystemdUnit,
  SystemInfo,
  UnitType,
  UpdateHistoryItem,
  VolumeGroup,
} from '../types'

export const systemInfo: SystemInfo = {
  hostname: 'srv-prod-01',
  os: 'Debian GNU/Linux 12 (bookworm)',
  kernel: '6.1.0-28-amd64',
  arch: 'x86_64',
  cpuModel: 'AMD EPYC 9454P 48-Core Processor',
  cores: 48,
  threads: 96,
  uptimeSeconds: 38 * 86400 + 11 * 3600 + 24 * 60,
  totalRamBytes: 128 * 1024 ** 3,
  diskCount: 4,
  nicCount: 3,
  timezone: 'UTC',
  ntpEnabled: true,
  ntpServer: 'time.cloudflare.com',
  performanceProfile: 'throughput-performance',
}

export const devices: BlockDevice[] = [
  {
    id: 'sda',
    name: 'sda',
    type: 'disk',
    size: 512 * 1024 ** 3,
    model: 'SAMSUNG MZQL21T9HCJR',
    serial: 'S6EXNX0T123456',
    children: ['sda1', 'sda2', 'sda3'],
  },
  {
    id: 'sda1',
    name: 'sda1',
    type: 'part',
    size: 512 * 1024 ** 2,
    fstype: 'vfat',
    mountpoint: '/boot/efi',
    usage: 18,
    parent: 'sda',
  },
  {
    id: 'sda2',
    name: 'sda2',
    type: 'part',
    size: 1 * 1024 ** 3,
    fstype: 'ext4',
    mountpoint: '/boot',
    usage: 42,
    parent: 'sda',
  },
  {
    id: 'sda3',
    name: 'sda3',
    type: 'part',
    size: 510.5 * 1024 ** 3,
    fstype: 'crypto_LUKS',
    encrypted: true,
    parent: 'sda',
    children: ['cryptroot'],
  },
  {
    id: 'cryptroot',
    name: 'cryptroot',
    type: 'crypt',
    size: 510.5 * 1024 ** 3,
    parent: 'sda3',
    children: ['vg0-root', 'vg0-var', 'vg0-home'],
  },
  {
    id: 'vg0-root',
    name: 'vg0-root',
    type: 'lvm',
    size: 80 * 1024 ** 3,
    fstype: 'ext4',
    mountpoint: '/',
    usage: 61,
    parent: 'cryptroot',
  },
  {
    id: 'vg0-var',
    name: 'vg0-var',
    type: 'lvm',
    size: 120 * 1024 ** 3,
    fstype: 'xfs',
    mountpoint: '/var',
    usage: 78,
    parent: 'cryptroot',
  },
  {
    id: 'vg0-home',
    name: 'vg0-home',
    type: 'lvm',
    size: 200 * 1024 ** 3,
    fstype: 'ext4',
    mountpoint: '/home',
    usage: 34,
    parent: 'cryptroot',
  },
  {
    id: 'sdb',
    name: 'sdb',
    type: 'disk',
    size: 2 * 1024 ** 4,
    model: 'WDC WUH721818ALE6L4',
    serial: 'WMC6N0K8ABCD',
    children: ['md0'],
  },
  {
    id: 'sdc',
    name: 'sdc',
    type: 'disk',
    size: 2 * 1024 ** 4,
    model: 'WDC WUH721818ALE6L4',
    serial: 'WMC6N0K8EFGH',
    children: ['md0'],
  },
  {
    id: 'md0',
    name: 'md0',
    type: 'raid',
    size: 2 * 1024 ** 4,
    fstype: 'xfs',
    mountpoint: '/data',
    usage: 91,
    parent: 'sdb',
    degraded: false,
  },
  {
    id: 'sdd',
    name: 'sdd',
    type: 'disk',
    size: 480 * 1024 ** 3,
    model: 'INTEL SSDSC2KB480G8',
    serial: 'BTYF12345',
  },
]

export const filesystems: Filesystem[] = [
  { device: '/dev/mapper/vg0-root', mountpoint: '/', type: 'ext4', size: 80 * 1024 ** 3, used: 48.8 * 1024 ** 3, available: 31.2 * 1024 ** 3, percent: 61 },
  { device: '/dev/mapper/vg0-var', mountpoint: '/var', type: 'xfs', size: 120 * 1024 ** 3, used: 93.6 * 1024 ** 3, available: 26.4 * 1024 ** 3, percent: 78 },
  { device: '/dev/mapper/vg0-home', mountpoint: '/home', type: 'ext4', size: 200 * 1024 ** 3, used: 68 * 1024 ** 3, available: 132 * 1024 ** 3, percent: 34 },
  { device: '/dev/sda2', mountpoint: '/boot', type: 'ext4', size: 1 * 1024 ** 3, used: 0.42 * 1024 ** 3, available: 0.58 * 1024 ** 3, percent: 42 },
  { device: '/dev/sda1', mountpoint: '/boot/efi', type: 'vfat', size: 512 * 1024 ** 2, used: 92 * 1024 ** 2, available: 420 * 1024 ** 2, percent: 18 },
  { device: '/dev/md0', mountpoint: '/data', type: 'xfs', size: 2 * 1024 ** 4, used: 1.82 * 1024 ** 4, available: 0.18 * 1024 ** 4, percent: 91 },
  { device: 'tmpfs', mountpoint: '/tmp', type: 'tmpfs', size: 16 * 1024 ** 3, used: 120 * 1024 ** 2, available: 15.88 * 1024 ** 3, percent: 1 },
]

export const vgs: VolumeGroup[] = [
  { name: 'vg0', size: 510.5 * 1024 ** 3, free: 110.5 * 1024 ** 3, pvCount: 1, lvCount: 3 },
]

export const lvs: LogicalVolume[] = [
  { name: 'root', vg: 'vg0', size: 80 * 1024 ** 3, used: 61, mountpoint: '/' },
  { name: 'var', vg: 'vg0', size: 120 * 1024 ** 3, used: 78, mountpoint: '/var' },
  { name: 'home', vg: 'vg0', size: 200 * 1024 ** 3, used: 34, mountpoint: '/home' },
]

export const nics: Nic[] = [
  {
    name: 'lo',
    type: 'loopback',
    up: true,
    carrier: true,
    mac: '00:00:00:00:00:00',
    mtu: 65536,
    ipv4: ['127.0.0.1/8'],
    ipv6: ['::1/128'],
    method: 'disabled',
    dns: [],
    search: [],
    rxBps: 1200,
    txBps: 1200,
    errors: 0,
    drops: 0,
  },
  {
    name: 'enp1s0',
    type: 'ethernet',
    up: true,
    carrier: true,
    mac: '52:54:00:a1:b2:c3',
    mtu: 1500,
    ipv4: ['10.8.12.41/24'],
    ipv6: ['fe80::5054:ff:fea1:b2c3/64'],
    method: 'static',
    gateway: '10.8.12.1',
    dns: ['10.8.12.1', '1.1.1.1'],
    search: ['internal.lan'],
    rxBps: 12_400_000,
    txBps: 3_200_000,
    errors: 0,
    drops: 0,
  },
  {
    name: 'enp2s0',
    type: 'ethernet',
    up: true,
    carrier: true,
    mac: '52:54:00:d4:e5:f6',
    mtu: 9000,
    ipv4: ['10.8.40.12/24'],
    ipv6: [],
    method: 'static',
    gateway: undefined,
    dns: [],
    search: [],
    rxBps: 84_000_000,
    txBps: 21_000_000,
    errors: 0,
    drops: 2,
  },
  {
    name: 'wlp3s0',
    type: 'wifi',
    up: false,
    carrier: false,
    mac: '3c:58:c2:11:22:33',
    mtu: 1500,
    ipv4: [],
    ipv6: [],
    method: 'dhcp',
    dns: [],
    search: [],
    rxBps: 0,
    txBps: 0,
    errors: 0,
    drops: 0,
  },
]

export const firewall = {
  enabled: true,
  defaultZone: 'public',
  zones: [
    {
      name: 'public',
      target: 'default',
      services: ['ssh', 'http', 'https', 'cockpit'],
      ports: ['9090/tcp'],
      interfaces: ['enp1s0'],
      sources: [],
    },
    {
      name: 'internal',
      target: 'ACCEPT',
      services: ['ssh', 'nfs', 'samba', 'dns'],
      ports: ['2049/tcp'],
      interfaces: ['enp2s0'],
      sources: ['10.8.40.0/24'],
    },
    {
      name: 'drop',
      target: 'DROP',
      services: [],
      ports: [],
      interfaces: [],
      sources: [],
    },
  ],
}

export const routes: Route[] = [
  { destination: 'default', gateway: '10.8.12.1', iface: 'enp1s0', metric: 100 },
  { destination: '10.8.12.0/24', gateway: '-', iface: 'enp1s0', metric: 100 },
  { destination: '10.8.40.0/24', gateway: '-', iface: 'enp2s0', metric: 200 },
]

export const accounts: Account[] = [
  { username: 'root', uid: 0, gid: 0, fullName: 'root', home: '/root', shell: '/bin/bash', groups: ['root'], locked: false, expired: false, lastLogin: '2026-09-06T08:12:00Z', sshKeys: 1, system: true },
  { username: 'admin', uid: 1000, gid: 1000, fullName: 'Alex Rivera', home: '/home/admin', shell: '/bin/bash', groups: ['admin', 'sudo', 'adm', 'systemd-journal'], locked: false, expired: false, lastLogin: '2026-09-06T09:41:00Z', sshKeys: 2, system: false },
  { username: 'deploy', uid: 1001, gid: 1001, fullName: 'Deploy Bot', home: '/home/deploy', shell: '/bin/bash', groups: ['deploy', 'www-data'], locked: false, expired: false, lastLogin: '2026-09-05T22:03:00Z', sshKeys: 1, system: false },
  { username: 'backup', uid: 1002, gid: 1002, fullName: 'Backup Operator', home: '/home/backup', shell: '/usr/sbin/nologin', groups: ['backup'], locked: false, expired: false, sshKeys: 0, system: false },
  { username: 'guest', uid: 1003, gid: 1003, fullName: 'Guest Account', home: '/home/guest', shell: '/bin/bash', groups: ['guest'], locked: true, expired: true, sshKeys: 0, system: false },
  { username: 'www-data', uid: 33, gid: 33, fullName: 'www-data', home: '/var/www', shell: '/usr/sbin/nologin', groups: ['www-data'], locked: true, expired: false, sshKeys: 0, system: true },
  { username: 'systemd-network', uid: 998, gid: 998, fullName: 'systemd Network Management', home: '/', shell: '/usr/sbin/nologin', groups: ['systemd-network'], locked: true, expired: false, sshKeys: 0, system: true },
  { username: 'nobody', uid: 65534, gid: 65534, fullName: 'nobody', home: '/nonexistent', shell: '/usr/sbin/nologin', groups: ['nogroup'], locked: true, expired: false, sshKeys: 0, system: true },
]

export const groups: Group[] = [
  { name: 'root', gid: 0, members: ['root'], system: true },
  { name: 'sudo', gid: 27, members: ['admin'], system: true },
  { name: 'adm', gid: 4, members: ['admin'], system: true },
  { name: 'admin', gid: 1000, members: ['admin'], system: false },
  { name: 'deploy', gid: 1001, members: ['deploy'], system: false },
  { name: 'backup', gid: 1002, members: ['backup', 'admin'], system: false },
  { name: 'www-data', gid: 33, members: ['www-data', 'deploy'], system: true },
  { name: 'guest', gid: 1003, members: ['guest'], system: false },
]

const unitTemplates: Array<Omit<SystemdUnit, 'id'>> = [
  { name: 'sshd.service', description: 'OpenBSD Secure Shell server', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'nginx.service', description: 'A high performance web server', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'postgresql.service', description: 'PostgreSQL RDBMS', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'redis-server.service', description: 'Advanced key-value store', type: 'service', loadState: 'loaded', activeState: 'failed', subState: 'failed', enabled: true, masked: false, user: false },
  { name: 'cron.service', description: 'Regular background program processing daemon', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'nftables.service', description: 'nftables firewall', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'exited', enabled: true, masked: false, user: false },
  { name: 'NetworkManager.service', description: 'Network Manager', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'fail2ban.service', description: 'Fail2Ban Service', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'unattended-upgrades.service', description: 'Unattended Upgrades Shutdown', type: 'service', loadState: 'loaded', activeState: 'inactive', subState: 'dead', enabled: true, masked: false, user: false },
  { name: 'docker.service', description: 'Docker Application Container Engine', type: 'service', loadState: 'loaded', activeState: 'inactive', subState: 'dead', enabled: false, masked: false, user: false },
  { name: 'rsyslog.service', description: 'System Logging Service', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'chrony.service', description: 'chrony, an NTP client/server', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'logrotate.timer', description: 'Daily rotation of log files', type: 'timer', loadState: 'loaded', activeState: 'active', subState: 'waiting', enabled: true, masked: false, user: false },
  { name: 'apt-daily.timer', description: 'Daily apt download activities', type: 'timer', loadState: 'loaded', activeState: 'active', subState: 'waiting', enabled: true, masked: false, user: false },
  { name: 'systemd-tmpfiles-clean.timer', description: 'Daily Cleanup of Temporary Directories', type: 'timer', loadState: 'loaded', activeState: 'active', subState: 'waiting', enabled: true, masked: false, user: false },
  { name: 'ssh.socket', description: 'OpenBSD Secure Shell server socket', type: 'socket', loadState: 'loaded', activeState: 'inactive', subState: 'dead', enabled: false, masked: false, user: false },
  { name: 'docker.socket', description: 'Docker Socket for the API', type: 'socket', loadState: 'loaded', activeState: 'inactive', subState: 'dead', enabled: false, masked: false, user: false },
  { name: 'multi-user.target', description: 'Multi-User System', type: 'target', loadState: 'loaded', activeState: 'active', subState: 'active', enabled: true, masked: false, user: false },
  { name: 'graphical.target', description: 'Graphical Interface', type: 'target', loadState: 'loaded', activeState: 'inactive', subState: 'dead', enabled: false, masked: false, user: false },
  { name: 'data.mount', description: '/data', type: 'mount', loadState: 'loaded', activeState: 'active', subState: 'mounted', enabled: true, masked: false, user: false },
  { name: 'boot-efi.mount', description: '/boot/efi', type: 'mount', loadState: 'loaded', activeState: 'active', subState: 'mounted', enabled: true, masked: false, user: false },
  { name: 'systemd-udevd.service', description: 'Rule-based Manager for Device Events', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: true, masked: false, user: false },
  { name: 'apparmor.service', description: 'Load AppArmor profiles', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'exited', enabled: true, masked: false, user: false },
  { name: 'user@1000.service', description: 'User Manager for UID 1000', type: 'service', loadState: 'loaded', activeState: 'active', subState: 'running', enabled: false, masked: false, user: true },
]

export const units: SystemdUnit[] = unitTemplates.map((u) => ({
  ...u,
  id: u.name,
}))

const logMessages: Array<{ p: LogPriority; unit: string; id: string; msg: string }> = [
  { p: 3, unit: 'redis-server.service', id: 'redis-server', msg: "Can't open the log file: Permission denied" },
  { p: 3, unit: 'redis-server.service', id: 'systemd', msg: 'Failed to start Advanced key-value store.' },
  { p: 4, unit: 'sshd.service', id: 'sshd', msg: 'Failed password for invalid user oracle from 185.220.101.42 port 44122 ssh2' },
  { p: 6, unit: 'sshd.service', id: 'sshd', msg: 'Accepted publickey for admin from 10.8.12.90 port 51244 ssh2: ED25519 SHA256:abc' },
  { p: 6, unit: 'nginx.service', id: 'nginx', msg: 'reloading configuration' },
  { p: 5, unit: 'kernel', id: 'kernel', msg: 'EXT4-fs (dm-0): mounted filesystem with ordered data mode' },
  { p: 4, unit: 'kernel', id: 'kernel', msg: 'nvme0n1: I/O timeout, aborting cmd id 0x1a' },
  { p: 6, unit: 'cron.service', id: 'CRON', msg: '(root) CMD (/usr/lib/apt/apt.systemd.daily)' },
  { p: 6, unit: 'NetworkManager.service', id: 'NetworkManager', msg: 'device (enp1s0): Activation: successful, device activated.' },
  { p: 4, unit: 'fail2ban.service', id: 'fail2ban', msg: 'Ban 45.33.32.156' },
  { p: 6, unit: 'postgresql.service', id: 'postgres', msg: 'checkpoint starting: time' },
  { p: 6, unit: 'postgresql.service', id: 'postgres', msg: 'checkpoint complete: wrote 184 buffers (1.1%)' },
  { p: 5, unit: 'systemd', id: 'systemd', msg: 'Started Daily apt download activities.' },
  { p: 3, unit: 'nginx.service', id: 'nginx', msg: 'upstream timed out (110: Connection timed out) while connecting to upstream' },
  { p: 6, unit: 'chrony.service', id: 'chronyd', msg: 'Selected source 162.159.200.1 (time.cloudflare.com)' },
  { p: 4, unit: 'kernel', id: 'kernel', msg: 'TCP: request_sock_TCP: Possible SYN flooding on port 443. Sending cookies.' },
  { p: 6, unit: 'sshd.service', id: 'sshd', msg: 'Disconnected from user admin 10.8.12.90 port 51244' },
  { p: 2, unit: 'kernel', id: 'kernel', msg: 'Out of memory: Killed process 18421 (node) total-vm:8421948kB' },
  { p: 6, unit: 'unattended-upgrades.service', id: 'unattended-upgr', msg: 'Starting unattended upgrades script' },
  { p: 5, unit: 'apt-daily.timer', id: 'systemd', msg: 'apt-daily.timer: Succeeded.' },
]

export function generateLogs(count = 240): LogEntry[] {
  const now = Date.now()
  const logs: LogEntry[] = []
  for (let i = 0; i < count; i += 1) {
    const src = logMessages[i % logMessages.length]
    const jitter = (i * 17_341) % 87_000
    const ts = now - i * 14_000 - jitter
    logs.push({
      cursor: `s=${(100000 + i).toString(16)}`,
      timestamp: ts,
      priority: src.p,
      unit: src.unit === 'kernel' ? undefined : src.unit,
      identifier: src.id,
      message: src.msg,
      pid: 400 + ((i * 13) % 9000),
      hostname: 'srv-prod-01',
      fields: {
        PRIORITY: String(src.p),
        SYSLOG_IDENTIFIER: src.id,
        MESSAGE: src.msg,
        _SYSTEMD_UNIT: src.unit,
        _HOSTNAME: 'srv-prod-01',
        _PID: String(400 + ((i * 13) % 9000)),
      },
    })
  }
  return logs
}

export const packageUpdates: PackageUpdate[] = [
  { name: 'linux-image-amd64', current: '6.1.0-27', next: '6.1.0-28', size: 72 * 1024 ** 2, severity: 'security', changelog: 'Fixes CVE-2026-4421 in netfilter.', selected: true },
  { name: 'openssl', current: '3.0.13-1', next: '3.0.15-1', size: 5.4 * 1024 ** 2, severity: 'security', changelog: 'Fixes timing side-channel in RSA.', selected: true },
  { name: 'openssh-server', current: '1:9.2p1-2+deb12u3', next: '1:9.2p1-2+deb12u4', size: 1.1 * 1024 ** 2, severity: 'security', changelog: 'Regressions in GSSAPI auth.', selected: true },
  { name: 'nginx', current: '1.22.1-9', next: '1.22.1-9+deb12u2', size: 0.8 * 1024 ** 2, severity: 'bugfix', changelog: 'HTTP/2 memory leak under load.', selected: true },
  { name: 'postgresql-15', current: '15.8-0+deb12u1', next: '15.10-0+deb12u1', size: 18 * 1024 ** 2, severity: 'security', changelog: 'Restricts GRANT on views.', selected: true },
  { name: 'curl', current: '7.88.1-10+deb12u7', next: '7.88.1-10+deb12u8', size: 0.4 * 1024 ** 2, severity: 'bugfix', selected: false },
  { name: 'systemd', current: '252.31-1~deb12u1', next: '252.36-1~deb12u1', size: 8.2 * 1024 ** 2, severity: 'bugfix', selected: false },
  { name: 'python3.11', current: '3.11.2-6', next: '3.11.2-6+deb12u3', size: 2.1 * 1024 ** 2, severity: 'security', selected: true },
  { name: 'ca-certificates', current: '20230311', next: '20241223', size: 0.2 * 1024 ** 2, severity: 'enhancement', selected: false },
  { name: 'tzdata', current: '2024b-0+deb12u1', next: '2025a-0+deb12u1', size: 0.3 * 1024 ** 2, severity: 'enhancement', selected: false },
]

export const updateHistory: UpdateHistoryItem[] = [
  { id: 'tx-8841', date: '2026-08-28T03:12:00Z', count: 18, status: 'success', summary: 'Security updates applied, reboot required' },
  { id: 'tx-8712', date: '2026-08-14T03:08:00Z', count: 7, status: 'success', summary: 'Routine unattended upgrades' },
  { id: 'tx-8503', date: '2026-07-30T03:21:00Z', count: 22, status: 'failed', summary: 'Held back: postgresql-15 conflict' },
]

export function listDir(path: string, showHidden: boolean): FileEntry[] {
  const now = Date.now()
  const trees: Record<string, FileEntry[]> = {
    '/': [
      dir('bin', '/bin', now - 86400_000 * 40),
      dir('boot', '/boot', now - 86400_000 * 8),
      dir('data', '/data', now - 3600_000),
      dir('etc', '/etc', now - 7200_000),
      dir('home', '/home', now - 1800_000),
      dir('lib', '/lib', now - 86400_000 * 40),
      dir('opt', '/opt', now - 86400_000 * 12),
      dir('root', '/root', now - 5400_000, 'root', 'root', 'drwx------'),
      dir('tmp', '/tmp', now - 60_000, 'root', 'root', 'drwxrwxrwt'),
      dir('usr', '/usr', now - 86400_000 * 20),
      dir('var', '/var', now - 300_000),
      file('vmlinuz', '/vmlinuz', 8_192, now - 86400_000 * 8, 'symlink'),
    ],
    '/home': [
      dir('admin', '/home/admin', now - 120_000, 'admin', 'admin', 'drwxr-x---'),
      dir('deploy', '/home/deploy', now - 86400_000, 'deploy', 'deploy', 'drwxr-x---'),
      dir('backup', '/home/backup', now - 86400_000 * 4, 'backup', 'backup', 'drwxr-x---'),
    ],
    '/home/admin': [
      dir('.ssh', '/home/admin/.ssh', now - 86400_000 * 20, 'admin', 'admin', 'drwx------'),
      dir('.config', '/home/admin/.config', now - 86400_000 * 2, 'admin', 'admin'),
      dir('projects', '/home/admin/projects', now - 3600_000, 'admin', 'admin'),
      file('.bashrc', '/home/admin/.bashrc', 3524, now - 86400_000 * 90, 'file', 'admin', 'admin', '-rw-r--r--', 'text/plain'),
      file('.profile', '/home/admin/.profile', 807, now - 86400_000 * 90, 'file', 'admin', 'admin', '-rw-r--r--', 'text/plain'),
      file('notes.md', '/home/admin/notes.md', 4821, now - 5400_000, 'file', 'admin', 'admin', '-rw-r--r--', 'text/markdown'),
      file('screenshot.png', '/home/admin/screenshot.png', 248_331, now - 86400_000, 'file', 'admin', 'admin', '-rw-r--r--', 'image/png'),
      file('report.pdf', '/home/admin/report.pdf', 1_204_441, now - 86400_000 * 3, 'file', 'admin', 'admin', '-rw-r--r--', 'application/pdf'),
    ],
    '/etc': [
      file('hostname', '/etc/hostname', 12, now - 86400_000 * 30, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
      file('hosts', '/etc/hosts', 221, now - 86400_000 * 12, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
      file('fstab', '/etc/fstab', 842, now - 86400_000 * 40, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
      file('passwd', '/etc/passwd', 2841, now - 86400_000, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
      dir('nginx', '/etc/nginx', now - 86400_000 * 2),
      dir('ssh', '/etc/ssh', now - 86400_000 * 14),
      dir('systemd', '/etc/systemd', now - 86400_000 * 7),
      file('resolv.conf', '/etc/resolv.conf', 92, now - 3600_000, 'symlink'),
    ],
    '/etc/nginx': [
      file('nginx.conf', '/etc/nginx/nginx.conf', 1442, now - 86400_000 * 2, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
      dir('sites-available', '/etc/nginx/sites-available', now - 86400_000 * 2),
      dir('sites-enabled', '/etc/nginx/sites-enabled', now - 86400_000 * 2),
    ],
    '/var': [
      dir('log', '/var/log', now - 20_000),
      dir('lib', '/var/lib', now - 3600_000),
      dir('www', '/var/www', now - 86400_000),
      dir('tmp', '/var/tmp', now - 86400_000),
    ],
    '/var/log': [
      file('syslog', '/var/log/syslog', 4_821_441, now - 8_000, 'file', 'root', 'adm', '-rw-r-----', 'text/plain'),
      file('auth.log', '/var/log/auth.log', 1_204_122, now - 12_000, 'file', 'root', 'adm', '-rw-r-----', 'text/plain'),
      file('nginx/access.log', '/var/log/nginx-access.log', 18_442_001, now - 3_000, 'file', 'www-data', 'adm', '-rw-r-----', 'text/plain'),
      file('kern.log', '/var/log/kern.log', 842_331, now - 40_000, 'file', 'root', 'adm', '-rw-r-----', 'text/plain'),
    ],
    '/data': [
      dir('backups', '/data/backups', now - 3600_000),
      dir('media', '/data/media', now - 86400_000 * 2),
      file('README.txt', '/data/README.txt', 220, now - 86400_000 * 90, 'file', 'root', 'root', '-rw-r--r--', 'text/plain'),
    ],
  }

  const entries = (trees[normalizePath(path)] ?? []).slice()
  return showHidden ? entries : entries.filter((e) => !e.hidden)
}

function dir(
  name: string,
  path: string,
  modified: number,
  owner = 'root',
  group = 'root',
  mode = 'drwxr-xr-x',
): FileEntry {
  return {
    name,
    path,
    type: 'dir',
    size: 4096,
    modified,
    mode,
    owner,
    group,
    hidden: name.startsWith('.'),
  }
}

function file(
  name: string,
  path: string,
  size: number,
  modified: number,
  type: FileEntry['type'] = 'file',
  owner = 'root',
  group = 'root',
  mode = '-rw-r--r--',
  mime?: string,
): FileEntry {
  return {
    name,
    path,
    type,
    size,
    modified,
    mode,
    owner,
    group,
    mime,
    hidden: name.startsWith('.'),
  }
}

export function normalizePath(p: string): string {
  if (!p) return '/'
  const parts = p.split('/').filter(Boolean)
  const stack: string[] = []
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return '/' + stack.join('/')
}

export const fileContents: Record<string, string> = {
  '/etc/hostname': 'srv-prod-01\n',
  '/etc/hosts': '127.0.0.1 localhost\n10.8.12.41 srv-prod-01\n',
  '/etc/fstab': `# /etc/fstab
UUID=7a1c... / ext4 defaults 0 1
UUID=9b2d... /boot ext4 defaults 0 2
/dev/mapper/vg0-var /var xfs defaults 0 2
/dev/mapper/vg0-home /home ext4 defaults 0 2
/dev/md0 /data xfs defaults,noatime 0 2
`,
  '/home/admin/notes.md': `# Runbook

- Check failed units: systemctl --failed
- Redis currently failing due to log permission
- /data at 91% — schedule expansion
`,
  '/etc/nginx/nginx.conf': `user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
  worker_connections 4096;
}

http {
  include /etc/nginx/mime.types;
  sendfile on;
  keepalive_timeout 65;
  include /etc/nginx/sites-enabled/*;
}
`,
  '/data/README.txt': 'Primary data volume. Nightly backups land in /data/backups.\n',
}

export const unitFiles: Record<string, string> = {
  'sshd.service': `[Unit]
Description=OpenBSD Secure Shell server
After=network.target

[Service]
ExecStart=/usr/sbin/sshd -D
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=on-failure

[Install]
WantedBy=multi-user.target
`,
  'redis-server.service': `[Unit]
Description=Advanced key-value store
After=network.target

[Service]
Type=notify
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
Restart=always
User=redis
Group=redis

[Install]
WantedBy=multi-user.target
`,
  'nginx.service': `[Unit]
Description=A high performance web server and a reverse proxy server
After=network.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStart=/usr/sbin/nginx
ExecReload=/usr/sbin/nginx -s reload
KillMode=mixed

[Install]
WantedBy=multi-user.target
`,
}

export const unitTypes: UnitType[] = [
  'service',
  'timer',
  'socket',
  'target',
  'path',
  'mount',
  'slice',
  'scope',
]
