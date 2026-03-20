import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'
import { tapAnimation } from '@/lib/animation'
import type { BgmTrack } from '@/app/routers/_shared'

interface DeleteConfirmDialogProps {
  track: BgmTrack
  onClose: () => void
}

export function DeleteConfirmDialog({ track, onClose }: DeleteConfirmDialogProps) {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const deleteMutation = trpc.bgm.delete.useMutation({
    onSuccess: () => {
      addToast('トラックを削除しました', 'success')
      utils.bgm.getAll.invalidate()
      onClose()
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ id: track.id })
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="widget p-6 w-full max-w-md m-4"
        >
          <h3 className="text-lg font-bold text-cf-text mb-2">確認</h3>
          <p className="text-cf-subtext mb-6">
            「{track.title}」を削除しますか？
          </p>

          <div className="flex gap-2">
            <motion.button
              {...tapAnimation}
              onClick={onClose}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-cf-surface hover:bg-cf-surface1 text-cf-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              キャンセル
            </motion.button>
            <motion.button
              {...tapAnimation}
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex-1 bg-cf-danger hover:bg-cf-danger/90 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  )
}
