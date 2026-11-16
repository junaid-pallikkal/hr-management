import useLoad from '../hooks/useLoad'
import { getPlatformStats } from '../services/admin'
import Async from '../components/Async'
import PageHeader from '../components/PageHeader'
import { BarList } from '../components/Stats'

const pretty = (rows) => rows.map((r) => ({ label: r.label.replaceAll('_', ' '), count: r.count }))

export default function AdminAnalytics() {
  const query = useLoad(getPlatformStats, [])
  return (
    <div>
      <PageHeader title="Analytics" />
      <Async query={query}>
        {(s) => (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card">
              <h2 className="mb-3 text-section font-semibold">Organizations</h2>
              <BarList items={pretty(s.orgs_by_status)} />
            </section>
            <section className="card">
              <h2 className="mb-3 text-section font-semibold">Users</h2>
              <BarList items={pretty(s.users_by_role)} />
            </section>
            <section className="card">
              <h2 className="mb-3 text-section font-semibold">Jobs</h2>
              <BarList items={pretty(s.jobs_by_status)} empty="No jobs yet." />
            </section>
            <section className="card">
              <h2 className="mb-3 text-section font-semibold">New sign-ups per week</h2>
              <BarList items={s.signups_by_week} empty="No sign-ups yet." />
            </section>
          </div>
        )}
      </Async>
    </div>
  )
}
