import { CalendarClock } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import { listMyInterviews } from '../services/interviews'
import { INTERVIEW_MODES, INTERVIEW_STATUSES } from '../lib/constants'
import { formatDateTime } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'

export default function SeekerInterviews() {
  const query = useLoad(listMyInterviews, [])
  return (
    <div>
      <PageHeader title="Interviews" />
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No interviews yet. We will tell you when one is scheduled." />
          ) : (
            <ul className="grid gap-3">
              {rows.map((i) => {
                const people = i.interview_participants.map((p) => p.profiles?.full_name).filter(Boolean).join(', ')
                const place = i.location_or_link
                return (
                  <li key={i.id} className="card space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">
                        {i.applications.jobs.title} · {i.title}
                      </p>
                      <Badge value={i.status} label={INTERVIEW_STATUSES[i.status]} />
                    </div>
                    <p className="text-muted">
                      {i.applications.jobs.organizations.name} · {formatDateTime(i.starts_at)} · {INTERVIEW_MODES[i.mode]}
                    </p>
                    {place && (
                      <p>
                        {/^https?:\/\//.test(place) ? (
                          <a href={place} target="_blank" rel="noopener noreferrer" className="text-primary">
                            Join link
                          </a>
                        ) : (
                          place
                        )}
                      </p>
                    )}
                    {people && <p className="text-muted">With {people}</p>}
                    {i.instructions && <p className="whitespace-pre-line">{i.instructions}</p>}
                  </li>
                )
              })}
            </ul>
          )
        }
      </Async>
    </div>
  )
}
