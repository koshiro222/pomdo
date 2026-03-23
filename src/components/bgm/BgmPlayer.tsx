import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBgm, type Track } from '../../hooks/useBgm'
import { Play, Pause, SkipBack, SkipForward, List, Volume2, Music } from 'lucide-react'
import { tapAnimation, hoverAnimation } from '@/lib/animation'

interface AlbumArtProps {
  isPlaying: boolean
  color: string
}

function AlbumArt({ isPlaying, color }: AlbumArtProps) {
  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
      {/* アルバムアート背景 */}
      <div
        className={`w-full h-full rounded-2xl flex items-center justify-center ${isPlaying ? 'album-art-spinning' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${color}40, ${color}20)`,
          boxShadow: `0 8px 24px ${color}40`,
        }}
      >
        {/* アイコンまたは回転するディスク */}
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center ${isPlaying ? 'album-art-spinning' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${color}60, ${color}30)`,
            animationDuration: '12s',
          }}
        >
          <Music className={`w-8 h-8 sm:w-10 sm:h-10 text-white ${isPlaying ? '' : 'album-art-paused'}`} />
        </div>
      </div>

      {/* 再生インジケーター（中心の点） */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white transition-all ${isPlaying ? 'scale-100' : 'scale-50'}`}
        style={{
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  )
}

export function BgmPlayer() {
  const {
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    volume,
    hasError,
    toggle,
    selectTrack,
    setVolume,
  } = useBgm()

  const [isExpanded, setIsExpanded] = useState(false)

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const handlePrevTrack = () => {
    const newIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    selectTrack(newIndex)
  }

  const handleNextTrack = () => {
    const newIndex = (currentIndex + 1) % tracks.length
    selectTrack(newIndex)
  }

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* コンパクト表示（常時表示） */}
      <div className="flex-1 flex flex-col p-4 sm:p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <motion.button
            {...tapAnimation}
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 text-cf-subtext hover:text-cf-primary hover:bg-white/10 transition-colors"
            title={isExpanded ? '縮小' : 'プレイリスト'}
            aria-label={isExpanded ? '縮小' : 'プレイリスト'}
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
              <List className="w-5 h-5" />
            </motion.div>
          </motion.button>
          <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold">
            BGM
          </p>
          <div className="w-5" /> {/* スペーサー */}
        </div>

        {/* アルバムアートと情報 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <AlbumArt
            isPlaying={isPlaying}
            color={currentTrack.color || '#3b82f6'}
          />

          {/* 曲名とアーティスト */}
          <div className="mt-4 text-center">
            <h3 className={`text-lg sm:text-xl font-bold text-cf-text ${hasError ? 'text-cf-subtext' : ''}`}>
              {hasError ? '音源なし' : currentTrack.title}
            </h3>
            {currentTrack.artist && !hasError && (
              <p className="text-sm text-cf-subtext mt-1">{currentTrack.artist}</p>
            )}
          </div>

          {/* 再生コントロール */}
          <div className="flex items-center gap-4 mt-4">
            <motion.button
              {...hoverAnimation}
              {...tapAnimation}
              onClick={handlePrevTrack}
              disabled={hasError}
              className="p-3 text-cf-text hover:text-cf-primary hover:bg-white/10 transition-colors disabled:text-cf-subtext disabled:cursor-not-allowed"
              title="前の曲"
            >
              <SkipBack className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggle}
              disabled={hasError}
              className="w-14 h-14 rounded-full bg-cf-primary hover:bg-cf-primary/80 text-white flex items-center justify-center transition-colors disabled:bg-cf-subtext/30 disabled:text-cf-subtext disabled:cursor-not-allowed shadow-lg shadow-cf-primary/30"
              title={isPlaying ? '一時停止' : '再生'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </motion.button>

            <motion.button
              {...hoverAnimation}
              {...tapAnimation}
              onClick={handleNextTrack}
              disabled={hasError}
              className="p-3 text-cf-text hover:text-cf-primary hover:bg-white/10 transition-colors disabled:text-cf-subtext disabled:cursor-not-allowed"
              title="次の曲"
            >
              <SkipForward className="w-6 h-6" />
            </motion.button>
          </div>

          {/* 音量コントロール */}
          <div className="flex items-center gap-2 mt-4 w-full max-w-[200px]">
            <Volume2 className="w-5 h-5 text-cf-subtext" />
            <div className="flex-1 h-2 bg-white/10 rounded-full relative">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* プログレスバー */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-cf-primary rounded-full pointer-events-none"
                style={{ width: `${volume * 100}%` }}
              />
              {/* つまみ */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cf-primary rounded-full border-2 border-cf-background shadow-lg pointer-events-none"
                style={{ left: `calc(${volume * 100}% - 8px)` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* トラックリスト（展開時のみ表示） */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 bg-cf-background/95 backdrop-blur-sm border-t border-white/10 max-h-[200px] overflow-y-auto rounded-b-3xl z-10"
          >
            <ul className="divide-y divide-white/10">
              {tracks.map((track: Track, index: number) => (
                <li key={track.id}>
                  <motion.button
                    {...tapAnimation}
                    onClick={() => {
                      selectTrack(index)
                      if (index === currentIndex) {
                        setIsExpanded(false)
                      }
                    }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      currentIndex === index
                        ? 'bg-cf-primary/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* アルバムアートサムネイル */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${track.color || '#3b82f6'}40, ${track.color || '#3b82f6'}20)`,
                      }}
                    >
                      {currentIndex === index && isPlaying ? (
                        <div className="w-2 h-2 rounded-full bg-cf-primary animate-pulse" />
                      ) : (
                        <Music className="w-4 h-4 text-cf-subtext" />
                      )}
                    </div>

                    {/* 曲情報 */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          currentIndex === index ? 'text-cf-primary' : 'text-cf-text'
                        }`}
                      >
                        {track.title}
                      </p>
                      {track.artist && (
                        <p className="text-xs text-cf-subtext truncate">{track.artist}</p>
                      )}
                    </div>

                    {/* 再生中インジケーター */}
                    {currentIndex === index && isPlaying && (
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-1 bg-cf-primary animate-[bounce_1s_infinite]" style={{ animationDelay: '0ms' }} />
                        <div className="w-1 bg-cf-primary animate-[bounce_1s_infinite]" style={{ animationDelay: '200ms' }} />
                        <div className="w-1 bg-cf-primary animate-[bounce_1s_infinite]" style={{ animationDelay: '400ms' }} />
                      </div>
                    )}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
