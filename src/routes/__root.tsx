import { createRootRoute } from '@tanstack/react-router'
import { AppProvider } from '../context/app-context.tsx'
import { Shell } from '../components/shell.tsx'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
