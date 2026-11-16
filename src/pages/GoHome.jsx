import { Navigate } from 'react-router-dom'
import { homePath, useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

// Sends a logged-in person to the dashboard for their role.
export default function GoHome() {
  const { session, profile, loading } = useAuth()
  if (loading || (session && !profile)) return <Spinner />
  return <Navigate to={session ? homePath(profile) : '/login'} replace />
}
