import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  amountLabel,
  daysInMonth,
  localDateKey,
  monthLabel,
  startPad,
  timeLabel,
  weekdayLabels,
} from '../lib/dates.ts'
import {
  isScheduledDue,
  scheduleStatusLabel,
  scheduleSummary,
} from '../lib/schedule.ts'
import type { Dose, Medication } from '../lib/types.ts'

type Props = {
  year: number
  monthIndex: number
  medications: Medication[]
  doses: Dose[]
  onPrev: () => void
  onNext: () => void
}

type DayDoses = {
  scheduled: Map<string, Dose[]>
  asNeeded: Map<string, Dose[]>
}

export function MonthCalendar({
  year,
  monthIndex,
  medications,
  doses,
  onPrev,
  onNext,
}: Props) {
  const todayKey = localDateKey(new Date())
  const [selectedKey, setSelectedKey] = useState(() => {
    const now = new Date()
    if (now.getFullYear() === year && now.getMonth() === monthIndex) return todayKey
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  })

  const byDay = useMemo(() => {
    const days = new Map<string, DayDoses>()
    const meds = new Map(medications.map((medication) => [medication.id, medication]))

    for (const dose of doses) {
      const medication = meds.get(dose.medicationId)
      if (!medication) continue
      const key = localDateKey(dose.takenAt)
      let entry = days.get(key)
      if (!entry) {
        entry = { scheduled: new Map(), asNeeded: new Map() }
        days.set(key, entry)
      }
      const bucket = medication.kind === 'daily' ? entry.scheduled : entry.asNeeded
      const list = bucket.get(dose.medicationId) ?? []
      list.push(dose)
      bucket.set(dose.medicationId, list)
    }
    return days
  }, [doses, medications])

  const days = daysInMonth(year, monthIndex)
  const pad = startPad(year, monthIndex)
  const weekdays = weekdayLabels()
  const scheduledMeds = medications.filter((medication) => medication.kind === 'daily')
  const asNeededMeds = medications.filter((medication) => medication.kind === 'as_needed')

  const selected = byDay.get(selectedKey)
  const selectedDate = new Date(`${selectedKey}T12:00:00`)
  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-paper text-ink"
          aria-label="Previous month"
        >
          <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <h2 className="text-lg font-semibold" aria-live="polite">
          {monthLabel(year, monthIndex)}
        </h2>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-paper text-ink"
          aria-label="Next month"
        >
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div
        className="rounded-3xl bg-paper p-3 lg:p-5"
        role="grid"
        aria-label={`Calendar for ${monthLabel(year, monthIndex)}`}
      >
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-mute uppercase">
          {weekdays.map((label) => (
            <div key={label} role="columnheader">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: pad }, (_, index) => (
            <div key={`pad-${index}`} className="min-h-14 lg:min-h-20" aria-hidden="true" />
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const entry = byDay.get(key)
            const selectedDay = key === selectedKey
            const isToday = key === todayKey
            const date = new Date(`${key}T12:00:00`)
            const dueCount = scheduledMeds.filter((medication) =>
              isScheduledDue(
                medication.cycleOnDays,
                medication.cycleOffDays,
                medication.cycleStart,
                date,
              ),
            ).length
            const takenCount =
              scheduledMeds.filter((medication) => {
                if (
                  !isScheduledDue(
                    medication.cycleOnDays,
                    medication.cycleOffDays,
                    medication.cycleStart,
                    date,
                  )
                ) {
                  return false
                }
                return (entry?.scheduled.get(medication.id)?.length ?? 0) > 0
              }).length
            const asNeededCount = entry?.asNeeded.size ?? 0
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                aria-selected={selectedDay}
                aria-current={isToday ? 'date' : undefined}
                aria-label={dayLabel(day, dueCount, takenCount, asNeededCount)}
                onClick={() => setSelectedKey(key)}
                className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-sm font-semibold lg:min-h-20 ${
                  selectedDay
                    ? 'bg-lagoon text-paper'
                    : isToday
                      ? 'bg-mist text-ink'
                      : 'text-ink hover:bg-canvas'
                }`}
              >
                <span>{day}</span>
                <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
                  {dueCount > 0 ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        takenCount >= dueCount
                          ? selectedDay
                            ? 'bg-paper'
                            : 'bg-sage'
                          : selectedDay
                            ? 'bg-paper/70'
                            : 'bg-amber'
                      }`}
                    />
                  ) : null}
                  {asNeededCount > 0 ? (
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${selectedDay ? 'bg-paper/80' : 'bg-lilac'}`}
                    />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <section className="mt-5 rounded-3xl bg-paper p-4" aria-live="polite">
        <h3 className="text-lg font-semibold">{selectedLabel}</h3>
        {scheduledMeds.length === 0 && asNeededMeds.length === 0 ? (
          <p className="mt-2 text-mute">No medications to show yet.</p>
        ) : (
          <div className="mt-4 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
            <DayGroup
              title="Scheduled"
              empty="No scheduled medication."
              items={scheduledMeds.map((medication) => {
                const due = isScheduledDue(
                  medication.cycleOnDays,
                  medication.cycleOffDays,
                  medication.cycleStart,
                  selectedDate,
                )
                const logged = selected?.scheduled.get(medication.id) ?? []
                const dose = logged[0]
                const status = scheduleStatusLabel(
                  medication.cycleOnDays,
                  medication.cycleOffDays,
                  medication.cycleStart,
                  selectedDate,
                )
                return {
                  id: medication.id,
                  name: medication.name,
                  subdetail: scheduleSummary(
                    medication.cycleOnDays,
                    medication.cycleOffDays,
                  ),
                  detail: logged.length
                    ? `Checked off · ${timeLabel(dose.takenAt)}`
                    : due
                      ? `${status} · not checked off`
                      : status,
                  active: due && logged.length > 0,
                }
              })}
            />
            <DayGroup
              title="As-needed"
              empty="No as-needed medication."
              items={asNeededMeds.map((medication) => {
                const logged = selected?.asNeeded.get(medication.id) ?? []
                const amount = logged.reduce((total, entry) => total + entry.amount, 0)
                return {
                  id: medication.id,
                  name: medication.name,
                  detail: logged.length
                    ? `${amountLabel(amount, medication.unit)} · ${timeLabel(logged[logged.length - 1].takenAt)}`
                    : 'Nothing logged',
                  active: logged.length > 0,
                }
              })}
            />
          </div>
        )}
      </section>
    </div>
  )
}

function DayGroup({
  title,
  empty,
  items,
}: {
  title: string
  empty: string
  items: Array<{
    id: string
    name: string
    subdetail?: string
    detail: string
    active: boolean
  }>
}) {
  if (items.length === 0) {
    return (
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-mute">{empty}</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-2xl bg-canvas px-3 py-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                {item.subdetail ? (
                  <p className="mt-1 text-xs text-mute">{item.subdetail}</p>
                ) : null}
              </div>
              <span className={`text-right text-sm ${item.active ? 'text-ink' : 'text-mute'}`}>
                {item.detail}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function dayLabel(
  day: number,
  dueCount: number,
  takenCount: number,
  asNeededCount: number,
) {
  const parts = [`${day}`]
  if (dueCount > 0) {
    parts.push(`${takenCount} of ${dueCount} scheduled checked off`)
  }
  if (asNeededCount > 0) {
    parts.push(`${asNeededCount} as-needed logged`)
  }
  return parts.join(', ')
}
