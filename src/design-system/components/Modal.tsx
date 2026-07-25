/**
 * Modal / Drawer — Modern Neo-Brutalist dialogs.
 * 4px solid borders, hard 8px shadows, 22px radius, high-contrast overlay.
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
                className="fixed inset-0 z-50 bg-black/75"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={`
                  fixed left-1/2 top-1/2 z-50
                  -translate-x-1/2 -translate-y-1/2
                  w-[calc(100%-2rem)] ${sizeClasses[size]}
                  bg-[var(--color-surface)]
                  border-4 border-[#111111]
                  rounded-[22px]
                  shadow-[8px_8px_0px_#111111]
                  p-8
                  focus:outline-none
                  max-h-[90dvh] overflow-y-auto
                `}
              >
                {(title || showClose) && (
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <div>
                      {title && (
                        <Dialog.Title className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <Dialog.Description className="text-sm font-semibold text-[var(--color-text-secondary)] mt-1.5">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <Dialog.Close className="
                        w-10 h-10 rounded-[14px]
                        border-3 border-[#111111]
                        bg-[var(--color-surface)]
                        shadow-[3px_3px_0px_#111111]
                        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                        flex items-center justify-center
                        text-[var(--color-text-primary)]
                        transition-all duration-150 cursor-pointer
                      ">
                        <X size={18} strokeWidth={3} />
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

// ─── Drawer (bottom sheet) ────────────────────

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
                className="fixed inset-0 z-50 bg-black/75"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="
                  fixed bottom-0 left-0 right-0 z-50
                  bg-[var(--color-surface)]
                  border-t-4 border-[#111111]
                  rounded-t-[24px]
                  p-8
                  max-h-[85dvh] overflow-y-auto
                  focus:outline-none
                "
              >
                <div className="w-12 h-1.5 rounded-full bg-[#111111] mx-auto mb-6" />
                {title && (
                  <Dialog.Title className="text-2xl font-bold text-[var(--color-text-primary)] mb-5">
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
