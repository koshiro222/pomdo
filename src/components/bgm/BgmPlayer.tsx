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

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  return (
    <div className="flex items-center px-8 gap-6 h-32">
      {/* アルバムアート */}
      <div className="size-16 rounded-lg overflow-hidden flex-shrink-0 relative group bg-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-3xl">music_note</span>
        <div className="absolute inset-0 bg-background-dark/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-white">music_note</span>
        </div>
      </div>

      {/* 曲情報とコントロール */}
      <div className="flex-1">
        <h4 className="font-bold text-slate-100">{hasError ? '音源なし' : currentTrack.title}</h4>
        <p className="text-xs text-slate-400">Lo-Fi Beats • Chill Beats</p>
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={prev}
            className="material-symbols-outlined text-lg text-slate-400 cursor-pointer hover:text-primary"
            title="前の曲"
            aria-label="前の曲"
          >
            skip_previous
          </button>
          <button
            onClick={toggle}
            disabled={hasError}
            className="material-symbols-outlined text-2xl text-slate-100 cursor-pointer hover:scale-110 transition-transform"
            title={isPlaying ? '一時停止' : '再生'}
            aria-label={isPlaying ? '一時停止' : '再生'}
          >
            {isPlaying ? 'pause_circle' : 'play_circle'}
          </button>
          <button
            onClick={next}
            className="material-symbols-outlined text-lg text-slate-400 cursor-pointer hover:text-primary"
            title="次の曲"
            aria-label="次の曲"
          >
            skip_next
          </button>
        </div>
      </div>

      {/* 音量スライダー */}
      <div className="w-48 flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400 text-sm">volume_down</span>
        <div className="flex-1 h-1.5 bg-white/10 rounded-full relative cursor-pointer">
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
            className="absolute left-0 top-0 bottom-0 bg-primary rounded-full pointer-events-none"
            style={{ width: `${volume * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg transition-all pointer-events-none"
            style={{ left: `calc(${volume * 100}% - 6px)` }}
          />
        </div>
        <span className="material-symbols-outlined text-slate-400 text-sm">volume_up</span>
      </div>
    </div>
  )
}
