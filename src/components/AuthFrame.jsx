import { Link } from 'react-router-dom'

export default function AuthFrame({ title, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Link to="/" className="mb-6 text-title font-semibold text-primary">
        JobBridge
      </Link>
      <div className="card w-full max-w-sm">
        <h1 className="mb-4 text-title font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  )
}
