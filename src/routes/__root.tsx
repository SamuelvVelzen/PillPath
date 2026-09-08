import { createRootRoute } from '@tanstack/react-router'
import { AppProvider } from '../context/app-context.tsx'
import { MedDialogProvider } from '../context/med-dialog-context.tsx'
import { ThemeProvider } from '../context/theme-context.tsx'
import { Shell } from '../components/shell.tsx'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider>
      <AppProvider>
        <MedDialogProvider>
          <Shell />
        </MedDialogProvider>
      </AppProvider>
    </ThemeProvider>
  )
}
