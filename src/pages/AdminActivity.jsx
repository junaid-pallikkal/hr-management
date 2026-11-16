import useLoad from '../hooks/useLoad'
import { listPlatformActivity } from '../services/admin'
import ActivityList from '../components/ActivityList'
import Async from '../components/Async'
import PageHeader from '../components/PageHeader'

export default function AdminActivity() {
  const query = useLoad(listPlatformActivity, [])
  return (
    <div>
      <PageHeader title="Activity" />
      <Async query={query}>{(rows) => <ActivityList rows={rows} showOrg />}</Async>
    </div>
  )
}
