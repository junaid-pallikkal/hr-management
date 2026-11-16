import { useState } from 'react'
import { Copy, Link2, MailPlus, Trash2, UserX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { createInvitation, listInvitations, listMembers, removeMember, renewInvitation, revokeInvitation, updateMember } from '../services/team'
import { MEMBER_ROLES, toOptions } from '../lib/constants'
import { formatDate } from '../lib/format'
import { publicUrl } from '../services/storage'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import Field, { Select } from '../components/Field'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function OrgTeam() {
  const { org, orgRole, user } = useAuth()
  const toast = useToast()
  const isAdmin = orgRole === 'org_admin'
  const members = useLoad(() => listMembers(org.id), [org.id])
  const invites = useLoad(() => listInvitations(org.id), [org.id])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('recruiter')
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'remove' | 'suspend', member }

  const roleOptions = toOptions(MEMBER_ROLES).filter((o) => isAdmin || o.value === 'recruiter')
  const canManage = (m) => m.user_id !== user.id && (isAdmin || m.role === 'recruiter')

  async function invite() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email.')
    setError('')
    setSaving(true)
    try {
      setLink(await createInvitation(org.id, user.id, email, role))
      invites.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy. Please select and copy the link.')
    }
  }

  async function act(fn, message) {
    try {
      await fn()
      toast.success(message)
      members.reload()
      invites.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function renew(inv) {
    try {
      const url = await renewInvitation(inv.id)
      await copy(url)
      invites.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmAction() {
    setSaving(true)
    const { kind, member } = confirm
    await act(() => (kind === 'remove' ? removeMember(member.id) : updateMember(member.id, { status: 'suspended' })), kind === 'remove' ? 'Member removed' : 'Member suspended')
    setSaving(false)
    setConfirm(null)
  }

  function closeInvite() {
    setInviteOpen(false)
    setLink('')
    setEmail('')
    setRole('recruiter')
    setError('')
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Team">
          <Button onClick={() => setInviteOpen(true)}>
            <MailPlus />
            Invite
          </Button>
        </PageHeader>
        <Async query={members}>
          {(rows) => (
            <ul className="card divide-y divide-soft">
              {rows.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={m.profiles?.full_name} src={publicUrl('avatars', m.profiles?.avatar_path)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.profiles?.full_name || m.profiles?.email}</p>
                    <p className="truncate text-small text-muted">{m.profiles?.email}</p>
                  </div>
                  {m.status === 'suspended' && <Badge value="suspended" label="Suspended" />}
                  {canManage(m) ? (
                    <div className="w-36">
                      <Select aria-label={`Role of ${m.profiles?.full_name}`} value={m.role} onChange={(e) => act(() => updateMember(m.id, { role: e.target.value }), 'Role changed')} options={roleOptions} />
                    </div>
                  ) : (
                    <Badge tone="muted" label={MEMBER_ROLES[m.role]} />
                  )}
                  {canManage(m) && (
                    <div className="flex">
                      {m.status === 'suspended' ? (
                        <Button variant="secondary" onClick={() => act(() => updateMember(m.id, { status: 'active' }), 'Member restored')}>
                          Restore
                        </Button>
                      ) : (
                        <IconButton label="Suspend" onClick={() => setConfirm({ kind: 'suspend', member: m })}>
                          <UserX />
                        </IconButton>
                      )}
                      <IconButton label="Remove" danger onClick={() => setConfirm({ kind: 'remove', member: m })}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Async>
      </div>

      <section>
        <h2 className="mb-3 text-section font-semibold">Invitations</h2>
        <Async query={invites}>
          {(rows) =>
            rows.length === 0 ? (
              <p className="text-muted">No pending invitations.</p>
            ) : (
              <ul className="card divide-y divide-soft">
                {rows.map((inv) => {
                  const expired = inv.status === 'expired' || new Date(inv.expires_at) < new Date()
                  return (
                    <li key={inv.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{inv.email}</p>
                        <p className="text-small text-muted">
                          {MEMBER_ROLES[inv.role]} · {expired ? 'Expired' : `Expires ${formatDate(inv.expires_at)}`}
                        </p>
                      </div>
                      <IconButton label="New link (copy)" onClick={() => renew(inv)}>
                        <Link2 />
                      </IconButton>
                      <IconButton label="Cancel invitation" danger onClick={() => act(() => revokeInvitation(inv.id), 'Invitation cancelled')}>
                        <Trash2 />
                      </IconButton>
                    </li>
                  )
                })}
              </ul>
            )
          }
        </Async>
      </section>

      <Modal
        open={inviteOpen}
        title="Invite team member"
        onClose={closeInvite}
        footer={
          link ? (
            <Button onClick={closeInvite}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeInvite}>
                Cancel
              </Button>
              <Button loading={saving} onClick={invite}>
                Create invitation
              </Button>
            </>
          )
        }
      >
        {link ? (
          <div className="space-y-3">
            <p>Send this link to {email}. It works once, for 7 days.</p>
            <div className="flex gap-2">
              <input className="input" readOnly value={link} aria-label="Invitation link" onFocus={(e) => e.target.select()} />
              <IconButton label="Copy link" onClick={() => copy(link)}>
                <Copy />
              </IconButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Email" error={error}>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Role">
              <Select value={role} onChange={(e) => setRole(e.target.value)} options={roleOptions} />
            </Field>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === 'remove' ? 'Remove member?' : 'Suspend member?'}
        message={confirm?.kind === 'remove' ? 'They will lose access to this organization.' : 'They cannot use this organization until you restore them.'}
        confirmLabel={confirm?.kind === 'remove' ? 'Remove' : 'Suspend'}
        danger
        loading={saving}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
