/**
 * Badge, ProgressRing, ProgressBar, EmptyState, Toast, Tooltip
 */
import { type ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Badge ────────────────────────────────────

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  accent: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)]',
  outline: 'border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-transparent',
}

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-[var(--radius-full)]
        ${sizeClasses}
        ${badgeVariants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

// ─── Progress Ring ────────────────────────────

interface ProgressRingProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  children?: ReactNode
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  color = 'var(--color-accent)',
  trackColor = 'var(--color-border)',
  children,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(value, 100) / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────

interface ProgressBarProps {
  value: number // 0-100
  color?: string
  height?: number
  className?: string
  animated?: boolean
}

export function ProgressBar({
  value,
  color = 'var(--color-accent)',
  height = 6,
  className = '',
  animated = true,
}: ProgressBarProps) {
  return (
    <div
      className={`w-full rounded-full bg-[var(--color-border)] overflow-hidden ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={animated ? { width: 0 } : { width: `${Math.min(value, 100)}%` }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── Empty State ──────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] flex items-center justify-center mb-4 text-[var(--color-text-tertiary)]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mb-5">{description}</p>
      )}
      {action}
    </motion.div>
  )
}

// ─── Tooltip ──────────────────────────────────

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="
              z-50 px-2.5 py-1.5 text-xs font-medium
              bg-[var(--color-text-primary)] text-[var(--color-background)]
              rounded-[var(--radius-sm)] shadow-[var(--shadow-md)]
              animate-scaleIn
            "
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[var(--color-text-primary)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// ─── Streak Indicator ─────────────────────────

interface StreakIndicatorProps {
  streak: number
  showBest?: boolean
  bestStreak?: number
}

export function StreakIndicator({ streak, showBest, bestStreak }: StreakIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-[var(--color-warning)]">
        {/* Flame icon — same icon means streak everywhere, not just in Habits */}
        <span className="text-base">🔥</span>
        <span className="font-mono text-sm font-semibold">{streak}</span>
      </div>
      {showBest && bestStreak !== undefined && (
        <span className="text-xs text-[var(--color-text-tertiary)]">/ {bestStreak} best</span>
      )}
    </div>
  )
}
