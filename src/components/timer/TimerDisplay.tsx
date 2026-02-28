interface TimerDisplayProps {
  remainingSecs: number
  totalSecs: number
  sessionType: 'work' | 'short_break' | 'long_break'
  onSessionTypeChange: (type: 'work' | 'short_break' | 'long_break') => void
  controls?: React.ReactNode
}

export function TimerDisplay({
  remainingSecs,
  totalSecs,
  sessionType,
  onSessionTypeChange,
  controls,
}: TimerDisplayProps) {
  const minutes = Math.floor(remainingSecs / 60)
  const seconds = remainingSecs % 60
  const progress = remainingSecs / totalSecs
  const circumference = 2 * Math.PI * 140
  const dashOffset = circumference * (1 - progress)

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

      {/* SVGリングタイマー */}
      <div className="relative flex items-center justify-center -mt-4">
        <svg className="size-72">
          <circle
            className="text-white/10"
            cx="144"
            cy="144"
            fill="transparent"
            r="140"
            stroke="currentColor"
            strokeWidth="6"
          />
          <circle
            className="text-cf-primary timer-ring"
            cx="144"
            cy="144"
            fill="transparent"
            r="140"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="6"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-7xl font-black tracking-tight text-cf-text">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-cf-subtext mt-2 tracking-widest uppercase text-xs">
            Stay focused, you got this
          </span>
        </div>
      </div>

      {/* Controls */}
      {controls && <div className="mt-8">{controls}</div>}
    </div>
  )
}
