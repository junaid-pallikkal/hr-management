import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import { getAnalytics } from '../services/organizations'
import { APPLICATION_STATUSES, PIPELINE_COLUMNS } from '../lib/constants'
import Async from '../components/Async'
import PageHeader from '../components/PageHeader'
import { BarList, StatGrid } from '../components/Stats'

export default function OrgAnalytics() {
  const { org } = useAuth()
  const query = useLoad(() => getAnalytics(org.id), [org.id])

  return (
    <div>
      <PageHeader title="Analytics" />
      <Async query={query}>
        {(a) => {
          const counts = Object.fromEntries(a.funnel.map((f) => [f.status, f.count]))
          const total = a.funnel.reduce((sum, f) => sum + f.count, 0)
          return (
            <div className="space-y-6">
              <StatGrid
                items={[
                  { label: 'Applications', value: total },
                  { label: 'Hired', value: counts.hired || 0 },
                  { label: 'Rejected', value: counts.rejected || 0 },
                  { label: 'Days to hire (average)', value: a.days_to_hire ?? '-' },
                ]}
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <section className="card">
                  <h2 className="mb-3 text-section font-semibold">Hiring funnel</h2>
                  <BarList items={PIPELINE_COLUMNS.map((s) => ({ label: APPLICATION_STATUSES[s], count: counts[s] || 0 }))} />
                </section>
                <section className="card">
                  <h2 className="mb-3 text-section font-semibold">Applications per job</h2>
                  <BarList items={a.per_job.map((j) => ({ label: j.title, count: j.count }))} empty="No jobs yet." />
                </section>
                <section className="card">
                  <h2 className="mb-3 text-section font-semibold">Hires by month</h2>
                  <BarList items={a.hires_by_month.map((h) => ({ label: h.month, count: h.count }))} empty="No hires yet." />
                </section>
              </div>
            </div>
          )
        }}
      </Async>
    </div>
  )
}
