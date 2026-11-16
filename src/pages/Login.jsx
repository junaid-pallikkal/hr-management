import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signIn } from '../services/auth'
import AuthFrame from '../components/AuthFrame'
import Button from '../components/Button'
import Field from '../components/Field'

export default function Login() {
  const { session, blocked } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const next = location.state?.from || new URLSearchParams(location.search).get('next') || '/dashboard'
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to={next} replace />

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!values.email.trim()) found.email = 'Enter your email.'
    if (!values.password) found.password = 'Enter your password.'
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    try {
      await signIn(values.email.trim(), values.password)
      navigate(next, { replace: true })
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Log in">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {(blocked || errors.form) && <p className="rounded-ui bg-danger/10 px-3 py-2 text-danger">{blocked || errors.form}</p>}
        <Field label="Email" error={errors.email}>
          <input className="input" type="email" name="email" autoComplete="email" value={values.email} onChange={change} />
        </Field>
        <Field label="Password" error={errors.password}>
          <input className="input" type="password" name="password" autoComplete="current-password" value={values.password} onChange={change} />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
        <div className="flex justify-between text-small">
          <Link to="/forgot-password" className="text-primary">
            Forgot password?
          </Link>
          <Link to={`/signup${location.search}`} className="text-primary">
            Create account
          </Link>
        </div>
      </form>
    </AuthFrame>
  )
}
