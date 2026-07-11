import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface GameMessageProps {
  title: string
  children: ReactNode
  onClose: () => void
  variant?: 'info' | 'levelup' | 'success'
}

export function GameMessage({ title, children, onClose, variant = 'info' }: GameMessageProps) {
  const borderColor =
    variant === 'levelup'
      ? 'border-[#f5d742]'
      : variant === 'success'
        ? 'border-green-500'
        : 'border-white'

  return (
    <div className="game-message-overlay" onClick={onClose} role="presentation">
      <div
        className={`pixel-window max-w-md w-full mx-3 sm:mx-4 animate-float-up border-4 ${borderColor}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h3 className="pixel-title text-base sm:text-lg break-words">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white shrink-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-center space-y-3">{children}</div>
        <button
          type="button"
          onClick={onClose}
          className="pixel-btn pixel-btn-gold w-full mt-6"
        >
          OK
        </button>
      </div>
    </div>
  )
}
