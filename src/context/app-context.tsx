import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchToday, logDose, deleteDose } from '../lib/api.ts'
import { localDayRange } from '../lib/dates.ts'
import {
  hasOnboarded,
  markOnboarded,
  readStoredPersonId,
  storePersonId,
} from '../lib/person-storage.ts'
import type { Person, TodayPayload } from '../lib/types.ts'

type AppContextValue = {
  loading: boolean
  error: string | null
  today: TodayPayload | null
  people: Person[]
  personId: string
  person: Person | undefined
  helper: Person | undefined
  primary: Person | undefined
  needsOnboarding: boolean
  setPersonId: (id: string) => void
  completeOnboarding: () => void
  refresh: () => Promise<void>
  addDose: (medicationId: string, amount: number, takenAt?: string) => Promise<void>
  removeDose: (doseId: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState<TodayPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [personId, setPersonIdState] = useState(
    () => readStoredPersonId() ?? 'person-samuel',
  )
  const [needsOnboarding, setNeedsOnboarding] = useState(() => !hasOnboarded())

  const refresh = useCallback(async () => {
    const range = localDayRange()
    const payload = await fetchToday(range.from, range.to)
    setToday(payload)
    setError(null)
    if (!payload.people.some((person) => person.id === personId)) {
      const fallback = payload.people[0]?.id
      if (fallback) {
        setPersonIdState(fallback)
        storePersonId(fallback)
      }
    }
    const helperPerson = payload.people.find((person) => person.role === 'helper')
    if (helperPerson && personId !== helperPerson.id) {
      setPersonIdState(helperPerson.id)
      storePersonId(helperPerson.id)
    }
  }, [personId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    refresh()
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : 'Could not load PillPath.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [refresh])

  const setPersonId = useCallback((id: string) => {
    setPersonIdState(id)
    storePersonId(id)
  }, [])

  const completeOnboarding = useCallback(() => {
    markOnboarded()
    setNeedsOnboarding(false)
  }, [])

  const addDose = useCallback(
    async (medicationId: string, amount: number, takenAt?: string) => {
      const loggedBy =
        today?.people.find((entry) => entry.role === 'helper')?.id ??
        personId ??
        'person-samuel'
      await logDose({ medicationId, loggedBy, amount, takenAt })
      await refresh()
    },
    [personId, refresh, today?.people],
  )

  const removeDose = useCallback(
    async (doseId: string) => {
      await deleteDose(doseId)
      await refresh()
    },
    [refresh],
  )

  const people = today?.people ?? []
  const helper = people.find((entry) => entry.role === 'helper')
  const primary = people.find((entry) => entry.role === 'primary')
  const person = helper ?? people.find((entry) => entry.id === personId)

  const value = useMemo(
    () => ({
      loading,
      error,
      today,
      people,
      personId,
      person,
      helper,
      primary,
      needsOnboarding,
      setPersonId,
      completeOnboarding,
      refresh,
      addDose,
      removeDose,
    }),
    [
      loading,
      error,
      today,
      people,
      personId,
      person,
      helper,
      primary,
      needsOnboarding,
      setPersonId,
      completeOnboarding,
      refresh,
      addDose,
      removeDose,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const value = useContext(AppContext)
  if (!value) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return value
}
