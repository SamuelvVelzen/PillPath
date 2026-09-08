import { useState } from 'react'
import { renamePerson } from '../lib/api.ts'
import { useApp } from '../context/app-context.tsx'

export function Onboarding() {
  const { people, setPersonId, completeOnboarding, refresh } = useApp()
  const helper = people.find((person) => person.role === 'helper')
  const primary = people.find((person) => person.role === 'primary')
  const [helperName, setHelperName] = useState(helper?.name ?? 'Samuel')
  const [primaryName, setPrimaryName] = useState(
    primary?.name === 'Partner' ? '' : (primary?.name ?? ''),
  )
  const [who, setWho] = useState(helper?.id ?? 'person-samuel')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    if (!helper || !primary) return
    const herName = primaryName.trim()
    if (!herName) {
      setError('Add her name so logs stay clear.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await renamePerson(helper.id, helperName.trim() || 'Samuel')
      await renamePerson(primary.id, herName)
      setPersonId(who)
      await refresh()
      completeOnboarding()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save names.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-canvas/95 px-4 py-10 lg:px-8">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center lg:max-w-lg">
        <p className="text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
          Welcome
        </p>
        <h2 className="mt-2 text-3xl font-semibold">A quieter way to keep track</h2>
        <p className="mt-3 text-mute">
          You can fill this in for her, and she can fill it in too. Everything
          stays on one shared path.
        </p>

        <label className="mt-8 block text-sm font-semibold text-mute">Your name</label>
        <input
          className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-paper px-4 text-ink outline-none ring-line focus:ring-2"
          value={helperName}
          onChange={(event) => setHelperName(event.target.value)}
        />

        <label className="mt-5 block text-sm font-semibold text-mute">Her name</label>
        <input
          className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-paper px-4 text-ink outline-none ring-line focus:ring-2"
          value={primaryName}
          placeholder="The person these meds are for"
          onChange={(event) => setPrimaryName(event.target.value)}
        />

        <p className="mt-6 text-sm font-semibold text-mute">Who is using the phone now?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => helper && setWho(helper.id)}
            className={`min-h-14 rounded-2xl font-semibold ${
              who === helper?.id ? 'bg-lagoon text-paper' : 'bg-paper text-ink'
            }`}
          >
            Me
          </button>
          <button
            type="button"
            onClick={() => primary && setWho(primary.id)}
            className={`min-h-14 rounded-2xl font-semibold ${
              who === primary?.id ? 'bg-lagoon text-paper' : 'bg-paper text-ink'
            }`}
          >
            Her
          </button>
        </div>

        {error ? <p className="mt-4 text-clay">{error}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void finish()}
          className="mt-8 min-h-14 rounded-2xl bg-lilac text-lg font-semibold text-paper disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Enter PillPath'}
        </button>
      </div>
    </div>
  )
}
