import { useEffect, useState } from 'react'
import { DoseTimeField } from './dose-time-field.tsx'
import { amountLabel, currentTimeValue, takenAtFromTime, timeLabel } from '../lib/dates.ts'
import { scheduleSummary } from '../lib/schedule.ts'
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
  const [time, setTime] = useState(() => currentTimeValue())
  const dose = item.medication.targetDose ?? 1
  const unit = item.medication.unit
  const trend = item.medication.trend ?? 'stable'
  const schedule = scheduleSummary(
    item.medication.cycleOnDays,
    item.medication.cycleOffDays,
  )

  useEffect(() => {
    if (item.todayDoses[0]) {
      setTime(currentTimeValue(new Date(item.todayDoses[0].takenAt)))
    }
  }, [item.todayDoses])

  async function toggle(checked: boolean) {
    setBusy(true)
    try {
      if (!checked && item.todayDoses[0]) {
        await removeDose(item.todayDoses[0].id)
        setTime(currentTimeValue())
      } else if (checked) {
        await addDose(item.medication.id, dose, takenAtFromTime(time))
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
            {amountLabel(dose, unit)} · {schedule}
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

      <label
        className={`mt-4 flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl px-4 ${
          item.takenToday ? 'bg-sage text-paper' : 'bg-mist text-ink'
        } ${busy ? 'opacity-60' : ''}`}
      >
        <input
          type="checkbox"
          className="h-5 w-5 shrink-0 accent-sage"
          checked={item.takenToday}
          disabled={busy}
          aria-busy={busy}
          onChange={(event) => void toggle(event.target.checked)}
        />
        <span className="text-base font-semibold">
          {item.takenToday ? 'Checked off for today' : 'Check off for today'}
        </span>
      </label>

      <DoseTimeField
        id={`daily-time-${item.medication.id}`}
        label="Time taken"
        value={time}
        disabled={busy || item.takenToday}
        onChange={setTime}
      />

      {item.todayDoses[0] ? (
        <p className="mt-3 text-sm text-mute">
          Logged at {timeLabel(item.todayDoses[0].takenAt)} by {item.todayDoses[0].loggedByName}
        </p>
      ) : (
        <p className="mt-3 text-sm text-mute">Pick a time, then check it off.</p>
      )}
    </article>
  )
}
