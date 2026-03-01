interface TimerDisplayProps {
  remainingSecs: number
  sessionType: 'work' | 'short_break' | 'long_break'
  onSessionTypeChange: (type: 'work' | 'short_break' | 'long_break') => void
  controls?: React.ReactNode
}

export function TimerDisplay({
  remainingSecs,
  sessionType,
  onSessionTypeChange,
  controls,
}: TimerDisplayProps) {
  const minutes = Math.floor(remainingSecs / 60)
  const seconds = remainingSecs % 60

  return (
    <div className="flex flex-col items-center h-full justify-center relative">
      {/* モードタブ */}
      <div className="absolute top-6 left-6 flex gap-2">
        <button
          onClick={() => onSessionTypeChange('work')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'work'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => onSessionTypeChange('short_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'short_break'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => onSessionTypeChange('long_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'long_break'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* デジタル時計タイマー */}
      <div className="flex flex-col items-center -mt-4">
        <span className="text-9xl font-light text-text-primary tracking-tighter tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
        <span className="mt-4 text-text-secondary text-sm uppercase tracking-widest">
          {sessionType === 'work' ? 'Focus' : sessionType === 'short_break' ? 'Rest' : 'Break'}
        </span>
      </div>

      {/* Controls */}
      {controls && <div className="mt-8">{controls}</div>}
    </div>
  )
}
