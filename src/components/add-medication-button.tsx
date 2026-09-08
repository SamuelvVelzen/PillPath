import { Plus } from 'lucide-react'
import { useMedDialog } from '../context/med-dialog-context.tsx'
import type { MedicationKind } from '../lib/types.ts'

export function AddMedicationButton({
  kind,
  label = 'Add medication',
  variant = 'primary',
}: {
  kind?: MedicationKind
  label?: string
  variant?: 'primary' | 'inline'
}) {
  const { openNew } = useMedDialog()

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={() => openNew(kind)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-lagoon"
      >
        <Plus size={16} strokeWidth={2} aria-hidden="true" />
        {label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openNew(kind)}
      className="min-h-14 w-full rounded-3xl bg-lilac font-semibold text-paper lg:w-auto lg:px-8"
    >
      {label}
    </button>
  )
}
