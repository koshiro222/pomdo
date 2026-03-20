import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { tapAnimation } from '@/lib/animation'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
}

type Mode = 'list' | 'add' | 'edit'

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [mode, setMode] = useState<Mode>('list')

  // ダイアログが閉じたらmodeをリセット
  useEffect(() => {
    if (!isOpen) {
      setMode('list')
    }
  }, [isOpen])

  // Escapeキーで閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return createPortal(
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
            className="widget p-6 w-full max-w-2xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-cf-text">BGM管理</h3>
              <motion.button
                {...tapAnimation}
                onClick={onClose}
                className="text-cf-subtext hover:text-cf-text transition-colors cursor-pointer"
                aria-label="閉じる"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Content - modeによる切り替え */}
            {mode === 'list' && (
              <div className="text-cf-subtext text-center py-8">
                トラック一覧（次のタスクで実装）
              </div>
            )}
            {mode === 'add' && (
              <div className="text-cf-subtext text-center py-8">
                追加フォーム（次のタスクで実装）
              </div>
            )}
            {mode === 'edit' && (
              <div className="text-cf-subtext text-center py-8">
                編集フォーム（次のタスクで実装）
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
