/**
 * Badge, ProgressRing, ProgressBar, EmptyState, Toast, Tooltip — Neo-Brutalist Indicators
 */
import { type ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'

// ─── Neo-Brutalist Badge ──────────────────────

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border-3 border-[#111111] shadow-[2px_2px_0px_#111111]',
  accent: 'bg-[var(--color-accent)] text-white border-3 border-[#111111] shadow-[2px_2px_0px_#111111]',
  success: 'bg-[var(--color-success)] text-white border-3 border-[#111111] shadow-[2px_2px_0px_#111111]',
  warning: 'bg-[var(--color-warning)] text-white border-3 border-[#111111] shadow-[2px_2px_0px_#111111]',
  danger: 'bg-[var(--color-danger)] text-white border-3 border-[#111111] shadow-[2px_2px_0px_#111111]',
  outline: 'border-3 border-[#111111] text-[var(--color-text-primary)] bg-transparent shadow-[2px_2px_0px_#111111]',
}

export function Badge({ variant = 'default', size = 'md', children, className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-bold' : size === 'lg' ? 'px-4 py-1 text-base font-extrabold' : 'px-3 py-1 text-sm font-bold'
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-[12px] uppercase tracking-wider
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
  size = 72,
  strokeWidth = 8,
  color = 'var(--color-accent)',
  trackColor = '#111111',
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
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center font-bold text-base">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Neo-Brutalist Stepped / Chunk Progress Bar ─────────────────

interface ProgressBarProps {
  value: number // 0-100
  color?: string
  height?: number
  className?: string
  animated?: boolean
  chunks?: number
}

export function ProgressBar({
  value,
  color = 'var(--color-accent)',
  height = 16,
  className = '',
  animated = true,
  chunks = 10,
}: ProgressBarProps) {
  const activeChunks = Math.round((Math.min(value, 100) / 100) * chunks)

  return (
    <div className={`flex gap-1.5 w-full ${className}`}>
      {Array.from({ length: chunks }).map((_, i) => {
        const isActive = i < activeChunks
        return (
          <motion.div
            key={i}
            initial={animated ? { scaleY: 0 } : false}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.15, delay: i * 0.02 }}
            className={`
              flex-1 rounded-[6px] border-2 border-[#111111]
              ${isActive ? 'shadow-[2px_2px_0px_#111111]' : 'bg-[var(--color-surface)] opacity-30'}
            `}
            style={{
              height,
              backgroundColor: isActive ? color : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Neo-Brutalist Empty State ─────────────────

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center border-4 border-[#111111] rounded-[22px] bg-[var(--color-surface)] shadow-[6px_6px_0px_#111111]">
      {icon && (
        <div className="w-20 h-20 rounded-[20px] border-4 border-[#111111] bg-[var(--color-accent)] text-white shadow-[4px_4px_0px_#111111] flex items-center justify-center mb-6 text-3xl font-bold">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h3>
      {description && (
        <p className="text-base font-semibold text-[var(--color-text-secondary)] max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
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
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={8}
            className="
              z-50 px-3 py-2 text-xs font-bold tracking-wide uppercase
              bg-[var(--color-surface)] text-[var(--color-text-primary)]
              border-3 border-[#111111] shadow-[4px_4px_0px_#111111]
              rounded-[10px]
            "
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[#111111]" />
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-[14px] border-3 border-[#111111] bg-[var(--color-surface)] shadow-[3px_3px_0px_#111111]">
      <span className="text-xl">🔥</span>
      <span className="font-mono text-base font-bold text-[var(--color-text-primary)]">{streak}d</span>
      {showBest && bestStreak !== undefined && (
        <span className="text-xs font-bold text-[var(--color-text-tertiary)]">/ {bestStreak} max</span>
      )}
    </div>
  )
}
