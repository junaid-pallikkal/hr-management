import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { createOrganization } from '../services/organizations'
import AuthFrame from '../components/AuthFrame'
import Button from '../components/Button'
import Field from '../components/Field'
import Spinner from '../components/Spinner'

export default function OrgOnboarding() {
  const { user, membership, loading: authLoading, refresh, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', industry: '', city: '', country: '', email: user?.email || '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (authLoading) return <Spinner />
  if (membership) return <Navigate to="/org" replace />

  const change = (e) => setValues({ ...values, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!values.name.trim()) found.name = 'Enter the company name.'
    if (!values.industry.trim()) found.industry = 'Enter the industry.'
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) found.email = 'Enter a valid email.'
    setErrors(found)
    if (Object.keys(found).length) return
    setLoading(true)
    try {
      await createOrganization({ ...values, name: values.name.trim() })
      await refresh()
      toast.success('Company created. We will review it soon.')
      navigate('/org/settings', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame title="Set up your company">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Company name" error={errors.name}>
          <input className="input" name="name" value={values.name} onChange={change} />
        </Field>
        <Field label="Industry" error={errors.industry}>
          <input className="input" name="industry" value={values.industry} onChange={change} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <input className="input" name="city" value={values.city} onChange={change} />
          </Field>
          <Field label="Country">
            <input className="input" name="country" value={values.country} onChange={change} />
          </Field>
        </div>
        <Field label="Contact email" error={errors.email}>
          <input className="input" type="email" name="email" value={values.email} onChange={change} />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          Create company
        </Button>
        <Button variant="ghost" className="w-full" onClick={logout}>
          Log out
        </Button>
      </form>
    </AuthFrame>
  )
}
