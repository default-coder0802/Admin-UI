import {
  Box,
  FileText,
  Folder,
  HardDrive,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Server,
  Sun,
  TerminalSquare,
  Users,
  WifiOff,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useAuth } from '../stores/auth'
import { useUi } from '../stores/ui'
import { Button } from './Button'
import { Toasts } from './Toasts'

const systemNav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/storage', label: 'Storage', icon: HardDrive },
  { to: '/networking', label: 'Networking', icon: Network },
  { to: '/accounts', label: 'Accounts', icon: Users },
  { to: '/services', label: 'Services', icon: Server },
  { to: '/logs', label: 'Logs', icon: ScrollText },
]

const toolsNav = [
  { to: '/files', label: 'Files', icon: Folder },
  { to: '/terminal', label: 'Terminal', icon: TerminalSquare },
  { to: '/updates', label: 'Software updates', icon: Box },
]

export function Layout() {
  const { sidebarCollapsed, toggleSidebar, mobileNav, setMobileNav, theme, setTheme, connection } = useUi()
  const { user, logout } = useAuth()
  const location = useLocation()

  const title =
    [...systemNav, ...toolsNav].find((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)))
      ?.label ?? 'Console'

  return (
    <div className="flex min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-emerald-500 focus:px-3 focus:py-2 focus:text-slate-950">
        Skip to main content
      </a>
      {mobileNav && (
        <button className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden" aria-label="Close menu" onClick={() => setMobileNav(false)} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width,transform] duration-200 lg:static',
          sidebarCollapsed ? 'w-[72px]' : 'w-60',
          mobileNav ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-[var(--border)] px-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <FileText className="size-4" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Admin Console</p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">srv-prod-01</p>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
          <NavSection title="System" collapsed={sidebarCollapsed}>
            {systemNav.map((item) => (
              <Item key={item.to} {...item} collapsed={sidebarCollapsed} onNavigate={() => setMobileNav(false)} />
            ))}
          </NavSection>
          <NavSection title="Tools" collapsed={sidebarCollapsed}>
            {toolsNav.map((item) => (
              <Item key={item.to} {...item} collapsed={sidebarCollapsed} onNavigate={() => setMobileNav(false)} />
            ))}
          </NavSection>
        </nav>
        <div className="border-t border-[var(--border)] p-2">
          <div className={cn('flex items-center gap-2 rounded-lg px-2 py-2', sidebarCollapsed && 'justify-center')}>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-300">
              {(user?.username ?? 'a').slice(0, 1).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{user?.fullName}</p>
                <p className="truncate text-[11px] text-[var(--text-muted)]">{user?.username}</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => void logout()} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)]/90 px-3 backdrop-blur">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open menu">
            <Menu className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={toggleSidebar} aria-label="Toggle sidebar">
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
          <h1 className="flex-1 text-sm font-semibold">{title}</h1>
          {connection !== 'live' && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-300">
              <WifiOff className="size-3.5" /> {connection}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </header>
        <main id="main" className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  )
}

function NavSection({
  title,
  collapsed,
  children,
}: {
  title: string
  collapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{title}</p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function Item({
  to,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  collapsed: boolean
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors duration-150',
          collapsed && 'justify-center',
          isActive
            ? 'bg-emerald-500/15 text-emerald-300'
            : 'text-[var(--text-muted)] hover:bg-[var(--muted)] hover:text-[var(--text)]',
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}
