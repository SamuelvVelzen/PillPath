import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Medication, MedicationKind } from '../lib/types.ts'

type MedDialogState =
  | { open: false }
  | { open: true; mode: 'new'; kind?: MedicationKind }
  | { open: true; mode: 'edit'; medication: Medication }

type MedDialogContextValue = {
  state: MedDialogState
  openNew: (kind?: MedicationKind) => void
  openEdit: (medication: Medication) => void
  close: () => void
}

const MedDialogContext = createContext<MedDialogContextValue | null>(null)

export function MedDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MedDialogState>({ open: false })

  const openNew = useCallback((kind?: MedicationKind) => {
    setState({ open: true, mode: 'new', kind })
  }, [])

  const openEdit = useCallback((medication: Medication) => {
    setState({ open: true, mode: 'edit', medication })
  }, [])

  const close = useCallback(() => {
    setState({ open: false })
  }, [])

  const value = useMemo(
    () => ({ state, openNew, openEdit, close }),
    [state, openNew, openEdit, close],
  )

  return <MedDialogContext.Provider value={value}>{children}</MedDialogContext.Provider>
}

export function useMedDialog() {
  const value = useContext(MedDialogContext)
  if (!value) {
    throw new Error('useMedDialog must be used inside MedDialogProvider')
  }
  return value
}
