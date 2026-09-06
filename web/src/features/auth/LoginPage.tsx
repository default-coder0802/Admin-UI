import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Field, Input } from '../../components/Input'
import { useAuth } from '../../stores/auth'

export function LoginPage() {
  const { user, login, loading, error } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [show, setShow] = useState(false)

  if (user) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Server Admin Console</p>
        <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Use system credentials. Demo: admin / admin</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void login(username, password).catch(() => undefined)
          }}
        >
          <Field label="Username">
            <Input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Field>
          <Field label="Password" error={error ?? undefined}>
            <div className="relative">
              <Input
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]"
                onClick={() => setShow((s) => !s)}
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
