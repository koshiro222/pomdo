import { motion } from 'framer-motion'
import { RotateCcw, SkipForward } from 'lucide-react'
import { tapAnimation, hoverAnimation } from '@/lib/animation'

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
      <motion.button
        {...hoverAnimation}
        {...tapAnimation}
        onClick={onReset}
        className="size-14 rounded-full glass flex items-center justify-center text-cf-subtext hover:text-cf-text transition-colors hover:bg-white/10"
        aria-label="リセット"
      >
        <RotateCcw className="text-3xl" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isActive ? onPause : onStart}
        className="h-16 px-10 rounded-full bg-cf-primary text-white font-bold text-xl hover:bg-cf-primary-hover transition-colors shadow-lg shadow-cf-primary/20"
      >
        {isActive ? 'PAUSE' : 'START'}
      </motion.button>

      <motion.button
        {...hoverAnimation}
        {...tapAnimation}
        onClick={onSkip}
        className="size-14 rounded-full glass flex items-center justify-center text-cf-subtext hover:text-cf-text transition-colors hover:bg-white/10"
        aria-label="スキップ"
      >
        <SkipForward className="text-3xl" />
      </motion.button>
    </div>
  )
}
