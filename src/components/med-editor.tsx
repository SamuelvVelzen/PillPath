import { type ReactNode } from 'react'
import type { DoseTrend, Medication, MedicationKind } from '../lib/types.ts'

export type MedDraft = {
  name: string
  kind: MedicationKind
  unit: string
  maxAmount: string
  windowHours: string
  targetDose: string
  trend: DoseTrend
  notes: string
}

export function draftFromMedication(medication?: Medication | null): MedDraft {
  return {
    name: medication?.name ?? '',
    kind: medication?.kind ?? 'as_needed',
    unit: medication?.unit ?? 'pills',
    maxAmount: medication?.maxAmount != null ? String(medication.maxAmount) : '8',
    windowHours: medication?.windowHours != null ? String(medication.windowHours) : '24',
    targetDose: medication?.targetDose != null ? String(medication.targetDose) : '',
    trend: medication?.trend ?? 'stable',
    notes: medication?.notes ?? '',
  }
}

export function MedEditor({
  title,
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  busy,
  error,
}: {
  title: string
  draft: MedDraft
  onChange: (draft: MedDraft) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
  busy: boolean
  error: string | null
}) {
  return (
    <section className="rounded-3xl bg-paper p-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      <Field label="Name">
        <input
          className="field"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </Field>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <KindButton
          selected={draft.kind === 'as_needed'}
          onClick={() => onChange({ ...draft, kind: 'as_needed' })}
        >
          As-needed
        </KindButton>
        <KindButton
          selected={draft.kind === 'daily'}
          onClick={() => onChange({ ...draft, kind: 'daily' })}
        >
          Daily
        </KindButton>
      </div>

      <Field label="Unit">
        <input
          className="field"
          value={draft.unit}
          onChange={(event) => onChange({ ...draft, unit: event.target.value })}
        />
      </Field>

      {draft.kind === 'as_needed' ? (
        <>
          <Field label="Maximum in the window">
            <input
              className="field"
              inputMode="decimal"
              value={draft.maxAmount}
              onChange={(event) => onChange({ ...draft, maxAmount: event.target.value })}
            />
          </Field>
          <Field label="Window (hours)">
            <input
              className="field"
              inputMode="numeric"
              value={draft.windowHours}
              onChange={(event) => onChange({ ...draft, windowHours: event.target.value })}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Current daily dose">
            <input
              className="field"
              inputMode="decimal"
              value={draft.targetDose}
              onChange={(event) => onChange({ ...draft, targetDose: event.target.value })}
            />
          </Field>
          <p className="mt-4 text-sm font-semibold text-mute">Is the dose moving?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['down', 'stable', 'up'] as const).map((trend) => (
              <button
                key={trend}
                type="button"
                onClick={() => onChange({ ...draft, trend })}
                className={`min-h-12 rounded-2xl text-sm font-semibold ${
                  draft.trend === trend ? 'bg-lagoon text-paper' : 'bg-mist text-ink'
                }`}
              >
                {trend === 'down' ? 'Down' : trend === 'up' ? 'Up' : 'Steady'}
              </button>
            ))}
          </div>
          <Field label="Note (optional)">
            <textarea
              className="field min-h-24 py-3"
              value={draft.notes}
              onChange={(event) => onChange({ ...draft, notes: event.target.value })}
            />
          </Field>
        </>
      )}

      {error ? <p className="mt-3 text-clay">{error}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-12 rounded-2xl bg-mist font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSave}
          className="min-h-12 rounded-2xl bg-lilac font-semibold text-paper disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      {onDelete ? (
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="mt-3 w-full text-sm font-semibold text-clay"
        >
          Remove this medication
        </button>
      ) : null}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-mute">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}

function KindButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 rounded-2xl font-semibold ${
        selected ? 'bg-lagoon text-paper' : 'bg-mist text-ink'
      }`}
    >
      {children}
    </button>
  )
}
