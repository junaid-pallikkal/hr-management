import { Link } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import useLoad from '../hooks/useLoad'
import { getPlatformStats, listOrganizations } from '../services/admin'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { buttonClass } from '../components/Button'
import Hero, { greeting } from '../components/Hero'
import { StatGrid } from '../components/Stats'

const count = (rows, label) => rows.find((r) => r.label === label)?.count || 0

export default function AdminDashboard() {
  const { profile } = useAuth()
  const query = useLoad(async () => {
    const [stats, pending] = await Promise.all([getPlatformStats(), listOrganizations({ status: 'pending' })])
    return { stats, pending }
  }, [])

  return (
    <div>
      <Async query={query}>
        {({ stats, pending }) => (
          <div className="space-y-6">
            <Hero
              title={greeting(profile?.full_name?.split(' ')[0])}
              text={pending.length ? `${pending.length} organization${pending.length === 1 ? ' is' : 's are'} waiting for review.` : 'Nothing is waiting for review.'}
              action={
                <Link to="/admin/organizations" className={`${buttonClass('secondary')} bg-primary-fg text-primary`}>
                  Open organizations
                </Link>
              }
            />
            <StatGrid
              items={[
                { label: 'Waiting for review', value: pending.length },
                { label: 'Verified organizations', value: count(stats.orgs_by_status, 'verified') },
                { label: 'Job seekers', value: count(stats.users_by_role, 'job_seeker') },
                { label: 'Applications', value: stats.total_applications },
              ]}
            />
            <section>
              <h2 className="mb-3 text-section font-semibold">Waiting for review</h2>
              {pending.length === 0 ? (
                <EmptyState icon={Building2} title="Nothing to review." />
              ) : (
                <ul className="card divide-y divide-soft">
                  {pending.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div>
                        <Link to={`/admin/organizations/${o.id}`} className="font-medium hover:text-primary">
                          {o.name}
                        </Link>
                        <p className="text-small text-muted">
                          {o.industry} · Sent {formatDate(o.created_at)}
                        </p>
                      </div>
                      <Link to={`/admin/organizations/${o.id}`} className="text-primary">
                        Review
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Async>
    </div>
  )
}
