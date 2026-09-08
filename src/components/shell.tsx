import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { CalendarCheck, House, Pill, Settings2 } from 'lucide-react'
import { useApp } from '../context/app-context.tsx'
import { InstallHint } from './install-hint.tsx'
import { Onboarding } from './onboarding.tsx'

const tabs = [
  { to: '/', label: 'Today', icon: House, exact: true },
  { to: '/as-needed', label: 'As-needed', icon: Pill, exact: false },
  { to: '/daily', label: 'Daily', icon: CalendarCheck, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings2, exact: false },
] as const

export function Shell() {
  const { loading, error, needsOnboarding } = useApp()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-canvas">
      <main className="flex-1 px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {error ? (
          <p className="rounded-3xl bg-over-soft px-4 py-3 text-clay">{error}</p>
        ) : null}
        {loading ? (
          <p className="mt-8 text-center text-mute">Loading a quiet view…</p>
        ) : (
          <Outlet />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-line/80 bg-paper/95 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur">
        <ul className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to)
            const Icon = tab.icon
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-semibold tracking-wide ${
                    active ? 'bg-mist text-ink' : 'text-mute'
                  }`}
                >
                  <Icon size={22} strokeWidth={1.75} />
                  <span className="mt-1">{tab.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <InstallHint />
      {needsOnboarding ? <Onboarding /> : null}
    </div>
  )
}
