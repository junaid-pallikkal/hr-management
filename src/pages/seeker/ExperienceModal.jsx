import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { saveExperience } from '../../services/candidates'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Modal from '../../components/Modal'

const empty = { company: '', title: '', location: '', start_date: '', end_date: '', description: '' }

// `item` is null when closed, {} for a new entry, or the entry to edit.
export default function ExperienceModal({ item, onClose, onSaved }) {
  const { user } = useAuth()
  const toast = useToast()
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setV({ ...empty, ...Object.fromEntries(Object.entries(item).map(([k, val]) => [k, val ?? ''])) })
      setErrors({})
    }
  }, [item])

  const change = (e) => setV({ ...v, [e.target.name]: e.target.value })

  async function submit() {
    const found = {}
    if (!v.title.trim()) found.title = 'Enter the job title.'
    if (!v.company.trim()) found.company = 'Enter the company.'
    if (!v.start_date) found.start_date = 'Choose a start date.'
    if (v.end_date && v.start_date && v.end_date < v.start_date) found.end_date = 'End date is before the start date.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await saveExperience(user.id, item.id, {
        company: v.company.trim(),
        title: v.title.trim(),
        location: v.location.trim() || null,
        start_date: v.start_date,
        end_date: v.end_date || null,
        description: v.description.trim() || null,
      })
      toast.success('Saved')
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
      open={!!item}
      title={item?.id ? 'Edit experience' : 'Add experience'}
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
        <Field label="Job title" error={errors.title}>
          <input className="input" name="title" value={v.title} onChange={change} />
        </Field>
        <Field label="Company" error={errors.company}>
          <input className="input" name="company" value={v.company} onChange={change} />
        </Field>
        <Field label="Location">
          <input className="input" name="location" value={v.location} onChange={change} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start" error={errors.start_date}>
            <input className="input" type="date" name="start_date" value={v.start_date} onChange={change} />
          </Field>
          <Field label="End" error={errors.end_date} hint="Leave empty if current">
            <input className="input" type="date" name="end_date" value={v.end_date} onChange={change} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className="input" rows={3} name="description" value={v.description} onChange={change} />
        </Field>
      </div>
    </Modal>
  )
}
