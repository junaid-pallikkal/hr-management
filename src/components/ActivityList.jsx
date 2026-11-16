import { Activity } from 'lucide-react'
import { formatDateTime } from '../lib/format'
import EmptyState from './EmptyState'

const label = (action) => action.replace('.', ': ').replaceAll('_', ' ')

export default function ActivityList({ rows, showOrg = false }) {
  if (!rows.length) return <EmptyState icon={Activity} title="No activity yet." />
  return (
    <ul className="card divide-y divide-soft">
      {rows.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="font-medium capitalize">{label(r.action)}</p>
            <p className="truncate text-small text-muted">
              {r.profiles?.full_name || 'System'}
              {showOrg && r.organizations?.name ? ` · ${r.organizations.name}` : ''}
              {r.metadata?.job ? ` · ${r.metadata.job}` : r.metadata?.title ? ` · ${r.metadata.title}` : ''}
            </p>
          </div>
          <span className="text-small text-muted">{formatDateTime(r.created_at)}</span>
        </li>
      ))}
    </ul>
  )
}
