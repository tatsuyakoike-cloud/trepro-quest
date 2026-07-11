import type { ProgressResult } from '../types'
import { RESULT_COLORS } from '../types'

interface ResultBadgeProps {
  result: ProgressResult
}

export function ResultBadge({ result }: ResultBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold text-white ${RESULT_COLORS[result]}`}
    >
      {result}
    </span>
  )
}
