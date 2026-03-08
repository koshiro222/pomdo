import { motion } from 'framer-motion'
import type { SessionType } from '../../hooks/useTimer'

interface TimerRingProps {
  remainingSecs: number
  totalSecs: number
  sessionType: SessionType
  size?: number
  strokeWidth?: number
}

export function TimerRing({
  remainingSecs,
  totalSecs,
  sessionType,
  size = 320,
  strokeWidth = 8,
}: TimerRingProps) {
  // SVGの中心と半径
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // プログレス計算 (0〜1)
  const progress = remainingSecs / totalSecs
  const strokeDashoffset = circumference * (1 - progress)

  // セッションタイプに応じた色
  const color = sessionType === 'work' ? '#22c55e' : '#f59e0b'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* 背景円 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />

        {/* プログレス円 */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            filter: 'drop-shadow(0 0 8px ' + color + ')',
          }}
        />
      </svg>
    </div>
  )
}
