import { useBgm } from '../../hooks/useBgm'

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) return <span>🔇</span>
  if (volume < 0.4) return <span>🔈</span>
  if (volume < 0.7) return <span>🔉</span>
  return <span>🔊</span>
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
    next,
    prev,
    setVolume,
  } = useBgm()

  return (
    <div className="widget p-4 w-96">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-ctp-mauve text-xs font-semibold tracking-widest uppercase">BGM</span>
        <span className="flex-1 h-px bg-ctp-surface1" />
        {hasError && (
          <span className="text-ctp-red text-xs">音源なし</span>
        )}
      </div>

      {/* Current track name */}
      <div className="text-ctp-text text-sm font-mono truncate mb-3 min-h-[1.25rem]">
        {hasError ? (
          <span className="text-ctp-subtext0 text-xs">
            /public/audio/ に MP3 を配置してください
          </span>
        ) : (
          <>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 transition-all ${
              isPlaying ? 'bg-ctp-green animate-pulse' : 'bg-ctp-surface2'
            }`} />
            {currentTrack.title}
          </>
        )}
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={prev}
          className="text-ctp-subtext1 hover:text-ctp-text transition-colors p-1 cursor-pointer"
          title="前の曲"
        >
          ⏮
        </button>

        <button
          onClick={toggle}
          disabled={hasError}
          className={`
            flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm
            transition-all cursor-pointer
            ${hasError
              ? 'bg-ctp-surface1 text-ctp-subtext0 cursor-not-allowed'
              : isPlaying
                ? 'bg-ctp-mauve text-ctp-base hover:bg-ctp-lavender'
                : 'bg-ctp-surface1 text-ctp-text hover:bg-ctp-surface2'
            }
          `}
          title={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={next}
          className="text-ctp-subtext1 hover:text-ctp-text transition-colors p-1 cursor-pointer"
          title="次の曲"
        >
          ⏭
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5 ml-auto">
          <VolumeIcon volume={volume} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-20 h-1 appearance-none bg-ctp-surface1 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-ctp-mauve
              [&::-webkit-slider-thumb]:cursor-pointer"
            title={`音量: ${Math.round(volume * 100)}%`}
          />
        </div>
      </div>

      {/* Track list */}
      <div className="flex flex-col gap-1">
        {tracks.map((track, i) => (
          <button
            key={track.id}
            onClick={() => selectTrack(i)}
            className={`
              text-left text-xs px-2 py-1 rounded transition-colors cursor-pointer w-full
              ${i === currentIndex
                ? 'bg-ctp-surface1 text-ctp-mauve'
                : 'text-ctp-subtext1 hover:bg-ctp-surface0 hover:text-ctp-text'
              }
            `}
          >
            <span className="mr-1.5 text-ctp-overlay0">{String(i + 1).padStart(2, '0')}</span>
            {track.title}
          </button>
        ))}
      </div>
    </div>
  )
}
