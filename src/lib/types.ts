export type PersonRole = 'helper' | 'primary'
export type MedicationKind = 'as_needed' | 'daily'
export type DoseTrend = 'up' | 'down' | 'stable'
export type ThresholdLevel = 'ok' | 'caution' | 'warning' | 'over'

export type Person = {
  id: string
  name: string
  role: PersonRole
}

export type Medication = {
  id: string
  name: string
  kind: MedicationKind
  unit: string
  maxAmount: number | null
  windowHours: number | null
  targetDose: number | null
  previousDose: number | null
  trend: DoseTrend | null
  notes: string | null
  active: boolean
  sortOrder: number
}

export type Dose = {
  id: string
  medicationId: string
  loggedBy: string
  loggedByName: string
  amount: number
  takenAt: string
  note: string | null
  createdAt: string
}

export type DailyStatus = {
  medication: Medication
  takenToday: boolean
  todayAmount: number
  todayDoses: Dose[]
}

export type AsNeededStatus = {
  medication: Medication
  used: number
  max: number
  remaining: number
  level: ThresholdLevel
  windowHours: number
  windowStart: string
  recentDoses: Dose[]
}

export type TodayPayload = {
  people: Person[]
  from: string
  to: string
  daily: DailyStatus[]
  asNeeded: AsNeededStatus[]
}

export type MedicationInput = {
  name: string
  kind: MedicationKind
  unit: string
  maxAmount?: number
  windowHours?: number
  targetDose?: number
  previousDose?: number | null
  trend?: DoseTrend
  notes?: string
}
