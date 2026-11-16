export default function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-40 mt-1 -translate-x-1/2 whitespace-nowrap rounded-ui bg-fg px-2 py-1 text-small text-bg opacity-0 shadow-raised transition group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
