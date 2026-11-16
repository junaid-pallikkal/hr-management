import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { onAuthChange } from './services/auth'
import AppRoutes from './routes'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()

  // Opening a "reset password" email link sends the person to the new password page.
  useEffect(
    () =>
      onAuthChange((_session, event) => {
        if (event === 'PASSWORD_RECOVERY' && location.pathname !== '/reset-password') navigate('/reset-password')
      }),
    [navigate, location.pathname],
  )

  return <AppRoutes />
}
