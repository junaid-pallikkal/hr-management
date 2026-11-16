import { useState } from 'react'
import { Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import useLoad from '../hooks/useLoad'
import { listMessages, sendMessage } from '../services/applications'
import { timeAgo } from '../lib/format'
import Async from './Async'
import Button from './Button'
import EmptyState from './EmptyState'

// Messages between the hiring team and the candidate, for one application.
export default function MessageThread({ applicationId }) {
  const { user } = useAuth()
  const toast = useToast()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const query = useLoad(() => listMessages(applicationId), [applicationId])

  async function send(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await sendMessage(applicationId, user.id, body.trim())
      setBody('')
      query.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <Async query={query}>
        {(messages) =>
          messages.length === 0 ? (
            <EmptyState title="No messages yet." />
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {messages.map((m) => {
                const mine = m.sender_id === user.id
                return (
                  <li key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-ui px-3 py-2 ${mine ? 'bg-primary text-primary-fg' : 'bg-soft'}`}>
                      <p className="whitespace-pre-line">{m.body}</p>
                    </div>
                    <span className="mt-0.5 text-small text-muted">
                      {mine ? 'You' : m.profiles?.full_name} · {timeAgo(m.created_at)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )
        }
      </Async>
      <form onSubmit={send} className="flex gap-2">
        <input className="input" placeholder="Write a message" aria-label="Message" value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="submit" loading={sending}>
          <Send />
          Send
        </Button>
      </form>
    </div>
  )
}
