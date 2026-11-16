import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { applyToJob } from '../services/applications'
import { listResumes } from '../services/candidates'
import Button, { buttonClass } from './Button'
import Field from './Field'
import Modal from './Modal'
import Spinner from './Spinner'

export default function ApplyModal({ job, open, onClose, onApplied }) {
  const { user } = useAuth()
  const toast = useToast()
  const resumes = useLoad(() => listResumes(user.id), [open])
  const [resumeId, setResumeId] = useState('')
  const [cover, setCover] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const list = resumes.data || []
  const chosen = resumeId || list.find((r) => r.is_default)?.id || list[0]?.id || ''

  async function submit() {
    if (!chosen) return setError('Please choose a resume.')
    setError('')
    setLoading(true)
    try {
      await applyToJob(job.id, chosen, cover)
      toast.success('Application sent')
      onApplied()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title={`Apply to ${job.title}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={loading} onClick={submit} disabled={!list.length}>
            Send application
          </Button>
        </>
      }
    >
      {resumes.loading && !resumes.data ? (
        <Spinner />
      ) : list.length === 0 ? (
        <div className="space-y-3 text-center">
          <p>You need a resume to apply.</p>
          <Link to="/seeker/resumes" className={buttonClass('primary')}>
            Add a resume
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Resume" error={error}>
            <select className="input" value={chosen} onChange={(e) => setResumeId(e.target.value)}>
              {list.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cover letter (optional)">
            <textarea className="input" rows={5} value={cover} onChange={(e) => setCover(e.target.value)} />
          </Field>
        </div>
      )}
    </Modal>
  )
}
