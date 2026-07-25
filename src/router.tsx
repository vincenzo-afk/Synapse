/**
 * App router — module routes per docs/05-folder-structure.md
 */
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AppShell } from './AppShell'
import { lazy, Suspense } from 'react'

// Lazy-loaded module pages — all chunks are precached by Workbox so first-load
// to a module works offline after install (see docs/10-pwa-offline-strategy.md)
const TodayPage = lazy(() => import('./modules/today/TodayPage'))
const HabitsPage = lazy(() => import('./modules/habits/HabitsPage'))
const TasksPage = lazy(() => import('./modules/tasks/TasksPage'))
const WorkoutPage = lazy(() => import('./modules/workout/WorkoutPage'))
const HydrationPage = lazy(() => import('./modules/hydration/HydrationPage'))
const NutritionPage = lazy(() => import('./modules/nutrition/NutritionPage'))
const SleepPage = lazy(() => import('./modules/sleep/SleepPage'))
const StudyPage = lazy(() => import('./modules/study/StudyPage'))
const JournalPage = lazy(() => import('./modules/journal/JournalPage'))
const FinancePage = lazy(() => import('./modules/finance/FinancePage'))
const CalendarPage = lazy(() => import('./modules/calendar/CalendarPage'))
const SettingsPage = lazy(() => import('./modules/settings/SettingsPage'))
const CollegePage = lazy(() => import('./modules/college/CollegePage'))
const ProjectsPage = lazy(() => import('./modules/projects/ProjectsPage'))
const VaultPage = lazy(() => import('./modules/vault/VaultPage'))
const PersonalPage = lazy(() => import('./modules/personal/PersonalPage'))
const AnalyticsPage = lazy(() => import('./modules/analytics/AnalyticsPage'))
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'))

function PageSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <PageSuspense><TodayPage /></PageSuspense> },
      { path: 'habits/*', element: <PageSuspense><HabitsPage /></PageSuspense> },
      { path: 'tasks/*', element: <PageSuspense><TasksPage /></PageSuspense> },
      { path: 'workout/*', element: <PageSuspense><WorkoutPage /></PageSuspense> },
      { path: 'hydration', element: <PageSuspense><HydrationPage /></PageSuspense> },
      { path: 'nutrition', element: <PageSuspense><NutritionPage /></PageSuspense> },
      { path: 'sleep', element: <PageSuspense><SleepPage /></PageSuspense> },
      { path: 'study/*', element: <PageSuspense><StudyPage /></PageSuspense> },
      { path: 'college/*', element: <PageSuspense><CollegePage /></PageSuspense> },
      { path: 'projects/*', element: <PageSuspense><ProjectsPage /></PageSuspense> },
      { path: 'journal/*', element: <PageSuspense><JournalPage /></PageSuspense> },
      { path: 'vault/*', element: <PageSuspense><VaultPage /></PageSuspense> },
      { path: 'finance/*', element: <PageSuspense><FinancePage /></PageSuspense> },
      { path: 'personal/*', element: <PageSuspense><PersonalPage /></PageSuspense> },
      { path: 'calendar', element: <PageSuspense><CalendarPage /></PageSuspense> },
      { path: 'analytics', element: <PageSuspense><AnalyticsPage /></PageSuspense> },
      { path: 'dashboard', element: <PageSuspense><DashboardPage /></PageSuspense> },
      { path: 'settings', element: <PageSuspense><SettingsPage /></PageSuspense> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
