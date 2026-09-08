import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  draftFromMedication,
  MedEditor,
  type MedDraft,
} from '../components/med-editor.tsx'
import { PersonBar } from '../components/person-bar.tsx'
import { useApp } from '../context/app-context.tsx'
import { useTheme } from '../context/theme-context.tsx'
import {
  createMedication,
  deleteMedication,
  renamePerson,
  updateMedication,
} from '../lib/api.ts'
import type { Medication, MedicationInput } from '../lib/types.ts'
import type { Theme } from '../lib/theme.ts'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { today, people, refresh } = useApp()
  const [helperName, setHelperName] = useState(
    () => people.find((person) => person.role === 'helper')?.name ?? 'Samuel',
  )
  const [primaryName, setPrimaryName] = useState(
    () => people.find((person) => person.role === 'primary')?.name ?? '',
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [editor, setEditor] = useState<'new' | string | null>(null)
  const [draft, setDraft] = useState<MedDraft>(() => draftFromMedication())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const medications = useMemo(() => {
    const daily = today?.daily.map((item) => item.medication) ?? []
    const asNeeded = today?.asNeeded.map((item) => item.medication) ?? []
    return [...asNeeded, ...daily]
  }, [today])

  const editing = medications.find((medication) => medication.id === editor) ?? null

  function openNew() {
    setDraft(draftFromMedication())
    setEditor('new')
    setError(null)
  }

  function openEdit(medication: Medication) {
    setDraft(draftFromMedication(medication))
    setEditor(medication.id)
    setError(null)
  }

  async function saveNames() {
    const helper = people.find((person) => person.role === 'helper')
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

  async function saveMedication() {
    setBusy(true)
    setError(null)
    try {
      const input = toInput(draft)
      if (editor === 'new') {
        await createMedication(input)
      } else if (editor) {
        await updateMedication(editor, input)
      }
      await refresh()
      setEditor(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function removeMedication() {
    if (!editor || editor === 'new') return
    if (!window.confirm('Remove this medication and its logs?')) return
    setBusy(true)
    try {
      await deleteMedication(editor)
      await refresh()
      setEditor(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PersonBar subtitle="Settings" />

      <div className="lg:mb-6 lg:grid lg:grid-cols-2 lg:gap-6">
      <section className="mb-6 rounded-3xl bg-paper p-4 lg:mb-0">
        <h2 className="text-lg font-semibold">Household names</h2>
        <p className="mt-1 text-sm text-mute">
          Medications belong to her. You can log them on her behalf. Both of you
          see the same usage — there are not two accounts.
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
          Dark mode follows your phone unless you pick one here.
        </p>
        <ThemePicker />
      </section>
      </div>

      {editor ? (
        <div className="mb-6">
          <MedEditor
            title={editor === 'new' ? 'New medication' : `Edit ${editing?.name ?? ''}`}
            draft={draft}
            onChange={setDraft}
            onSave={() => void saveMedication()}
            onCancel={() => setEditor(null)}
            onDelete={editor === 'new' ? undefined : () => void removeMedication()}
            busy={busy}
            error={error}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openNew}
          className="mb-6 min-h-14 w-full rounded-3xl bg-lilac font-semibold text-paper"
        >
          Add medication
        </button>
      )}

      <MedicationGroup
        title="As-needed"
        hint="Limits and warnings live here."
        items={medications.filter((medication) => medication.kind === 'as_needed')}
        onEdit={openEdit}
      />
      <MedicationGroup
        title="Daily"
        hint="Routine doses and whether they are moving."
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
                className="flex min-h-14 w-full items-center justify-between rounded-3xl bg-paper px-4 text-left"
              >
                <span className="font-semibold">{medication.name}</span>
                <span className="text-sm text-mute">
                  {medication.kind === 'as_needed'
                    ? `max ${medication.maxAmount} / ${medication.windowHours}h`
                    : `${medication.targetDose} ${medication.unit}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function toInput(draft: MedDraft): MedicationInput {
  if (draft.kind === 'as_needed') {
    return {
      name: draft.name,
      kind: 'as_needed',
      unit: draft.unit,
      maxAmount: Number(draft.maxAmount),
      windowHours: Number(draft.windowHours),
    }
  }
  return {
    name: draft.name,
    kind: 'daily',
    unit: draft.unit,
    targetDose: Number(draft.targetDose),
    trend: draft.trend,
    notes: draft.notes,
  }
}
