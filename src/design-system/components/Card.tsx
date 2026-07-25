/**
 * Card component — the primary surface container in the design system.
 */
import { type HTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLMotionProps<'div'> {
  elevated?: boolean
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  elevated = false,
  interactive = false,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        rounded-[var(--radius-lg)]
        border border-[var(--color-border)]
        ${elevated ? 'bg-[var(--color-surface-elevated)] shadow-[var(--shadow-md)]' : 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'}
        ${interactive ? 'cursor-pointer transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-accent)] hover:-translate-y-0.5' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ─── Card sub-components ──────────────────────

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-semibold text-[var(--color-text-primary)] ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardContent({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 ${className}`} {...props}>
      {children}
    </div>
  )
}
