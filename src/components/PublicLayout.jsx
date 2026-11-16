import { Link, Outlet } from 'react-router-dom'
import { homePath, useAuth } from '../context/AuthContext'
import { buttonClass } from './Button'

export default function PublicLayout() {
  const { profile, session } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-surface shadow-soft">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-section font-semibold text-primary">
            JobBridge
          </Link>
          <nav className="ml-4 hidden gap-4 sm:flex">
            <Link to="/jobs" className="font-medium text-muted hover:text-fg">
              Find jobs
            </Link>
          </nav>
          <div className="flex-1" />
          {session && profile ? (
            <Link to={homePath(profile)} className={buttonClass('primary')}>
              My dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={buttonClass('ghost')}>
                Log in
              </Link>
              <Link to="/signup" className={buttonClass('primary')}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="px-4 py-6 text-center text-small text-muted">JobBridge</footer>
    </div>
  )
}
