import type { ThresholdLevel } from './types.ts'

export function levelCopy(level: ThresholdLevel) {
  if (level === 'over') return 'Over the limit'
  if (level === 'warning') return 'Very close to the limit'
  if (level === 'caution') return 'Getting close'
  return 'Within the usual range'
}

export function wouldCrossLimit(used: number, amount: number, max: number) {
  if (max <= 0) return false
  return used + amount > max
}

export function nextLevel(used: number, amount: number, max: number): ThresholdLevel {
  const next = used + amount
  if (max <= 0) return 'ok'
  const ratio = next / max
  if (ratio > 1) return 'over'
  if (ratio >= 1) return 'warning'
  if (ratio >= 0.9) return 'warning'
  if (ratio >= 0.7) return 'caution'
  return 'ok'
}
