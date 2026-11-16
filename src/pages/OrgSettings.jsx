import { useState } from 'react'
import { FileText, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { addDocument, listDocuments, removeDocument, resubmitOrganization, updateOrganization, uploadOrgImage } from '../services/organizations'
import { checkFile, DOC_FILE_TYPES, IMAGE_TYPES, openPrivateFile, publicUrl } from '../services/storage'
import { DOC_TYPES, ORG_SIZES, ORG_STATUSES } from '../lib/constants'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Field, { Select } from '../components/Field'
import FileInput from '../components/FileInput'
import IconButton from '../components/IconButton'
import PageHeader from '../components/PageHeader'

const text = (v) => v.trim() || null

function ProfileForm() {
  const { org, refresh } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({
    name: org.name || '',
    tagline: org.tagline || '',
    industry: org.industry || '',
    size_range: org.size_range || '',
    founded_year: org.founded_year ?? '',
    website: org.website || '',
    linkedin_url: org.linkedin_url || '',
    contact_email: org.contact_email || '',
    contact_phone: org.contact_phone || '',
    address_line: org.address_line || '',
    city: org.city || '',
    state: org.state || '',
    country: org.country || '',
    about: org.about || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')
  const change = (e) => setV({ ...v, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!v.name.trim()) found.name = 'Enter the company name.'
    if (v.contact_email && !/^\S+@\S+\.\S+$/.test(v.contact_email)) found.contact_email = 'Enter a valid email.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await updateOrganization(org.id, {
        name: v.name.trim(),
        tagline: text(v.tagline),
        industry: text(v.industry),
        size_range: v.size_range || null,
        founded_year: v.founded_year ? Number(v.founded_year) : null,
        website: text(v.website),
        linkedin_url: text(v.linkedin_url),
        contact_email: text(v.contact_email),
        contact_phone: text(v.contact_phone),
        address_line: text(v.address_line),
        city: text(v.city),
        state: text(v.state),
        country: text(v.country),
        about: text(v.about),
      })
      await refresh()
      toast.success('Saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function image(kind, file) {
    const problem = checkFile(file, IMAGE_TYPES, 2)
    if (problem) return toast.error(problem)
    setUploading(kind)
    try {
      await updateOrganization(org.id, await uploadOrgImage(org.id, kind, file))
      await refresh()
      toast.success('Image updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading('')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar large name={org.name} src={publicUrl('org-assets', org.logo_path)} />
        <FileInput label="Logo" accept={IMAGE_TYPES.join(',')} loading={uploading === 'logo'} onFile={(f) => image('logo', f)} />
        <FileInput label="Cover image" accept={IMAGE_TYPES.join(',')} loading={uploading === 'cover'} onFile={(f) => image('cover', f)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company name" error={errors.name}>
          <input className="input" name="name" value={v.name} onChange={change} />
        </Field>
        <Field label="Tagline">
          <input className="input" name="tagline" value={v.tagline} onChange={change} />
        </Field>
        <Field label="Industry">
          <input className="input" name="industry" value={v.industry} onChange={change} />
        </Field>
        <Field label="Company size">
          <Select placeholder="Choose" name="size_range" value={v.size_range} onChange={change} options={ORG_SIZES.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Founded">
          <input className="input" type="number" name="founded_year" value={v.founded_year} onChange={change} />
        </Field>
        <Field label="Website">
          <input className="input" name="website" value={v.website} onChange={change} />
        </Field>
        <Field label="LinkedIn">
          <input className="input" name="linkedin_url" value={v.linkedin_url} onChange={change} />
        </Field>
        <Field label="Contact email" error={errors.contact_email}>
          <input className="input" type="email" name="contact_email" value={v.contact_email} onChange={change} />
        </Field>
        <Field label="Contact phone">
          <input className="input" name="contact_phone" value={v.contact_phone} onChange={change} />
        </Field>
        <Field label="Address">
          <input className="input" name="address_line" value={v.address_line} onChange={change} />
        </Field>
        <Field label="City">
          <input className="input" name="city" value={v.city} onChange={change} />
        </Field>
        <Field label="State">
          <input className="input" name="state" value={v.state} onChange={change} />
        </Field>
        <Field label="Country">
          <input className="input" name="country" value={v.country} onChange={change} />
        </Field>
      </div>
      <Field label="About">
        <textarea className="input" rows={5} name="about" value={v.about} onChange={change} />
      </Field>
      <Button type="submit" loading={saving}>
        Save
      </Button>
    </form>
  )
}

function Verification() {
  const { org, user, refresh } = useAuth()
  const toast = useToast()
  const docs = useLoad(() => listDocuments(org.id), [org.id])
  const [docType, setDocType] = useState(DOC_TYPES[0])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

  async function upload(file) {
    const problem = checkFile(file, DOC_FILE_TYPES, 5)
    if (problem) return toast.error(problem)
    setUploading(true)
    try {
      await addDocument(org.id, user.id, docType, file)
      toast.success('Document added')
      docs.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function remove(doc) {
    try {
      await removeDocument(doc)
      docs.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function open(doc) {
    try {
      await openPrivateFile('verification-docs', doc.file_path)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function resubmit() {
    setSending(true)
    try {
      await resubmitOrganization(org.id)
      await refresh()
      toast.success('Sent for review again')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  const editable = org.status === 'pending' || org.status === 'rejected'

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-section font-semibold">Verification</h2>
        <Badge value={org.status} label={ORG_STATUSES[org.status]} />
      </div>
      {org.status === 'rejected' && org.rejection_reason && <p className="text-danger">Reason: {org.rejection_reason}</p>}
      {editable && (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Document type">
            <Select value={docType} onChange={(e) => setDocType(e.target.value)} options={DOC_TYPES.map((d) => ({ value: d, label: d }))} />
          </Field>
          <FileInput label="Upload document" accept=".pdf,.jpg,.jpeg,.png" loading={uploading} onFile={upload} />
          {org.status === 'rejected' && (
            <Button loading={sending} onClick={resubmit}>
              Send for review again
            </Button>
          )}
        </div>
      )}
      <Async query={docs}>
        {(rows) =>
          rows.length === 0 ? (
            <p className="text-muted">No documents yet. Upload a registration certificate to speed up approval.</p>
          ) : (
            <ul className="card divide-y divide-soft">
              {rows.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <FileText className="text-muted" />
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => open(d)}>
                    <span className="block truncate font-medium">{d.doc_type}</span>
                    <span className="text-small text-muted">
                      {d.file_name} · {formatDate(d.created_at)}
                    </span>
                  </button>
                  {editable && (
                    <IconButton label="Delete" danger onClick={() => remove(d)}>
                      <Trash2 />
                    </IconButton>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </Async>
    </section>
  )
}

export default function OrgSettings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" />
      <ProfileForm />
      <Verification />
    </div>
  )
}
