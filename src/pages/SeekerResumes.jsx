import { useState } from 'react'
import { Download, FileText, Star, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { addResume, deleteResume, listResumes, setDefaultResume } from '../services/candidates'
import { checkFile, openPrivateFile, RESUME_TYPES } from '../services/storage'
import { fileSize, formatDate } from '../lib/format'
import Async from '../components/Async'
import Badge from '../components/Badge'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Field from '../components/Field'
import FileInput from '../components/FileInput'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function SeekerResumes() {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => listResumes(user.id), [user.id])
  const [file, setFile] = useState(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [remove, setRemove] = useState(null)

  function pick(f) {
    const problem = checkFile(f, RESUME_TYPES, 5)
    if (problem) return toast.error(problem)
    setFile(f)
    setLabel(f.name.replace(/\.[^.]+$/, ''))
    setError('')
  }

  async function upload() {
    if (!label.trim()) return setError('Give this resume a name.')
    setSaving(true)
    try {
      await addResume(user.id, label.trim(), file, (query.data || []).length === 0)
      toast.success('Resume added')
      setFile(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function makeDefault(id) {
    try {
      await setDefaultResume(user.id, id)
      toast.success('Default resume changed')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function open(r) {
    try {
      await openPrivateFile('resumes', r.file_path)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmRemove() {
    setSaving(true)
    try {
      await deleteResume(remove)
      toast.success('Resume deleted')
      setRemove(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Resumes">
        <FileInput label="Add resume" accept=".pdf,.doc,.docx" onFile={pick} variant="primary" />
      </PageHeader>
      <Async query={query}>
        {(resumes) =>
          resumes.length === 0 ? (
            <EmptyState icon={FileText} title="No resumes yet. Add one to start applying." />
          ) : (
            <ul className="card divide-y divide-soft">
              {resumes.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <FileText className="text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{r.label}</span>
                      {r.is_default && <Badge label="Default" tone="primary" />}
                    </p>
                    <p className="text-small text-muted">
                      {r.file_name} · {fileSize(r.file_size)} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  {!r.is_default && (
                    <IconButton label="Make default" onClick={() => makeDefault(r.id)}>
                      <Star />
                    </IconButton>
                  )}
                  <IconButton label="Download" onClick={() => open(r)}>
                    <Download />
                  </IconButton>
                  <IconButton label="Delete" danger onClick={() => setRemove(r)}>
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
          )
        }
      </Async>

      <Modal
        open={!!file}
        title="Add resume"
        onClose={() => setFile(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFile(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={upload}>
              Upload
            </Button>
          </>
        }
      >
        <Field label="Name" error={error} hint={file?.name}>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
      </Modal>
      <ConfirmDialog open={!!remove} title="Delete resume?" message="Applications you already sent keep their copy." confirmLabel="Delete" danger loading={saving} onConfirm={confirmRemove} onClose={() => setRemove(null)} />
    </div>
  )
}
