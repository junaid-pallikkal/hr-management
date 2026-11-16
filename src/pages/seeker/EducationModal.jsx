import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { saveEducation } from '../../services/candidates'
import Button from '../../components/Button'
import Field from '../../components/Field'
import Modal from '../../components/Modal'

const empty = { institution: '', degree: '', field_of_study: '', start_year: '', end_year: '', grade: '' }

export default function EducationModal({ item, onClose, onSaved }) {
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
    if (!v.institution.trim()) found.institution = 'Enter the school or university.'
    if (!v.degree.trim()) found.degree = 'Enter the degree.'
    if (v.start_year && v.end_year && Number(v.end_year) < Number(v.start_year)) found.end_year = 'End year is before the start year.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await saveEducation(user.id, item.id, {
        institution: v.institution.trim(),
        degree: v.degree.trim(),
        field_of_study: v.field_of_study.trim() || null,
        start_year: v.start_year ? Number(v.start_year) : null,
        end_year: v.end_year ? Number(v.end_year) : null,
        grade: v.grade.trim() || null,
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
      title={item?.id ? 'Edit education' : 'Add education'}
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
        <Field label="School or university" error={errors.institution}>
          <input className="input" name="institution" value={v.institution} onChange={change} />
        </Field>
        <Field label="Degree" error={errors.degree}>
          <input className="input" name="degree" value={v.degree} onChange={change} />
        </Field>
        <Field label="Field of study">
          <input className="input" name="field_of_study" value={v.field_of_study} onChange={change} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start year">
            <input className="input" type="number" name="start_year" value={v.start_year} onChange={change} />
          </Field>
          <Field label="End year" error={errors.end_year}>
            <input className="input" type="number" name="end_year" value={v.end_year} onChange={change} />
          </Field>
        </div>
        <Field label="Grade">
          <input className="input" name="grade" value={v.grade} onChange={change} />
        </Field>
      </div>
    </Modal>
  )
}
