import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useLoad from '../../hooks/useLoad'
import { scheduleInterview } from '../../services/interviews'
import { listMembers } from '../../services/team'
import { INTERVIEW_MODES, toOptions } from '../../lib/constants'
import Button from '../../components/Button'
import Field, { Select } from '../../components/Field'
import Modal from '../../components/Modal'

const DURATIONS = [30, 45, 60, 90, 120]

export default function ScheduleModal({ open, applicationId, onClose, onSaved }) {
  const { org, user } = useAuth()
  const toast = useToast()
  const members = useLoad(() => listMembers(org.id), [org.id, open])
  const [v, setV] = useState({ title: 'Interview', mode: 'video', start: '', duration: 60, place: '', instructions: '', people: [user.id] })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setV({ title: 'Interview', mode: 'video', start: '', duration: 60, place: '', instructions: '', people: [user.id] })
      setErrors({})
    }
  }, [open, user.id])

  const change = (e) => setV({ ...v, [e.target.name]: e.target.value })
  const togglePerson = (id) => setV({ ...v, people: v.people.includes(id) ? v.people.filter((p) => p !== id) : [...v.people, id] })

  async function submit() {
    const found = {}
    if (!v.title.trim()) found.title = 'Enter a title.'
    if (!v.start) found.start = 'Choose a date and time.'
    else if (new Date(v.start) < new Date()) found.start = 'Choose a time in the future.'
    if (v.people.length === 0) found.people = 'Choose at least one interviewer.'
    setErrors(found)
    if (Object.keys(found).length) return
    const starts = new Date(v.start)
    setSaving(true)
    try {
      await scheduleInterview({
        application_id: applicationId,
        title: v.title.trim(),
        mode: v.mode,
        starts_at: starts.toISOString(),
        ends_at: new Date(starts.getTime() + Number(v.duration) * 60000).toISOString(),
        place: v.place,
        instructions: v.instructions,
        participants: v.people,
      })
      toast.success('Interview scheduled')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.message)
      setErrors({ people: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Schedule interview"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            Schedule
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Title" error={errors.title}>
          <input className="input" name="title" value={v.title} onChange={change} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select name="mode" value={v.mode} onChange={change} options={toOptions(INTERVIEW_MODES)} />
          </Field>
          <Field label="Length">
            <Select name="duration" value={v.duration} onChange={change} options={DURATIONS.map((d) => ({ value: d, label: `${d} min` }))} />
          </Field>
        </div>
        <Field label="Date and time" error={errors.start}>
          <input className="input" type="datetime-local" name="start" value={v.start} onChange={change} />
        </Field>
        <Field label="Meeting link or address">
          <input className="input" name="place" value={v.place} onChange={change} />
        </Field>
        <Field label="Note for the candidate">
          <textarea className="input" rows={2} name="instructions" value={v.instructions} onChange={change} />
        </Field>
        <fieldset>
          <legend className="mb-1 text-small font-medium text-muted">Interviewers</legend>
          <div className="space-y-1">
            {(members.data || [])
              .filter((m) => m.status === 'active')
              .map((m) => (
                <label key={m.user_id} className="flex items-center gap-2">
                  <input type="checkbox" checked={v.people.includes(m.user_id)} onChange={() => togglePerson(m.user_id)} />
                  {m.profiles?.full_name || m.profiles?.email}
                </label>
              ))}
          </div>
          {errors.people && <p className="mt-1 text-small text-danger">{errors.people}</p>}
        </fieldset>
      </div>
    </Modal>
  )
}
