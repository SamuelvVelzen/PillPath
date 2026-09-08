import { ThemeToggle } from './theme-toggle.tsx'

export function PersonBar({ subtitle }: { subtitle: string }) {
  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-3 lg:hidden">
        <p className="text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
          PillPath
        </p>
        <ThemeToggle className="lg:hidden" />
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">{subtitle}</h1>
    </header>
  )
}
