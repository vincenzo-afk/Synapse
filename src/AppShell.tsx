/**
 * App Shell — Neo-Brutalist Desktop Application Shell.
 * Renders Saturn logo, high-contrast Top Bar, floating nav sidebar, and persistent timer.
 */
import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun, Target, CheckSquare, Dumbbell, Droplets, UtensilsCrossed,
  Moon, BookOpen, GraduationCap, Briefcase, BookMarked, Archive,
  Wallet, Users, Calendar, BarChart3, LayoutDashboard, Settings,
  ChevronLeft, ChevronRight, Plus, Search, Bell, HardDrive, ShieldCheck, Flame
} from 'lucide-react'
import { useUIStore } from './stores/ui-store'
import { FloatingTimer } from './modules/shared/FloatingTimer'
import { Button, IconButton } from './design-system/components/Button'
import { localDateString } from './db/repositories/habits'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  color: string
}

const NAV_GROUPS: Array<{ group: string; pillColor: string; items: NavItem[] }> = [
  {
    group: 'Daily Operating',
    pillColor: 'bg-[#fbbf24] text-black',
    items: [
      { to: '/today', icon: <Sun size={20} strokeWidth={2.5} />, label: 'Today', color: 'var(--color-warning)' },
      { to: '/habits', icon: <Target size={20} strokeWidth={2.5} />, label: 'Habits', color: 'var(--color-habits)' },
      { to: '/tasks', icon: <CheckSquare size={20} strokeWidth={2.5} />, label: 'Tasks', color: 'var(--color-tasks)' },
      { to: '/journal', icon: <BookMarked size={20} strokeWidth={2.5} />, label: 'Journal', color: 'var(--color-journal)' },
    ],
  },
  {
    group: 'Health & Physical',
    pillColor: 'bg-[#ef4444] text-white',
    items: [
      { to: '/workout', icon: <Dumbbell size={20} strokeWidth={2.5} />, label: 'Workout', color: 'var(--color-workout)' },
      { to: '/hydration', icon: <Droplets size={20} strokeWidth={2.5} />, label: 'Hydration', color: 'var(--color-hydration)' },
      { to: '/nutrition', icon: <UtensilsCrossed size={20} strokeWidth={2.5} />, label: 'Nutrition', color: 'var(--color-nutrition)' },
      { to: '/sleep', icon: <Moon size={20} strokeWidth={2.5} />, label: 'Sleep', color: 'var(--color-sleep)' },
    ],
  },
  {
    group: 'Knowledge',
    pillColor: 'bg-[#3b82f6] text-white',
    items: [
      { to: '/study', icon: <BookOpen size={20} strokeWidth={2.5} />, label: 'Study', color: 'var(--color-study)' },
      { to: '/college', icon: <GraduationCap size={20} strokeWidth={2.5} />, label: 'College', color: 'var(--color-college)' },
      { to: '/projects', icon: <Briefcase size={20} strokeWidth={2.5} />, label: 'Projects', color: 'var(--color-accent)' },
    ],
  },
  {
    group: 'Life & Storage',
    pillColor: 'bg-[#10b981] text-white',
    items: [
      { to: '/finance', icon: <Wallet size={20} strokeWidth={2.5} />, label: 'Finance', color: 'var(--color-finance)' },
      { to: '/personal', icon: <Users size={20} strokeWidth={2.5} />, label: 'Personal', color: 'var(--color-personal)' },
      { to: '/vault', icon: <Archive size={20} strokeWidth={2.5} />, label: 'Vault', color: 'var(--color-vault)' },
    ],
  },
  {
    group: 'Analytics',
    pillColor: 'bg-[#8b5cf6] text-white',
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={20} strokeWidth={2.5} />, label: 'Dashboard', color: 'var(--color-accent)' },
      { to: '/calendar', icon: <Calendar size={20} strokeWidth={2.5} />, label: 'Calendar', color: 'var(--color-accent)' },
      { to: '/analytics', icon: <BarChart3 size={20} strokeWidth={2.5} />, label: 'Analytics', color: 'var(--color-accent)' },
    ],
  },
]

