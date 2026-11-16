import { useState } from 'react'
import { Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { listUsers, setUserActive } from '../services/admin'
import { formatDate } from '../lib/format'
import { publicUrl } from '../services/storage'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { Select } from '../components/Field'
import PageHeader from '../components/PageHeader'

const ROLES = { super_admin: 'Super admin', organization_user: 'Company', job_seeker: 'Job seeker' }

export default function AdminUsers() {
  const { user } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const query = useLoad(() => listUsers({ q, role }), [q, role])

  async function toggle(person) {
    setBusy(true)
    try {
      await setUserActive(person.id, !person.is_active)
      toast.success(person.is_active ? 'User suspended' : 'User restored')
      setTarget(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Users" />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <input className="input" placeholder="Search by name or email" aria-label="Search users" onChange={(e) => setQ(e.target.value.trim())} />
        <Select placeholder="All types" aria-label="Type" value={role} onChange={(e) => setRole(e.target.value)} options={Object.entries(ROLES).map(([value, label]) => ({ value, label }))} />
      </div>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState icon={Users} title="No users found." />
          ) : (
            <ul className="card divide-y divide-soft">
              {rows.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={p.full_name} src={publicUrl('avatars', p.avatar_path)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.full_name || p.email}</p>
                    <p className="truncate text-small text-muted">
                      {p.email} · Joined {formatDate(p.created_at)}
                    </p>
                  </div>
                  <Badge tone="muted" label={ROLES[p.platform_role]} />
                  {!p.is_active && <Badge value="suspended" label="Suspended" />}
                  {p.id !== user.id && p.platform_role !== 'super_admin' && (
                    <Button variant="secondary" onClick={() => (p.is_active ? setTarget(p) : toggle(p))}>
                      {p.is_active ? 'Suspend' : 'Restore'}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </Async>
      <ConfirmDialog open={!!target} title="Suspend this user?" message="They will not be able to log in until you restore them." confirmLabel="Suspend" danger loading={busy} onConfirm={() => toggle(target)} onClose={() => setTarget(null)} />
    </div>
  )
}
