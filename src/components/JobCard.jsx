import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react'
import { EMPLOYMENT_TYPES, WORK_MODES } from '../lib/constants'
import { placeText, salaryText, timeAgo } from '../lib/format'
import { publicUrl } from '../services/storage'
import Avatar from './Avatar'
import IconButton from './IconButton'

export default function JobCard({ job, saved, onToggleSave }) {
  const org = job.organizations
  const place = placeText(job)
  const salary = salaryText(job)
  return (
    <div className="card flex gap-3">
      <Avatar large name={org?.name} src={publicUrl('org-assets', org?.logo_path)} />
      <div className="min-w-0 flex-1">
        <Link to={`/jobs/${job.slug}`} className="block truncate text-section font-semibold hover:text-primary">
          {job.title}
        </Link>
        <Link to={`/companies/${org?.slug}`} className="text-muted hover:text-fg">
          {org?.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted">
          {place && (
            <span className="inline-flex items-center gap-1">
              <MapPin />
              {place}
            </span>
          )}
          <span>{WORK_MODES[job.work_mode]}</span>
          <span>{EMPLOYMENT_TYPES[job.employment_type]}</span>
          {salary && <span>{salary}</span>}
          {job.published_at && <span>{timeAgo(job.published_at)}</span>}
        </div>
      </div>
      {onToggleSave && (
        <IconButton label={saved ? 'Remove from saved' : 'Save job'} onClick={() => onToggleSave(job)}>
          {saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
        </IconButton>
      )}
    </div>
  )
}
