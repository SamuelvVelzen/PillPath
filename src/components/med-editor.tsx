import { type ReactNode } from 'react'
import { localDateKey } from '../lib/dates.ts'
import {
  SchedulePreview,
  ScheduleUnitToggle,
} from './schedule-display.tsx'
import {
  bestDisplayValue,
  fromDisplayValue,
  scheduleSummary,
  type ScheduleUnit,
} from '../lib/schedule.ts'
import type { DoseTrend, Medication, MedicationInput, MedicationKind } from '../lib/types.ts'

export type MedDraft = {
  name: string
  kind: MedicationKind
  unit: string
  maxAmount: string
  windowHours: string
  targetDose: string
  trend: DoseTrend
  notes: string
  cycleOnValue: string
  cycleOnUnit: ScheduleUnit
  cycleOffValue: string
  cycleOffUnit: ScheduleUnit
  cycleStart: string
}

export function draftFromMedication(
  medication?: Medication | null,
  kind?: MedicationKind,
): MedDraft {
  const on = bestDisplayValue(medication?.cycleOnDays ?? 1)
  const off = bestDisplayValue(medication?.cycleOffDays ?? 0)

  return {
    name: medication?.name ?? '',
    kind: medication?.kind ?? kind ?? 'as_needed',
    unit: medication?.unit ?? 'pills',
    maxAmount: medication?.maxAmount != null ? String(medication.maxAmount) : '8',
    windowHours: medication?.windowHours != null ? String(medication.windowHours) : '24',
    targetDose: medication?.targetDose != null ? String(medication.targetDose) : '1',
    trend: medication?.trend ?? 'stable',
    notes: medication?.notes ?? '',
    cycleOnValue: on.value,
    cycleOnUnit: on.unit,
    cycleOffValue: off.value,
    cycleOffUnit: off.unit,
    cycleStart: medication?.cycleStart ?? localDateKey(new Date()),
  }
}

export function draftToInput(draft: MedDraft): MedicationInput {
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
    cycleOnDays: fromDisplayValue(draft.cycleOnValue, draft.cycleOnUnit),
    cycleOffDays: fromDisplayValue(draft.cycleOffValue, draft.cycleOffUnit),
    cycleStart: draft.cycleStart,
  }
}

export function MedEditor({
  title,
  titleId = 'med-editor-title',
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  busy,
  error,
  bare = false,
}: {
  title: string
  titleId?: string
  draft: MedDraft
  onChange: (draft: MedDraft) => void
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
  busy: boolean
  error: string | null
  bare?: boolean
}) {
  const previewOnDays = fromDisplayValue(draft.cycleOnValue, draft.cycleOnUnit)
  const previewOffDays = fromDisplayValue(draft.cycleOffValue, draft.cycleOffUnit)
  const previewSummary =
    previewOnDays > 0
      ? scheduleSummary(previewOnDays, previewOffDays)
      : 'Set how long each on and off period lasts.'

  return (
    <section className={bare ? undefined : 'rounded-3xl bg-paper p-4'}>
      <h2 id={titleId} className="text-xl font-semibold">
        {title}
      </h2>

      <Field label="Name">
        <input
          className="field"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </Field>

      <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Medication kind">
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
          Scheduled
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
          <Field label="Dose each time">
            <input
              className="field"
              inputMode="decimal"
              value={draft.targetDose}
              onChange={(event) => onChange({ ...draft, targetDose: event.target.value })}
            />
          </Field>

          <p className="mt-4 text-sm font-semibold text-mute">Schedule</p>
          <p className="mt-1 text-sm text-mute">
            Set any pattern you need — for example 3 weeks on and 10 days off, or
            5 days on and 2 days off.
          </p>

          <div className="mt-4 rounded-2xl bg-canvas p-3">
            <p className="text-sm font-semibold text-ink">On period</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
              <input
                className="field"
                inputMode="decimal"
                value={draft.cycleOnValue}
                onChange={(event) =>
                  onChange({ ...draft, cycleOnValue: event.target.value })
                }
                aria-label="On period length"
              />
              <ScheduleUnitToggle
                id="on-period-unit"
                unit={draft.cycleOnUnit}
                onChange={(cycleOnUnit) => onChange({ ...draft, cycleOnUnit })}
              />
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-canvas p-3">
            <p className="text-sm font-semibold text-ink">Break period</p>
            <p className="mt-1 text-xs text-mute">Use 0 for no break between cycles.</p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_8.5rem] gap-2">
              <input
                className="field"
                inputMode="decimal"
                value={draft.cycleOffValue}
                onChange={(event) =>
                  onChange({ ...draft, cycleOffValue: event.target.value })
                }
                aria-label="Break period length"
              />
              <ScheduleUnitToggle
                id="off-period-unit"
                unit={draft.cycleOffUnit}
                onChange={(cycleOffUnit) => onChange({ ...draft, cycleOffUnit })}
              />
            </div>
          </div>

          <Field label="Cycle starts">
            <input
              className="field"
              type="date"
              value={draft.cycleStart}
              onChange={(event) => onChange({ ...draft, cycleStart: event.target.value })}
            />
          </Field>

          <p className="mt-2 text-sm font-semibold text-ink">{previewSummary}</p>

          {previewOnDays > 0 ? (
            <SchedulePreview
              cycleOnDays={previewOnDays}
              cycleOffDays={previewOffDays}
              cycleStart={draft.cycleStart}
            />
          ) : null}

          <p className="mt-4 text-sm font-semibold text-mute" id="dose-trend-label">
            Is the dose moving?
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-labelledby="dose-trend-label">
            {(['down', 'stable', 'up'] as const).map((trend) => (
              <button
                key={trend}
                type="button"
                aria-pressed={draft.trend === trend}
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

      {error ? (
        <p className="mt-3 text-clay" role="alert">
          {error}
        </p>
      ) : null}

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
          aria-busy={busy}
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
          aria-busy={busy}
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
      aria-pressed={selected}
      className={`min-h-12 rounded-2xl font-semibold ${
        selected ? 'bg-lagoon text-paper' : 'bg-mist text-ink'
      }`}
    >
      {children}
    </button>
  )
}
