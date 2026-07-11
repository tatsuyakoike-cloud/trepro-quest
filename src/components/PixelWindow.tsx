import type { ReactNode } from 'react'

interface PixelWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export function PixelWindow({ title, children, className = '' }: PixelWindowProps) {
  return (
    <div className={`pixel-window rounded-sm p-4 ${className}`}>
      {title && (
        <h2 className="pixel-title text-lg mb-4 pb-2 border-b-2 border-white/30">
          {title}
        </h2>
      )}
      <div className="pixel-window-inner p-2">{children}</div>
    </div>
  )
}
