import { useState } from 'react'
import { useBgm } from '../../hooks/useBgm'

export function BgmPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    hasError,
    toggle,
    next,
    prev,
    setVolume,
  } = useBgm()

  const [isExpanded, setIsExpanded] = useState(false)

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  return (
    <div className="flex flex-col overflow-hidden transition-all duration-300">
      {/* コンパクトバー（常時表示） */}
      <div className="flex items-center px-4 gap-4 h-12">
        {/* 展開/縮小ボタン */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="material-symbols-outlined text-cf-subtext hover:text-cf-primary cursor-pointer transition-transform"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          title={isExpanded ? '縮小' : '展開'}
          aria-label={isExpanded ? '縮小' : '展開'}
        >
          expand_more
        </button>

        {/* 再生/停止ボタン */}
        <button
          onClick={toggle}
          disabled={hasError}
          className="material-symbols-outlined text-2xl text-cf-text cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
          title={isPlaying ? '一時停止' : '再生'}
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? 'pause_circle' : 'play_circle'}
        </button>

        {/* 曲名 */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-cf-text text-sm truncate">{hasError ? '音源なし' : currentTrack.title}</p>
        </div>

        {/* 音量スライダー */}
        <div className="w-20 sm:w-32 flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className="material-symbols-outlined text-cf-subtext text-sm">volume_down</span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative cursor-pointer">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute left-0 top-0 bottom-0 bg-cf-primary rounded-full pointer-events-none"
              style={{ width: `${volume * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-2 bg-cf-text rounded-full shadow-lg transition-all pointer-events-none"
              style={{ left: `calc(${volume * 100}% - 4px)` }}
            />
          </div>
          <span className="material-symbols-outlined text-cf-subtext text-sm">volume_up</span>
        </div>
      </div>

      {/* 拡張モード（展開時のみ表示） */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 flex items-center justify-center bgm-expanded-enter transition-all duration-300">
          {/* アルバムアート */}
          <div className={`size-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-cf-primary/20 flex items-center justify-center ${isPlaying && !hasError ? 'album-art-spinning' : 'album-art-paused'}`}>
            <span className="material-symbols-outlined text-cf-primary text-xl">music_note</span>
          </div>

          {/* 詳細コントロール */}
          <div className="flex-1 px-4">
            <p className="text-xs text-cf-subtext">Lo-Fi Beats • Chill Beats</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={prev}
                className="material-symbols-outlined text-lg text-cf-subtext cursor-pointer hover:text-cf-primary"
                title="前の曲"
                aria-label="前の曲"
              >
                skip_previous
              </button>
              <button
                onClick={next}
                className="material-symbols-outlined text-lg text-cf-subtext cursor-pointer hover:text-cf-primary"
                title="次の曲"
                aria-label="次の曲"
              >
                skip_next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
