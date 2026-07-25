// Stub pages for modules not yet fully implemented
// Each provides a beautiful holding screen with module context

import { Dumbbell, UtensilsCrossed, GraduationCap, Briefcase, Archive, Users, Calendar, BarChart3, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

function ComingSoon({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="w-20 h-20 rounded-[var(--radius-xl)] flex items-center justify-center mb-6"
        style={{ backgroundColor: color + '22', color }}
      >
        {icon}
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-[var(--color-text-primary)] mb-3"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-[var(--color-text-secondary)] mb-6 max-w-sm"
      >
        {description}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]"
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        Phase 3+ — Coming soon
      </motion.div>
    </div>
  )
}

export function WorkoutPage() {
  return <ComingSoon icon={<Dumbbell size={36} />} title="Workout" description="Weekly split planner, exercise database, sets/reps/weight logging, rest timer, PRs, and body measurements." color="var(--color-workout)" />
}

export function NutritionPage() {
  return <ComingSoon icon={<UtensilsCrossed size={36} />} title="Nutrition" description="Log meals, track calories and protein, manage nutrition goals, and stay in sync with your water intake." color="var(--color-nutrition)" />
}

export function CollegePage() {
  return <ComingSoon icon={<GraduationCap size={36} />} title="College" description="Semesters, subjects, attendance tracking, assignments, exams, and CGPA calculator." color="var(--color-college)" />
}

export function ProjectsPage() {
  return <ComingSoon icon={<Briefcase size={36} />} title="Projects" description="Portfolio-level project management with milestones, Kanban boards, and roadmaps." color="var(--color-accent)" />
}

export function VaultPage() {
  return <ComingSoon icon={<Archive size={36} />} title="Vault" description="Store notes, documents, certificates, bookmarks, ideas, and receipts — all searchable and tagged." color="var(--color-vault)" />
}

export function PersonalPage() {
  return <ComingSoon icon={<Users size={36} />} title="Personal" description="Contacts, birthdays, anniversaries, gift ideas — never forget what matters." color="var(--color-personal)" />
}

export function CalendarPage() {
  return <ComingSoon icon={<Calendar size={36} />} title="Calendar" description="Unified view of all your habits, tasks, workouts, study sessions, events, and more." color="var(--color-accent)" />
}

export function AnalyticsPage() {
  return <ComingSoon icon={<BarChart3 size={36} />} title="Analytics" description="Daily, weekly, monthly, and yearly insights across all modules — habit streaks, sleep trends, study hours, finance summaries." color="var(--color-accent)" />
}

export function DashboardPage() {
  return <ComingSoon icon={<LayoutDashboard size={36} />} title="Dashboard" description="Customizable widget dashboard — arrange your most important data at a glance." color="var(--color-accent)" />
}