export function AppShell() {
  const { sidebarCollapsed, toggleSidebar, setQuickAddOpen } = useUIStore()
  const location = useLocation()
  const todayStr = localDateString()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-background)] font-sans">
      {/* ── Neo-Brutalist Floating Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 88 : 280 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="
          flex flex-col shrink-0 h-[calc(100dvh-1.5rem)] m-3
          bg-[var(--color-surface)] border-4 border-[#111111] rounded-[24px]
          shadow-[6px_6px_0px_#111111] overflow-hidden z-30 relative
        "
      >
        {/* Header with App Saturn Logo */}
        <div className="flex items-center gap-3 p-4 border-b-4 border-[#111111] shrink-0 bg-[var(--color-surface-elevated)]">
          <img
            src="/logo.png"
            alt="Synapse Logo"
            className="w-10 h-10 rounded-[12px] border-2 border-[#111111] shadow-[2px_2px_0px_#111111] object-cover shrink-0"
          />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="font-extrabold text-xl tracking-tight text-[var(--color-text-primary)] leading-tight">
                  Synapse
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-[var(--color-accent)]">
                  Desktop OS v1.0
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Add CTA */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => setQuickAddOpen(true)}
            className={`
              w-full flex items-center justify-center gap-2.5 h-12
              rounded-[18px] border-4 border-[#111111]
              bg-[var(--color-accent)] text-white font-extrabold text-base
              shadow-[4px_4px_0px_#111111] hover:shadow-[6px_6px_0px_#111111]
              active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
              transition-all duration-150 cursor-pointer
            `}
          >
            <Plus size={22} strokeWidth={3} />
            {!sidebarCollapsed && <span>Quick Add</span>}
          </button>
        </div>

        {/* Navigation Group Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.group} className="space-y-2">
              {!sidebarCollapsed && (
                <div className={`inline-block px-2.5 py-0.5 rounded-[8px] text-[10px] font-extrabold uppercase tracking-widest border-2 border-[#111111] shadow-[2px_2px_0px_#111111] ${group.pillColor}`}>
                  {group.group}
                </div>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={({ isActive }) => `
                      flex items-center gap-3 rounded-[16px] px-3.5 h-12
                      font-bold text-base transition-all duration-150 border-4
                      ${sidebarCollapsed ? 'justify-center px-0' : ''}
                      ${isActive
                        ? 'bg-[var(--color-accent)] text-white border-[#111111] shadow-[4px_4px_0px_#111111] translate-x-0.5'
                        : 'bg-transparent text-[var(--color-text-primary)] border-transparent hover:border-[#111111] hover:bg-[var(--color-surface-elevated)] hover:shadow-[3px_3px_0px_#111111]'
                      }
                    `}
                  >
                    {({ isActive }) => (
                      <>
                        <span style={{ color: isActive ? '#ffffff' : item.color }} className="shrink-0">
                          {item.icon}
                        </span>
                        <AnimatePresence>
                          {!sidebarCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              className="overflow-hidden whitespace-nowrap tracking-tight"
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

        {/* Footer Settings & Storage Indicator */}
        <div className="shrink-0 border-t-4 border-[#111111] p-3 space-y-2 bg-[var(--color-surface-elevated)]">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 p-2 rounded-[12px] border-2 border-[#111111] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-text-secondary)]">
              <ShieldCheck size={16} className="text-[var(--color-success)] shrink-0" />
              <span className="truncate">IndexedDB Offline · 100% Private</span>
            </div>
          )}
          <div className="flex gap-2">
            <NavLink
              to="/settings"
              title="Settings"
              className={({ isActive }) => `
                flex-1 flex items-center justify-center gap-2 h-11 rounded-[14px]
                border-3 border-[#111111] font-bold text-sm transition-all duration-150
                ${isActive
                  ? 'bg-[var(--color-accent)] text-white shadow-[3px_3px_0px_#111111]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:shadow-[3px_3px_0px_#111111]'
                }
              `}
            >
              <Settings size={18} strokeWidth={2.5} />
              {!sidebarCollapsed && <span>Settings</span>}
            </NavLink>
            <button
              onClick={toggleSidebar}
              className="
                w-11 h-11 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface)]
                flex items-center justify-center text-[var(--color-text-primary)] font-bold
                hover:shadow-[3px_3px_0px_#111111] transition-all duration-150 cursor-pointer shrink-0
              "
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={20} strokeWidth={3} /> : <ChevronLeft size={20} strokeWidth={3} />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main View Container with Top Bar ── */}
      <main className="flex-1 flex flex-col overflow-hidden m-3 ml-0 space-y-3">
        {/* Top Bar Header */}
        <header className="flex items-center justify-between px-6 py-3.5 bg-[var(--color-surface)] border-4 border-[#111111] rounded-[24px] shadow-[6px_6px_0px_#111111] shrink-0 gap-4">
          {/* Left: Search Bar & Smart AI Parser */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search size={18} strokeWidth={2.5} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-primary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    try {
                      const { parseAndExecuteNaturalLanguage } = await import('./engines/ai-parser')
                      const res = await parseAndExecuteNaturalLanguage(searchQuery)
                      setSearchQuery('')
                      alert(`[Groq AI Assistant] Created in ${res.module}: ${res.actionSummary}`)
                    } catch (err: any) {
                      alert(`Parse Error: ${err?.message || 'Failed to parse command.'}`)
                    }
                  }
                }}
                placeholder="Type command or search... (e.g. 'Drink 4L water' & Press Enter)"
                className="w-full h-11 pl-10 pr-4 rounded-[14px] border-3 border-[#111111] bg-[var(--color-background)] text-sm font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-3 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Right: Actions, Streaks, Date, Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Today Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[12px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] text-xs font-bold text-[var(--color-text-primary)] shadow-[2px_2px_0px_#111111]">
              <Calendar size={14} strokeWidth={2.5} className="text-[var(--color-accent)]" />
              <span>{todayStr}</span>
            </div>

            {/* Streak Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] border-3 border-[#111111] bg-[#fef3c7] text-[#92400e] text-xs font-extrabold shadow-[2px_2px_0px_#111111]">
              <Flame size={16} className="text-[#f59e0b] fill-[#f59e0b]" />
              <span>14 DAY STREAK</span>
            </div>

            {/* Quick Notification Button */}
            <button
              title="Notifications"
              className="w-11 h-11 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-primary)] shadow-[3px_3px_0px_#111111] hover:shadow-[4px_4px_0px_#111111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer transition-all"
            >
              <Bell size={18} strokeWidth={2.5} />
            </button>

            {/* User Profile Tile */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface-elevated)] shadow-[3px_3px_0px_#111111]">
              <div className="w-8 h-8 rounded-[10px] border-2 border-[#111111] bg-[var(--color-accent)] text-white font-extrabold text-sm flex items-center justify-center">
                V
              </div>
              <span className="font-bold text-sm text-[var(--color-text-primary)] hidden sm:inline">Vincenzo</span>
            </div>
          </div>
        </header>

        {/* View Outlet Container */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-surface)] border-4 border-[#111111] rounded-[24px] shadow-[6px_6px_0px_#111111] p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.99, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* ── Persistent Floating Timer Engine ── */}
      <FloatingTimer />
    </div>
  )
}
