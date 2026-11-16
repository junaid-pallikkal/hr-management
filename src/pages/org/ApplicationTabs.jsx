import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import useLoad from '../../hooks/useLoad'
import {
  addNote,
  deleteNote,
  listEvaluations,
  listHistory,
  listNotes,
  saveEvaluation,
} from '../../services/applications'
import { APPLICATION_STATUSES, RECOMMENDATIONS, toOptions } from '../../lib/constants'
import { formatDateTime } from '../../lib/format'
import Async from '../../components/Async'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import Field, { Select } from '../../components/Field'
import IconButton from '../../components/IconButton'

export function NotesTab({ applicationId }) {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => listNotes(applicationId), [applicationId])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function add(e) {
    e.preventDefault()
    if (!body.trim()) return setError('Write a note first.')
    setError('')
    setSaving(true)
    try {
      await addNote(applicationId, user.id, body.trim())
      setBody('')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    try {
      await deleteNote(id)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="space-y-2">
        <Field label="Private note (candidates never see this)" error={error}>
          <textarea className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Button type="submit" loading={saving}>
          Add note
        </Button>
      </form>
      <Async query={query}>
        {(notes) =>
          notes.length === 0 ? (
            <EmptyState title="No notes yet." />
          ) : (
            <ul className="divide-y divide-soft">
              {notes.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2 py-3">
                  <div>
                    <p className="whitespace-pre-line">{n.body}</p>
                    <p className="text-small text-muted">
                      {n.profiles?.full_name} · {formatDateTime(n.created_at)}
                    </p>
                  </div>
                  {n.author_id === user.id && (
                    <IconButton label="Delete note" danger onClick={() => remove(n.id)}>
                      <Trash2 />
                    </IconButton>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      </Async>
    </div>
  )
}

export function EvaluationsTab({ applicationId }) {
  const { user } = useAuth()
  const toast = useToast()
  const query = useLoad(() => listEvaluations(applicationId), [applicationId])
  const [v, setV] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const mine = query.data?.find((e) => e.evaluator_id === user.id)
  const form = v || {
    rating: mine?.rating ?? '',
    recommendation: mine?.recommendation ?? '',
    strengths: mine?.strengths ?? '',
    concerns: mine?.concerns ?? '',
  }
  const change = (e) => setV({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!form.rating) found.rating = 'Choose a score.'
    if (!form.recommendation) found.recommendation = 'Choose your recommendation.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    try {
      await saveEvaluation(applicationId, user.id, {
        rating: Number(form.rating),
        recommendation: form.recommendation,
        strengths: form.strengths.trim() || null,
        concerns: form.concerns.trim() || null,
      })
      toast.success('Scorecard saved')
      setV(null)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Score (1 to 5)" error={errors.rating}>
            <Select placeholder="Choose" name="rating" value={form.rating} onChange={change} options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} />
          </Field>
          <Field label="Your recommendation" error={errors.recommendation}>
            <Select placeholder="Choose" name="recommendation" value={form.recommendation} onChange={change} options={toOptions(RECOMMENDATIONS)} />
          </Field>
        </div>
        <Field label="Strengths">
          <textarea className="input" rows={2} name="strengths" value={form.strengths} onChange={change} />
        </Field>
        <Field label="Concerns">
          <textarea className="input" rows={2} name="concerns" value={form.concerns} onChange={change} />
        </Field>
        <Button type="submit" loading={saving}>
          {mine ? 'Update my scorecard' : 'Save scorecard'}
        </Button>
      </form>
      <Async query={query}>
        {(rows) =>
          rows.length === 0 ? null : (
            <ul className="divide-y divide-soft">
              {rows.map((r) => (
                <li key={r.id} className="space-y-1 py-3">
                  <p className="font-medium">
                    {r.profiles?.full_name} · {r.rating}/5 · {RECOMMENDATIONS[r.recommendation]}
                  </p>
                  {r.strengths && <p>Strengths: {r.strengths}</p>}
                  {r.concerns && <p>Concerns: {r.concerns}</p>}
                </li>
              ))}
            </ul>
          )
        }
      </Async>
    </div>
  )
}

export function HistoryTab({ applicationId, refreshKey }) {
  const query = useLoad(() => listHistory(applicationId), [applicationId, refreshKey])
  return (
    <Async query={query}>
      {(rows) => (
        <ol className="space-y-3">
          {rows.map((h) => (
            <li key={h.id} className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {h.from_status && <Badge value={h.from_status} label={APPLICATION_STATUSES[h.from_status]} />}
                {h.from_status && <span className="text-muted">to</span>}
                <Badge value={h.to_status} label={APPLICATION_STATUSES[h.to_status]} />
              </div>
              <p className="text-small text-muted">
                {h.profiles?.full_name || 'Candidate'} · {formatDateTime(h.created_at)}
              </p>
              {h.note && <p>{h.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </Async>
  )
}
