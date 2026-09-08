import { localDateKey } from './dates.ts'

export function parseLocalDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function daysBetween(startKey: string, endKey: string) {
  const start = parseLocalDateKey(startKey)
  const end = parseLocalDateKey(endKey)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function isScheduledDue(
  cycleOnDays: number,
  cycleOffDays: number,
  cycleStart: string,
  date = new Date(),
) {
  const dayKey = localDateKey(date)
  const daysSince = daysBetween(cycleStart, dayKey)
  if (daysSince < 0) return false

  const on = Math.max(1, cycleOnDays)
  const off = Math.max(0, cycleOffDays)
  if (off === 0) return true

  const position = daysSince % (on + off)
  return position < on
}

export function scheduleSummary(cycleOnDays: number, cycleOffDays: number) {
  const on = Math.max(1, cycleOnDays)
  const off = Math.max(0, cycleOffDays)
  if (off === 0 && on === 1) return 'Every day'
  if (off === 0) return `${on} days on, then repeats`
  if (on === 7 && off === 7) return '1 week on, 1 week off'
  if (on === 21 && off === 7) return '3 weeks on, 1 week off'
  return `${on} day${on === 1 ? '' : 's'} on, ${off} day${off === 1 ? '' : 's'} off`
}

export function nextDueDateKey(
  cycleOnDays: number,
  cycleOffDays: number,
  cycleStart: string,
  from = new Date(),
) {
  const fromKey = localDateKey(from)
  for (let offset = 0; offset <= 366; offset += 1) {
    const date = parseLocalDateKey(fromKey)
    date.setDate(date.getDate() + offset)
    if (isScheduledDue(cycleOnDays, cycleOffDays, cycleStart, date)) {
      return localDateKey(date)
    }
  }
  return null
}
