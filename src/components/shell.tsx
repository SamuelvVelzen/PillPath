import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { CalendarCheck, House, Pill, Settings2 } from 'lucide-react'
import { useApp } from '../context/app-context.tsx'
import { ThemeToggle } from './theme-toggle.tsx'
import { InstallHint } from './install-hint.tsx'
import { Onboarding } from './onboarding.tsx'

export const tabs = [
  { to: '/', label: 'Today', icon: House, exact: true },
  { to: '/as-needed', label: 'As-needed', icon: Pill, exact: false },
  { to: '/daily', label: 'Daily', icon: CalendarCheck, exact: false },
  { to: '/settings', label: 'Settings', icon: Settings2, exact: false },
] as const

export function Shell() {
  const { loading, error, needsOnboarding } = useApp()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-canvas lg:max-w-none lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-2xl focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-line/80 lg:bg-paper lg:px-4 lg:pt-[max(1.5rem,env(safe-area-inset-top))] lg:pb-6">
        <p className="px-3 text-sm font-semibold tracking-[0.16em] text-lagoon uppercase">
          PillPath
        </p>
        <p className="mt-2 px-3 text-sm text-mute">
          Daily and as-needed medication, on a shared path.
        </p>
        <nav className="mt-8 flex-1" aria-label="Main">
          <NavList pathname={pathname} variant="sidebar" />
        </nav>
        <div className="px-1">
          <ThemeToggle />
        </div>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] lg:max-w-5xl lg:px-8 lg:pb-10 lg:pt-8"
        >
          {error ? (
            <p role="alert" className="rounded-3xl bg-over-soft px-4 py-3 text-clay">
              {error}
            </p>
          ) : null}
          {loading ? (
            <p role="status" className="mt-8 text-center text-mute">
              Loading a quiet view…
            </p>
          ) : (
            <Outlet />
          )}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-line/80 bg-paper/95 px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
          aria-label="Main"
        >
          <NavList pathname={pathname} variant="tabs" />
        </nav>
      </div>

      <InstallHint />
      {needsOnboarding ? <Onboarding /> : null}
    </div>
  )
}

function NavList({
  pathname,
  variant,
}: {
  pathname: string
  variant: 'tabs' | 'sidebar'
}) {
  const listClass =
    variant === 'tabs' ? 'grid grid-cols-4 gap-1' : 'flex flex-col gap-1'

  return (
    <ul className={listClass}>
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to)
        const Icon = tab.icon
        return (
          <li key={tab.to}>
            <Link
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={
                variant === 'tabs'
                  ? `flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-semibold tracking-wide ${
                      active ? 'bg-mist text-ink' : 'text-mute'
                    }`
                  : `flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-semibold ${
                      active ? 'bg-mist text-ink' : 'text-mute hover:bg-canvas hover:text-ink'
                    }`
              }
            >
              <Icon
                size={variant === 'tabs' ? 22 : 20}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className={variant === 'tabs' ? 'mt-1' : undefined}>{tab.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
