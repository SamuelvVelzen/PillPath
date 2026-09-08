import { useState } from 'react'
import { DoseTimeField } from './dose-time-field.tsx'
import { amountLabel, currentTimeValue, takenAtFromTime, timeLabel } from '../lib/dates.ts'
import { levelCopy, nextLevel, wouldCrossLimit } from '../lib/threshold.ts'
import type { AsNeededStatus } from '../lib/types.ts'
import { useApp } from '../context/app-context.tsx'

const levelStyles = {
  ok: 'bg-ok-soft text-sage',
  caution: 'bg-caution-soft text-amber',
  warning: 'bg-warning-soft text-clay',
  over: 'bg-over-soft text-clay',
} as const

export function AsNeededCard({ item }: { item: AsNeededStatus }) {
  const { addDose, removeDose } = useApp()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [time, setTime] = useState(() => currentTimeValue())
  const unit = item.medication.unit
  const ratio = item.max > 0 ? Math.min(1, item.used / item.max) : 0
  const last = item.recentDoses[0]

  async function log(amount: number) {
    const upcoming = nextLevel(item.used, amount, item.max)
    if (confirm !== amount && (upcoming === 'warning' || upcoming === 'over')) {
      setConfirm(amount)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await addDose(item.medication.id, amount, takenAtFromTime(time))
      setConfirm(null)
      setTime(currentTimeValue())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not log that dose.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      className="h-full rounded-3xl bg-paper p-4"
      aria-labelledby={`as-needed-${item.medication.id}-name`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2
            id={`as-needed-${item.medication.id}-name`}
            className="text-xl font-semibold"
          >
            {item.medication.name}
          </h2>
          <p className="text-sm text-mute">
            Last {item.windowHours} hours · max {amountLabel(item.max, unit)}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${levelStyles[item.level]}`}>
          {levelCopy(item.level)}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-3xl font-semibold tracking-tight">
            {item.used}
            <span className="ml-1 text-lg font-medium text-mute">/ {item.max}</span>
          </p>
          <p className="text-sm text-mute">
            {item.remaining > 0
              ? `${amountLabel(item.remaining, unit)} left`
              : 'No more in this window'}
          </p>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-mist"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={item.max}
          aria-valuenow={item.used}
          aria-label={`${item.medication.name} used ${item.used} of ${item.max} ${unit} in the last ${item.windowHours} hours`}
        >
          <div
            className={`h-full rounded-full ${
              item.level === 'over' || item.level === 'warning'
                ? 'bg-clay'
                : item.level === 'caution'
                  ? 'bg-amber'
                  : 'bg-sage'
            }`}
            style={{ width: `${Math.max(ratio * 100, item.used > 0 ? 6 : 0)}%` }}
          />
        </div>
      </div>

      {confirm !== null ? (
        <p className="mt-4 rounded-2xl bg-warning-soft px-3 py-3 text-sm text-clay" role="alert">
          {wouldCrossLimit(item.used, confirm, item.max)
            ? `This would go over the limit (${item.used + confirm} of ${item.max} ${unit}). Only continue if that was planned.`
            : `This brings you to ${item.used + confirm} of ${item.max} ${unit} — very close to the limit.`}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-clay" role="alert">
          {error}
        </p>
      ) : null}

      <DoseTimeField
        id={`as-needed-time-${item.medication.id}`}
        label="Time taken"
        value={time}
        disabled={busy}
        onChange={setTime}
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          aria-label={`Log one ${unit} of ${item.medication.name}`}
          onClick={() => void log(1)}
          className="min-h-14 rounded-2xl bg-mist font-semibold disabled:opacity-60"
        >
          +1
        </button>
        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          aria-label={`Log half a ${unit} of ${item.medication.name}`}
          onClick={() => void log(0.5)}
          className="min-h-14 rounded-2xl bg-mist font-semibold disabled:opacity-60"
        >
          +½
        </button>
        {last ? (
          <button
            type="button"
            disabled={busy}
            aria-busy={busy}
            aria-label={`Undo last dose of ${item.medication.name}`}
            onClick={() => void removeDose(last.id)}
            className="min-h-14 rounded-2xl bg-mist font-semibold text-mute disabled:opacity-60"
          >
            Undo
          </button>
        ) : (
          <div className="min-h-14 rounded-2xl bg-canvas/70" aria-hidden="true" />
        )}
      </div>

      {confirm !== null ? (
        <button
          type="button"
          className="mt-2 w-full text-sm font-semibold text-mute"
          onClick={() => setConfirm(null)}
        >
          Cancel extra confirmation
        </button>
      ) : null}

      {item.recentDoses.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm text-mute">
          {item.recentDoses.slice(0, 3).map((dose) => (
            <li key={dose.id}>
              {amountLabel(dose.amount, unit)} at {timeLabel(dose.takenAt)} · {dose.loggedByName}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-mute">Nothing in this window yet.</p>
      )}
    </article>
  )
}
