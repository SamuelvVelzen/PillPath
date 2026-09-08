export type Theme = 'light' | 'dark' | 'system'

export const THEME_KEY = 'pillpath.theme'
export const LIGHT_THEME_COLOR = '#e7eef2'
export const DARK_THEME_COLOR = '#12171c'

export function readTheme(): Theme {
  const value = localStorage.getItem(THEME_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'dark'
}

export function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme) {
  const resolved = resolvedTheme(theme)
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute(
      'content',
      resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
    )
  }
  const statusBar = document.querySelector(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  )
  if (statusBar) {
    statusBar.setAttribute(
      'content',
      resolved === 'dark' ? 'black-translucent' : 'default',
    )
  }
}

export function storeTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function nextTheme(theme: Theme, resolved: 'light' | 'dark'): Theme {
  if (theme === 'system') return resolved === 'dark' ? 'light' : 'dark'
  if (theme === 'light') return 'dark'
  return 'system'
}
