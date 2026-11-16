import { useAuth } from '../context/AuthContext'
import useLoad from '../hooks/useLoad'
import { listOrgActivity } from '../services/organizations'
import ActivityList from '../components/ActivityList'
import Async from '../components/Async'
import PageHeader from '../components/PageHeader'

export default function OrgActivity() {
  const { org } = useAuth()
  const query = useLoad(() => listOrgActivity(org.id), [org.id])
  return (
    <div>
      <PageHeader title="Activity" />
      <Async query={query}>{(rows) => <ActivityList rows={rows} />}</Async>
    </div>
  )
}
