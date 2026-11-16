import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, action }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft text-muted">
        <Icon />
      </span>
      <p className="font-medium">{title}</p>
      {action}
    </div>
  )
}
