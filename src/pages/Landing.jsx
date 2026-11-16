import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import useSavedJobs from '../hooks/useSavedJobs'
import { listCategories, listLatestJobs } from '../services/jobs'
import Async from '../components/Async'
import Button, { buttonClass } from '../components/Button'
import EmptyState from '../components/EmptyState'
import JobCard from '../components/JobCard'

export default function Landing() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const saved = useSavedJobs()
  const jobs = useLoad(listLatestJobs, [])
  const categories = useLoad(listCategories, [])

  return (
    <div className="space-y-8">
      <section className="py-8 text-center">
        <h1 className="mx-auto max-w-xl text-title font-semibold sm:text-[28px] sm:leading-9">Find your next job, or your next hire</h1>
        <form
          className="mx-auto mt-6 flex max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            navigate(`/jobs?q=${encodeURIComponent(q)}`)
          }}
        >
          <input className="input" placeholder="Job title or skill" aria-label="Search jobs" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit">
            <Search />
            Search
          </Button>
        </form>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/signup?type=org" className={buttonClass('secondary')}>
            Post a job
          </Link>
        </div>
      </section>

      {categories.data?.length > 0 && (
        <section>
          <h2 className="mb-3 text-section font-semibold">Browse by category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.data.map((c) => (
              <Link key={c.id} to={`/jobs?category=${c.id}`} className={buttonClass('secondary')}>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-section font-semibold">Latest jobs</h2>
          <Link to="/jobs" className="text-primary">
            See all
          </Link>
        </div>
        <Async query={jobs}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState title="No jobs are open right now." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {list.map((job) => (
                  <JobCard key={job.id} job={job} saved={saved.ids.includes(job.id)} onToggleSave={saved.enabled ? saved.toggle : undefined} />
                ))}
              </div>
            )
          }
        </Async>
      </section>
    </div>
  )
}
