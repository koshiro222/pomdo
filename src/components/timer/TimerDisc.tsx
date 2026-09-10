import { buildFocusWedgePath, calculateRemainingFraction } from '../../core/domain/focus-session'

export function TimerDisc({ remainingSecs, plannedSecs, mode }: { remainingSecs: number; plannedSecs: number; mode: 'focus' | 'shortBreak' | 'longBreak' }) {
  const fraction = calculateRemainingFraction(remainingSecs, plannedSecs)
  const minutes = Math.floor(remainingSecs / 60).toString().padStart(2, '0')
  const seconds = (remainingSecs % 60).toString().padStart(2, '0')
  const label = mode === 'focus' ? `残り ${Math.ceil(remainingSecs / 60)}分` : `休憩、残り ${Math.ceil(remainingSecs / 60)}分`
  return (
    <div className={`disc ${mode !== 'focus' ? 'disc-break' : ''}`} role="timer" aria-label={label} aria-live="polite">
      <svg viewBox="0 0 264 264" aria-hidden="true">
        <circle cx="132" cy="132" r="120" fill="var(--color-base-300)" stroke="var(--color-hairline)" strokeWidth="1.5" />
        <path d={buildFocusWedgePath(fraction)} fill="currentColor" opacity="0.92" />
      </svg>
      <div className="mmss tabular">{minutes}:{seconds}</div>
    </div>
  )
}
