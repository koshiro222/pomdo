import { messages } from '../../messages'

export function TimerControls({ isActive, mode, preset, onPresetChange, onStart, onStop, onSkip }: {
  isActive: boolean
  mode: 'focus' | 'shortBreak' | 'longBreak'
  preset: number
  onPresetChange: (seconds: number) => void
  onStart: () => void
  onStop: () => void
  onSkip: () => void
}) {
  return isActive
    ? <button className="btn btn-outline" type="button" onClick={mode === 'focus' ? onStop : onSkip}>{mode === 'focus' ? messages.app.stop : messages.app.skip}</button>
    : <div className="timer-actions">
        <div className="presets" role="group" aria-label="集中時間">
          {[15, 25, 45].map((minutes) => <button className="btn btn-ghost btn-sm" key={minutes} type="button" aria-pressed={preset === minutes * 60} onClick={() => onPresetChange(minutes * 60)}>{minutes}</button>)}
        </div>
        <button className="btn btn-primary btn-lg min-h-12 px-[30px] py-3" type="button" onClick={onStart}>{messages.app.start}</button>
      </div>
}
