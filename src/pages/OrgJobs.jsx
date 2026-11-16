import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Columns3, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { deleteJob, duplicateJob, listOrgJobs, setJobStatus } from '../services/jobs'
import { JOB_STATUSES, toOptions } from '../lib/constants'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import { buttonClass } from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import { Select } from '../components/Field'
import IconButton from '../components/IconButton'
import PageHeader from '../components/PageHeader'

export default function OrgJobs() {
  const { org, orgRole, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [params] = useSearchParams()
  const [search, setSearch] = useState(params.get('q') || '')
  useEffect(() => setSearch(params.get('q') || ''), [params])
  const [confirm, setConfirm] = useState(null) // { kind: 'delete' | 'status', job, value }
  const [busy, setBusy] = useState(false)
  const query = useLoad(() => listOrgJobs(org.id), [org.id])
  const manager = orgRole === 'org_admin' || orgRole === 'hr_manager'

  async function changeStatus(job, value) {
    setBusy(true)
    try {
      await setJobStatus(job.id, value)
      toast.success(`Job ${JOB_STATUSES[value].toLowerCase()}`)
      setConfirm(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
      setConfirm(null)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await deleteJob(confirm.job.id)
      toast.success('Job deleted')
      setConfirm(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function copy(job) {
    try {
      await duplicateJob(job.id, user.id)
      toast.success('Copy created as a draft')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  function pick(job, value) {
    if (value === job.status) return
    if (value === 'closed' || value === 'archived') setConfirm({ kind: 'status', job, value })
    else changeStatus(job, value)
  }

  return (
    <div>
      <PageHeader title="Jobs">
        <Link to="/org/jobs/new" className={buttonClass('primary')}>
          <Plus />
          New job
        </Link>
      </PageHeader>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <input className="input" placeholder="Search jobs" aria-label="Search jobs" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select placeholder="All statuses" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={toOptions(JOB_STATUSES)} />
      </div>
      <Async query={query}>
        {(jobs) => {
          const shown = jobs.filter((j) => (!status || j.status === status) && j.title.toLowerCase().includes(search.toLowerCase()))
          if (jobs.length === 0)
            return <EmptyState icon={Briefcase} title="No jobs yet. Create your first one." action={<Link to="/org/jobs/new" className={buttonClass('primary')}>Create a job</Link>} />
          if (shown.length === 0) return <EmptyState title="No jobs match your search." />
          return (
            <ul className="card divide-y divide-soft">
              {shown.map((job) => {
                const canEdit = manager || job.created_by === user.id
                return (
                  <li key={job.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <Link to={`/org/jobs/${job.id}/pipeline`} className="block truncate font-medium hover:text-primary">
                        {job.title}
                      </Link>
                      <span className="text-small text-muted">
                        {job.applications?.[0]?.count || 0} applicants · Created {formatDate(job.created_at)}
                      </span>
                    </div>
                    <Badge value={job.status} label={JOB_STATUSES[job.status]} />
                    {canEdit && (
                      <div className="w-32">
                        <Select aria-label={`Status of ${job.title}`} value={job.status} onChange={(e) => pick(job, e.target.value)} options={toOptions(JOB_STATUSES).filter((o) => manager || o.value !== 'archived')} />
                      </div>
                    )}
                    <div className="flex">
                      <IconButton label="View applicants" onClick={() => navigate(`/org/jobs/${job.id}/pipeline`)}>
                        <Columns3 />
                      </IconButton>
                      {canEdit && (
                        <Link to={`/org/jobs/${job.id}/edit`} aria-label="Edit" className="inline-flex h-8 w-8 items-center justify-center rounded-ui text-muted hover:bg-soft hover:text-fg">
                          <Pencil />
                        </Link>
                      )}
                      <IconButton label="Duplicate" onClick={() => copy(job)}>
                        <Copy />
                      </IconButton>
                      {manager && (
                        <IconButton label="Delete" danger onClick={() => setConfirm({ kind: 'delete', job })}>
                          <Trash2 />
                        </IconButton>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        }}
      </Async>
      <ConfirmDialog
        open={confirm?.kind === 'delete'}
        title="Delete job?"
        message="The job and all its applications will be deleted. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={busy}
        onConfirm={remove}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.kind === 'status'}
        title={confirm?.value === 'closed' ? 'Close job?' : 'Archive job?'}
        message="Candidates will no longer be able to apply."
        confirmLabel={confirm?.value === 'closed' ? 'Close job' : 'Archive'}
        loading={busy}
        onConfirm={() => changeStatus(confirm.job, confirm.value)}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
