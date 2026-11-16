import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { deleteEducation, deleteExperience, getCandidate, saveCandidate, saveCandidateSkills, uploadAvatar } from '../services/candidates'
import { checkFile, IMAGE_TYPES, publicUrl } from '../services/storage'
import { parseSkills } from '../services/skills'
import { CURRENCIES, toOptions, WORK_MODES } from '../lib/constants'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import Field, { Select } from '../components/Field'
import FileInput from '../components/FileInput'
import IconButton from '../components/IconButton'
import PageHeader from '../components/PageHeader'
import EducationModal from './seeker/EducationModal'
import ExperienceModal from './seeker/ExperienceModal'

const num = (v) => (v === '' || v == null ? null : Number(v))
const text = (v) => v?.trim() || null

function ProfileForm({ data, onSaved }) {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const { profile, base, skills } = data
  const [v, setV] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    headline: base.headline || '',
    current_title: base.current_title || '',
    city: base.city || '',
    country: base.country || '',
    years_experience: base.years_experience ?? '',
    expected_salary: base.expected_salary ?? '',
    salary_currency: base.salary_currency || 'USD',
    work_mode_preference: base.work_mode_preference || '',
    notice_period_days: base.notice_period_days ?? '',
    linkedin_url: base.linkedin_url || '',
    portfolio_url: base.portfolio_url || '',
    github_url: base.github_url || '',
    summary: base.summary || '',
    skills: skills.join(', '),
    open_to_work: base.open_to_work ?? true,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const change = (e) => setV({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!v.full_name.trim()) found.full_name = 'Enter your name.'
    if (v.years_experience !== '' && Number(v.years_experience) < 0) found.years_experience = 'Cannot be negative.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await saveCandidate(
        user.id,
        { full_name: v.full_name.trim(), phone: text(v.phone) },
        {
          headline: text(v.headline),
          current_title: text(v.current_title),
          city: text(v.city),
          country: text(v.country),
          years_experience: num(v.years_experience),
          expected_salary: num(v.expected_salary),
          salary_currency: v.salary_currency,
          work_mode_preference: v.work_mode_preference || null,
          notice_period_days: num(v.notice_period_days),
          linkedin_url: text(v.linkedin_url),
          portfolio_url: text(v.portfolio_url),
          github_url: text(v.github_url),
          summary: text(v.summary),
          open_to_work: v.open_to_work,
        },
      )
      await saveCandidateSkills(user.id, parseSkills(v.skills))
      await refresh()
      toast.success('Profile saved')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function photo(file) {
    const problem = checkFile(file, IMAGE_TYPES, 2)
    if (problem) return toast.error(problem)
    setUploading(true)
    try {
      await uploadAvatar(user.id, file)
      await refresh()
      onSaved()
      toast.success('Photo updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex items-center gap-4">
        <Avatar large name={v.full_name} src={publicUrl('avatars', profile.avatar_path)} />
        <FileInput label="Change photo" accept={IMAGE_TYPES.join(',')} onFile={photo} loading={uploading} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.full_name}>
          <input className="input" name="full_name" value={v.full_name} onChange={change} />
        </Field>
        <Field label="Phone">
          <input className="input" name="phone" value={v.phone} onChange={change} />
        </Field>
        <Field label="Headline">
          <input className="input" name="headline" value={v.headline} onChange={change} />
        </Field>
        <Field label="Current job title">
          <input className="input" name="current_title" value={v.current_title} onChange={change} />
        </Field>
        <Field label="City">
          <input className="input" name="city" value={v.city} onChange={change} />
        </Field>
        <Field label="Country">
          <input className="input" name="country" value={v.country} onChange={change} />
        </Field>
        <Field label="Years of experience" error={errors.years_experience}>
          <input className="input" type="number" min="0" name="years_experience" value={v.years_experience} onChange={change} />
        </Field>
        <Field label="Notice period (days)">
          <input className="input" type="number" min="0" name="notice_period_days" value={v.notice_period_days} onChange={change} />
        </Field>
        <Field label="Expected pay per year">
          <div className="flex gap-2">
            <select className="input w-24" name="salary_currency" value={v.salary_currency} onChange={change}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input className="input" type="number" min="0" name="expected_salary" value={v.expected_salary} onChange={change} />
          </div>
        </Field>
        <Field label="Preferred work mode">
          <Select placeholder="No preference" name="work_mode_preference" value={v.work_mode_preference} onChange={change} options={toOptions(WORK_MODES)} />
        </Field>
        <Field label="LinkedIn">
          <input className="input" name="linkedin_url" value={v.linkedin_url} onChange={change} />
        </Field>
        <Field label="Portfolio">
          <input className="input" name="portfolio_url" value={v.portfolio_url} onChange={change} />
        </Field>
        <Field label="GitHub">
          <input className="input" name="github_url" value={v.github_url} onChange={change} />
        </Field>
        <Field label="Skills" hint="Separate with commas">
          <input className="input" name="skills" value={v.skills} onChange={change} />
        </Field>
      </div>
      <Field label="About you">
        <textarea className="input" rows={4} name="summary" value={v.summary} onChange={change} />
      </Field>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="open_to_work" checked={v.open_to_work} onChange={change} />
        Open to work
      </label>
      <Button type="submit" loading={saving}>
        Save profile
      </Button>
    </form>
  )
}

export default function SeekerProfile() {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => getCandidate(user.id), [user.id])
  const [expModal, setExpModal] = useState(null)
  const [eduModal, setEduModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Profile · JobBridge'
  }, [])

  async function remove() {
    setBusy(true)
    try {
      await (confirm.kind === 'exp' ? deleteExperience(confirm.id) : deleteEducation(confirm.id))
      toast.success('Removed')
      setConfirm(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profile" />
      <Async query={query}>
        {(data) => (
          <div className="space-y-8">
            <ProfileForm data={data} onSaved={query.reload} />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-section font-semibold">Experience</h2>
                <Button variant="secondary" onClick={() => setExpModal({})}>
                  <Plus />
                  Add
                </Button>
              </div>
              {data.experiences.length === 0 ? (
                <p className="text-muted">No experience added yet.</p>
              ) : (
                <ul className="divide-y divide-soft">
                  {data.experiences.map((x) => (
                    <li key={x.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">{x.title}</p>
                        <p className="text-muted">
                          {x.company} · {formatDate(x.start_date)} - {x.end_date ? formatDate(x.end_date) : 'Now'}
                        </p>
                        {x.description && <p className="mt-1 whitespace-pre-line">{x.description}</p>}
                      </div>
                      <div className="flex">
                        <IconButton label="Edit" onClick={() => setExpModal(x)}>
                          <Pencil />
                        </IconButton>
                        <IconButton label="Delete" danger onClick={() => setConfirm({ kind: 'exp', id: x.id })}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-section font-semibold">Education</h2>
                <Button variant="secondary" onClick={() => setEduModal({})}>
                  <Plus />
                  Add
                </Button>
              </div>
              {data.educations.length === 0 ? (
                <p className="text-muted">No education added yet.</p>
              ) : (
                <ul className="divide-y divide-soft">
                  {data.educations.map((x) => (
                    <li key={x.id} className="flex items-start justify-between gap-3 py-3">
                      <div>
                        <p className="font-medium">
                          {x.degree}
                          {x.field_of_study ? `, ${x.field_of_study}` : ''}
                        </p>
                        <p className="text-muted">
                          {x.institution}
                          {x.end_year ? ` · ${x.end_year}` : ''}
                        </p>
                      </div>
                      <div className="flex">
                        <IconButton label="Edit" onClick={() => setEduModal(x)}>
                          <Pencil />
                        </IconButton>
                        <IconButton label="Delete" danger onClick={() => setConfirm({ kind: 'edu', id: x.id })}>
                          <Trash2 />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Async>
      <ExperienceModal item={expModal} onClose={() => setExpModal(null)} onSaved={query.reload} />
      <EducationModal item={eduModal} onClose={() => setEduModal(null)} onSaved={query.reload} />
      <ConfirmDialog open={!!confirm} title="Delete this?" message="This cannot be undone." confirmLabel="Delete" danger loading={busy} onConfirm={remove} onClose={() => setConfirm(null)} />
    </div>
  )
}
