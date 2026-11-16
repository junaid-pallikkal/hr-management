import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { getJob, listCategories, saveJob } from '../services/jobs'
import { parseSkills } from '../services/skills'
import { CURRENCIES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, SALARY_PERIODS, toOptions, WORK_MODES } from '../lib/constants'
import { toLocalInput } from '../lib/format'
import Async from '../components/Async'
import Button from '../components/Button'
import Field, { Select } from '../components/Field'
import PageHeader from '../components/PageHeader'

const emptyJob = {
  title: '',
  category_id: '',
  department: '',
  employment_type: 'full_time',
  work_mode: 'onsite',
  experience_level: 'mid',
  min_experience_years: '',
  city: '',
  state: '',
  country: '',
  salary_min: '',
  salary_max: '',
  salary_currency: 'USD',
  salary_period: 'year',
  show_salary: true,
  openings: 1,
  closes_at: '',
  summary: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  skills: '',
}

const num = (v) => (v === '' || v == null ? null : Number(v))
const text = (v) => v.trim() || null

function Form({ job, categories }) {
  const { org, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [v, setV] = useState(() =>
    job
      ? {
          ...emptyJob,
          ...Object.fromEntries(Object.keys(emptyJob).map((k) => [k, job[k] ?? emptyJob[k]])),
          closes_at: job.closes_at ? toLocalInput(job.closes_at) : '',
          skills: job.job_skills.map((s) => s.skills.name).join(', '),
        }
      : emptyJob,
  )
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState('')
  const change = (e) => setV({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  function validate(publish) {
    const found = {}
    if (!v.title.trim()) found.title = 'Enter a job title.'
    if (publish && !v.summary.trim()) found.summary = 'Add a short summary.'
    if (publish && !v.description.trim()) found.description = 'Describe the job.'
    if (v.salary_min !== '' && v.salary_max !== '' && Number(v.salary_min) > Number(v.salary_max)) found.salary_max = 'Maximum is lower than the minimum.'
    if (v.openings === '' || Number(v.openings) < 1) found.openings = 'At least 1.'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function submit(publish) {
    if (!validate(publish)) return toast.error('Please fix the highlighted fields.')
    setSaving(publish ? 'publish' : 'draft')
    try {
      const values = {
        title: v.title.trim(),
        category_id: v.category_id || null,
        department: text(v.department),
        employment_type: v.employment_type,
        work_mode: v.work_mode,
        experience_level: v.experience_level,
        min_experience_years: num(v.min_experience_years),
        city: text(v.city),
        state: text(v.state),
        country: text(v.country),
        salary_min: num(v.salary_min),
        salary_max: num(v.salary_max),
        salary_currency: v.salary_currency,
        salary_period: v.salary_period,
        show_salary: v.show_salary,
        openings: Number(v.openings),
        closes_at: v.closes_at ? new Date(v.closes_at).toISOString() : null,
        summary: v.summary.trim(),
        description: v.description.trim(),
        responsibilities: text(v.responsibilities),
        requirements: text(v.requirements),
        benefits: text(v.benefits),
      }
      if (publish) values.status = 'published'
      await saveJob(org.id, user.id, job?.id, values, parseSkills(v.skills))
      toast.success(publish ? 'Job published' : 'Draft saved')
      navigate('/org/jobs')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving('')
    }
  }

  const alreadyLive = job && job.status === 'published'

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4" noValidate>
      <div className="card grid gap-4 sm:grid-cols-2">
        <Field label="Job title" error={errors.title} className="sm:col-span-2">
          <input className="input" name="title" value={v.title} onChange={change} />
        </Field>
        <Field label="Category">
          <Select placeholder="Choose" name="category_id" value={v.category_id} onChange={change} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Department">
          <input className="input" name="department" value={v.department} onChange={change} />
        </Field>
        <Field label="Job type">
          <Select name="employment_type" value={v.employment_type} onChange={change} options={toOptions(EMPLOYMENT_TYPES)} />
        </Field>
        <Field label="Work mode">
          <Select name="work_mode" value={v.work_mode} onChange={change} options={toOptions(WORK_MODES)} />
        </Field>
        <Field label="Experience level">
          <Select name="experience_level" value={v.experience_level} onChange={change} options={toOptions(EXPERIENCE_LEVELS)} />
        </Field>
        <Field label="Minimum years">
          <input className="input" type="number" min="0" name="min_experience_years" value={v.min_experience_years} onChange={change} />
        </Field>
        <Field label="City">
          <input className="input" name="city" value={v.city} onChange={change} />
        </Field>
        <Field label="State">
          <input className="input" name="state" value={v.state} onChange={change} />
        </Field>
        <Field label="Country">
          <input className="input" name="country" value={v.country} onChange={change} />
        </Field>
        <Field label="Openings" error={errors.openings}>
          <input className="input" type="number" min="1" name="openings" value={v.openings} onChange={change} />
        </Field>
        <Field label="Pay from">
          <input className="input" type="number" min="0" name="salary_min" value={v.salary_min} onChange={change} />
        </Field>
        <Field label="Pay up to" error={errors.salary_max}>
          <input className="input" type="number" min="0" name="salary_max" value={v.salary_max} onChange={change} />
        </Field>
        <Field label="Currency">
          <Select name="salary_currency" value={v.salary_currency} onChange={change} options={CURRENCIES.map((c) => ({ value: c, label: c }))} />
        </Field>
        <Field label="Pay period">
          <Select name="salary_period" value={v.salary_period} onChange={change} options={toOptions(SALARY_PERIODS)} />
        </Field>
        <Field label="Closing date" hint="Optional">
          <input className="input" type="datetime-local" name="closes_at" value={v.closes_at} onChange={change} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2">
          <input type="checkbox" name="show_salary" checked={v.show_salary} onChange={change} />
          Show pay on the job page
        </label>
        <Field label="Skills" hint="Separate with commas" className="sm:col-span-2">
          <input className="input" name="skills" value={v.skills} onChange={change} />
        </Field>
      </div>

      <div className="card space-y-4">
        <Field label="Short summary" error={errors.summary}>
          <input className="input" name="summary" maxLength={160} value={v.summary} onChange={change} />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className="input" rows={6} name="description" value={v.description} onChange={change} />
        </Field>
        <Field label="Responsibilities">
          <textarea className="input" rows={4} name="responsibilities" value={v.responsibilities} onChange={change} />
        </Field>
        <Field label="Requirements">
          <textarea className="input" rows={4} name="requirements" value={v.requirements} onChange={change} />
        </Field>
        <Field label="Benefits">
          <textarea className="input" rows={3} name="benefits" value={v.benefits} onChange={change} />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link to="/org/jobs" className="inline-flex items-center rounded-ui bg-soft px-4 py-2 font-medium">
          Cancel
        </Link>
        <Button variant="secondary" loading={saving === 'draft'} onClick={() => submit(false)}>
          {alreadyLive ? 'Save changes' : 'Save draft'}
        </Button>
        {!alreadyLive && (
          <Button loading={saving === 'publish'} onClick={() => submit(true)}>
            Publish
          </Button>
        )}
      </div>
    </form>
  )
}

export default function JobForm() {
  const { id } = useParams()
  const query = useLoad(async () => {
    const [categories, job] = await Promise.all([listCategories(), id ? getJob(id) : null])
    return { categories, job }
  }, [id])

  return (
    <div>
      <PageHeader title={id ? 'Edit job' : 'New job'} />
      <Async query={query}>{({ categories, job }) => <Form key={id || 'new'} job={job} categories={categories} />}</Async>
    </div>
  )
}
