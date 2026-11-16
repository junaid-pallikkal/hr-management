import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Briefcase, MapPin, SearchX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import useSavedJobs from '../hooks/useSavedJobs'
import { getJobBySlug } from '../services/jobs'
import { getMyApplicationForJob } from '../services/applications'
import { publicUrl } from '../services/storage'
import { APPLICATION_STATUSES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from '../lib/constants'
import { formatDate, placeText, salaryText } from '../lib/format'
import ApplyModal from '../components/ApplyModal'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

function Block({ title, text }) {
  if (!text) return null
  return (
    <section>
      <h2 className="mb-2 text-section font-semibold">{title}</h2>
      <p className="whitespace-pre-line">{text}</p>
    </section>
  )
}

export default function JobDetail() {
  const { slug } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const saved = useSavedJobs()
  const [applyOpen, setApplyOpen] = useState(false)
  const query = useLoad(() => getJobBySlug(slug).then((j) => j || false), [slug])
  const isSeeker = profile?.platform_role === 'job_seeker'
  const mine = useLoad(async (/* only for seekers */) => (isSeeker && query.data ? getMyApplicationForJob(user.id, query.data.id) : null), [isSeeker, query.data?.id])

  return (
    <Async query={query}>
      {(job) => {
        if (!job) return <EmptyState icon={SearchX} title="This job is not available." action={<Link to="/jobs" className="text-primary">See other jobs</Link>} />
        const org = job.organizations
        const salary = salaryText(job)
        const application = mine.data
        const skills = job.job_skills.map((s) => s.skills.name)
        return (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div>
                <h1 className="text-title font-semibold">{job.title}</h1>
                <Link to={`/companies/${org.slug}`} className="text-primary">
                  {org.name}
                </Link>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin />
                    {placeText(job) || 'Location not set'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Briefcase />
                    {EMPLOYMENT_TYPES[job.employment_type]} · {WORK_MODES[job.work_mode]} · {EXPERIENCE_LEVELS[job.experience_level]}
                  </span>
                  {salary && <span>{salary}</span>}
                </div>
              </div>
              <Block title="About the job" text={job.description} />
              <Block title="What you will do" text={job.responsibilities} />
              <Block title="What we look for" text={job.requirements} />
              <Block title="What we offer" text={job.benefits} />
              {skills.length > 0 && (
                <section>
                  <h2 className="mb-2 text-section font-semibold">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <Badge key={s} label={s} tone="primary" />
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-4 self-start lg:sticky lg:top-20">
              <div className="card space-y-3">
                {application ? (
                  <div className="space-y-2">
                    <p className="font-medium">You applied</p>
                    <Badge value={application.status} label={APPLICATION_STATUSES[application.status]} />
                    <Link to="/seeker/applications" className="block text-primary">
                      See my applications
                    </Link>
                  </div>
                ) : isSeeker ? (
                  <Button className="w-full" onClick={() => setApplyOpen(true)}>
                    Apply now
                  </Button>
                ) : profile ? (
                  <p className="text-muted">Only job seeker accounts can apply.</p>
                ) : (
                  <Button className="w-full" onClick={() => navigate(`/login?next=/jobs/${job.slug}`)}>
                    Log in to apply
                  </Button>
                )}
                {saved.enabled && (
                  <Button variant="secondary" className="w-full" onClick={() => saved.toggle(job)}>
                    {saved.ids.includes(job.id) ? <BookmarkCheck /> : <Bookmark />}
                    {saved.ids.includes(job.id) ? 'Saved' : 'Save job'}
                  </Button>
                )}
                <dl className="space-y-1 text-small text-muted">
                  {job.published_at && (
                    <div>
                      Posted {formatDate(job.published_at)}
                    </div>
                  )}
                  {job.closes_at && <div>Closes {formatDate(job.closes_at)}</div>}
                  <div>
                    {job.openings} opening{job.openings === 1 ? '' : 's'}
                  </div>
                </dl>
              </div>
              <Link to={`/companies/${org.slug}`} className="card flex items-center gap-3 hover:opacity-90">
                <Avatar name={org.name} src={publicUrl('org-assets', org.logo_path)} />
                <span className="font-medium">{org.name}</span>
              </Link>
            </aside>

            {isSeeker && <ApplyModal job={job} open={applyOpen} onClose={() => setApplyOpen(false)} onApplied={mine.reload} />}
          </div>
        )
      }}
    </Async>
  )
}
