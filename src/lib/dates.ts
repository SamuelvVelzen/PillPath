export function localDayRange(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return {
    from: start.toISOString(),
    to: end.toISOString(),
    label: start.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  }
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function amountLabel(amount: number, unit: string) {
  const rounded = Number.isInteger(amount) ? String(amount) : amount.toFixed(1)
  return `${rounded} ${unit}`
}

export function currentTimeValue(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function takenAtFromTime(time: string, day = new Date()) {
  const [hours, minutes] = time.split(':').map(Number)
  const taken = new Date(day)
  taken.setHours(hours, minutes, 0, 0)
  return taken.toISOString()
}

export function localMonthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 1)
  end.setHours(0, 0, 0, 0)
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

export function localDateKey(isoOrDate: string | Date) {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function monthLabel(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function weekdayLabels() {
  const sunday = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday)
    date.setDate(sunday.getDate() + index)
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  })
}

export function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function startPad(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay()
}
