// Label, input and the error message right next to it.
export default function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-small font-medium text-muted">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-small text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-small text-danger">{error}</span>}
    </label>
  )
}

export function Select({ options, placeholder, className = '', ...rest }) {
  return (
    <select className={`input ${className}`} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
