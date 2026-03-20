import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { tapAnimation, hoverAnimation } from '@/lib/animation'
import { TrackItem } from './TrackItem'
import type { BgmTrack } from '@/app/routers/_shared'

export interface TrackListProps {
  onAdd: () => void
}

export function TrackList({ onAdd }: TrackListProps) {
  const { data: tracks, isLoading, error } = trpc.bgm.getAll.useQuery()

  if (isLoading) {
    return <div className="text-cf-subtext">Loading...</div>
  }

  if (error) {
    return <div className="text-cf-danger">エラーが発生しました</div>
  }

  return (
    <div>
      {/* ヘッダー：タイトルと追加ボタン */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-cf-text">トラック一覧</h4>
        <motion.button
          {...tapAnimation}
          {...hoverAnimation}
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-cf-primary text-white rounded-lg text-sm"
        >
          <Plus size={16} />
          追加
        </motion.button>
      </div>

      {/* トラックリスト */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {!tracks || tracks.length === 0 ? (
          <div className="text-cf-subtext text-center py-8">
            トラックがありません
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tracks.map((track: BgmTrack) => (
              <TrackItem key={track.id} track={track} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
