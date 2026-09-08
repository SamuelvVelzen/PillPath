import { useEffect, useState } from 'react'
import { Dialog } from './dialog.tsx'
import {
  draftFromMedication,
  draftToInput,
  MedEditor,
  type MedDraft,
} from './med-editor.tsx'
import { useApp } from '../context/app-context.tsx'
import { useMedDialog } from '../context/med-dialog-context.tsx'
import { createMedication, deleteMedication, updateMedication } from '../lib/api.ts'

const TITLE_ID = 'med-dialog-title'

export function MedDialog() {
  const { refresh } = useApp()
  const { state, close } = useMedDialog()
  const [draft, setDraft] = useState<MedDraft>(() => draftFromMedication())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state.open) return
    setError(null)
    setBusy(false)
    if (state.mode === 'edit') {
      setDraft(draftFromMedication(state.medication))
    } else {
      setDraft(draftFromMedication(null, state.kind))
    }
  }, [state])

  if (!state.open) return null

  const title =
    state.mode === 'edit' ? `Edit ${state.medication.name}` : 'New medication'

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const input = draftToInput(draft)
      if (state.open && state.mode === 'edit') {
        await updateMedication(state.medication.id, input)
      } else {
        await createMedication(input)
      }
      await refresh()
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!state.open || state.mode !== 'edit') return
    if (!window.confirm('Remove this medication and its logs?')) return
    setBusy(true)
    try {
      await deleteMedication(state.medication.id)
      await refresh()
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog titleId={TITLE_ID} onClose={close}>
      <MedEditor
        title={title}
        titleId={TITLE_ID}
        draft={draft}
        onChange={setDraft}
        onSave={() => void save()}
        onCancel={close}
        onDelete={state.mode === 'edit' ? () => void remove() : undefined}
        busy={busy}
        error={error}
        bare
      />
    </Dialog>
  )
}
