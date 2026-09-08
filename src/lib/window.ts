export type WindowUnit = 'hours' | 'days' | 'weeks' | 'months'

const HOURS_PER_DAY = 24
const HOURS_PER_WEEK = HOURS_PER_DAY * 7
const HOURS_PER_MONTH = HOURS_PER_DAY * 30

export function fromDisplayValue(value: string, unit: WindowUnit) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return 0
  switch (unit) {
    case 'hours':
      return Math.round(amount)
    case 'days':
      return Math.round(amount * HOURS_PER_DAY)
    case 'weeks':
      return Math.round(amount * HOURS_PER_WEEK)
    case 'months':
      return Math.round(amount * HOURS_PER_MONTH)
  }
}

export function bestDisplayUnit(hours: number): WindowUnit {
  const rounded = Math.max(1, Math.round(hours))
  if (rounded >= HOURS_PER_MONTH && rounded % HOURS_PER_MONTH === 0) return 'months'
  if (rounded >= HOURS_PER_WEEK && rounded % HOURS_PER_WEEK === 0) return 'weeks'
  if (rounded >= HOURS_PER_DAY && rounded % HOURS_PER_DAY === 0) return 'days'
  return 'hours'
}

export function bestDisplayValue(hours: number) {
  const unit = bestDisplayUnit(hours)
  const rounded = Math.max(1, Math.round(hours))
  const value =
    unit === 'months'
      ? String(rounded / HOURS_PER_MONTH)
      : unit === 'weeks'
        ? String(rounded / HOURS_PER_WEEK)
        : unit === 'days'
          ? String(rounded / HOURS_PER_DAY)
          : String(rounded)
  return { value, unit }
}

export function formatWindow(hours: number) {
  const { value, unit } = bestDisplayValue(hours)
  const amount = Number(value)
  if (unit === 'hours') return amount === 1 ? '1 hour' : `${amount} hours`
  if (unit === 'days') return amount === 1 ? '1 day' : `${amount} days`
  if (unit === 'weeks') return amount === 1 ? '1 week' : `${amount} weeks`
  return amount === 1 ? '1 month' : `${amount} months`
}

export function limitSummary(maxAmount: number, unit: string, windowHours: number) {
  return `max ${maxAmount} ${unit} per ${formatWindow(windowHours)}`
}
