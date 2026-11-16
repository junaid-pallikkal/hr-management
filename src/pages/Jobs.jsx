import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import useSavedJobs from '../hooks/useSavedJobs'
import { listCategories, PAGE_SIZE, searchJobs } from '../services/jobs'
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, toOptions, WORK_MODES } from '../lib/constants'
import Async from '../components/Async'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Field, { Select } from '../components/Field'
import JobCard from '../components/JobCard'
import Pagination from '../components/Pagination'

const FILTERS = ['q', 'category', 'work_mode', 'employment_type', 'experience_level', 'city', 'salary', 'posted', 'sort']

export default function Jobs() {
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const saved = useSavedJobs()
  const categories = useLoad(listCategories, [])
  const filters = Object.fromEntries(FILTERS.map((k) => [k, params.get(k) || '']))
  const page = Number(params.get('page') || 1)
  const query = useLoad(() => searchJobs(filters, page), [params.toString()])

  const set = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next, { replace: true })
  }
  const activeCount = FILTERS.filter((k) => k !== 'q' && k !== 'sort' && filters[k]).length

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input className="input" placeholder="Job title or skill" aria-label="Search jobs" defaultValue={filters.q} key={filters.q} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value.trim())} onBlur={(e) => e.target.value.trim() !== filters.q && set('q', e.target.value.trim())} />
        <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal />
          Filters{activeCount ? ` (${activeCount})` : ''}
        </Button>
      </div>

      {showFilters && (
        <div className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Category">
            <Select placeholder="Any" value={filters.category} onChange={(e) => set('category', e.target.value)} options={(categories.data || []).map((c) => ({ value: c.id, label: c.name }))} />
          </Field>
          <Field label="Work mode">
            <Select placeholder="Any" value={filters.work_mode} onChange={(e) => set('work_mode', e.target.value)} options={toOptions(WORK_MODES)} />
          </Field>
          <Field label="Job type">
            <Select placeholder="Any" value={filters.employment_type} onChange={(e) => set('employment_type', e.target.value)} options={toOptions(EMPLOYMENT_TYPES)} />
          </Field>
          <Field label="Experience">
            <Select placeholder="Any" value={filters.experience_level} onChange={(e) => set('experience_level', e.target.value)} options={toOptions(EXPERIENCE_LEVELS)} />
          </Field>
          <Field label="City">
            <input className="input" defaultValue={filters.city} onBlur={(e) => set('city', e.target.value.trim())} />
          </Field>
          <Field label="Pay at least">
            <input className="input" type="number" min="0" defaultValue={filters.salary} onBlur={(e) => set('salary', e.target.value)} />
          </Field>
          <Field label="Posted">
            <Select
              placeholder="Any time"
              value={filters.posted}
              onChange={(e) => set('posted', e.target.value)}
              options={[
                { value: '1', label: 'Last 24 hours' },
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
              ]}
            />
          </Field>
          <Field label="Sort by">
            <Select
              placeholder="Newest"
              value={filters.sort}
              onChange={(e) => set('sort', e.target.value)}
              options={[
                { value: 'closing', label: 'Closing soon' },
                { value: 'salary', label: 'Highest pay' },
              ]}
            />
          </Field>
          <div className="flex items-end">
            <Button variant="ghost" onClick={() => setParams({}, { replace: true })}>
              Clear all
            </Button>
          </div>
        </div>
      )}

      <Async query={query}>
        {({ jobs, total }) =>
          jobs.length === 0 ? (
            <EmptyState icon={SearchX} title="No jobs match your search." action={<Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear search</Button>} />
          ) : (
            <>
              <p className="mb-3 text-muted">{total} job{total === 1 ? '' : 's'}</p>
              <div className="grid gap-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} saved={saved.ids.includes(job.id)} onToggleSave={saved.enabled ? saved.toggle : undefined} />
                ))}
              </div>
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={(p) => setParams({ ...Object.fromEntries(params), page: p })} />
            </>
          )
        }
      </Async>
    </div>
  )
}
