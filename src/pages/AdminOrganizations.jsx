import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import { listOrganizations } from '../services/admin'
import { ORG_STATUSES, toOptions } from '../lib/constants'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import EmptyState from '../components/EmptyState'
import { Select } from '../components/Field'
import PageHeader from '../components/PageHeader'

export default function AdminOrganizations() {
  const [status, setStatus] = useState('')
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') || '')
  useEffect(() => setQ(params.get('q') || ''), [params])
  const query = useLoad(() => listOrganizations({ status, q }), [status, q])

  return (
    <div>
      <PageHeader title="Organizations" />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px]">
        <input className="input" placeholder="Search by name" aria-label="Search organizations" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select placeholder="All statuses" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={toOptions(ORG_STATUSES)} />
      </div>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState icon={Building2} title="No organizations found." />
          ) : (
            <ul className="card divide-y divide-soft">
              {rows.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link to={`/admin/organizations/${o.id}`} className="block truncate font-medium hover:text-primary">
                      {o.name}
                    </Link>
                    <span className="text-small text-muted">
                      {o.industry || 'No industry'} · {formatDate(o.created_at)}
                    </span>
                  </div>
                  <Badge value={o.status} label={ORG_STATUSES[o.status]} />
                </li>
              ))}
            </ul>
          )
        }
      </Async>
    </div>
  )
}
