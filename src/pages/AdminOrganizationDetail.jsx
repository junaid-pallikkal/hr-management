import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { getOrganizationForReview, reviewOrganization } from '../services/admin'
import { openPrivateFile } from '../services/storage'
import { JOB_STATUSES, MEMBER_ROLES, ORG_STATUSES } from '../lib/constants'
import { formatDate, placeText } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Field from '../components/Field'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function AdminOrganizationDetail() {
  const { id } = useParams()
  const toast = useToast()
  const navigate = useNavigate()
  const { switchOrg } = useAuth()
  const query = useLoad(() => getOrganizationForReview(id), [id])
  const [action, setAction] = useState(null) // 'rejected' | 'suspended'
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function review(status, why) {
    if ((status === 'rejected' || status === 'suspended') && !why.trim()) return setError('Please give a reason.')
    setError('')
    setBusy(true)
    try {
      await reviewOrganization(id, status, why.trim())
      toast.success(`Organization ${ORG_STATUSES[status].toLowerCase()}`)
      setAction(null)
      setReason('')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function open(doc) {
    try {
      await openPrivateFile('verification-docs', doc.file_path)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Async query={query}>
      {({ org, documents, members, jobs }) => (
        <div className="space-y-6">
          <div>
            <Link to="/admin/organizations" className="mb-2 inline-flex items-center gap-1 text-muted hover:text-fg">
              <ArrowLeft />
              Organizations
            </Link>
            <PageHeader title={org.name}>
              <Badge value={org.status} label={ORG_STATUSES[org.status]} />
              <Button variant="secondary" onClick={() => { switchOrg(org.id); navigate('/org') }}>
                <Building2 />
                Open company pages
              </Button>
              {org.status !== 'verified' && org.status !== 'suspended' && <Button onClick={() => review('verified', '')} loading={busy}>Approve</Button>}
              {org.status === 'suspended' && <Button onClick={() => review('verified', '')} loading={busy}>Restore</Button>}
              {(org.status === 'pending') && <Button variant="danger" onClick={() => setAction('rejected')}>Reject</Button>}
              {org.status === 'verified' && <Button variant="danger" onClick={() => setAction('suspended')}>Suspend</Button>}
            </PageHeader>
            {org.rejection_reason && <p className="text-danger">Reason: {org.rejection_reason}</p>}
          </div>

          <section className="card grid gap-2 sm:grid-cols-2">
            {[
              ['Industry', org.industry],
              ['Size', org.size_range],
              ['Location', placeText(org)],
              ['Website', org.website],
              ['Contact email', org.contact_email],
              ['Contact phone', org.contact_phone],
              ['Created', formatDate(org.created_at)],
            ].map(([k, v]) => (
              <p key={k}>
                <span className="text-muted">{k}: </span>
                {v || '-'}
              </p>
            ))}
            {org.about && <p className="whitespace-pre-line sm:col-span-2">{org.about}</p>}
          </section>

          <section>
            <h2 className="mb-3 text-section font-semibold">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-muted">No documents uploaded.</p>
            ) : (
              <ul className="card divide-y divide-soft">
                {documents.map((d) => (
                  <li key={d.id}>
                    <button type="button" onClick={() => open(d)} className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0">
                      <FileText className="text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{d.doc_type}</span>
                        <span className="text-small text-muted">{d.file_name}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-section font-semibold">Team</h2>
            <ul className="card divide-y divide-soft">
              {members.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <span>
                    {m.profiles?.full_name} <span className="text-muted">{m.profiles?.email}</span>
                  </span>
                  <Badge tone="muted" label={MEMBER_ROLES[m.role]} />
                </li>
              ))}
            </ul>
          </section>

          {jobs.length > 0 && (
            <section>
              <h2 className="mb-3 text-section font-semibold">Recent jobs</h2>
              <ul className="card divide-y divide-soft">
                {jobs.map((j) => (
                  <li key={j.id} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span>{j.title}</span>
                    <Badge value={j.status} label={JOB_STATUSES[j.status]} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Modal
            open={!!action}
            title={action === 'rejected' ? 'Reject organization' : 'Suspend organization'}
            onClose={() => setAction(null)}
            footer={
              <>
                <Button variant="secondary" onClick={() => setAction(null)}>
                  Cancel
                </Button>
                <Button variant="danger" loading={busy} onClick={() => review(action, reason)}>
                  {action === 'rejected' ? 'Reject' : 'Suspend'}
                </Button>
              </>
            }
          >
            <Field label="Reason (the organization will see this)" error={error}>
              <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          </Modal>
        </div>
      )}
    </Async>
  )
}
