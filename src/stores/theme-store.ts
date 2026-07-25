/**
 * Theme store — persists to localStorage so theme is applied before Dexie
 * has opened (prevents flash of wrong theme).
 * The canonical source of truth for theme preference is also mirrored to
 * Dexie's settings table, but this store is initialized from localStorage first.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode } from '../db/schema'

interface ThemeState {
  theme: ThemeMode
  accentColor: string
  setTheme: (t: ThemeMode) => void
  setAccentColor: (c: string) => void
}

function applyTheme(theme: ThemeMode, accentColor: string): void {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.setProperty('--color-accent', accentColor)
  document.documentElement.style.setProperty('--color-accent-hover', accentColor)
  // Update meta theme-color for mobile browsers
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#f8f7ff' : '#0d0d0f')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark' as ThemeMode,
      accentColor: '#7c6af7',
      setTheme: (theme) => {
        set((s) => {
          applyTheme(theme, s.accentColor)
          return { theme }
        })
      },
      setAccentColor: (accentColor) => {
        set((s) => {
          applyTheme(s.theme, accentColor)
          return { accentColor }
        })
      },
    }),
    {
      name: 'synapse-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately on load — before React renders
        if (state) {
          applyTheme(state.theme, state.accentColor)
        }
      },
    }
  )
)

// Apply theme on script load (before hydration) to avoid flash
const stored = localStorage.getItem('synapse-theme')
if (stored) {
  try {
    const parsed = JSON.parse(stored) as { state?: { theme?: ThemeMode; accentColor?: string } }
    const t = parsed.state?.theme ?? 'dark'
    const c = parsed.state?.accentColor ?? '#7c6af7'
    applyTheme(t, c)
  } catch {
    // If parse fails, default is applied by CSS variables
  }
}
