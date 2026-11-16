import { Loader2 } from 'lucide-react'

const styles = {
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  secondary: 'bg-soft text-fg hover:opacity-80',
  danger: 'bg-danger text-primary-fg hover:opacity-90',
  ghost: 'text-fg hover:bg-soft',
}

// Use this on links that should look like buttons.
export const buttonClass = (variant = 'primary') =>
  `inline-flex items-center justify-center gap-2 rounded-ui px-4 py-2 text-body font-medium transition duration-200 ease-out hover:-translate-y-px hover:shadow-soft active:translate-y-0 active:scale-95 disabled:pointer-events-none disabled:opacity-50 ${styles[variant]}`

export default function Button({ variant = 'primary', loading = false, className = '', children, disabled, type = 'button', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} className={`${buttonClass(variant)} ${className}`} {...rest}>
      {loading && <Loader2 className="animate-spin" />}
      {children}
    </button>
  )
}
