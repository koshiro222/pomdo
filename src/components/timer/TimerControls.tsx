interface TimerControlsProps {
  isActive: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
}

export function TimerControls({
  isActive,
  onStart,
  onPause,
  onReset,
  onSkip,
}: TimerControlsProps) {
  return (
    <div className="flex items-center gap-6 mt-12">
      <button
        onClick={onReset}
        className="size-14 rounded-full glass flex items-center justify-center text-cf-subtext hover:text-cf-text transition-all hover:bg-white/10"
        aria-label="リセット"
      >
        <span className="material-symbols-outlined text-3xl">refresh</span>
      </button>

      <button
        onClick={isActive ? onPause : onStart}
        className="h-16 px-10 rounded-full bg-cf-primary text-white font-bold text-xl hover:bg-cf-primary-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-cf-primary/20"
      >
        {isActive ? 'PAUSE' : 'START'}
      </button>

      <button
        onClick={onSkip}
        className="size-14 rounded-full glass flex items-center justify-center text-cf-subtext hover:text-cf-text transition-all hover:bg-white/10"
        aria-label="スキップ"
      >
        <span className="material-symbols-outlined text-3xl">skip_next</span>
      </button>
    </div>
  )
}
