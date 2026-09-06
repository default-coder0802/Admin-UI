import { create } from 'zustand'
import type { Toast } from '../lib/types'

interface UiState {
  sidebarCollapsed: boolean
  mobileNav: boolean
  theme: 'dark' | 'light'
  toasts: Toast[]
  connection: 'live' | 'reconnecting' | 'offline'
  toggleSidebar: () => void
  setMobileNav: (open: boolean) => void
  setTheme: (theme: 'dark' | 'light') => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  setConnection: (c: UiState['connection']) => void
}

const THEME_KEY = 'sac.theme'

export const useUi = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  mobileNav: false,
  theme: (localStorage.getItem(THEME_KEY) as 'dark' | 'light') || 'dark',
  toasts: [],
  connection: 'live',
  toggleSidebar() {
    set({ sidebarCollapsed: !get().sidebarCollapsed })
  },
  setMobileNav(open) {
    set({ mobileNav: open })
  },
  setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme)
    document.documentElement.dataset.theme = theme
    set({ theme })
  },
  pushToast(toast) {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { ...toast, id }] })
    window.setTimeout(() => get().dismissToast(id), 4200)
  },
  dismissToast(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
  setConnection(connection) {
    set({ connection })
  },
}))
