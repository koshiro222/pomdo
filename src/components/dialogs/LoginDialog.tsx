import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { GoogleIcon } from '@/components/auth/LoginButton'
import { X } from 'lucide-react'
import { tapAnimation } from '@/lib/animation'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const { login } = useAuth()
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (isOpen && buttonRef) {
      buttonRef.focus()
    }
  }, [isOpen, buttonRef])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    createPortal(
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="widget p-6 w-full max-w-md m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-cf-text">Login</h3>
                <motion.button
                  {...tapAnimation}
                  onClick={onClose}
                  className="text-cf-subtext hover:text-cf-text transition-colors cursor-pointer"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <p className="text-cf-subtext mb-6">
                Sign in to sync your todos and progress across devices.
              </p>

              <motion.button
                {...tapAnimation}
                ref={setButtonRef}
                whileHover={{ scale: 1.02 }}
                onClick={login}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-cf-primary px-4 py-3 text-sm font-medium text-white hover:bg-cf-primary/90 transition-colors cursor-pointer"
              >
                <GoogleIcon />
                Google でログイン
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )
  )
}
