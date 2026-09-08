import { useApp } from '../context/app-context.tsx'

export function PersonBar({ subtitle }: { subtitle: string }) {
  const { people, personId, setPersonId, person } = useApp()

  return (
    <header className="mb-6">
      <p className="text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
        PillPath
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-ink">{subtitle}</h1>
      <p className="mt-1 text-mute">
        Logging as {person?.name ?? 'you'}. Both of you share the same list.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {people.map((entry) => {
          const selected = entry.id === personId
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setPersonId(entry.id)}
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
