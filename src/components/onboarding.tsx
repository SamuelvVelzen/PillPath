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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish() {
    if (!helper || !primary) return
    const herName = primaryName.trim()
    if (!herName) {
      setError('Add her name so the list is clearly hers.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await renamePerson(helper.id, helperName.trim() || 'Samuel')
      await renamePerson(primary.id, herName)
      setPersonId(helper.id)
      await refresh()
      completeOnboarding()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save names.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-canvas/95 px-4 py-10 lg:px-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center lg:max-w-lg">
        <p className="text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
          Welcome
        </p>
        <h2 id="onboarding-title" className="mt-2 text-3xl font-semibold">
          A quieter way to keep track
        </h2>
        <p className="mt-3 text-mute">
          You can log medication for her from this app. There is one shared
          usage — no second account to set up.
        </p>

        <label className="mt-8 block text-sm font-semibold text-mute" htmlFor="onboarding-helper">
          Your name
        </label>
        <input
          id="onboarding-helper"
          className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-paper px-4 text-ink outline-none ring-line focus:ring-2"
          value={helperName}
          autoComplete="name"
          onChange={(event) => setHelperName(event.target.value)}
        />

        <label className="mt-5 block text-sm font-semibold text-mute" htmlFor="onboarding-primary">
          Her name
        </label>
        <input
          id="onboarding-primary"
          className="mt-2 min-h-14 w-full rounded-2xl border-0 bg-paper px-4 text-ink outline-none ring-line focus:ring-2"
          value={primaryName}
          placeholder="The person these meds are for"
          autoComplete="name"
          onChange={(event) => setPrimaryName(event.target.value)}
        />

        {error ? (
          <p className="mt-4 text-clay" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          aria-busy={busy}
          onClick={() => void finish()}
          className="mt-8 min-h-14 rounded-2xl bg-lilac text-lg font-semibold text-paper disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Enter PillPath'}
        </button>
      </div>
    </div>
  )
}
