import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendResetEmail } from '../services/auth'
import AuthFrame from '../components/AuthFrame'
import Button from '../components/Button'
import Field from '../components/Field'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email.')
    setError('')
    setLoading(true)
    try {
      await sendResetEmail(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Reset password">
      {sent ? (
        <p>If that email has an account, we sent a link to reset the password.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={error}>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Send link
          </Button>
        </form>
      )}
      <p className="mt-4 text-center text-small">
        <Link to="/login" className="text-primary">
          Back to log in
        </Link>
      </p>
    </AuthFrame>
  )
}
