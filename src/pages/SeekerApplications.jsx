import { useState } from 'react'
import { Link } from 'react-router-dom'
import { History, ListChecks, MessageSquare, Undo2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { getTimeline, listMyApplications, withdrawApplication } from '../services/applications'
import { APPLICATION_STATUSES } from '../lib/constants'
import { formatDate, formatDateTime } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import { buttonClass } from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import IconButton from '../components/IconButton'
import MessageThread from '../components/MessageThread'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

function Timeline({ id }) {
  const query = useLoad(() => getTimeline(id), [id])
  return (
    <Async query={query}>
      {(rows) => (
        <ol className="space-y-3">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <Badge value={r.to_status} label={APPLICATION_STATUSES[r.to_status]} />
              <span className="text-muted">{formatDateTime(r.created_at)}</span>
            </li>
          ))}
        </ol>
      )}
    </Async>
  )
}

export default function SeekerApplications() {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => listMyApplications(user.id), [user.id])
  const [panel, setPanel] = useState(null) // { kind: 'timeline' | 'messages', app }
  const [withdraw, setWithdraw] = useState(null)
  const [busy, setBusy] = useState(false)

  async function confirmWithdraw() {
    setBusy(true)
    try {
      await withdrawApplication(withdraw.id)
      toast.success('Application withdrawn')
      setWithdraw(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Applications" />
      <Async query={query}>
        {(apps) =>
          apps.length === 0 ? (
            <EmptyState icon={ListChecks} title="You have not applied to any job yet." action={<Link to="/jobs" className={buttonClass('primary')}>Find jobs</Link>} />
          ) : (
            <ul className="card divide-y divide-soft">
              {apps.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link to={`/jobs/${a.jobs.slug}`} className="block truncate font-medium hover:text-primary">
                      {a.jobs.title}
                    </Link>
                    <span className="text-small text-muted">
                      {a.jobs.organizations.name} · Applied {formatDate(a.applied_at)}
                    </span>
                  </div>
                  <Badge value={a.status} label={APPLICATION_STATUSES[a.status]} />
                  <div className="flex">
                    <IconButton label="See progress" onClick={() => setPanel({ kind: 'timeline', app: a })}>
                      <History />
                    </IconButton>
                    <IconButton label="Messages" onClick={() => setPanel({ kind: 'messages', app: a })}>
                      <MessageSquare />
                    </IconButton>
                    {!['hired', 'rejected', 'withdrawn'].includes(a.status) && (
                      <IconButton label="Withdraw" danger onClick={() => setWithdraw(a)}>
                        <Undo2 />
                      </IconButton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </Async>
      <Modal open={!!panel} title={panel?.kind === 'timeline' ? 'Progress' : 'Messages'} onClose={() => setPanel(null)}>
        {panel?.kind === 'timeline' && <Timeline id={panel.app.id} />}
        {panel?.kind === 'messages' && <MessageThread applicationId={panel.app.id} />}
      </Modal>
      <ConfirmDialog open={!!withdraw} title="Withdraw application?" message="The company will no longer consider you for this job. You cannot apply again." confirmLabel="Withdraw" danger loading={busy} onConfirm={confirmWithdraw} onClose={() => setWithdraw(null)} />
    </div>
  )
}
