import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Star, ThumbsUp } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { changeStatus, getApplication, rateApplication } from '../services/applications'
import { getCandidate } from '../services/candidates'
import { openPrivateFile, publicUrl } from '../services/storage'
import { APPLICATION_STATUSES, PIPELINE_COLUMNS } from '../lib/constants'
import { formatDate } from '../lib/format'
import Async from '../components/Async'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Field from '../components/Field'
import MessageThread from '../components/MessageThread'
import Modal from '../components/Modal'
import { EvaluationsTab, HistoryTab, NotesTab } from './org/ApplicationTabs'
import InterviewsTab from './org/InterviewsTab'

const TABS = [
  ['notes', 'Notes'],
  ['scorecards', 'Scorecards'],
  ['interviews', 'Interviews'],
  ['messages', 'Messages'],
  ['history', 'History'],
]

function CandidateInfo({ app, candidate }) {
  const toast = useToast()
  const { profile, base, experiences, educations, skills } = candidate

  async function open() {
    try {
      await openPrivateFile('resumes', app.resumes.file_path)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const links = [
    ['LinkedIn', base.linkedin_url],
    ['Portfolio', base.portfolio_url],
    ['GitHub', base.github_url],
  ].filter(([, url]) => url)

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-muted">{[base.current_title, [base.city, base.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</p>
        <p>{profile.email}</p>
        {profile.phone && <p>{profile.phone}</p>}
        {base.years_experience != null && <p>{base.years_experience} years of experience</p>}
        {links.map(([label, url]) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="mr-3 text-primary">
            {label}
          </a>
        ))}
      </div>
      {app.resumes && (
        <Button variant="secondary" onClick={open}>
          <Download />
          Resume: {app.resumes.label}
        </Button>
      )}
      {app.cover_letter && (
        <section>
          <h3 className="mb-1 font-semibold">Cover letter</h3>
          <p className="whitespace-pre-line">{app.cover_letter}</p>
        </section>
      )}
      {base.summary && (
        <section>
          <h3 className="mb-1 font-semibold">About</h3>
          <p className="whitespace-pre-line">{base.summary}</p>
        </section>
      )}
      {skills.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <Badge key={s} label={s} tone="primary" />
            ))}
          </div>
        </section>
      )}
      {experiences.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Experience</h3>
          <ul className="space-y-2">
            {experiences.map((x) => (
              <li key={x.id}>
                <p className="font-medium">
                  {x.title}, {x.company}
                </p>
                <p className="text-small text-muted">
                  {formatDate(x.start_date)} - {x.end_date ? formatDate(x.end_date) : 'Now'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {educations.length > 0 && (
        <section>
          <h3 className="mb-1 font-semibold">Education</h3>
          <ul className="space-y-2">
            {educations.map((x) => (
              <li key={x.id}>
                <p className="font-medium">{x.degree}</p>
                <p className="text-small text-muted">
                  {x.institution}
                  {x.end_year ? ` · ${x.end_year}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default function ApplicationDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [tab, setTab] = useState('notes')
  const [historyKey, setHistoryKey] = useState(0)
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const query = useLoad(async () => {
    const app = await getApplication(id)
    return { app, candidate: await getCandidate(app.candidate_id) }
  }, [id])

  async function move(status, note) {
    setBusy(true)
    try {
      await changeStatus(id, status, note)
      toast.success(`Moved to ${APPLICATION_STATUSES[status].toLowerCase()}`)
      setReject(false)
      setHistoryKey((k) => k + 1)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function rate(n) {
    try {
      await rateApplication(id, n)
      query.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <Async query={query}>
      {({ app, candidate }) => {
        const closed = app.status === 'withdrawn'
        return (
          <div>
            <Link to={`/org/jobs/${app.jobs.id}/pipeline`} className="mb-2 inline-flex items-center gap-1 text-muted hover:text-fg">
              <ArrowLeft />
              {app.jobs.title}
            </Link>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Avatar large name={app.profiles.full_name} src={publicUrl('avatars', app.profiles.avatar_path)} />
              <div className="min-w-0 flex-1">
                <h1 className="text-title font-semibold">{app.profiles.full_name}</h1>
                <p className="text-muted">Applied {formatDate(app.applied_at)}</p>
              </div>
              <Badge value={app.status} label={APPLICATION_STATUSES[app.status]} />
            </div>

            {!closed && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => rate(n)} className="p-1">
                      <Star className={n <= (app.rating || 0) ? 'fill-current text-warning' : 'text-muted'} />
                    </button>
                  ))}
                </div>
                <select className="input w-auto" aria-label="Move to stage" value={app.status} onChange={(e) => (e.target.value === 'rejected' ? setReject(true) : move(e.target.value))}>
                  {PIPELINE_COLUMNS.map((s) => (
                    <option key={s} value={s}>
                      {APPLICATION_STATUSES[s]}
                    </option>
                  ))}
                </select>
                {app.status !== 'shortlisted' && (
                  <Button variant="secondary" onClick={() => move('shortlisted')}>
                    <ThumbsUp />
                    Shortlist
                  </Button>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="card">
                <CandidateInfo app={app} candidate={candidate} />
              </section>
              <section className="card">
                <div className="mb-4 flex gap-1 overflow-x-auto rounded-ui bg-soft p-1" role="tablist">
                  {TABS.map(([key, label]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`whitespace-nowrap rounded-ui px-3 py-1.5 font-medium transition ${tab === key ? 'bg-surface text-fg shadow-soft' : 'text-muted'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === 'notes' && <NotesTab applicationId={id} />}
                {tab === 'scorecards' && <EvaluationsTab applicationId={id} />}
                {tab === 'interviews' && <InterviewsTab applicationId={id} />}
                {tab === 'messages' && <MessageThread applicationId={id} />}
                {tab === 'history' && <HistoryTab applicationId={id} refreshKey={historyKey} />}
              </section>
            </div>

            <Modal
              open={reject}
              title="Reject candidate"
              onClose={() => setReject(false)}
              footer={
                <>
                  <Button variant="secondary" onClick={() => setReject(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" loading={busy} onClick={() => move('rejected', reason)}>
                    Reject
                  </Button>
                </>
              }
            >
              <Field label="Reason (only your team sees this)">
                <textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            </Modal>
          </div>
        )
      }}
    </Async>
  )
}
