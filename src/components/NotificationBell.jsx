import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { subscribeToNotifications, unreadCount } from '../services/notifications'
import Tooltip from './Tooltip'

export default function NotificationBell() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const refresh = useCallback(() => unreadCount().then(setCount), [])

  useEffect(() => {
    if (!user) return
    refresh()
    return subscribeToNotifications(user.id, refresh)
  }, [user, refresh])

  return (
    <Tooltip label="Notifications">
      <Link to="/notifications" aria-label="Notifications" className="relative inline-flex h-8 w-8 items-center justify-center rounded-ui text-muted hover:bg-soft hover:text-fg">
        <Bell />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-small font-semibold text-primary-fg">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Link>
    </Tooltip>
  )
}
