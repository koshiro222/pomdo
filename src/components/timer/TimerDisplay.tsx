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
  const circumference = 2 * Math.PI * 150
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center h-full justify-center relative">
      {/* モードタブ */}
      <div className="absolute top-6 left-6 flex gap-2">
        <button
          onClick={() => onSessionTypeChange('work')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'work'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-white/5 text-slate-400 border-transparent hover:border-white/10'
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => onSessionTypeChange('short_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'short_break'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-white/5 text-slate-400 border-transparent hover:border-white/10'
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => onSessionTypeChange('long_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'long_break'
              ? 'bg-primary/20 text-primary border-primary/30'
              : 'bg-white/5 text-slate-400 border-transparent hover:border-white/10'
          }`}
        >
          Long Break
        </button>
      </div>

      {/* SVGリングタイマー */}
      <div className="relative flex items-center justify-center -mt-4">
        <svg className="size-80">
          <circle
            className="text-white/10"
            cx="160"
            cy="160"
            fill="transparent"
            r="150"
            stroke="currentColor"
            strokeWidth="8"
          />
          <circle
            className="text-primary timer-ring"
            cx="160"
            cy="160"
            fill="transparent"
            r="150"
            stroke="currentColor"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth="8"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-8xl font-black tracking-tighter text-slate-100">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="text-slate-400 mt-2 tracking-[0.2em] uppercase text-xs">
            Stay focused, you got this
          </span>
        </div>
      </div>

      {/* Controls */}
      {controls && <div className="mt-8">{controls}</div>}
    </div>
  )
}
