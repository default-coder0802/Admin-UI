import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Field, Input, Select } from '../../components/Input'
import { Modal } from '../../components/Modal'
import { api } from '../../lib/api'
import type { Account, Group } from '../../lib/types'
import { useUi } from '../../stores/ui'

const emptyUser = (): Partial<Account> & { username: string; password?: string } => ({
  username: '',
  fullName: '',
  shell: '/bin/bash',
  home: '',
  groups: [],
  password: '',
})

export function AccountsPage() {
  const qc = useQueryClient()
  const toast = useUi((s) => s.pushToast)
  const q = useQuery({ queryKey: ['accounts'], queryFn: api.accounts })
  const [tab, setTab] = useState<'users' | 'groups'>('users')
  const [query, setQuery] = useState('')
  const [edit, setEdit] = useState<(Partial<Account> & { username: string; password?: string }) | null>(null)
  const [group, setGroup] = useState<Partial<Group> & { name: string } | null>(null)
  const [del, setDel] = useState<string | null>(null)

  const users = useMemo(() => {
    const list = q.data?.users ?? []
    const s = query.toLowerCase()
    return list.filter((u) => u.username.includes(s) || u.fullName.toLowerCase().includes(s))
  }, [q.data, query])

  const save = useMutation({
    mutationFn: () => api.saveAccount(edit!),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Account saved', message: 'Change audited.' })
      setEdit(null)
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const remove = useMutation({
    mutationFn: () => api.deleteAccount(del!),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Account deleted' })
      setDel(null)
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
  const saveGroup = useMutation({
    mutationFn: () => api.saveGroup(group!),
    onSuccess: () => {
      toast({ kind: 'success', title: 'Group saved' })
      setGroup(null)
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[var(--border)] p-0.5">
          <Button size="sm" variant={tab === 'users' ? 'primary' : 'ghost'} onClick={() => setTab('users')}>Users</Button>
          <Button size="sm" variant={tab === 'groups' ? 'primary' : 'ghost'} onClick={() => setTab('groups')}>Groups</Button>
        </div>
        <Input className="max-w-xs" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        {tab === 'users' ? (
          <Button className="ml-auto" variant="primary" size="sm" onClick={() => setEdit(emptyUser())}>Create user</Button>
        ) : (
          <Button className="ml-auto" variant="primary" size="sm" onClick={() => setGroup({ name: '', members: [] })}>Create group</Button>
        )}
      </div>

      {tab === 'users' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">UID</th>
                  <th className="px-4 py-2">Home</th>
                  <th className="px-4 py-2">Shell</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.username} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2">
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-[var(--text-muted)]">{u.fullName}</p>
                    </td>
                    <td className="px-4 py-2 tabular">{u.uid}</td>
                    <td className="px-4 py-2 font-mono text-xs">{u.home}</td>
                    <td className="px-4 py-2 font-mono text-xs">{u.shell}</td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {u.locked && <Badge tone="warn">locked</Badge>}
                        {u.expired && <Badge tone="crit">expired</Badge>}
                        {u.system && <Badge>system</Badge>}
                        {!u.locked && !u.expired && !u.system && <Badge tone="ok">active</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button size="sm" onClick={() => setEdit({ ...u, password: '' })}>Edit</Button>
                      {!u.system && (
                        <Button size="sm" variant="ghost" className="ml-1" onClick={() => setDel(u.username)}>
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'groups' && (
        <Card>
          <ul className="divide-y divide-[var(--border)]">
            {(q.data?.groups ?? []).map((g) => (
              <li key={g.name} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{g.name} <span className="text-xs text-[var(--text-muted)]">gid {g.gid}</span></p>
                  <p className="text-xs text-[var(--text-muted)]">{g.members.join(', ') || 'no members'}</p>
                </div>
                <Button size="sm" onClick={() => setGroup({ ...g })}>Edit</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={!!edit}
        title={edit?.uid ? `Edit ${edit.username}` : 'Create user'}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button onClick={() => setEdit(null)}>Cancel</Button>
            <Button variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save</Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-3">
            {edit.system && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Critical system account. Changes require extra care.</p>}
            <Field label="Username">
              <Input value={edit.username} onChange={(e) => setEdit({ ...edit, username: e.target.value })} disabled={!!edit.uid} />
            </Field>
            <Field label="Full name">
              <Input value={edit.fullName ?? ''} onChange={(e) => setEdit({ ...edit, fullName: e.target.value })} />
            </Field>
            <Field label="Password" hint="Never stored in plaintext. Leave blank to keep current.">
              <Input type="password" value={edit.password ?? ''} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
            </Field>
            <Field label="Shell">
              <Select value={edit.shell} onChange={(e) => setEdit({ ...edit, shell: e.target.value })}>
                {['/bin/bash', '/bin/sh', '/usr/sbin/nologin', '/bin/zsh'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!edit.locked} onChange={(e) => setEdit({ ...edit, locked: e.target.checked })} />
              Lock account
            </label>
          </div>
        )}
      </Modal>

      <Modal
        open={!!group}
        title={group?.gid ? `Edit ${group.name}` : 'Create group'}
        onClose={() => setGroup(null)}
        footer={
          <>
            <Button onClick={() => setGroup(null)}>Cancel</Button>
            <Button variant="primary" loading={saveGroup.isPending} onClick={() => saveGroup.mutate()}>Save</Button>
          </>
        }
      >
        {group && (
          <div className="space-y-3">
            <Field label="Name">
              <Input value={group.name} onChange={(e) => setGroup({ ...group, name: e.target.value })} disabled={!!group.gid} />
            </Field>
            <Field label="Members" hint="Comma-separated usernames">
              <Input
                value={(group.members ?? []).join(', ')}
                onChange={(e) => setGroup({ ...group, members: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
              />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!del}
        title={`Delete ${del}?`}
        danger
        onClose={() => setDel(null)}
        footer={
          <>
            <Button onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate()}>Delete</Button>
          </>
        }
      >
        <p>Optionally remove the home directory. This cannot be undone.</p>
      </Modal>
    </div>
  )
}
