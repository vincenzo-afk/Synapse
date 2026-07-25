/**
 * Form input components — Input, Textarea, Select, Checkbox, Toggle, Slider
 * All use design tokens and Radix primitives for accessibility.
 */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as Label from '@radix-ui/react-label'
import { Check } from 'lucide-react'

// ─── Input ────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <Label.Root
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </Label.Root>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-10 rounded-[var(--radius-md)] px-3
              ${leftIcon ? 'pl-9' : ''}
              ${rightIcon ? 'pr-9' : ''}
              bg-[var(--color-surface-elevated)]
              border border-[var(--color-border)]
              text-[var(--color-text-primary)] text-sm
              placeholder:text-[var(--color-text-tertiary)]
              transition-colors duration-150
              focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs text-[var(--color-danger)]">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ─── Textarea ─────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, rows = 4, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <Label.Root htmlFor={inputId} className="text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </Label.Root>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full rounded-[var(--radius-md)] px-3 py-2.5
            bg-[var(--color-surface-elevated)]
            border border-[var(--color-border)]
            text-[var(--color-text-primary)] text-sm
            placeholder:text-[var(--color-text-tertiary)]
            transition-colors duration-150 resize-none
            focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]
            ${error ? 'border-[var(--color-danger)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Checkbox ─────────────────────────────────

interface CheckboxProps {
  id?: string
  label?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Checkbox({ id, label, checked, onCheckedChange, disabled }: CheckboxProps) {
  const checkId = id ?? `checkbox-${label?.replace(/\s+/g, '-')}`
  return (
    <div className="flex items-center gap-2">
      <CheckboxPrimitive.Root
        id={checkId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={`
          w-5 h-5 rounded-[var(--radius-sm)]
          border-2 border-[var(--color-border)]
          bg-[var(--color-surface-elevated)]
          data-[state=checked]:bg-[var(--color-accent)]
          data-[state=checked]:border-[var(--color-accent)]
          transition-all duration-150 cursor-pointer
          focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center
        `}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={12} className="text-white stroke-[3]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <Label.Root
          htmlFor={checkId}
          className="text-sm text-[var(--color-text-primary)] cursor-pointer select-none"
        >
          {label}
        </Label.Root>
      )}
    </div>
  )
}

// ─── Toggle (Switch) ──────────────────────────

interface ToggleProps {
  id?: string
  label?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ id, label, checked, onCheckedChange, disabled }: ToggleProps) {
  const toggleId = id ?? `toggle-${label?.replace(/\s+/g, '-')}`
  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitive.Root
        id={toggleId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={`
          w-11 h-6 rounded-full
          bg-[var(--color-border)]
          data-[state=checked]:bg-[var(--color-accent)]
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] focus-visible:outline-offset-2
          relative inline-flex items-center
        `}
      >
        <SwitchPrimitive.Thumb
          className={`
            block w-5 h-5 rounded-full bg-white shadow-sm
            transition-transform duration-200
            data-[state=unchecked]:translate-x-0.5
            data-[state=checked]:translate-x-5
          `}
        />
      </SwitchPrimitive.Root>
      {label && (
        <Label.Root htmlFor={toggleId} className="text-sm text-[var(--color-text-primary)] cursor-pointer">
          {label}
        </Label.Root>
      )}
    </div>
  )
}
