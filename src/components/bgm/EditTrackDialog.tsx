import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useUiStore } from '@/core/store/ui'
import { tapAnimation } from '@/lib/animation'
import type { BgmTrack, UpdateBgmTrack } from '@/app/routers/_shared'

interface EditTrackDialogProps {
  track: BgmTrack
  onClose: () => void
}

export function EditTrackDialog({ track, onClose }: EditTrackDialogProps) {
  const addToast = useUiStore(state => state.addToast)
  const utils = trpc.useUtils()

  const [title, setTitle] = useState(track.title)
  const [artist, setArtist] = useState(track.artist || '')
  const [color, setColor] = useState(track.color || '#3b82f6')
  const [tier, setTier] = useState<'free' | 'premium'>(track.tier)

  // track変更時にフォームをリセット
  useEffect(() => {
    setTitle(track.title)
    setArtist(track.artist || '')
    setColor(track.color || '#3b82f6')
    setTier(track.tier)
  }, [track])

  const updateMutation = trpc.bgm.update.useMutation({
    onSuccess: () => {
      addToast('トラックを更新しました', 'success')
      utils.bgm.getAll.invalidate()
      onClose()
    },
    onError: (error) => {
      addToast(error.message, 'error')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const data: UpdateBgmTrack = {
      id: track.id,
      title,
      artist,
      color,
      tier,
    }

    await updateMutation.mutateAsync(data)
  }

  return createPortal(
    <AnimatePresence>
      {track && (
        <div className="fixed inset-0 z-widget-modal flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="widget p-6 w-full max-w-md m-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-cf-text">トラック編集</h3>
              <motion.button
                {...tapAnimation}
                onClick={onClose}
                className="text-cf-subtext hover:text-cf-text transition-colors cursor-pointer"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cf-subtext">曲名</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                />
              </div>

              {/* Artist */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cf-subtext">アーティスト</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                />
              </div>

              {/* Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cf-subtext">色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-cf-text">{color}</span>
                </div>
              </div>

              {/* Tier */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-cf-subtext">Tier</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as 'free' | 'premium')}
                  className="rounded-lg border border-cf-border bg-cf-surface px-3 py-2 text-sm text-cf-text outline-none focus:border-cf-primary transition-colors"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-2">
                <motion.button
                  {...tapAnimation}
                  type="button"
                  onClick={onClose}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-cf-surface hover:bg-cf-surface1 text-cf-text px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  キャンセル
                </motion.button>
                <motion.button
                  {...tapAnimation}
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-cf-primary hover:bg-cf-primary/90 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updateMutation.isPending ? '更新中...' : '更新'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
