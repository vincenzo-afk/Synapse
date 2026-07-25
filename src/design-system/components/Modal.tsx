/**
 * Modal / Drawer — built on Radix Dialog for correct ARIA behavior.
 */
import { type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showClose?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`
                  fixed left-1/2 top-1/2 z-50
                  -translate-x-1/2 -translate-y-1/2
                  w-[calc(100%-2rem)] ${sizeClasses[size]}
                  bg-[var(--color-surface)]
                  border border-[var(--color-border)]
                  rounded-[var(--radius-xl)]
                  shadow-[var(--shadow-xl)]
                  p-6
                  focus:outline-none
                  max-h-[90dvh] overflow-y-auto
                `}
              >
                {(title || showClose) && (
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      {title && (
                        <Dialog.Title className="text-lg font-semibold text-[var(--color-text-primary)]">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm text-[var(--color-text-secondary)] mt-1">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <Dialog.Close className="
                        w-8 h-8 rounded-[var(--radius-md)]
                        flex items-center justify-center
                        text-[var(--color-text-tertiary)]
                        hover:bg-[var(--color-surface-elevated)]
                        hover:text-[var(--color-text-primary)]
                        transition-colors duration-150
                        focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]
                      ">
                        <X size={16} />
                      </Dialog.Close>
                    )}
                  </div>
                )}
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

// ─── Drawer (bottom sheet for mobile) ────────

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: ReactNode
}

export function Drawer({ open, onOpenChange, title, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="
                  fixed bottom-0 left-0 right-0 z-50
                  bg-[var(--color-surface)]
                  border-t border-[var(--color-border)]
                  rounded-t-[var(--radius-xl)]
                  p-6
                  max-h-[85dvh] overflow-y-auto
                  focus:outline-none
                "
              >
                {/* Drag handle */}
                <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-5" />
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    {title}
                  </Dialog.Title>
                )}
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
