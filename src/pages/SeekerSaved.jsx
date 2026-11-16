import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { listSavedJobs, unsaveJob } from '../services/candidates'
import Async from '../components/Async'
import { buttonClass } from '../components/Button'
import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'
import PageHeader from '../components/PageHeader'

export default function SeekerSaved() {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => listSavedJobs(user.id), [user.id])

  async function remove(job) {
    try {
      await unsaveJob(user.id, job.id)
      toast.success('Removed from saved jobs')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <PageHeader title="Saved jobs" />
      <Async query={query}>
        {(rows) => {
          const jobs = rows.map((r) => r.jobs).filter(Boolean)
          return jobs.length === 0 ? (
            <EmptyState icon={Bookmark} title="No saved jobs yet." action={<Link to="/jobs" className={buttonClass('primary')}>Find jobs</Link>} />
          ) : (
            <div className="grid gap-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} saved onToggleSave={remove} />
              ))}
            </div>
          )
        }}
      </Async>
    </div>
  )
}
