import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MailX } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { acceptInvitation, getInviteInfo } from '../services/team'
import { MEMBER_ROLES } from '../lib/constants'
import AuthFrame from '../components/AuthFrame'
import Async from '../components/Async'
import Button, { buttonClass } from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function Invite() {
  const { token } = useParams()
  const { session, refresh } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const query = useLoad(async () => (await getInviteInfo(token)) || false, [token])

  async function accept() {
    setLoading(true)
    try {
      await acceptInvitation(token)
      await refresh()
      toast.success('You joined the team')
      navigate('/org', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Team invitation">
      <Async query={query}>
        {(info) =>
          !info || !info.valid ? (
            <EmptyState icon={MailX} title="This invitation is not valid or has expired." action={<Link to="/" className="text-primary">Go home</Link>} />
          ) : (
            <div className="space-y-4">
              <p>
                Join <strong>{info.org_name}</strong> as {MEMBER_ROLES[info.role]}. Use the email <strong>{info.email}</strong>.
              </p>
              {session ? (
                <Button className="w-full" loading={loading} onClick={accept}>
                  Join team
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/login?next=/invite/${token}`} className={buttonClass('secondary')}>
                    Log in
                  </Link>
                  <Link to={`/signup?type=org&email=${encodeURIComponent(info.email)}&next=/invite/${token}`} className={buttonClass('primary')}>
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          )
        }
      </Async>
    </AuthFrame>
  )
}
