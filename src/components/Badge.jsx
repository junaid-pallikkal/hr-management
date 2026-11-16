import { TONES } from '../lib/constants'

const tones = {
  muted: 'bg-soft text-muted',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
}

// `value` picks the color from the status. Or pass `tone` directly.
export default function Badge({ value, label, tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-small font-medium ${tones[tone || TONES[value] || 'muted']}`}>
      {label}
    </span>
  )
}
