import { useEffect, useState } from 'react'

type PromptEvent = Event & {
  prompt: () => Promise<void>
}

export function InstallHint() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (standalone) return

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIos(isIos)

    const onPrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as PromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (hidden || (!promptEvent && !ios)) return null

  return (
    <aside
      className="fixed bottom-[calc(5.4rem+env(safe-area-inset-bottom))] left-4 right-4 z-20 mx-auto max-w-lg rounded-3xl bg-paper px-4 py-3 shadow-sm shadow-mist lg:bottom-6 lg:left-[calc(16rem+1.5rem)] lg:right-auto lg:mx-0 lg:w-80"
      aria-label="Install PillPath"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">Add PillPath to this device</p>
          <p className="mt-1 text-sm text-mute">
            {promptEvent
              ? 'Install it so it opens like an app, without the browser chrome.'
              : 'On iPhone: Share, then Add to Home Screen. On a computer, use the browser install option.'}
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-mute"
          onClick={() => setHidden(true)}
          aria-label="Hide install hint"
        >
          Hide
        </button>
      </div>
      {promptEvent ? (
        <button
          type="button"
          className="mt-3 min-h-11 w-full rounded-2xl bg-lagoon font-semibold text-paper"
          onClick={() => void promptEvent.prompt()}
        >
          Install
        </button>
      ) : null}
    </aside>
  )
}
