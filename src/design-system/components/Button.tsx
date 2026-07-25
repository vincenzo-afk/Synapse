/**
 * Button component — primary interactive element in the design system.
 * Always uses design tokens, never hardcoded colors.
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:bg-[var(--color-accent-hover)] shadow-sm',
  secondary: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border-subtle)]',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]',
  danger: 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white',
  success: 'bg-[var(--color-success-subtle)] text-[var(--color-success)] border border-[var(--color-success)] hover:bg-[var(--color-success)] hover:text-white',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-[var(--radius-sm)]',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[var(--radius-md)]',
  lg: 'h-12 px-6 text-base gap-2 rounded-[var(--radius-lg)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, className = '', disabled, onClick, type, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type ?? 'button'}
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={`
          inline-flex items-center justify-center font-medium
          transition-all duration-150 cursor-pointer select-none
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
      >
        {loading ? (
          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </motion.button>
    )
  }
)
Button.displayName = 'Button'


// ─── Icon Button ──────────────────────────────

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string // required for accessibility
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-7 h-7 rounded-[var(--radius-sm)]',
  sm: 'w-8 h-8 rounded-[var(--radius-sm)]',
  md: 'w-10 h-10 rounded-[var(--radius-md)]',
  lg: 'w-12 h-12 rounded-[var(--radius-lg)]',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'ghost', size = 'md', label, children, className = '', onClick, type, disabled }, ref) => {
    return (
      <motion.button
        ref={ref}
        aria-label={label}
        onClick={onClick}
        type={type ?? 'button'}
        disabled={disabled}
        whileTap={{ scale: 0.93 }}
        transition={{ duration: 0.1 }}
        className={`
          inline-flex items-center justify-center
          transition-all duration-150 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${iconSizeStyles[size]}
          ${className}
        `}
      >
        {children}
      </motion.button>
    )
  }
)
IconButton.displayName = 'IconButton'

