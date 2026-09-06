import { create } from 'zustand'
import { api } from '../lib/api'
import type { UserSession } from '../lib/types'

interface AuthState {
  user: UserSession | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => void
}

const KEY = 'sac.session'

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  hydrate() {
    const raw = sessionStorage.getItem(KEY)
    if (raw) set({ user: JSON.parse(raw) as UserSession })
  },
  async login(username, password) {
    set({ loading: true, error: null })
    try {
      const user = await api.login(username, password)
      sessionStorage.setItem(KEY, JSON.stringify(user))
      set({ user, loading: false })
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Login failed' })
      throw e
    }
  },
  async logout() {
    await api.logout()
    sessionStorage.removeItem(KEY)
    set({ user: null })
  },
}))
