import { createFileRoute } from '@tanstack/react-router'
import { AddMedicationButton } from '../components/add-medication-button.tsx'
import { AsNeededCard } from '../components/as-needed-card.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'

export const Route = createFileRoute('/as-needed')({
  component: AsNeededPage,
})

function AsNeededPage() {
  const { today } = useApp()
  const items = today?.asNeeded ?? []
  const near = items.filter((item) => item.level !== 'ok')

  return (
    <div>
      <PersonBar subtitle="As-needed limits" />
      <p className="mb-5 text-mute">
        This is the headache-care list — not the daily routine. Watch the
        threshold so extra pills do not make things worse.
      </p>

      <div className="mb-5">
        <AddMedicationButton kind="as_needed" label="Add as-needed medication" />
      </div>

      {near.length === 0 && items.length > 0 ? (
        <p role="status" className="mb-4 rounded-3xl bg-ok-soft px-4 py-3 text-sage">
          All as-needed medication is still within its window.
        </p>
      ) : null}

      {items.length ? (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {items.map((item) => (
            <AsNeededCard key={item.medication.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-paper px-4 py-5 text-mute">
          <p>Add something like “max 8 pills in 24 hours”.</p>
        </div>
      )}
    </div>
  )
}
