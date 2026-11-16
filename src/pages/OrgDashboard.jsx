import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import { getDashboardStats } from '../services/organizations'
import { listRecentApplications } from '../services/applications'
import { listOrgJobs } from '../services/jobs'
import { listOrgInterviews } from '../services/interviews'
import { publicUrl } from '../services/storage'
import { APPLICATION_STATUSES } from '../lib/constants'
import { timeAgo } from '../lib/format'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import { buttonClass } from '../components/Button'
import EmptyState from '../components/EmptyState'
import Hero, { greeting } from '../components/Hero'
import { StatGrid } from '../components/Stats'

const TILE_TONES = ['bg-primary/10 text-primary', 'bg-success/10 text-success', 'bg-warning/10 text-warning', 'bg-danger/10 text-danger']

function Schedule({ interviews }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
  const [selected, setSelected] = useState(0)
  const onDay = (d) => interviews.filter((i) => i.status === 'scheduled' && new Date(i.starts_at).toDateString() === d.toDateString())
  const todays = onDay(days[selected]).sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))

  return (
    <section className="card space-y-4">
      <h2 className="text-section font-semibold">
        Schedule <span className="font-normal text-muted">· {days[0].toLocaleDateString(undefined, { month: 'long' })}</span>
      </h2>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className={`flex flex-col items-center gap-0.5 rounded-ui py-2 transition ${selected === i ? 'bg-primary text-primary-fg shadow-soft' : 'bg-soft hover:opacity-80'}`}
          >
            <span className="text-small opacity-80">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
            <span className="font-semibold">{d.getDate()}</span>
            <span className={`h-1 w-1 rounded-full ${onDay(d).length ? (selected === i ? 'bg-primary-fg' : 'bg-primary') : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
      {todays.length === 0 ? (
        <p className="text-muted">No interviews this day.</p>
      ) : (
        <ul className="space-y-3">
          {todays.map((i) => (
            <li key={i.id} className="flex gap-3">
              <span className="w-12 shrink-0 font-semibold text-primary">{new Date(i.starts_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
              <Link to={`/org/applications/${i.application_id}`} className="min-w-0 hover:text-primary">
                <span className="block truncate font-medium">{i.applications.profiles?.full_name}</span>
                <span className="block truncate text-small text-muted">
                  {i.title} · {i.applications.jobs.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function OrgDashboard() {
  const { org, profile } = useAuth()
  const query = useLoad(async () => {
    const [stats, recent, jobs, interviews] = await Promise.all([
      getDashboardStats(org.id),
      listRecentApplications(org.id, 8),
      listOrgJobs(org.id),
      listOrgInterviews(org.id),
    ])
    return { stats, recent, jobs, interviews }
  }, [org.id])

  return (
    <Async query={query}>
      {({ stats, recent, jobs, interviews }) => {
        const open = jobs
          .filter((j) => j.status === 'published')
          .sort((a, b) => (b.applications?.[0]?.count || 0) - (a.applications?.[0]?.count || 0))
          .slice(0, 6)
        const n = stats.new_applications_week
        return (
          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6">
              <Hero
                title={greeting(profile?.full_name?.split(' ')[0])}
                text={n > 0 ? `You have ${n} new application${n === 1 ? '' : 's'} this week.` : 'No new applications this week. Share your open jobs to attract candidates.'}
                action={
                  <Link to={n > 0 && open[0] ? `/org/jobs/${open[0].id}/pipeline` : '/org/jobs'} className={`${buttonClass('secondary')} bg-primary-fg text-primary`}>
                    {n > 0 ? 'Review applications' : 'See my jobs'}
                  </Link>
                }
              />

              <StatGrid
                items={[
                  { label: 'Open jobs', value: stats.open_jobs },
                  { label: 'Applications this week', value: stats.new_applications_week },
                  { label: 'Interviews this week', value: stats.interviews_week },
                  { label: 'Hired this month', value: stats.hires_month },
                ]}
              />

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-section font-semibold">Jobs to fill</h2>
                  <Link to="/org/jobs" className="text-primary">
                    View all
                  </Link>
                </div>
                {open.length === 0 ? (
                  <EmptyState icon={Briefcase} title="No open jobs. Publish one to start hiring." action={<Link to="/org/jobs/new" className={buttonClass('primary')}>Create a job</Link>} />
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {open.map((j, i) => (
                      <Link key={j.id} to={`/org/jobs/${j.id}/pipeline`} className="card flex flex-col items-center gap-2 text-center transition hover:-translate-y-0.5 hover:shadow-raised">
                        <span className={`flex h-11 w-11 items-center justify-center rounded-ui ${TILE_TONES[i % TILE_TONES.length]}`}>
                          <Briefcase />
                        </span>
                        <span className="line-clamp-2 font-semibold">{j.title}</span>
                        <span className="text-small text-muted">{j.applications?.[0]?.count || 0} candidates</span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-3 text-section font-semibold">Recruitment progress</h2>
                {recent.length === 0 ? (
                  <EmptyState icon={Users} title="No applications yet." />
                ) : (
                  <div className="card p-2 sm:p-3">
                    <div className="hidden grid-cols-[1.2fr_1fr_auto] gap-3 px-3 pb-2 text-small font-medium text-muted sm:grid">
                      <span>Name</span>
                      <span>Job</span>
                      <span className="w-24">Status</span>
                    </div>
                    <ul>
                      {recent.map((a) => (
                        <li key={a.id}>
                          <Link to={`/org/applications/${a.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-ui px-3 py-2.5 transition hover:bg-primary hover:text-primary-fg sm:grid-cols-[1.2fr_1fr_auto]">
                            <span className="min-w-0">
                              <span className="block truncate font-medium">{a.profiles?.full_name}</span>
                              <span className="block truncate text-small opacity-70 sm:hidden">{a.jobs?.title}</span>
                            </span>
                            <span className="hidden truncate sm:block">{a.jobs?.title}</span>
                            <span className="sm:w-24">
                              <Badge value={a.status} label={APPLICATION_STATUSES[a.status]} />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>

            <aside className="min-w-0 space-y-6">
              <Schedule interviews={interviews} />
              <section className="card">
                <h2 className="mb-3 text-section font-semibold">New applicants</h2>
                {recent.length === 0 ? (
                  <p className="text-muted">Nobody yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {recent.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <Link to={`/org/applications/${a.id}`} className="flex items-center gap-3 hover:text-primary">
                          <Avatar name={a.profiles?.full_name} src={publicUrl('avatars', a.profiles?.avatar_path)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{a.profiles?.full_name}</span>
                            <span className="block truncate text-small text-muted">
                              {a.jobs?.title} · {timeAgo(a.applied_at)}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>
          </div>
        )
      }}
    </Async>
  )
}
