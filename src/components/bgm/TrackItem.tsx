import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Trash2 } from 'lucide-react'
import { slideInVariants, tapAnimation } from '@/lib/animation'
import { EditTrackDialog } from './EditTrackDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

export interface Track {
  id: string
  title: string
  artist: string | null
  color: string | null
  tier: 'free' | 'premium'
  filename: string
  createdAt: Date
  updatedAt: Date
  src?: string
}

export interface TrackItemProps {
  track: Track
}

export function TrackItem({ track }: TrackItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  return (
    <>
      <motion.div
        variants={slideInVariants}
        initial="visible"
        animate="visible"
        data-testid="track-item"
        className="group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-colors"
      >
        {/* 色プレビュー */}
        <div
          data-testid="color-preview"
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: track.color || '#3b82f6' }}
        />

        {/* トラック情報 */}
        <div className="flex-1">
          <p className="text-sm font-medium text-cf-text">{track.title}</p>
          <p className="text-xs text-cf-subtext">{track.artist || 'Unknown'}</p>
        </div>

        {/* Tierバッジ */}
        <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded">
          {track.tier}
        </span>

        {/* アクションボタン */}
        <div
          data-testid="action-buttons"
          className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <motion.button
            {...tapAnimation}
            onClick={() => setShowEditDialog(true)}
            className="text-cf-subtext hover:text-cf-text"
            aria-label="編集"
          >
            <Edit2 size={16} />
          </motion.button>
          <motion.button
            {...tapAnimation}
            onClick={() => setShowDeleteConfirm(true)}
            className="text-cf-subtext hover:text-cf-danger"
            aria-label="削除"
          >
            <Trash2 size={16} />
          </motion.button>
        </div>
      </motion.div>

      {/* ダイアログ */}
      <AnimatePresence>
        {showEditDialog && (
          <EditTrackDialog
            track={track}
            onClose={() => setShowEditDialog(false)}
          />
        )}
        {showDeleteConfirm && (
          <DeleteConfirmDialog
            track={track}
            onClose={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
