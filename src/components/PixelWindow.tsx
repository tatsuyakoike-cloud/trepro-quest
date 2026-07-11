import type { ReactNode } from 'react'

interface PixelWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function PixelWindow({ title, children, className = '' }: PixelWindowProps) {
  return (
    <div className={`pixel-window rounded-sm p-3 sm:p-4 w-full max-w-full ${className}`}>
      {title && (
        <h2 className="pixel-title text-base sm:text-lg mb-3 sm:mb-4 pb-2 border-b-2 border-white/30 break-words">
          {title}
        </h2>
      )}
      <div className="pixel-window-inner p-2 sm:p-3">{children}</div>
    </div>
  )
}
