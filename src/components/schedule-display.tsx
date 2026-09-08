import {
  cycleSegments,
  schedulePhase,
  scheduleStatusLabel,
  scheduleSummary,
  type ScheduleUnit,
} from '../lib/schedule.ts'
import type { Medication } from '../lib/types.ts'

export function ScheduleBadge({
  medication,
  date = new Date(),
  showStatus = false,
}: {
  medication: Pick<Medication, 'cycleOnDays' | 'cycleOffDays' | 'cycleStart'>
  date?: Date
  showStatus?: boolean
}) {
  const summary = scheduleSummary(medication.cycleOnDays, medication.cycleOffDays)
  const status = showStatus
    ? scheduleStatusLabel(
        medication.cycleOnDays,
        medication.cycleOffDays,
        medication.cycleStart,
        date,
      )
    : null
  const phase = schedulePhase(
    medication.cycleOnDays,
    medication.cycleOffDays,
    medication.cycleStart,
    date,
  )

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-mist px-3 py-1 text-sm font-semibold text-ink">
        {summary}
      </span>
      {status ? (
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            phase.kind === 'on'
              ? 'bg-ok-soft text-sage'
              : phase.kind === 'off'
                ? 'bg-caution-soft text-amber'
                : 'bg-mist text-mute'
          }`}
        >
          {status}
        </span>
      ) : null}
    </div>
  )
}

export function SchedulePreview({
  cycleOnDays,
  cycleOffDays,
  cycleStart,
}: {
  cycleOnDays: number
  cycleOffDays: number
  cycleStart: string
}) {
  const segments = cycleSegments(cycleOnDays, cycleOffDays)
  const total = segments.reduce((sum, segment) => sum + segment.length, 0)
  const summary = scheduleSummary(cycleOnDays, cycleOffDays)
  const today = scheduleStatusLabel(cycleOnDays, cycleOffDays, cycleStart)

  return (
    <div className="mt-3 rounded-2xl bg-canvas px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{summary}</p>
        <p className="text-sm text-mute">Today: {today}</p>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-mist">
        {segments.map((segment, index) => (
          <div
            key={`${segment.kind}-${index}`}
            className={segment.kind === 'on' ? 'bg-sage' : 'bg-amber/70'}
            style={{ width: `${(segment.length / total) * 100}%` }}
            title={segment.kind === 'on' ? 'On period' : 'Break'}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-mute">
        <span>On</span>
        {cycleOffDays > 0 ? <span>Break</span> : <span>Repeats</span>}
      </div>
    </div>
  )
}

export function ScheduleUnitToggle({
  unit,
  onChange,
  id,
}: {
  unit: ScheduleUnit
  onChange: (unit: ScheduleUnit) => void
  id: string
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-mist p-1" role="group" aria-labelledby={id}>
      {(['days', 'weeks'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={unit === option}
          onClick={() => onChange(option)}
          className={`min-h-10 rounded-xl text-sm font-semibold capitalize ${
            unit === option ? 'bg-paper text-ink' : 'text-mute'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
