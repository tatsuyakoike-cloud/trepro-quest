import type { ProgressStatus } from '../types'
import { STATUS_COLORS } from '../types'

interface StatusBadgeProps {
  status: ProgressStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold text-white ${STATUS_COLORS[status]}`}
    >
      {status}
    </span>
  )
}
