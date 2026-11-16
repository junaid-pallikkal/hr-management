import Tooltip from './Tooltip'

// Every icon-only button needs a label. It becomes the tooltip.
export default function IconButton({ label, children, className = '', danger = false, type = 'button', ...rest }) {
  return (
    <Tooltip label={label}>
      <button
        type={type}
        aria-label={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-ui transition duration-200 ease-out hover:bg-soft active:scale-90 disabled:opacity-50 ${danger ? 'text-danger' : 'text-muted hover:text-fg'} ${className}`}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  )
}
