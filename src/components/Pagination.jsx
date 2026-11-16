import { ChevronLeft, ChevronRight } from 'lucide-react'
import IconButton from './IconButton'

export default function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-muted">
      <IconButton label="Previous page" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft />
      </IconButton>
      <span>
        Page {page} of {pages}
      </span>
      <IconButton label="Next page" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        <ChevronRight />
      </IconButton>
    </div>
  )
}
