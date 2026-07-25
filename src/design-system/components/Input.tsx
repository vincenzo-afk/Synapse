/**
 * Form input components — Neo-Brutalist Input, Textarea, Checkbox, Toggle (Switch)
 * 4px solid borders, 16px radius, hard shadows, physical feel.
 */
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
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
      <div className="flex flex-col gap-2">
        {label && (
          <Label.Root
            htmlFor={inputId}
            className="text-sm font-bold tracking-wide uppercase text-[var(--color-text-primary)]"
          >
            {label}
          </Label.Root>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-primary)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-12 rounded-[16px] px-4 font-semibold text-base
              ${leftIcon ? 'pl-11' : ''}
              ${rightIcon ? 'pr-11' : ''}
              bg-[var(--color-surface)]
              border-4 border-[#111111]
              text-[var(--color-text-primary)]
              placeholder:text-[var(--color-text-tertiary)] placeholder:font-medium
              transition-all duration-150
              focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]
              disabled:opacity-40 disabled:cursor-not-allowed
              ${error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-primary)]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span className="text-xs font-bold text-[var(--color-danger)]">{error}</span>
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
      <div className="flex flex-col gap-2">
        {label && (
          <Label.Root htmlFor={inputId} className="text-sm font-bold tracking-wide uppercase text-[var(--color-text-primary)]">
            {label}
          </Label.Root>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full rounded-[16px] px-4 py-3 font-semibold text-base
            bg-[var(--color-surface)]
            border-4 border-[#111111]
            text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-tertiary)] placeholder:font-medium
            transition-all duration-150 resize-none
            focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]
            ${error ? 'border-[var(--color-danger)]' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-xs font-bold text-[var(--color-danger)]">{error}</span>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

// ─── Neo-Brutalist Checkbox ────────────────────

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
    <div className="flex items-center gap-3">
      <CheckboxPrimitive.Root
        id={checkId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={`
          w-7 h-7 rounded-[8px]
          border-4 border-[#111111]
          bg-[var(--color-surface)]
          data-[state=checked]:bg-[var(--color-accent)]
          shadow-[3px_3px_0px_#111111]
          active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
          transition-all duration-150 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed
          flex items-center justify-center shrink-0
        `}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={16} className="text-white stroke-[3.5]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <Label.Root
          htmlFor={checkId}
          className="text-base font-bold text-[var(--color-text-primary)] cursor-pointer select-none"
        >
          {label}
        </Label.Root>
      )}
    </div>
  )
}

// ─── Custom Neo-Brutalist Toggle (Switch) ───────

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
          w-16 h-9 rounded-full
          border-4 border-[#111111]
          bg-[var(--color-surface)]
          data-[state=checked]:bg-[var(--color-accent)]
          shadow-[4px_4px_0px_#111111]
          transition-all duration-200 cursor-pointer
          disabled:opacity-40 disabled:cursor-not-allowed
          relative inline-flex items-center p-0.5
        `}
      >
        <SwitchPrimitive.Thumb
          className={`
            block w-6 h-6 rounded-full bg-white border-2 border-[#111111] shadow-sm
            transition-transform duration-200
            data-[state=unchecked]:translate-x-0.5
            data-[state=checked]:translate-x-7
          `}
        />
      </SwitchPrimitive.Root>
      {label && (
        <Label.Root htmlFor={toggleId} className="text-base font-bold text-[var(--color-text-primary)] cursor-pointer select-none">
          {label}
        </Label.Root>
      )}
    </div>
  )
}
