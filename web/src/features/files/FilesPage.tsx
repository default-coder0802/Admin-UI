import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight,
  File as FileIcon,
  Folder,
  Grid3x3,
  List as ListIcon,
  Upload,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Field, Input } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatBytes, formatDateTime } from '../../lib/format'
import { normalizePath } from '../../lib/mock/seed'
import type { FileEntry } from '../../lib/types'
import { useUi } from '../../stores/ui'

type View = 'list' | 'grid'
type SortKey = 'name' | 'size' | 'modified' | 'type'

export function FilesPage() {
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const [path, setPath] = useState('/home/admin')
  const [pathInput, setPathInput] = useState('/home/admin')
  const [hidden, setHidden] = useState(false)
  const [view, setView] = useState<View>('list')
  const [sort, setSort] = useState<SortKey>('name')
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [dialog, setDialog] = useState<
    | { kind: 'mkdir' | 'mkfile' | 'rename' | 'symlink'; value: string }
    | { kind: 'chmod'; value: string }
    | { kind: 'delete' }
    | { kind: 'edit'; path: string; content: string; dirty: boolean }
    | { kind: 'preview'; path: string; mime?: string }
    | { kind: 'props'; entry: FileEntry }
    | { kind: 'conflict'; name: string }
    | null
  >(null)
  const [clip, setClip] = useState<{ mode: 'copy' | 'cut'; paths: string[] } | null>(null)
  const [bookmarks, setBookmarks] = useState<string[]>(['/home/admin', '/etc', '/var/log', '/data'])
  const [dragOver, setDragOver] = useState(false)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const q = useQuery({
    queryKey: ['files', path, hidden],
    queryFn: () => api.files(path, hidden),
  })

  const entries = useMemo(() => {
    let list = q.data ?? []
    if (search) list = list.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a, b) => {
      if (a.type === 'dir' && b.type !== 'dir') return -1
      if (b.type === 'dir' && a.type !== 'dir') return 1
      if (sort === 'size') return b.size - a.size
      if (sort === 'modified') return b.modified - a.modified
      if (sort === 'type') return (a.mime ?? a.type).localeCompare(b.mime ?? b.type)
      return a.name.localeCompare(b.name)
    })
  }, [q.data, search, sort])

  const crumbs = path.split('/').filter(Boolean)

  function go(next: string) {
    const p = normalizePath(next)
    setPath(p)
    setPathInput(p)
    setSelected([])
  }

  const mkdir = useMutation({
    mutationFn: () => api.mkdir(path, (dialog as { value: string }).value),
    onSuccess: () => {
      setDialog(null)
      void qc.invalidateQueries({ queryKey: ['files', path] })
    },
  })
  const mkfile = useMutation({
    mutationFn: () => api.mkfile(path, (dialog as { value: string }).value),
    onSuccess: () => {
      setDialog(null)
      void qc.invalidateQueries({ queryKey: ['files', path] })
    },
  })
  const rename = useMutation({
    mutationFn: () => api.rename(selected[0], (dialog as { value: string }).value),
    onSuccess: () => {
      setDialog(null)
      void qc.invalidateQueries({ queryKey: ['files', path] })
    },
  })
  const remove = useMutation({
    mutationFn: () => api.remove(selected),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Deleted', message: 'Undo not available for privileged paths.' })
      setDialog(null)
      setSelected([])
      void qc.invalidateQueries({ queryKey: ['files', path] })
    },
  })
  const chmod = useMutation({
    mutationFn: () => api.chmod(selected, (dialog as { value: string }).value),
    onSuccess: () => {
      setDialog(null)
      void qc.invalidateQueries({ queryKey: ['files', path] })
    },
  })
  const saveFile = useMutation({
    mutationFn: () => {
      const d = dialog as { path: string; content: string }
      return api.writeFile(d.path, d.content)
    },
    onSuccess: () => {
      toast({ kind: 'success', title: 'File saved' })
      setDialog(null)
    },
  })

  async function openItem(entry: FileEntry) {
    if (entry.type === 'dir') {
      go(entry.path)
      return
    }
    if (entry.mime?.startsWith('text') || entry.name.endsWith('.conf') || entry.name.endsWith('.md')) {
      const content = await api.readFile(entry.path)
      setDialog({ kind: 'edit', path: entry.path, content, dirty: false })
      return
    }
    setDialog({ kind: 'preview', path: entry.path, mime: entry.mime })
  }

  function toggleSelect(pathName: string, additive: boolean) {
    setSelected((cur) => {
      if (!additive) return [pathName]
      return cur.includes(pathName) ? cur.filter((p) => p !== pathName) : [...cur, pathName]
    })
  }

  function simulateUpload(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    const existing = (q.data ?? []).some((e) => e.name === list[0].name)
    if (existing) {
      setDialog({ kind: 'conflict', name: list[0].name })
      return
    }
    setUploadPct(8)
    let p = 8
    const id = window.setInterval(() => {
      p = Math.min(100, p + 18)
      setUploadPct(p)
      if (p >= 100) {
        window.clearInterval(id)
        void api.mkfile(path, list[0].name).then(() => {
          setUploadPct(null)
          toast({ kind: 'success', title: `Uploaded ${list.length} file(s)` })
          void qc.invalidateQueries({ queryKey: ['files', path] })
        })
      }
    }, 180)
  }

  return (
    <div
      className="flex h-[calc(100dvh-7rem)] flex-col gap-3"
      onClick={() => setMenu(null)}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files.length) simulateUpload(e.dataTransfer.files)
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            go(pathInput)
          }}
        >
          <Button size="sm" onClick={() => go(path.split('/').slice(0, -1).join('/') || '/')} type="button">
            Up
          </Button>
          <Input value={pathInput} onChange={(e) => setPathInput(e.target.value)} aria-label="Path" />
        </form>
        <Input className="w-40" placeholder="Search here" value={search} onChange={(e) => setSearch(e.target.value)} />
        <SelectLike sort={sort} setSort={setSort} />
        <Button size="sm" onClick={() => setHidden((h) => !h)}>{hidden ? 'Hide hidden' : 'Show hidden'}</Button>
        <Button size="sm" onClick={() => setView((v) => (v === 'list' ? 'grid' : 'list'))} aria-label="Toggle view">
          {view === 'list' ? <Grid3x3 className="size-4" /> : <ListIcon className="size-4" />}
        </Button>
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Upload
        </Button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && simulateUpload(e.target.files)} />
      </div>
      <div className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)]">
        <button className="hover:text-[var(--text)]" onClick={() => go('/')}>/</button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3" />
            <button className="hover:text-[var(--text)]" onClick={() => go('/' + crumbs.slice(0, i + 1).join('/'))}>
              {c}
            </button>
          </span>
        ))}
        <div className="ml-auto flex flex-wrap gap-1">
          {bookmarks.map((b) => (
            <Button key={b} size="sm" variant="ghost" onClick={() => go(b)}>
              {b}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setBookmarks((b) => (b.includes(path) ? b : [...b, path]))}>
            Bookmark
          </Button>
        </div>
      </div>
      {uploadPct != null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
          <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${uploadPct}%` }} />
        </div>
      )}
      <Card className={cn('min-h-0 flex-1 overflow-auto', dragOver && 'ring-2 ring-emerald-400')}>
        {view === 'list' ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--surface)] text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Modified</th>
                <th className="px-4 py-2">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.path}
                  className={cn('cursor-pointer border-t border-[var(--border)] hover:bg-[var(--muted)]', selected.includes(e.path) && 'bg-emerald-500/10')}
                  onClick={(ev) => toggleSelect(e.path, ev.ctrlKey || ev.metaKey)}
                  onDoubleClick={() => void openItem(e)}
                  onContextMenu={(ev) => {
                    ev.preventDefault()
                    if (!selected.includes(e.path)) setSelected([e.path])
                    setMenu({ x: ev.clientX, y: ev.clientY })
                  }}
                >
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-2">
                      {e.type === 'dir' ? <Folder className="size-4 text-sky-400" /> : <FileIcon className="size-4 text-slate-400" />}
                      {e.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 tabular">{e.type === 'dir' ? '—' : formatBytes(e.size)}</td>
                  <td className="px-4 py-2 text-xs">{formatDateTime(e.modified)}</td>
                  <td className="px-4 py-2 font-mono text-xs">{e.mode} {e.owner}:{e.group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 lg:grid-cols-6">
            {entries.map((e) => (
              <button
                key={e.path}
                className={cn('flex flex-col items-center gap-2 rounded-lg p-3 text-xs hover:bg-[var(--muted)]', selected.includes(e.path) && 'bg-emerald-500/10')}
                onClick={(ev) => toggleSelect(e.path, ev.ctrlKey || ev.metaKey)}
                onDoubleClick={() => void openItem(e)}
                onContextMenu={(ev) => {
                  ev.preventDefault()
                  setSelected([e.path])
                  setMenu({ x: ev.clientX, y: ev.clientY })
                }}
              >
                {e.type === 'dir' ? <Folder className="size-8 text-sky-400" /> : <FileIcon className="size-8 text-slate-400" />}
                <span className="w-full truncate text-center">{e.name}</span>
              </button>
            ))}
          </div>
        )}
      </Card>
      {menu && (
        <ul
          className="fixed z-50 min-w-40 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 text-sm shadow-xl"
          style={{ left: menu.x, top: menu.y }}
        >
          <MenuItem onClick={() => setDialog({ kind: 'mkfile', value: 'untitled.txt' })}>New file</MenuItem>
          <MenuItem onClick={() => setDialog({ kind: 'mkdir', value: 'new-folder' })}>New folder</MenuItem>
          <MenuItem onClick={() => selected[0] && setDialog({ kind: 'rename', value: selected[0].split('/').pop() ?? '' })}>Rename</MenuItem>
          <MenuItem onClick={() => setClip({ mode: 'copy', paths: selected })}>Copy</MenuItem>
          <MenuItem onClick={() => setClip({ mode: 'cut', paths: selected })}>Cut</MenuItem>
          <MenuItem
            onClick={() => {
              if (clip) toast({ kind: 'success', title: `Pasted ${clip.paths.length} item(s)` })
            }}
          >
            Paste
          </MenuItem>
          <MenuItem onClick={() => setDialog({ kind: 'chmod', value: '-rw-r--r--' })}>Permissions</MenuItem>
          <MenuItem onClick={() => setDialog({ kind: 'symlink', value: 'link' })}>Create symlink</MenuItem>
          <MenuItem
            onClick={() => {
              const entry = entries.find((e) => e.path === selected[0])
              if (entry) setDialog({ kind: 'props', entry })
            }}
          >
            Properties
          </MenuItem>
          <MenuItem onClick={() => setDialog({ kind: 'delete' })}>Delete</MenuItem>
        </ul>
      )}

      <Modal
        open={dialog?.kind === 'mkdir' || dialog?.kind === 'mkfile' || dialog?.kind === 'rename' || dialog?.kind === 'symlink'}
        title={dialog?.kind === 'mkdir' ? 'New folder' : dialog?.kind === 'mkfile' ? 'New file' : dialog?.kind === 'symlink' ? 'Create symlink' : 'Rename'}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (dialog?.kind === 'mkdir') mkdir.mutate()
                if (dialog?.kind === 'mkfile') mkfile.mutate()
                if (dialog?.kind === 'rename') rename.mutate()
                if (dialog?.kind === 'symlink') {
                  toast({ kind: 'success', title: 'Symlink created' })
                  setDialog(null)
                }
              }}
            >
              OK
            </Button>
          </>
        }
      >
        <Field label="Name">
          <Input
            value={dialog && 'value' in dialog ? dialog.value : ''}
            onChange={(e) => dialog && 'value' in dialog && setDialog({ ...dialog, value: e.target.value })}
          />
        </Field>
      </Modal>

      <Modal
        open={dialog?.kind === 'chmod'}
        title="Permissions"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => chmod.mutate()}>Apply</Button>
          </>
        }
      >
        <Field label="Mode" hint="Applies to selected items.">
          <Input value={dialog?.kind === 'chmod' ? dialog.value : ''} onChange={(e) => setDialog({ kind: 'chmod', value: e.target.value })} />
        </Field>
      </Modal>

      <Modal
        open={dialog?.kind === 'delete'}
        title="Delete selected?"
        danger
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>Delete</Button>
          </>
        }
      >
        <p>{selected.length} item(s) will be removed. This respects filesystem permissions.</p>
      </Modal>

      <Modal
        open={dialog?.kind === 'edit'}
        title={dialog?.kind === 'edit' ? dialog.path : 'Editor'}
        onClose={() => {
          if (dialog?.kind === 'edit' && dialog.dirty && !window.confirm('Discard unsaved changes?')) return
          setDialog(null)
        }}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Close</Button>
            <Button variant="primary" loading={saveFile.isPending} onClick={() => saveFile.mutate()}>Save</Button>
          </>
        }
      >
        {dialog?.kind === 'edit' && (
          <textarea
            className="min-h-64 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 font-mono text-xs"
            value={dialog.content}
            onChange={(e) => setDialog({ ...dialog, content: e.target.value, dirty: true })}
          />
        )}
      </Modal>

      <Modal open={dialog?.kind === 'preview'} title="Preview" onClose={() => setDialog(null)}>
        {dialog?.kind === 'preview' && (
          <div className="text-sm text-[var(--text-muted)]">
            Preview for {dialog.path} ({dialog.mime ?? 'unknown'}). Browser-native preview is used when the backend streams the object.
          </div>
        )}
      </Modal>

      <Modal open={dialog?.kind === 'props'} title="Properties" onClose={() => setDialog(null)}>
        {dialog?.kind === 'props' && (
          <dl className="space-y-1 text-sm">
            <p>Path {dialog.entry.path}</p>
            <p>Size {formatBytes(dialog.entry.size)}</p>
            <p>Modified {formatDateTime(dialog.entry.modified)}</p>
            <p>Mode {dialog.entry.mode}</p>
            <p>Owner {dialog.entry.owner}:{dialog.entry.group}</p>
            <p>MIME {dialog.entry.mime ?? '—'}</p>
          </dl>
        )}
      </Modal>

      <Modal
        open={dialog?.kind === 'conflict'}
        title="File already exists"
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Skip</Button>
            <Button onClick={() => { toast({ kind: 'info', title: 'Renamed on upload' }); setDialog(null) }}>Rename</Button>
            <Button variant="primary" onClick={() => { toast({ kind: 'warning', title: 'Overwritten' }); setDialog(null) }}>Overwrite</Button>
          </>
        }
      >
        <p>{dialog?.kind === 'conflict' ? dialog.name : ''} already exists in this directory.</p>
      </Modal>
    </div>
  )
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <li>
      <button className="w-full px-3 py-1.5 text-left hover:bg-[var(--muted)]" onClick={onClick}>
        {children}
      </button>
    </li>
  )
}

function SelectLike({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  return (
    <select
      className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 text-sm"
      value={sort}
      onChange={(e) => setSort(e.target.value as SortKey)}
      aria-label="Sort"
    >
      <option value="name">Name</option>
      <option value="size">Size</option>
      <option value="modified">Modified</option>
      <option value="type">Type</option>
    </select>
  )
}
