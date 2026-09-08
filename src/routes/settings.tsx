import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AddMedicationButton } from '../components/add-medication-button.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { ScheduleBadge } from '../components/schedule-display.tsx'
import { useApp } from '../context/app-context.tsx'
import { useMedDialog } from '../context/med-dialog-context.tsx'
import { useTheme } from '../context/theme-context.tsx'
import { renamePerson } from '../lib/api.ts'
import type { Theme } from '../lib/theme.ts'
import type { Medication } from '../lib/types.ts'
import { limitSummary } from '../lib/window.ts'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { medications, people, refresh } = useApp()
  const { openEdit } = useMedDialog()
  const [helperName, setHelperName] = useState(
    () => people.find((person) => person.role === 'helper')?.name ?? 'Samuel',
  )
  const [primaryName, setPrimaryName] = useState(
    () => people.find((person) => person.role === 'primary')?.name ?? '',
  )
  const [nameError, setNameError] = useState<string | null>(null)

  async function saveNames() {    const helper = people.find((person) => person.role === 'helper')
    const primary = people.find((person) => person.role === 'primary')
    if (!helper || !primary) return
    if (!primaryName.trim()) {
      setNameError('Her name is needed.')
      return
    }
    setNameError(null)
    await renamePerson(helper.id, helperName.trim() || 'Samuel')
    await renamePerson(primary.id, primaryName.trim())
    await refresh()
  }

  return (
    <div>
      <PersonBar subtitle="Settings" />

      <div className="lg:mb-6 lg:grid lg:grid-cols-2 lg:gap-6">
      <section className="mb-6 rounded-3xl bg-paper p-4 lg:mb-0">
        <h2 className="text-lg font-semibold">Household names</h2>
        <p className="mt-1 text-sm text-mute">
          Names on this list. Medication usage is the same for everyone who
          opens the app.
        </p>
        <label className="mt-4 block text-sm font-semibold text-mute" htmlFor="helper-name">
          Your name
        </label>
        <input
          id="helper-name"
          className="field mt-2"
          value={helperName}
          autoComplete="name"
          onChange={(event) => setHelperName(event.target.value)}
          onBlur={() => void saveNames()}
        />
        <label className="mt-4 block text-sm font-semibold text-mute" htmlFor="primary-name">
          Medications are for
        </label>
        <input
          id="primary-name"
          className="field mt-2"
          value={primaryName}
          autoComplete="name"
          onChange={(event) => setPrimaryName(event.target.value)}
          onBlur={() => void saveNames()}
        />
        {nameError ? (
          <p className="mt-2 text-sm text-clay" role="alert">
            {nameError}
          </p>
        ) : null}
      </section>

      <section className="mb-6 rounded-3xl bg-paper p-4 lg:mb-0">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-mute">
          Dark is the default. Switch to light, or follow the system.
        </p>
        <ThemePicker />
      </section>
      </div>

      <div className="mb-6">
        <AddMedicationButton />
      </div>

      <MedicationGroup
        title="As-needed"
        hint="Pain, fever, or flare-up meds with hourly, daily, weekly, or monthly limits."
        items={medications.filter((medication) => medication.kind === 'as_needed')}
        onEdit={openEdit}
      />
      <MedicationGroup
        title="Scheduled"
        hint="Any on/off pattern — weeks, days, or a mix."
        items={medications.filter((medication) => medication.kind === 'daily')}
        onEdit={openEdit}
      />

      <section className="mt-6 rounded-3xl bg-paper p-4 text-sm text-mute">
        <h2 className="text-base font-semibold text-ink">On this device</h2>
        <p className="mt-2">
          On a phone, install PillPath from the browser menu, or use Share → Add
          to Home Screen on iPhone. On a computer, keep the tab or install it as
          an app from the browser. Weather and flare-up tracking can come later.
        </p>
      </section>
    </div>
  )
}

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const options: Array<{ id: Theme; label: string }> = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ]

  return (
    <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {options.map((option) => {
        const selected = theme === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.id)}
            className={`min-h-12 rounded-2xl text-sm font-semibold ${
              selected ? 'bg-lagoon text-paper' : 'bg-mist text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function MedicationGroup({
  title,
  hint,
  items,
  onEdit,
}: {
  title: string
  hint: string
  items: Medication[]
  onEdit: (medication: Medication) => void
}) {
  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mb-3 text-sm text-mute">{hint}</p>
      {items.length === 0 ? (
        <p className="rounded-3xl bg-paper px-4 py-4 text-mute">None yet.</p>
      ) : (
        <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-2 lg:space-y-0">
          {items.map((medication) => (
            <li key={medication.id}>
              <button
                type="button"
                onClick={() => onEdit(medication)}
                aria-label={`Edit ${medication.name}`}
                className="flex min-h-14 w-full flex-col items-start rounded-3xl bg-paper px-4 py-3 text-left"
              >
                <span className="font-semibold">{medication.name}</span>
                {medication.kind === 'as_needed' ? (
                  <span className="mt-1 text-sm text-mute">
                    {limitSummary(
                      medication.maxAmount ?? 0,
                      medication.unit,
                      medication.windowHours ?? 24,
                    )}
                  </span>
                ) : (
                  <>
                    <span className="mt-1 text-sm text-mute">
                      {medication.targetDose} {medication.unit} each time
                    </span>
                    <ScheduleBadge medication={medication} showStatus />
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
