import { Link } from 'react-router-dom'
import { ListChecks } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import { listMyApplications } from '../services/applications'
import { listMyInterviews } from '../services/interviews'
import { APPLICATION_STATUSES } from '../lib/constants'
import { formatDateTime, timeAgo } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import { buttonClass } from '../components/Button'
import EmptyState from '../components/EmptyState'
import Hero, { greeting } from '../components/Hero'
import { StatGrid } from '../components/Stats'

export default function SeekerDashboard() {
  const { user, profile } = useAuth()
  const query = useLoad(async () => {
    const [applications, interviews] = await Promise.all([listMyApplications(user.id), listMyInterviews()])
    return { applications, interviews }
  }, [user.id])

  return (
    <div>
      <Async query={query}>
        {({ applications, interviews }) => {
          const upcoming = interviews.filter((i) => i.status === 'scheduled' && new Date(i.starts_at) > new Date())
          const active = applications.filter((a) => !['hired', 'rejected', 'withdrawn'].includes(a.status))
          return (
            <div className="space-y-6">
              <Hero
                title={greeting(profile?.full_name?.split(' ')[0])}
                text={
                  upcoming.length
                    ? `You have ${upcoming.length} upcoming interview${upcoming.length === 1 ? '' : 's'}.`
                    : active.length
                      ? `${active.length} application${active.length === 1 ? ' is' : 's are'} in progress.`
                      : 'Find a job you like and apply in a minute.'
                }
                action={
                  <Link to={upcoming.length ? '/seeker/interviews' : '/jobs'} className={`${buttonClass('secondary')} bg-primary-fg text-primary`}>
                    {upcoming.length ? 'See interviews' : 'Find jobs'}
                  </Link>
                }
              />
              <StatGrid
                items={[
                  { label: 'Applications', value: applications.length },
                  { label: 'In progress', value: active.length },
                  { label: 'Upcoming interviews', value: upcoming.length },
                  { label: 'Offers', value: applications.filter((a) => a.status === 'offered' || a.status === 'hired').length },
                ]}
              />
              <section>
                <h2 className="mb-3 text-section font-semibold">Recent applications</h2>
                {applications.length === 0 ? (
                  <EmptyState icon={ListChecks} title="You have not applied to any job yet." action={<Link to="/jobs" className={buttonClass('primary')}>Find jobs</Link>} />
                ) : (
                  <ul className="card divide-y divide-soft">
                    {applications.slice(0, 5).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link to={`/jobs/${a.jobs.slug}`} className="block truncate font-medium hover:text-primary">
                            {a.jobs.title}
                          </Link>
                          <span className="text-small text-muted">
                            {a.jobs.organizations.name} · {timeAgo(a.applied_at)}
                          </span>
                        </div>
                        <Badge value={a.status} label={APPLICATION_STATUSES[a.status]} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {upcoming.length > 0 && (
                <section>
                  <h2 className="mb-3 text-section font-semibold">Next interview</h2>
                  <div className="card">
                    <p className="font-medium">{upcoming[0].applications.jobs.title}</p>
                    <p className="text-muted">
                      {upcoming[0].title} · {formatDateTime(upcoming[0].starts_at)}
                    </p>
                  </div>
                </section>
              )}
            </div>
          )
        }}
      </Async>
    </div>
  )
}
