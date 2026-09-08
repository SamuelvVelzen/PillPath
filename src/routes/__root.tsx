import { createRootRoute } from '@tanstack/react-router'
import { AppProvider } from '../context/app-context.tsx'
import { ThemeProvider } from '../context/theme-context.tsx'
import { Shell } from '../components/shell.tsx'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ThemeProvider>
  )
}
