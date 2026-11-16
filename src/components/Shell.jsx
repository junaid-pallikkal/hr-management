import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Search, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { publicUrl } from '../services/storage'
import Avatar from './Avatar'
import IconButton from './IconButton'
import NotificationBell from './NotificationBell'

// The app frame for logged-in people: sidebar on desktop, drawer on mobile.
// searchTo: page the top search sends people to. action: a button next to the search.
export default function Shell({ nav, topSlot, banner, blocked, searchTo, searchLabel = 'Search', action, profileTo }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const location = useLocation()
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  function search(e) {
    e.preventDefault()
    navigate(`${searchTo}?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="min-h-screen md:flex">
      {open && <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-surface px-3 py-4 shadow-soft transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="mb-5 flex items-center justify-between px-2">
          <Link to="/" className="flex items-center gap-2 text-section font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-ui bg-primary text-primary-fg">J</span>
            JobBridge
          </Link>
          <span className="md:hidden">
            <IconButton label="Close menu" onClick={() => setOpen(false)}>
              <X />
            </IconButton>
          </span>
        </div>
        {topSlot && <div className="mb-4 px-2">{topSlot}</div>}
        <nav className="-mx-3 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-ui px-3 py-2.5 font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-soft hover:text-fg'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-primary" />}
                  <Icon />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={logout} className="mt-2 flex items-center gap-3 rounded-ui px-3 py-2.5 font-medium text-muted transition hover:bg-soft hover:text-fg">
          <LogOut />
          Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 bg-bg/85 px-4 py-3 backdrop-blur md:px-6">
          <span className="md:hidden">
            <IconButton label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </IconButton>
          </span>
          {searchTo && (
            <form onSubmit={search} className="relative min-w-0 max-w-md flex-1">
              <input className="input bg-surface pr-10 shadow-soft" placeholder={searchLabel} aria-label={searchLabel} value={q} onChange={(e) => setQ(e.target.value)} />
              <button type="submit" aria-label="Search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-ui p-1 text-muted hover:text-fg">
                <Search />
              </button>
            </form>
          )}
          <div className="flex-1" />
          <span className="hidden sm:block">{action}</span>
          <NotificationBell />
          <div className="ml-1 flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate font-semibold leading-4">{profile?.full_name || profile?.email}</p>
              {profileTo && (
                <Link to={profileTo} className="text-small text-muted hover:text-primary">
                  View profile
                </Link>
              )}
            </div>
            <Avatar name={profile?.full_name || profile?.email} src={publicUrl('avatars', profile?.avatar_path)} />
          </div>
        </header>
        {banner}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{blocked || <Outlet />}</main>
      </div>
    </div>
  )
}
