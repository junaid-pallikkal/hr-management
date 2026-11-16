import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import {
  Activity,
  BarChart3,
  Bookmark,
  Briefcase,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ListChecks,
  Plus,
  Settings,
  Tags,
  User,
  Users,
  Building2,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Shell from './Shell'
import { buttonClass } from './Button'
import EmptyState from './EmptyState'
import Spinner from './Spinner'
import { Navigate, useLocation } from 'react-router-dom'
import { Select } from './Field'

const seekerNav = [
  { to: '/seeker', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/seeker/profile', label: 'Profile', icon: User },
  { to: '/seeker/resumes', label: 'Resumes', icon: FileText },
  { to: '/seeker/applications', label: 'Applications', icon: ListChecks },
  { to: '/seeker/saved', label: 'Saved jobs', icon: Bookmark },
  { to: '/seeker/interviews', label: 'Interviews', icon: CalendarClock },
  { to: '/jobs', label: 'Find jobs', icon: Briefcase },
]

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
  { to: '/org', label: 'Company pages', icon: Briefcase },
]

export const SeekerLayout = () => <Shell nav={seekerNav} searchTo="/jobs" searchLabel="Search jobs" profileTo="/seeker/profile" />
export const AdminLayout = () => <Shell nav={adminNav} searchTo="/admin/organizations" searchLabel="Search organizations" />

export function OrgLayout() {
  const { org, orgRole, memberships, membership, switchOrg, refresh, profile } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const seen = useRef({ id: org?.id, status: org?.status })
  const manager = orgRole === 'org_admin' || orgRole === 'hr_manager'

  // While waiting for approval, check every few seconds. When approved, go straight to the job listing.
  useEffect(() => {
    if (org?.status !== 'pending' || profile?.platform_role === 'super_admin') return
    const timer = setInterval(refresh, 8000)
    return () => clearInterval(timer)
  }, [org?.id, org?.status, profile?.platform_role, refresh])

  useEffect(() => {
    if (seen.current.id === org?.id && seen.current.status === 'pending' && org?.status === 'verified') {
      toast.success('Your company is approved. You can post jobs now.')
      navigate('/org/jobs')
    }
    seen.current = { id: org?.id, status: org?.status }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id, org?.status])

  const nav = [
    ...(profile?.platform_role === 'super_admin' ? [{ to: '/admin', label: 'Admin panel', icon: ShieldAlert }] : []),
    { to: '/org', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/org/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/org/interviews', label: 'Interviews', icon: CalendarClock },
    ...(manager ? [{ to: '/org/team', label: 'Team', icon: Users }] : []),
    { to: '/org/analytics', label: 'Analytics', icon: BarChart3 },
    ...(orgRole === 'org_admin'
      ? [
          { to: '/org/activity', label: 'Activity', icon: Activity },
          { to: '/org/settings', label: 'Settings', icon: Settings },
        ]
      : []),
  ]

  const topSlot =
    memberships.length > 1 ? (
      <div className="max-w-56">
        <Select
          aria-label="Switch organization"
          value={membership?.organization_id}
          onChange={(e) => switchOrg(e.target.value)}
          options={memberships.map((m) => ({ value: m.organization_id, label: m.organizations.name }))}
        />
      </div>
    ) : (
      <span className="font-semibold">{org?.name}</span>
    )

  let banner = null
  if (org?.status === 'pending')
    banner = (
      <div className="bg-warning/10 px-4 py-2 text-warning">
        Waiting for approval. You can set up your company and save drafts. Publishing opens after approval.{' '}
        <Link to="/org/settings" className="font-semibold underline">
          Add documents
        </Link>
      </div>
    )
  if (org?.status === 'rejected')
    banner = (
      <div className="bg-danger/10 px-4 py-2 text-danger">
        Not approved{org.rejection_reason ? `: ${org.rejection_reason}` : '.'}{' '}
        {orgRole === 'org_admin' && (
          <Link to="/org/settings" className="font-semibold underline">
            Fix and send again
          </Link>
        )}
      </div>
    )

  const blocked =
    org?.status === 'suspended' ? (
      <EmptyState icon={ShieldAlert} title="This organization is suspended. Please contact support." />
    ) : null

  const action = (
    <Link to="/org/jobs/new" className={buttonClass('primary')}>
      <Plus />
      New job
    </Link>
  )

  return (
    <Shell
      nav={nav}
      topSlot={topSlot}
      banner={banner}
      blocked={blocked}
      searchTo="/org/jobs"
      searchLabel="Search jobs"
      action={org ? action : null}
      profileTo={orgRole === 'org_admin' ? '/org/settings' : undefined}
    />
  )
}

// Used by pages every role can open, such as notifications.
export function AnyLayout() {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading || (session && !profile)) return <Spinner />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (profile.platform_role === 'super_admin') return <AdminLayout />
  if (profile.platform_role === 'organization_user') return <OrgLayout />
  return <SeekerLayout />
}
