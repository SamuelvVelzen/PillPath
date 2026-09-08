import { useState } from 'react'
import { amountLabel, timeLabel } from '../lib/dates.ts'
import type { DailyStatus, DoseTrend } from '../lib/types.ts'
import { useApp } from '../context/app-context.tsx'

const trendCopy: Record<DoseTrend, string> = {
  up: 'Going up',
  down: 'Going down',
  stable: 'Holding steady',
}

export function DailyCard({ item }: { item: DailyStatus }) {
  const { addDose, removeDose } = useApp()
  const [busy, setBusy] = useState(false)
  const dose = item.medication.targetDose ?? 1
  const unit = item.medication.unit
  const trend = item.medication.trend ?? 'stable'

  async function toggle() {
    setBusy(true)
    try {
      if (item.takenToday && item.todayDoses[0]) {
        await removeDose(item.todayDoses[0].id)
      } else {
        await addDose(item.medication.id, dose)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <article
      aria-labelledby={`daily-${item.medication.id}-name`}
      className="h-full rounded-3xl bg-paper p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`daily-${item.medication.id}-name`} className="text-xl font-semibold">
            {item.medication.name}
          </h2>
          <p className="text-mute">
            {amountLabel(dose, unit)}
            {item.medication.previousDose
              ? ` · was ${amountLabel(item.medication.previousDose, unit)}`
              : ''}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            trend === 'down'
              ? 'bg-ok-soft text-sage'
              : trend === 'up'
                ? 'bg-caution-soft text-amber'
                : 'bg-mist text-lagoon'
          }`}
        >
          {trendCopy[trend]}
        </span>
      </div>

      {item.medication.notes ? (
        <p className="mt-3 text-sm text-mute">{item.medication.notes}</p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        aria-pressed={item.takenToday}
        aria-busy={busy}
        onClick={() => void toggle()}
        className={`mt-4 min-h-14 w-full rounded-2xl text-base font-semibold disabled:opacity-60 ${
          item.takenToday ? 'bg-sage text-paper' : 'bg-mist text-ink'
        }`}
      >
        {item.takenToday ? 'Taken today' : 'Mark as taken'}
      </button>

      {item.todayDoses[0] ? (
        <p className="mt-3 text-sm text-mute">
          Logged at {timeLabel(item.todayDoses[0].takenAt)} by {item.todayDoses[0].loggedByName}
        </p>
      ) : (
        <p className="mt-3 text-sm text-mute">Not logged yet today.</p>
      )}
    </article>
  )
}
