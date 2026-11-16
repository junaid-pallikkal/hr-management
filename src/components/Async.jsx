import { AlertCircle } from 'lucide-react'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import Button from './Button'

// Shows loading, error (with retry), then the page content. `query` comes from useLoad.
export default function Async({ query, children }) {
  if (query.loading && query.data == null) return <Spinner />
  if (query.error)
    return (
      <EmptyState
        icon={AlertCircle}
        title={query.error}
        action={
          <Button variant="secondary" onClick={query.reload}>
            Try again
          </Button>
        }
      />
    )
  if (query.data == null) return null
  return children(query.data)
}
