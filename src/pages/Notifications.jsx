import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Settings2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import {
  getPreferences,
  listNotifications,
  markAllRead,
  markRead,
  removeNotification,
  savePreference,
  subscribeToNotifications,
} from '../services/notifications'
import { NOTIFICATION_TYPES } from '../lib/constants'
import { timeAgo } from '../lib/format'
import Async from '../components/Async'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import Spinner from '../components/Spinner'

function Preferences({ open, onClose }) {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => getPreferences(user.id), [open])

  async function toggle(type, field, value, current) {
    try {
      await savePreference(user.id, type, { in_app: current.in_app, email: current.email, [field]: value })
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Modal open={open} title="Notification settings" onClose={onClose}>
      {query.loading && !query.data ? (
        <Spinner />
      ) : (
        <div>
          <div className="mb-2 grid grid-cols-[1fr_56px_56px] gap-2 text-small font-medium text-muted">
            <span />
            <span>In app</span>
            <span>Email</span>
          </div>
          <ul className="divide-y divide-soft">
            {Object.entries(NOTIFICATION_TYPES).map(([type, label]) => {
              const pref = (query.data || []).find((p) => p.type === type) || { in_app: true, email: true }
              return (
                <li key={type} className="grid grid-cols-[1fr_56px_56px] items-center gap-2 py-2">
                  <span>{label}</span>
                  <input type="checkbox" aria-label={`${label} in app`} checked={pref.in_app} onChange={(e) => toggle(type, 'in_app', e.target.checked, pref)} />
                  <input type="checkbox" aria-label={`${label} email`} checked={pref.email} onChange={(e) => toggle(type, 'email', e.target.checked, pref)} />
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Modal>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const query = useLoad(() => listNotifications(), [])
  const [settings, setSettings] = useState(false)

  useEffect(() => subscribeToNotifications(user.id, query.reload), [user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function open(n) {
    try {
      if (!n.is_read) await markRead(n.id)
      if (n.link) navigate(n.link)
      else query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function readAll() {
    try {
      await markAllRead()
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function remove(n) {
    try {
      await removeNotification(n.id)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <PageHeader title="Notifications">
        <Button variant="secondary" onClick={readAll}>
          <CheckCheck />
          Mark all read
        </Button>
        <IconButton label="Settings" onClick={() => setSettings(true)}>
          <Settings2 />
        </IconButton>
      </PageHeader>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState icon={Bell} title="You are all caught up." />
          ) : (
            <ul className="card divide-y divide-soft">
              {rows.map((n) => (
                <li key={n.id} className="flex items-start gap-2 py-3 first:pt-0 last:pb-0">
                  <button type="button" onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                    <span className="min-w-0">
                      <span className={`block ${n.is_read ? '' : 'font-semibold'}`}>{n.title}</span>
                      {n.body && <span className="block truncate text-muted">{n.body}</span>}
                      <span className="text-small text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                  <IconButton label="Delete" onClick={() => remove(n)}>
                    <X />
                  </IconButton>
                </li>
              ))}
            </ul>
          )
        }
      </Async>
      <Preferences open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
