import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import { listOrgInterviews } from '../services/interviews'
import { INTERVIEW_MODES, INTERVIEW_STATUSES } from '../lib/constants'
import { formatDateTime } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function OrgInterviews() {
  const { org, user } = useAuth()
  const [mineOnly, setMineOnly] = useState(false)
  const query = useLoad(() => listOrgInterviews(org.id), [org.id])

  return (
    <div>
      <PageHeader title="Interviews">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Only mine
        </label>
      </PageHeader>
      <Async query={query}>
        {(rows) => {
          const shown = rows.filter((i) => !mineOnly || i.interview_participants.some((p) => p.user_id === user.id))
          const now = Date.now()
          const upcoming = shown.filter((i) => new Date(i.ends_at) >= now && i.status === 'scheduled').reverse()
          const past = shown.filter((i) => !upcoming.includes(i))
          if (shown.length === 0)
            return <EmptyState icon={CalendarClock} title="No interviews yet. Schedule one from a candidate page." />
          const list = (items) => (
            <ul className="card divide-y divide-soft">
              {items.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <Link to={`/org/applications/${i.application_id}`} className="block truncate font-medium hover:text-primary">
                      {i.applications.profiles?.full_name} · {i.applications.jobs.title}
                    </Link>
                    <span className="text-small text-muted">
                      {i.title} · {formatDateTime(i.starts_at)} · {INTERVIEW_MODES[i.mode]} · With{' '}
                      {i.interview_participants.map((p) => p.profiles?.full_name).join(', ')}
                    </span>
                  </div>
                  <Badge value={i.status} label={INTERVIEW_STATUSES[i.status]} />
                </li>
              ))}
            </ul>
          )
          return (
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 text-section font-semibold">Upcoming</h2>
                {upcoming.length ? list(upcoming) : <p className="text-muted">Nothing coming up.</p>}
              </section>
              {past.length > 0 && (
                <section>
                  <h2 className="mb-3 text-section font-semibold">Past and cancelled</h2>
                  {list(past)}
                </section>
              )}
            </div>
          )
        }}
      </Async>
    </div>
  )
}
