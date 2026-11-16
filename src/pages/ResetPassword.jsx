import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setNewPassword } from '../services/auth'
import { useToast } from '../context/ToastContext'
import AuthFrame from '../components/AuthFrame'
import Button from '../components/Button'
import Field from '../components/Field'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Use at least 6 characters.')
    setError('')
    setLoading(true)
    try {
      await setNewPassword(password)
      toast.success('Password changed')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="New password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" error={error}>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Save password
        </Button>
      </form>
    </AuthFrame>
  )
}
