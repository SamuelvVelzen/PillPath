import { createFileRoute } from '@tanstack/react-router'
import { AddMedicationButton } from '../components/add-medication-button.tsx'
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

      <div className="mb-5">
        <AddMedicationButton kind="daily" label="Add daily medication" />
      </div>

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
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {items.map((item) => (
            <DailyCard key={item.medication.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-paper px-4 py-5 text-mute">
          <p>No daily medication yet. Add one here to start the routine list.</p>
        </div>
      )}
    </div>
  )
}
