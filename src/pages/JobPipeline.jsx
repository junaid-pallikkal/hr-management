import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { getJob } from '../services/jobs'
import { changeStatus, listJobApplications } from '../services/applications'
import { JOB_STATUSES } from '../lib/constants'
import Async from '../components/Async'
import Badge from '../components/Badge'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import Field from '../components/Field'
import KanbanBoard from '../components/KanbanBoard'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function JobPipeline() {
  const { id } = useParams()
  const toast = useToast()
  const query = useLoad(async () => {
    const [job, apps] = await Promise.all([getJob(id), listJobApplications(id)])
    return { job, apps }
  }, [id])
  const [reject, setReject] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function move(item, status, note) {
    try {
      await changeStatus(item.id, status, note)
      toast.success(`Moved to ${status.replace('_', ' ')}`)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  function onMove(item, status) {
    if (status === 'rejected') {
      setReason('')
      setReject(item)
    } else move(item, status)
  }

  async function confirmReject() {
    setBusy(true)
    await move(reject, 'rejected', reason)
    setBusy(false)
    setReject(null)
  }

  return (
    <div>
      <Async query={query}>
        {({ job, apps }) => {
          const active = apps.filter((a) => a.status !== 'withdrawn')
          return (
            <>
              <Link to="/org/jobs" className="mb-2 inline-flex items-center gap-1 text-muted hover:text-fg">
                <ArrowLeft />
                All jobs
              </Link>
              <PageHeader title={job.title}>
                <Badge value={job.status} label={JOB_STATUSES[job.status]} />
              </PageHeader>
              {active.length === 0 ? (
                <EmptyState icon={Users} title="No applications for this job yet." />
              ) : (
                <KanbanBoard items={active} onMove={onMove} />
              )}
            </>
          )
        }}
      </Async>
      <Modal
        open={!!reject}
        title="Reject candidate"
        onClose={() => setReject(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReject(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={confirmReject}>
              Reject
            </Button>
          </>
        }
      >
        <Field label="Reason (only your team sees this)">
          <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}
