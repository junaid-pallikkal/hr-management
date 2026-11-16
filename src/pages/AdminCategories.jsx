import { useState } from 'react'
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { listCategories } from '../services/jobs'
import { deleteCategory, saveCategory } from '../services/admin'
import Async from '../components/Async'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EmptyState from '../components/EmptyState'
import Field from '../components/Field'
import IconButton from '../components/IconButton'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'

export default function AdminCategories() {
  const toast = useToast()
  const query = useLoad(listCategories, [])
  const [edit, setEdit] = useState(null)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [remove, setRemove] = useState(null)
  const [busy, setBusy] = useState(false)

  function open(item) {
    setEdit(item)
    setName(item.name || '')
    setError('')
  }

  async function submit() {
    if (!name.trim()) return setError('Enter a name.')
    setBusy(true)
    try {
      await saveCategory(edit.id, name.trim(), edit.sort_order ?? (query.data?.length || 0) + 1)
      toast.success('Saved')
      setEdit(null)
      query.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    setBusy(true)
    try {
      await deleteCategory(remove.id)
      toast.success('Category deleted')
      setRemove(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
      setRemove(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Categories">
        <Button onClick={() => open({})}>
          <Plus />
          Add
        </Button>
      </PageHeader>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? (
            <EmptyState icon={Tags} title="No categories yet." />
          ) : (
            <ul className="card divide-y divide-soft">
              {rows.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                  <span className="font-medium">{c.name}</span>
                  <div className="flex">
                    <IconButton label="Edit" onClick={() => open(c)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Delete" danger onClick={() => setRemove(c)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </Async>
      <Modal
        open={!!edit}
        title={edit?.id ? 'Edit category' : 'Add category'}
        onClose={() => setEdit(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button loading={busy} onClick={submit}>
              Save
            </Button>
          </>
        }
      >
        <Field label="Name" error={error}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </Modal>
      <ConfirmDialog open={!!remove} title="Delete category?" message="Jobs in this category will have no category." confirmLabel="Delete" danger loading={busy} onConfirm={confirmRemove} onClose={() => setRemove(null)} />
    </div>
  )
}
