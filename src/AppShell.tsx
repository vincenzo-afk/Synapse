/**
 * App Shell — the root layout with sidebar navigation and floating timer.
 * Renders for every route; module content rendered via <Outlet />.
 */
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Target, CheckSquare, Dumbbell, Droplets, UtensilsCrossed,
  Moon, BookOpen, GraduationCap, Briefcase, BookMarked, Archive,
  Wallet, Users, Calendar, BarChart3, LayoutDashboard, Settings,
  ChevronLeft, ChevronRight, Timer, Plus
} from 'lucide-react'
import { useUIStore } from './stores/ui-store'
import { FloatingTimer } from './modules/shared/FloatingTimer'
import { IconButton } from './design-system/components/Button'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  color: string
}

const NAV_GROUPS: Array<{ group: string; items: NavItem[] }> = [
  {
    group: 'Daily',
    items: [
      { to: '/today', icon: <Sun size={18} />, label: 'Today', color: 'var(--color-warning)' },
      { to: '/habits', icon: <Target size={18} />, label: 'Habits', color: 'var(--color-habits)' },
      { to: '/tasks', icon: <CheckSquare size={18} />, label: 'Tasks', color: 'var(--color-tasks)' },
      { to: '/journal', icon: <BookMarked size={18} />, label: 'Journal', color: 'var(--color-journal)' },
    ],
  },
  {
    group: 'Health',
    items: [
      { to: '/workout', icon: <Dumbbell size={18} />, label: 'Workout', color: 'var(--color-workout)' },
      { to: '/hydration', icon: <Droplets size={18} />, label: 'Hydration', color: 'var(--color-hydration)' },
      { to: '/nutrition', icon: <UtensilsCrossed size={18} />, label: 'Nutrition', color: 'var(--color-nutrition)' },
      { to: '/sleep', icon: <Moon size={18} />, label: 'Sleep', color: 'var(--color-sleep)' },
    ],
  },
  {
    group: 'Learning',
    items: [
      { to: '/study', icon: <BookOpen size={18} />, label: 'Study', color: 'var(--color-study)' },
      { to: '/college', icon: <GraduationCap size={18} />, label: 'College', color: 'var(--color-college)' },
      { to: '/projects', icon: <Briefcase size={18} />, label: 'Projects', color: 'var(--color-accent)' },
    ],
  },
  {
    group: 'Life',
    items: [
      { to: '/finance', icon: <Wallet size={18} />, label: 'Finance', color: 'var(--color-finance)' },
      { to: '/personal', icon: <Users size={18} />, label: 'Personal', color: 'var(--color-personal)' },
      { to: '/vault', icon: <Archive size={18} />, label: 'Vault', color: 'var(--color-vault)' },
    ],
  },
  {
    group: 'Overview',
    items: [
      { to: '/calendar', icon: <Calendar size={18} />, label: 'Calendar', color: 'var(--color-accent)' },
      { to: '/analytics', icon: <BarChart3 size={18} />, label: 'Analytics', color: 'var(--color-accent)' },
      { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', color: 'var(--color-accent)' },
    ],
  },
]

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar, setQuickAddOpen } = useUIStore()
  const location = useLocation()

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-background)]">
      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="
          flex flex-col shrink-0 h-full
          bg-[var(--color-surface)] border-r border-[var(--color-border)]
          overflow-hidden z-20
        "
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 shrink-0">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent)] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold tracking-tight">S</span>
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-bold text-[var(--color-text-primary)] text-base overflow-hidden whitespace-nowrap"
              >
                Synapse
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add */}
        <div className="px-3 mb-4 shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setQuickAddOpen(true)}
            className={`
              w-full flex items-center gap-2.5
              ${sidebarCollapsed ? 'justify-center px-0 h-10 w-10 mx-auto' : 'px-3 h-10'}
              rounded-[var(--radius-md)]
              bg-[var(--color-accent)] text-white text-sm font-medium
              hover:bg-[var(--color-accent-hover)]
              transition-colors duration-150
            `}
          >
            <Plus size={16} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Quick Add
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.group}>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-widest px-2 mb-1.5"
                  >
                    {group.group}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-[var(--radius-md)] px-2 h-9
                      transition-all duration-150 text-sm font-medium
                      ${sidebarCollapsed ? 'justify-center' : ''}
                      ${isActive
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{ color: isActive ? 'var(--color-accent)' : item.color, opacity: isActive ? 1 : 0.7 }}>
                          {item.icon}
                        </span>
                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="overflow-hidden whitespace-nowrap"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: Settings + Collapse */}
        <div className="shrink-0 border-t border-[var(--color-border)] p-3 space-y-1">
          <NavLink
            to="/settings"
            title={sidebarCollapsed ? 'Settings' : undefined}
            className={({ isActive }) => `
              flex items-center gap-3 rounded-[var(--radius-md)] px-2 h-9 w-full
              transition-colors duration-150 text-sm font-medium
              ${sidebarCollapsed ? 'justify-center' : ''}
              ${isActive
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]'
              }
            `}
          >
            <Settings size={18} />
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>

          <button
            onClick={toggleSidebar}
            className="
              flex items-center gap-3 rounded-[var(--radius-md)] px-2 h-9 w-full
              text-[var(--color-text-tertiary)]
              hover:bg-[var(--color-surface-elevated)]
              hover:text-[var(--color-text-primary)]
              transition-colors duration-150
              justify-center
            "
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* ── Floating Timer (persists across route changes) ── */}
      <FloatingTimer />
    </div>
  )
}
