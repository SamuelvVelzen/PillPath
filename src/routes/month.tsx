import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AddMedicationButton } from '../components/add-medication-button.tsx'
import { MonthCalendar } from '../components/month-calendar.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'
import { fetchMonth } from '../lib/api.ts'
import { localMonthRange } from '../lib/dates.ts'
import type { MonthPayload } from '../lib/types.ts'

export const Route = createFileRoute('/month')({
  component: MonthPage,
})

function MonthPage() {
  const { today } = useApp()
  const now = new Date()
  const [cursor, setCursor] = useState({
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  })
  const [payload, setPayload] = useState<MonthPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const range = localMonthRange(cursor.year, cursor.monthIndex)
    setLoading(true)
    fetchMonth(range.from, range.to)
      .then((next) => {
        if (cancelled) return
        setPayload(next)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Could not load this month.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cursor.monthIndex, cursor.year, today])

  function shift(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.monthIndex + delta, 1)
      return { year: date.getFullYear(), monthIndex: date.getMonth() }
    })
  }

  return (
    <div>
      <PersonBar subtitle="Month" />
      <p className="mb-5 text-mute">
        One shared month. Sage dots are daily doses; lilac dots are as-needed.
      </p>

      <div className="mb-5">
        <AddMedicationButton />
      </div>

      {error ? (
        <p role="alert" className="mb-4 rounded-3xl bg-over-soft px-4 py-3 text-clay">
          {error}
        </p>
      ) : null}

      {loading && !payload ? (
        <p role="status" className="text-mute">
          Loading the month…
        </p>
      ) : (
        <MonthCalendar
          key={`${cursor.year}-${cursor.monthIndex}`}
          year={cursor.year}
          monthIndex={cursor.monthIndex}
          medications={payload?.medications ?? []}
          doses={payload?.doses ?? []}
          onPrev={() => shift(-1)}
          onNext={() => shift(1)}
        />
      )}
    </div>
  )
}
