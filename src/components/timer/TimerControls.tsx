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
    <div className="flex items-center gap-4">
      <button
        onClick={isActive ? onPause : onStart}
        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-mauve text-base font-bold text-base rounded-lg hover:bg-mauve-hover active:scale-95 transition-all"
      >
        {isActive ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            一時停止
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            開始
          </>
        )}
      </button>

      <button
        onClick={onReset}
        className="p-3 bg-surface0 text-text rounded-lg hover:bg-surface1 active:scale-95 transition-all"
        aria-label="リセット"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
          <path d="M3 3v9h9" />
        </svg>
      </button>

      <button
        onClick={onSkip}
        className="p-3 bg-surface0 text-text rounded-lg hover:bg-surface1 active:scale-95 transition-all"
        aria-label="スキップ"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <polygon points="5 4 15 12 5 20 5 4" />
          <polygon points="15 4 25 12 15 20 15 4" />
          <rect x="19" y="4" width="2" height="16" transform="translate(21 -19) rotate(90 21 21)" />
        </svg>
      </button>
    </div>
  )
}
