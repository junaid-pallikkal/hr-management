// A row of big numbers.
export function StatGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="card">
          <p className="text-title font-semibold">{s.value ?? 0}</p>
          <p className="text-small text-muted">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// Simple bars for analytics. No chart package needed.
export function BarList({ items, empty = 'No data yet.' }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  if (!items.length) return <p className="text-muted">{empty}</p>
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex justify-between gap-2">
            <span className="truncate">{i.label}</span>
            <span className="font-medium">{i.count}</span>
          </div>
          <div className="h-2 rounded-full bg-soft">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${(i.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
