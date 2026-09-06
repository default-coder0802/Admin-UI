import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { Minus, Plus, PlusSquare, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { cn } from '../../lib/cn'

interface Sess {
  id: string
  title: string
}

const themes = {
  dark: { background: '#020617', foreground: '#e2e8f0', cursor: '#22c55e' },
  light: { background: '#f8fafc', foreground: '#0f172a', cursor: '#16a34a' },
  solarized: { background: '#002b36', foreground: '#93a1a1', cursor: '#268bd2' },
}

export function TerminalPage() {
  const [sessions, setSessions] = useState<Sess[]>([{ id: 't1', title: 'admin@srv-prod-01' }])
  const [active, setActive] = useState('t1')
  const [status, setStatus] = useState<'connected' | 'reconnecting'>('connected')
  const [theme, setTheme] = useState<keyof typeof themes>('dark')
  const [fontSize, setFontSize] = useState(14)
  const host = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const lines = useRef<string[]>([])

  useEffect(() => {
    if (!host.current) return
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Fira Code, ui-monospace, monospace',
      fontSize,
      theme: themes[theme],
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(host.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit
    banner(term)
    term.onData((data) => {
      if (data === '\r') {
        const cmd = lines.current.join('')
        term.write('\r\n')
        handleCommand(term, cmd)
        lines.current = []
        term.write('admin@srv-prod-01:~$ ')
      } else if (data === '\u007f') {
        if (lines.current.length) {
          lines.current.pop()
          term.write('\b \b')
        }
      } else {
        lines.current.push(data)
        term.write(data)
      }
    })
    const onResize = () => fit.fit()
    window.addEventListener('resize', onResize)
    const idle = window.setTimeout(() => setStatus('reconnecting'), 120000)
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(idle)
      term.dispose()
    }
  }, [active, theme, fontSize])

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            className={cn('rounded-lg border px-3 py-1 text-xs', active === s.id ? 'border-emerald-500 bg-emerald-500/15' : 'border-[var(--border)]')}
            onClick={() => setActive(s.id)}
          >
            {s.title}
            {sessions.length > 1 && (
              <span
                className="ml-2"
                onClick={(e) => {
                  e.stopPropagation()
                  const next = sessions.filter((x) => x.id !== s.id)
                  setSessions(next)
                  if (active === s.id) setActive(next[0]?.id ?? '')
                }}
              >
                <X className="inline size-3" />
              </span>
            )}
          </button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const id = `t${Date.now()}`
            setSessions((s) => [...s, { id, title: `session ${s.length + 1}` }])
            setActive(id)
          }}
          aria-label="New session"
        >
          <PlusSquare className="size-4" />
        </Button>
        <span className={cn('ml-auto text-xs', status === 'connected' ? 'text-emerald-400' : 'text-amber-300')}>{status}</span>
        <select
          className="h-8 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 text-xs"
          value={theme}
          onChange={(e) => setTheme(e.target.value as keyof typeof themes)}
          aria-label="Terminal theme"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="solarized">Solarized</option>
        </select>
        <Button size="sm" variant="ghost" onClick={() => setFontSize((n) => Math.max(10, n - 1))} aria-label="Decrease font">
          <Minus className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setFontSize((n) => Math.min(22, n + 1))} aria-label="Increase font">
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--border)] bg-[#020617] p-2">
        <div ref={host} className="h-full w-full" />
      </div>
    </div>
  )
}

function banner(term: Terminal) {
  term.writeln('Web terminal attached as admin (PTY).')
  term.writeln('Type `help` for demo commands. Idle timeout is 2 minutes.')
  term.write('admin@srv-prod-01:~$ ')
}

function handleCommand(term: Terminal, cmd: string) {
  const c = cmd.trim()
  if (!c) return
  if (c === 'help') {
    term.writeln('help, whoami, hostname, uptime, df -h, systemctl --failed, clear')
    return
  }
  if (c === 'whoami') {
    term.writeln('admin')
    return
  }
  if (c === 'hostname') {
    term.writeln('srv-prod-01')
    return
  }
  if (c === 'uptime') {
    term.writeln(' 09:41:12 up 38 days, 11:24,  3 users,  load average: 0.42, 0.38, 0.31')
    return
  }
  if (c === 'df -h') {
    term.writeln('Filesystem      Size  Used Avail Use%\n/dev/mapper/vg0-root   80G   49G   31G  61%\n/dev/md0              2.0T  1.8T  180G  91%')
    return
  }
  if (c === 'systemctl --failed') {
    term.writeln('  UNIT                 LOAD   ACTIVE SUB    DESCRIPTION\n  redis-server.service loaded failed failed Advanced key-value store')
    return
  }
  if (c === 'clear') {
    term.clear()
    return
  }
  term.writeln(`bash: ${c}: command not found`)
}
