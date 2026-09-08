import { createFileRoute, Link } from '@tanstack/react-router'
import { AsNeededCard } from '../components/as-needed-card.tsx'
import { DailyCard } from '../components/daily-card.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'
import { greetingFor, localDayRange } from '../lib/dates.ts'

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
          className="mb-3 rounded-3xl bg-warning-soft px-4 py-3 text-clay"
        >
          {item.medication.name} is at {item.used} of {item.max} {item.medication.unit} in
          the last {item.windowHours} hours.
        </p>
      ))}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <section className="mb-8 lg:mb-0">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Daily</h2>
          <Link to="/daily" className="text-sm font-semibold text-lagoon">
            Open daily
          </Link>
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
            to="/settings"
            action="Add one in Settings"
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
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-semibold">As-needed</h2>
          <Link to="/as-needed" className="text-sm font-semibold text-lagoon">
            Open limits
          </Link>
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
            to="/settings"
            action="Add a limit"
          />
        )}
      </section>
      </div>
    </div>
  )
}

function Empty({ text, to, action }: { text: string; to: '/settings'; action: string }) {
  return (
    <div className="rounded-3xl bg-paper px-4 py-5 text-mute">
      <p>{text}</p>
      <Link to={to} className="mt-3 inline-block font-semibold text-lagoon">
        {action}
      </Link>
    </div>
  )
}
