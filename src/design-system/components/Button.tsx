/**
 * Button component — Neo-Brutalist interactive element.
 * 4px solid borders, 18px radius, physical press mechanics (6px -> 0px shadow).
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
  primary: 'bg-[var(--color-accent)] text-white border-4 border-[#111111] shadow-[6px_6px_0px_#111111] hover:shadow-[8px_8px_0px_#111111] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  secondary: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border-4 border-[#111111] shadow-[6px_6px_0px_#111111] hover:shadow-[8px_8px_0px_#111111] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  ghost: 'bg-transparent text-[var(--color-text-primary)] border-4 border-transparent hover:border-[#111111] hover:bg-[var(--color-surface-elevated)] hover:shadow-[6px_6px_0px_#111111]',
  danger: 'bg-[var(--color-danger)] text-white border-4 border-[#111111] shadow-[6px_6px_0px_#111111] hover:shadow-[8px_8px_0px_#111111] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
  success: 'bg-[var(--color-success)] text-white border-4 border-[#111111] shadow-[6px_6px_0px_#111111] hover:shadow-[8px_8px_0px_#111111] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
}

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs gap-1.5 rounded-[14px]',
  sm: 'h-10 px-4 text-sm gap-2 rounded-[16px]',
  md: 'h-12 px-6 text-base gap-2.5 rounded-[18px]',
  lg: 'h-14 px-8 text-lg gap-3 rounded-[20px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, children, className = '', disabled, onClick, type, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        onClick={onClick}
        className={`
          inline-flex items-center justify-center font-bold tracking-tight
          transition-all duration-150 cursor-pointer select-none
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0
          focus-visible:outline-4 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-4
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="animate-spin w-5 h-5 border-3 border-current border-t-transparent rounded-full" />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)
Button.displayName = 'Button'


// ─── Icon Button ──────────────────────────────

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  label: string
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'w-8 h-8 rounded-[14px]',
  sm: 'w-10 h-10 rounded-[16px]',
  md: 'w-12 h-12 rounded-[18px]',
  lg: 'w-14 h-14 rounded-[20px]',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = 'secondary', size = 'md', label, children, className = '', onClick, type, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        onClick={onClick}
        type={type ?? 'button'}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center font-bold
          transition-all duration-150 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
          focus-visible:outline-4 focus-visible:outline-[var(--color-accent)]
          ${variantStyles[variant]}
          ${iconSizeStyles[size]}
          ${className}
        `}
        {...rest}
      >
        {children}
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'

