interface TimerDisplayProps {
  remainingSecs: number
  totalSecs: number
  sessionType: 'work' | 'short_break' | 'long_break'
  isActive: boolean
}

export function TimerDisplay({
  remainingSecs,
  totalSecs,
  sessionType,
  isActive,
}: TimerDisplayProps) {
  const minutes = Math.floor(remainingSecs / 60)
  const seconds = remainingSecs % 60
  const progress = ((totalSecs - remainingSecs) / totalSecs) * 100

  const sessionLabel = {
    work: '作業',
    short_break: '休憩',
    long_break: '長休憩',
  }[sessionType]

  const sessionColor = {
    work: 'bg-mauve',
    short_break: 'bg-green',
    long_break: 'bg-yellow',
  }[sessionType]

  const textColor = {
    work: 'text-mauve',
    short_break: 'text-green',
    long_break: 'text-yellow',
  }[sessionType]

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`px-4 py-1 rounded-full text-sm font-bold ${textColor} bg-surface0`}
      >
        {sessionLabel}
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="absolute w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            stroke="var(--surface0)"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            stroke={`var(--${sessionColor === 'bg-mauve' ? 'mauve' : sessionColor === 'bg-green' ? 'green' : 'yellow'})`}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 48}%`}
            strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}%`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <div className="text-6xl font-mono font-bold text-text">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="h-2 w-full bg-surface0 rounded-full overflow-hidden">
        <div
          className={`h-full ${sessionColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isActive && (
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 bg-overlay0 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
