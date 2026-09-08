import { ThemeToggle } from './theme-toggle.tsx'
import { useApp } from '../context/app-context.tsx'

export function PersonBar({ subtitle }: { subtitle: string }) {
  const { helper, primary } = useApp()
  const helperName = helper?.name ?? 'Samuel'
  const forName = primary?.name

  return (
    <header className="mb-6">
      <div className="flex items-start justify-between gap-3 lg:hidden">
        <p className="text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
          PillPath
        </p>
        <ThemeToggle className="lg:hidden" />
      </div>
      <h1 className="mt-1 text-2xl font-semibold text-ink lg:text-3xl">{subtitle}</h1>
      <p className="mt-1 text-mute">
        {forName
          ? `For ${forName}. ${helperName} can log for her — one shared list, not two accounts.`
          : `${helperName} can log for her. One shared list, not two accounts.`}
      </p>
    </header>
  )
}
