interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  gold?: boolean
}

export function ProgressBar({ value, max = 100, label, gold = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      {label && (
        <div className="flex justify-between text-sm mb-1">
          <span>{label}</span>
          <span className="pixel-font text-xs">{pct}%</span>
        </div>
      )}
      <div className="hp-bar">
        <div
          className={`hp-bar-fill ${gold ? 'hp-bar-fill-gold' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
