/**
 * UI Store — global ephemeral UI state only (Zustand).
 * Durable data NEVER lives here — always in Dexie.
 * See docs/07-state-management.md.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ActiveModule =
  | 'today'
  | 'habits'
  | 'tasks'
  | 'workout'
  | 'nutrition'
  | 'hydration'
  | 'sleep'
  | 'study'
  | 'college'
  | 'projects'
  | 'journal'
  | 'vault'
  | 'finance'
  | 'personal'
  | 'calendar'
  | 'analytics'
  | 'dashboard'
  | 'settings'

interface UIState {
  sidebarCollapsed: boolean
  activeModule: ActiveModule
  commandPaletteOpen: boolean
  quickAddOpen: boolean
  setSidebarCollapsed: (v: boolean) => void
  toggleSidebar: () => void
  setActiveModule: (m: ActiveModule) => void
  setCommandPaletteOpen: (v: boolean) => void
  setQuickAddOpen: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeModule: 'today',
      commandPaletteOpen: false,
      quickAddOpen: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setActiveModule: (m) => set({ activeModule: m }),
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      setQuickAddOpen: (v) => set({ quickAddOpen: v }),
    }),
    {
      name: 'synapse-ui-state',
      // Only persist non-sensitive UI prefs, not open modal state
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
