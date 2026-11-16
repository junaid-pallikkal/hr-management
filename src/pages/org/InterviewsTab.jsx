import { useState } from 'react'
import { CalendarPlus, Check, MessageSquarePlus, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useLoad from '../../hooks/useLoad'
import { listApplicationInterviews, saveFeedback, updateInterview } from '../../services/interviews'
import { INTERVIEW_MODES, INTERVIEW_STATUSES, RECOMMENDATIONS, toOptions } from '../../lib/constants'
import { formatDateTime } from '../../lib/format'
import Async from '../../components/Async'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import ConfirmDialog from '../../components/ConfirmDialog'
import EmptyState from '../../components/EmptyState'
import Field, { Select } from '../../components/Field'
import IconButton from '../../components/IconButton'
import Modal from '../../components/Modal'
import ScheduleModal from './ScheduleModal'

function FeedbackModal({ interview, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const mine = interview?.interview_feedback?.find((f) => f.author_id === user.id)
  const [v, setV] = useState({ rating: mine?.rating ?? '', recommendation: mine?.recommendation ?? '', comments: mine?.comments ?? '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const change = (e) => setV({ ...v, [e.target.name]: e.target.value })

  async function submit() {
    const found = {}
    if (!v.rating) found.rating = 'Choose a score.'
    if (!v.recommendation) found.recommendation = 'Choose your recommendation.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await saveFeedback(interview.id, user.id, { rating: Number(v.rating), recommendation: v.recommendation, comments: v.comments.trim() || null })
      toast.success('Feedback saved')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      title="Interview feedback"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Score (1 to 5)" error={errors.rating}>
          <Select placeholder="Choose" name="rating" value={v.rating} onChange={change} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
        </Field>
        <Field label="Recommendation" error={errors.recommendation}>
          <Select placeholder="Choose" name="recommendation" value={v.recommendation} onChange={change} options={toOptions(RECOMMENDATIONS)} />
        </Field>
        <Field label="Comments">
          <textarea className="input" rows={4} name="comments" value={v.comments} onChange={change} />
        </Field>
      </div>
    </Modal>
  )
}

export default function InterviewsTab({ applicationId, onChanged }) {
  const toast = useToast()
  const query = useLoad(() => listApplicationInterviews(applicationId), [applicationId])
  const [schedule, setSchedule] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [cancel, setCancel] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = () => {
    query.reload()
    onChanged?.()
  }

  async function setStatus(interview, status) {
    setBusy(true)
    try {
      await updateInterview(interview.id, { status })
      toast.success(status === 'cancelled' ? 'Interview cancelled' : 'Updated')
      setCancel(null)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setSchedule(true)}>
        <CalendarPlus />
        Schedule interview
      </Button>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState title="No interviews yet." />
          ) : (
            <ul className="divide-y divide-soft">
              {rows.map((i) => (
                <li key={i.id} className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{i.title}</p>
                    <div className="flex items-center gap-1">
                      <Badge value={i.status} label={INTERVIEW_STATUSES[i.status]} />
                      <IconButton label="Add feedback" onClick={() => setFeedback(i)}>
                        <MessageSquarePlus />
                      </IconButton>
                      {i.status === 'scheduled' && (
                        <>
                          <IconButton label="Mark as done" onClick={() => setStatus(i, 'completed')}>
                            <Check />
                          </IconButton>
                          <IconButton label="Cancel interview" danger onClick={() => setCancel(i)}>
                            <X />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-muted">
                    {formatDateTime(i.starts_at)} · {INTERVIEW_MODES[i.mode]}
                    {i.location_or_link ? ` · ${i.location_or_link}` : ''}
                  </p>
                  <p className="text-small text-muted">With {i.interview_participants.map((p) => p.profiles?.full_name).join(', ')}</p>
                  {i.interview_feedback.map((f) => (
                    <p key={f.id} className="rounded-ui bg-soft px-3 py-2">
                      <strong>{f.profiles?.full_name}</strong>: {f.rating}/5, {RECOMMENDATIONS[f.recommendation]}
                      {f.comments ? ` — ${f.comments}` : ''}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          )
        }
      </Async>
      <ScheduleModal open={schedule} applicationId={applicationId} onClose={() => setSchedule(false)} onSaved={refresh} />
      {feedback && <FeedbackModal interview={feedback} onClose={() => setFeedback(null)} onSaved={refresh} />}
      <ConfirmDialog
        open={!!cancel}
        title="Cancel interview?"
        message="The candidate and interviewers will be told."
        confirmLabel="Cancel interview"
        danger
        loading={busy}
        onConfirm={() => setStatus(cancel, 'cancelled')}
        onClose={() => setCancel(null)}
      />
    </div>
  )
}
