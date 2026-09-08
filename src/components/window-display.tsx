import type { WindowUnit } from '../lib/window.ts'

const labels: Record<WindowUnit, string> = {
  hours: 'Hours',
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
}

export function WindowUnitToggle({
  unit,
  onChange,
  id,
}: {
  unit: WindowUnit
  onChange: (unit: WindowUnit) => void
  id: string
}) {
  return (
    <div
      className="grid grid-cols-4 gap-1 rounded-2xl bg-mist p-1"
      role="group"
      aria-labelledby={id}
    >
      {(['hours', 'days', 'weeks', 'months'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          onClick={() => onChange(option)}
          className={`min-h-11 rounded-xl px-1 text-sm font-semibold ${
            unit === option ? 'bg-paper text-ink shadow-sm' : 'text-mute'
          }`}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}
