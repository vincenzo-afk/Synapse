/**
 * Card component — Modern Neo-Brutalist container.
 * 4px solid borders, hard 6px 6px shadow, 20px radius, generous padding.
 */
import { type HTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

interface CardProps extends HTMLMotionProps<'div'> {
  elevated?: boolean
  interactive?: boolean
  accentColor?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  children: ReactNode
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
}

export function Card({
  elevated = false,
  interactive = false,
  accentColor,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      className={`
        relative overflow-hidden
        rounded-[20px]
        border-4 border-[#111111]
        bg-[var(--color-surface)]
        shadow-[6px_6px_0px_#111111]
        ${interactive ? 'cursor-pointer transition-all duration-200 hover:shadow-[8px_8px_0px_#111111] hover:-translate-y-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[4px_4px_0px_#111111]' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
      {...props}
    >
      {accentColor && (
        <div
          className="absolute top-0 left-0 right-0 h-2.5 border-b-4 border-[#111111]"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {children}
    </motion.div>
  )
}

// ─── Card sub-components ──────────────────────

export function CardHeader({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between mb-5 gap-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-xl font-bold tracking-tight text-[var(--color-text-primary)] ${className}`}
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
    <div className={`mt-6 pt-5 border-t-4 border-[#111111] flex items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  )
}
