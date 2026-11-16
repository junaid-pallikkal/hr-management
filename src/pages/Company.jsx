import { Link, useParams } from 'react-router-dom'
import { Globe, MapPin, SearchX } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import useSavedJobs from '../hooks/useSavedJobs'
import { getOrganizationBySlug } from '../services/organizations'
import { searchJobs } from '../services/jobs'
import { publicUrl } from '../services/storage'
import { placeText } from '../lib/format'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'

export default function Company() {
  const { slug } = useParams()
  const saved = useSavedJobs()
  const query = useLoad(async () => {
    const org = await getOrganizationBySlug(slug)
    if (!org || org.status !== 'verified') return false
    const { jobs } = await searchJobs({ org: org.id }, 1)
    return { org, jobs }
  }, [slug])

  return (
    <Async query={query}>
      {(data) => {
        if (!data) return <EmptyState icon={SearchX} title="We could not find this company." action={<Link to="/jobs" className="text-primary">See jobs</Link>} />
        const { org, jobs } = data
        const cover = publicUrl('org-assets', org.cover_path)
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-ui bg-surface shadow-soft">
              <div className="h-32 bg-primary/10 sm:h-44" style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
              <div className="flex flex-wrap items-center gap-4 p-4">
                <Avatar large name={org.name} src={publicUrl('org-assets', org.logo_path)} />
                <div className="min-w-0 flex-1">
                  <h1 className="text-title font-semibold">{org.name}</h1>
                  {org.tagline && <p className="text-muted">{org.tagline}</p>}
                  <div className="mt-1 flex flex-wrap gap-x-4 text-muted">
                    {placeText(org) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin />
                        {placeText(org)}
                      </span>
                    )}
                    {org.website && (
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary">
                        <Globe />
                        Website
                      </a>
                    )}
                    {org.industry && <span>{org.industry}</span>}
                    {org.size_range && <span>{org.size_range} people</span>}
                  </div>
                </div>
              </div>
            </div>
            {org.about && (
              <section>
                <h2 className="mb-2 text-section font-semibold">About</h2>
                <p className="whitespace-pre-line">{org.about}</p>
              </section>
            )}
            <section>
              <h2 className="mb-3 text-section font-semibold">Open jobs</h2>
              {jobs.length === 0 ? (
                <EmptyState title="No open jobs right now." />
              ) : (
                <div className="grid gap-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} saved={saved.ids.includes(job.id)} onToggleSave={saved.enabled ? saved.toggle : undefined} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )
      }}
    </Async>
  )
}
