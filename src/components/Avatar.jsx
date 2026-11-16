import { initials } from '../lib/format'

export default function Avatar({ name, src, large = false }) {
  const size = large ? 'h-12 w-12' : 'h-8 w-8'
  if (src) return <img src={src} alt={name || ''} className={`${size} shrink-0 rounded-full object-cover`} />
  return (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-small font-semibold text-primary`}>
      {initials(name)}
    </span>
  )
}
