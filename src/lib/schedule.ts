import { localDateKey } from './dates.ts'

export type ScheduleUnit = 'days' | 'weeks'

export type SchedulePhase =
  | { kind: 'before'; daysUntilStart: number }
  | { kind: 'on'; dayOfPhase: number; phaseLength: number }
  | { kind: 'off'; dayOfPhase: number; phaseLength: number }

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

export function fromDisplayValue(value: string, unit: ScheduleUnit) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return unit === 'weeks' ? Math.round(amount * 7) : Math.round(amount)
}

export function bestDisplayUnit(days: number): ScheduleUnit {
  if (days >= 7 && days % 7 === 0) return 'weeks'
  return 'days'
}

export function bestDisplayValue(days: number) {
  const unit = bestDisplayUnit(days)
  return {
    value: unit === 'weeks' ? String(days / 7) : String(days),
    unit,
  }
}

export function formatDuration(days: number) {
  const rounded = Math.max(0, Math.round(days))
  if (rounded === 1) return '1 day'
  if (rounded === 7) return '1 week'
  if (rounded > 7 && rounded % 7 === 0) {
    const weeks = rounded / 7
    return `${weeks} week${weeks === 1 ? '' : 's'}`
  }
  return `${rounded} days`
}

export function isScheduledDue(
  cycleOnDays: number,
  cycleOffDays: number,
  cycleStart: string,
  date = new Date(),
) {
  return schedulePhase(cycleOnDays, cycleOffDays, cycleStart, date).kind === 'on'
}

export function schedulePhase(
  cycleOnDays: number,
  cycleOffDays: number,
  cycleStart: string,
  date = new Date(),
): SchedulePhase {
  const dayKey = localDateKey(date)
  const daysSince = daysBetween(cycleStart, dayKey)
  if (daysSince < 0) {
    return { kind: 'before', daysUntilStart: Math.abs(daysSince) }
  }

  const on = Math.max(1, cycleOnDays)
  const off = Math.max(0, cycleOffDays)
  if (off === 0) {
    return {
      kind: 'on',
      dayOfPhase: (daysSince % on) + 1,
      phaseLength: on,
    }
  }

  const position = daysSince % (on + off)
  if (position < on) {
    return { kind: 'on', dayOfPhase: position + 1, phaseLength: on }
  }
  return { kind: 'off', dayOfPhase: position - on + 1, phaseLength: off }
}

export function scheduleSummary(cycleOnDays: number, cycleOffDays: number) {
  const on = Math.max(1, cycleOnDays)
  const off = Math.max(0, cycleOffDays)
  if (off === 0 && on === 1) return 'Every day'
  if (off === 0) return `${formatDuration(on)} on, then repeats`
  return `${formatDuration(on)} on, ${formatDuration(off)} off`
}

export function scheduleStatusLabel(
  cycleOnDays: number,
  cycleOffDays: number,
  cycleStart: string,
  date = new Date(),
) {
  const phase = schedulePhase(cycleOnDays, cycleOffDays, cycleStart, date)
  if (phase.kind === 'before') {
    return phase.daysUntilStart === 1
      ? 'Starts tomorrow'
      : `Starts in ${formatDuration(phase.daysUntilStart)}`
  }
  if (phase.kind === 'on') {
    return `On period · day ${phase.dayOfPhase} of ${formatDuration(phase.phaseLength)}`
  }
  return `Break · day ${phase.dayOfPhase} of ${formatDuration(phase.phaseLength)}`
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

export function cycleSegments(cycleOnDays: number, cycleOffDays: number) {
  const on = Math.max(1, cycleOnDays)
  const off = Math.max(0, cycleOffDays)
  if (off === 0) {
    return [{ kind: 'on' as const, length: Math.min(on, 14) }]
  }
  return [
    { kind: 'on' as const, length: on },
    { kind: 'off' as const, length: off },
  ]
}
