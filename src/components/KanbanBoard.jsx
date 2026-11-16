import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { APPLICATION_STATUSES, PIPELINE_COLUMNS, toOptions } from '../lib/constants'
import { timeAgo } from '../lib/format'
import { publicUrl } from '../services/storage'
import Avatar from './Avatar'

// Drag a card to another column. On phones, use the "Move to" menu on the card.
export default function KanbanBoard({ items, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [over, setOver] = useState(null)
  const options = toOptions(
    Object.fromEntries(PIPELINE_COLUMNS.map((c) => [c, APPLICATION_STATUSES[c]])),
  )

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
      {PIPELINE_COLUMNS.map((status) => {
        const cards = items.filter((i) => i.status === status)
        return (
          <section
            key={status}
            aria-label={APPLICATION_STATUSES[status]}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              const item = items.find((i) => i.id === dragId)
              setOver(null)
              setDragId(null)
              if (item && item.status !== status) onMove(item, status)
            }}
            className={`w-64 shrink-0 snap-start rounded-ui p-2 transition ${over === status ? 'bg-primary/10' : 'bg-soft'}`}
          >
            <h3 className="mb-2 flex items-center justify-between px-1 font-semibold">
              {APPLICATION_STATUSES[status]}
              <span className="text-small font-medium text-muted">{cards.length}</span>
            </h3>
            <div className="space-y-2">
              {cards.length === 0 && <p className="px-1 py-4 text-center text-small text-muted">Empty</p>}
              {cards.map((c) => (
                <article
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`cursor-grab space-y-2 rounded-ui bg-surface p-3 shadow-soft ${dragId === c.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={c.profiles?.full_name} src={publicUrl('avatars', c.profiles?.avatar_path)} />
                    <Link to={`/org/applications/${c.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
                      {c.profiles?.full_name}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-small text-muted">
                    <span>{timeAgo(c.applied_at)}</span>
                    {c.rating ? (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <Star />
                        {c.rating}
                      </span>
                    ) : null}
                  </div>
                  <select aria-label={`Move ${c.profiles?.full_name}`} className="input py-1 text-small" value={c.status} onChange={(e) => e.target.value !== c.status && onMove(c, e.target.value)}>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {c.status === o.value ? o.label : `Move to ${o.label}`}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
