import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AdminLayout, AnyLayout, OrgLayout, SeekerLayout } from './components/Layouts'
import PublicLayout from './components/PublicLayout'
import { RequireOrg, RequireOrgRole, RequireRole } from './components/RouteGuards'
import Spinner from './components/Spinner'
const AdminActivity = lazy(() => import('./pages/AdminActivity'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const AdminCategories = lazy(() => import('./pages/AdminCategories'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminOrganizationDetail = lazy(() => import('./pages/AdminOrganizationDetail'))
const AdminOrganizations = lazy(() => import('./pages/AdminOrganizations'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'))
const Company = lazy(() => import('./pages/Company'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const GoHome = lazy(() => import('./pages/GoHome'))
const Invite = lazy(() => import('./pages/Invite'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const JobForm = lazy(() => import('./pages/JobForm'))
const JobPipeline = lazy(() => import('./pages/JobPipeline'))
const Jobs = lazy(() => import('./pages/Jobs'))
const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Notifications = lazy(() => import('./pages/Notifications'))
const OrgActivity = lazy(() => import('./pages/OrgActivity'))
const OrgAnalytics = lazy(() => import('./pages/OrgAnalytics'))
const OrgDashboard = lazy(() => import('./pages/OrgDashboard'))
const OrgInterviews = lazy(() => import('./pages/OrgInterviews'))
const OrgJobs = lazy(() => import('./pages/OrgJobs'))
const OrgOnboarding = lazy(() => import('./pages/OrgOnboarding'))
const OrgSettings = lazy(() => import('./pages/OrgSettings'))
const OrgTeam = lazy(() => import('./pages/OrgTeam'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const SeekerApplications = lazy(() => import('./pages/SeekerApplications'))
const SeekerDashboard = lazy(() => import('./pages/SeekerDashboard'))
const SeekerInterviews = lazy(() => import('./pages/SeekerInterviews'))
const SeekerProfile = lazy(() => import('./pages/SeekerProfile'))
const SeekerResumes = lazy(() => import('./pages/SeekerResumes'))
const SeekerSaved = lazy(() => import('./pages/SeekerSaved'))
const Signup = lazy(() => import('./pages/Signup'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:slug" element={<JobDetail />} />
        <Route path="/companies/:slug" element={<Company />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite/:token" element={<Invite />} />
      <Route path="/dashboard" element={<GoHome />} />

      {/* Everyone who is logged in */}
      <Route element={<AnyLayout />}>
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      {/* Job seeker */}
      <Route element={<RequireRole role="job_seeker" />}>
        <Route element={<SeekerLayout />}>
          <Route path="/seeker" element={<SeekerDashboard />} />
          <Route path="/seeker/profile" element={<SeekerProfile />} />
          <Route path="/seeker/resumes" element={<SeekerResumes />} />
          <Route path="/seeker/applications" element={<SeekerApplications />} />
          <Route path="/seeker/saved" element={<SeekerSaved />} />
          <Route path="/seeker/interviews" element={<SeekerInterviews />} />
        </Route>
      </Route>

      {/* Organization */}
      <Route element={<RequireRole role={['organization_user', 'super_admin']} />}>
        <Route path="/org/onboarding" element={<OrgOnboarding />} />
        <Route element={<RequireOrg />}>
          <Route element={<OrgLayout />}>
            <Route path="/org" element={<OrgDashboard />} />
            <Route path="/org/jobs" element={<OrgJobs />} />
            <Route path="/org/jobs/new" element={<JobForm />} />
            <Route path="/org/jobs/:id/edit" element={<JobForm />} />
            <Route path="/org/jobs/:id/pipeline" element={<JobPipeline />} />
            <Route path="/org/applications/:id" element={<ApplicationDetail />} />
            <Route path="/org/interviews" element={<OrgInterviews />} />
            <Route path="/org/analytics" element={<OrgAnalytics />} />
            <Route element={<RequireOrgRole roles={['org_admin', 'hr_manager']} />}>
              <Route path="/org/team" element={<OrgTeam />} />
            </Route>
            <Route element={<RequireOrgRole roles={['org_admin']} />}>
              <Route path="/org/settings" element={<OrgSettings />} />
              <Route path="/org/activity" element={<OrgActivity />} />
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Super Admin */}
      <Route element={<RequireRole role="super_admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/activity" element={<AdminActivity />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  )
}
