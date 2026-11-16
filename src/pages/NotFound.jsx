import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState icon={Compass} title="We could not find that page." action={<Link to="/" className="text-primary">Go home</Link>} />
    </div>
  )
}
