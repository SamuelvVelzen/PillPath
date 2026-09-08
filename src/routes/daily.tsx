import { createFileRoute, Link } from '@tanstack/react-router'
import { DailyCard } from '../components/daily-card.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'

export const Route = createFileRoute('/daily')({
  component: DailyPage,
})

function DailyPage() {
  const { today } = useApp()
  const items = today?.daily ?? []
  const changing = items.filter(
    (item) => item.medication.trend === 'up' || item.medication.trend === 'down',
  )

  return (
    <div>
      <PersonBar subtitle="Daily medication" />
      <p className="mb-5 text-mute">
        Separate from as-needed limits. Use this to see whether a regular dose
        is going up, coming down, or holding.
      </p>

      {changing.length > 0 ? (
        <div className="mb-4 rounded-3xl bg-mist px-4 py-3 text-ink">
          <p className="font-semibold">Dose movement</p>
          <ul className="mt-2 space-y-1 text-mute">
            {changing.map((item) => (
              <li key={item.medication.id}>
                {item.medication.name} is {item.medication.trend === 'up' ? 'going up' : 'going down'}
                {item.medication.previousDose
                  ? ` from ${item.medication.previousDose}`
                  : ''}
                {item.medication.targetDose ? ` to ${item.medication.targetDose}` : ''}.
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <DailyCard key={item.medication.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-paper px-4 py-5 text-mute">
          <p>No daily medication yet.</p>
          <Link to="/settings" className="mt-3 inline-block font-semibold text-lagoon">
            Add daily medication
          </Link>
        </div>
      )}
    </div>
  )
}
