import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { signUp } from '../services/auth'
import AuthFrame from '../components/AuthFrame'
import Button from '../components/Button'
import Field from '../components/Field'
import EmptyState from '../components/EmptyState'

export default function Signup() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/dashboard'
  const [type, setType] = useState(params.get('type') === 'org' ? 'organization_user' : 'job_seeker')
  const [values, setValues] = useState({ fullName: '', email: params.get('email') || '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  if (session) return <Navigate to={next} replace />

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!values.fullName.trim()) found.fullName = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = 'Enter a valid email.'
    if (values.password.length < 6) found.password = 'Use at least 6 characters.'
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    try {
      const needsConfirm = await signUp({ ...values, email: values.email.trim(), fullName: values.fullName.trim(), accountType: type })
      if (needsConfirm) setSent(true)
      else navigate(next, { replace: true })
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (sent)
    return (
      <AuthFrame title="Check your email">
        <EmptyState icon={MailCheck} title="We sent you a link. Open it to confirm your account, then log in." action={<Link to="/login" className="text-primary">Go to log in</Link>} />
      </AuthFrame>
    )

  return (
    <AuthFrame title="Create account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.form && <p className="rounded-ui bg-danger/10 px-3 py-2 text-danger">{errors.form}</p>}
        <div className="grid grid-cols-2 gap-1 rounded-ui bg-soft p-1">
          {[
            ['job_seeker', 'Job seeker'],
            ['organization_user', 'Company'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-ui px-3 py-2 font-medium transition ${type === value ? 'bg-surface text-fg shadow-soft' : 'text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <Field label="Full name" error={errors.fullName}>
          <input className="input" name="fullName" autoComplete="name" value={values.fullName} onChange={change} />
        </Field>
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" name="email" autoComplete="email" value={values.email} onChange={change} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className="input" type="password" name="password" autoComplete="new-password" value={values.password} onChange={change} />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Sign up
        </Button>
        <p className="text-center text-small">
          Already have an account?{' '}
          <Link to="/login" className="text-primary">
            Log in
          </Link>
        </p>
      </form>
    </AuthFrame>
  )
}
