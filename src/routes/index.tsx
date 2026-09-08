import { createFileRoute, Link } from '@tanstack/react-router'
import { AddMedicationButton } from '../components/add-medication-button.tsx'
import { AsNeededCard } from '../components/as-needed-card.tsx'
import { DailyCard } from '../components/daily-card.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'
import { greetingFor, localDayRange } from '../lib/dates.ts'
import type { MedicationKind } from '../lib/types.ts'

export const Route = createFileRoute('/')({
  component: TodayPage,
})

function TodayPage() {
  const { today } = useApp()
  const day = localDayRange()
  const warnings = today?.asNeeded.filter(
    (item) => item.level === 'caution' || item.level === 'warning' || item.level === 'over',
  ) ?? []
  const dailyLeft = today?.daily.filter((item) => !item.takenToday) ?? []

  return (
    <div>
      <PersonBar subtitle={`${greetingFor()}.`} />
      <p className="mb-5 text-mute">{day.label}</p>

      {warnings.map((item) => (
        <p
          key={item.medication.id}
          role="status"
          className="mb-3 rounded-3xl bg-warning-soft px-4 py-3 text-clay"
        >
          {item.medication.name} is at {item.used} of {item.max} {item.medication.unit} in
          the last {item.windowHours} hours.
        </p>
      ))}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <section className="mb-8 lg:mb-0">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Daily</h2>
          <div className="flex items-center gap-3">
            <AddMedicationButton kind="daily" label="Add" variant="inline" />
            <Link to="/daily" className="text-sm font-semibold text-lagoon">
              Open daily
            </Link>
          </div>
        </div>
        {today?.daily.length ? (
          <div className="space-y-3">
            {today.daily.map((item) => (
              <DailyCard key={item.medication.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty
            text="No daily medication yet."
            kind="daily"
            action="Add daily medication"
          />
        )}
        {dailyLeft.length > 0 ? (
          <p className="mt-3 text-sm text-mute">
            {dailyLeft.length === 1
              ? `${dailyLeft[0].medication.name} is still waiting.`
              : `${dailyLeft.length} daily medications still waiting.`}
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">As-needed</h2>
          <div className="flex items-center gap-3">
            <AddMedicationButton kind="as_needed" label="Add" variant="inline" />
            <Link to="/as-needed" className="text-sm font-semibold text-lagoon">
              Open limits
            </Link>
          </div>
        </div>
        {today?.asNeeded.length ? (
          <div className="space-y-3">
            {today.asNeeded.map((item) => (
              <AsNeededCard key={item.medication.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty
            text="No as-needed medication yet. This is the list with limits, like 8 pills in 24 hours."
            kind="as_needed"
            action="Add a limit"
          />
        )}
      </section>
      </div>
    </div>
  )
}

function Empty({
  text,
  kind,
  action,
}: {
  text: string
  kind: MedicationKind
  action: string
}) {
  return (
    <div className="rounded-3xl bg-paper px-4 py-5 text-mute">
      <p>{text}</p>
      <div className="mt-3">
        <AddMedicationButton kind={kind} label={action} variant="inline" />
      </div>
    </div>
  )
}
