import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { homePath, useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Spinner from './Spinner'

// Needs a login and one of the platform roles.
export function RequireRole({ role }) {
  const { session, profile, loading } = useAuth()
  const toast = useToast()
  const location = useLocation()
  const wrong = !!profile && !!role && ![].concat(role).includes(profile.platform_role)

  useEffect(() => {
    if (wrong) toast.error('You do not have access to that page.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrong])

  if (loading || (session && !profile)) return <Spinner />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (wrong) return <Navigate to={homePath(profile)} replace />
  return <Outlet />
}

// Organization users need a membership. Without one they set up an organization first.
export function RequireOrg() {
  const { membership, loading, profile } = useAuth()
  if (loading) return <Spinner />
  if (!membership) return <Navigate to={profile?.platform_role === 'super_admin' ? '/admin' : '/org/onboarding'} replace />
  return <Outlet />
}

// Limits a page to some roles inside the organization.
export function RequireOrgRole({ roles }) {
  const { orgRole } = useAuth()
  const toast = useToast()
  const allowed = roles.includes(orgRole)

  useEffect(() => {
    if (!allowed) toast.error('You do not have access to that page.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed])

  return allowed ? <Outlet /> : <Navigate to="/org" replace />
}
