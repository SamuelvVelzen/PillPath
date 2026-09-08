import { ThemeToggle } from './theme-toggle.tsx'
import { useApp } from '../context/app-context.tsx'

export function PersonBar({ subtitle }: { subtitle: string }) {
  const { people, personId, setPersonId, person } = useApp()

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
        Logging as {person?.name ?? 'you'}. Both of you share the same list.
      </p>
      <div
        className="mt-4 grid max-w-md grid-cols-2 gap-2"
        role="group"
        aria-label="Who is logging"
      >
        {people.map((entry) => {
          const selected = entry.id === personId
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPersonId(entry.id)}
              aria-pressed={selected}
              className={`min-h-12 rounded-2xl px-3 text-sm font-semibold ${
                selected ? 'bg-lagoon text-paper' : 'bg-paper text-ink'
              }`}
            >
              {entry.name}
            </button>
          )
        })}
      </div>
    </header>
  )
}
