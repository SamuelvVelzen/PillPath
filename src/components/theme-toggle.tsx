import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../context/theme-context.tsx'

const labels = {
  light: 'Light theme',
  dark: 'Dark theme',
  system: 'System theme',
} as const

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme()
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-paper text-ink"
      aria-label={`${labels[theme]}. Switch theme`}
      title={`${labels[theme]}. Click to switch`}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
