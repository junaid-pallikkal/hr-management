import { SALARY_PERIODS } from './constants'

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : ''

export function timeAgo(d) {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(d)
}

export function salaryText(job) {
  if (!job.show_salary || (!job.salary_min && !job.salary_max)) return ''
  const n = (v) => new Intl.NumberFormat().format(v)
  const range = job.salary_min && job.salary_max ? `${n(job.salary_min)} - ${n(job.salary_max)}` : n(job.salary_min || job.salary_max)
  return `${job.salary_currency || ''} ${range} ${SALARY_PERIODS[job.salary_period] || ''}`.trim()
}

export const placeText = (o) => [o.city, o.state, o.country].filter(Boolean).join(', ')

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)

export const randomSuffix = () => Math.random().toString(36).slice(2, 7)

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?'

export const fileSize = (bytes = 0) => (bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`)

// Value for <input type="datetime-local"> from a date, in local time.
export function toLocalInput(d) {
  const date = new Date(d)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
