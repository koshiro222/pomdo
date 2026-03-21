import { motion } from 'framer-motion'
import { TimerRing } from './TimerRing'
import type { SessionType } from '../../hooks/useTimer'
import { tapAnimation, hoverAnimation } from '@/lib/animation'

interface TimerDisplayProps {
  remainingSecs: number
  totalSecs: number
  sessionType: SessionType
  onSessionTypeChange: (type: SessionType) => void
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

  return (
    <div className="flex flex-col items-center h-full justify-center relative">
      {/* モードタブ */}
      <div className="absolute top-4 left-4 flex gap-2">
        <motion.button
          {...hoverAnimation}
          {...tapAnimation}
          onClick={() => onSessionTypeChange('work')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'work'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Focus
        </motion.button>
        <motion.button
          {...hoverAnimation}
          {...tapAnimation}
          onClick={() => onSessionTypeChange('short_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'short_break'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Short Break
        </motion.button>
        <motion.button
          {...hoverAnimation}
          {...tapAnimation}
          onClick={() => onSessionTypeChange('long_break')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
            sessionType === 'long_break'
              ? 'bg-cf-primary/20 text-cf-primary border-cf-primary/30'
              : 'bg-white/5 text-cf-subtext border-transparent hover:border-white/10'
          }`}
        >
          Long Break
        </motion.button>
      </div>

      {/* 円形プログレスバータイマー */}
      <div className="relative flex flex-col items-center pointer-events-none">
        <TimerRing
          remainingSecs={remainingSecs}
          totalSecs={totalSecs}
          sessionType={sessionType}
          size={280}
          strokeWidth={8}
        />
        {/* 時刻表示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-5xl sm:text-6xl lg:text-7xl font-light text-text-primary tracking-tighter tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className="mt-2 text-text-secondary text-sm uppercase tracking-widest">
            {sessionType === 'work' ? 'Focus' : sessionType === 'short_break' ? 'Rest' : 'Break'}
          </span>
        </div>
      </div>

      {/* Controls */}
      {controls && <div className="mt-6">{controls}</div>}
    </div>
  )
}
