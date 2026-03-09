import { Clock, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePomodoro } from '../../hooks/usePomodoro'

interface DailyStats {
  date: string
  focusMinutes: number
  pomodoros: number
}

export default function StatsCard() {
  const { sessions } = usePomodoro()

  // 本日のデータを抽出
  const today = new Date().toDateString()
  const todayStats = sessions
    .filter((s) => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === today)
    .reduce(
      (acc, s) => ({
        focusMinutes: acc.focusMinutes + Math.floor(s.durationSecs / 60),
        pomodoros: acc.pomodoros + 1,
      }),
      { focusMinutes: 0, pomodoros: 0 }
    )

  // 直近7日間のデータを計算
  const weeklyData: DailyStats[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()

    const dayStats = sessions
      .filter((s) => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === dateStr)
      .reduce(
        (acc, s) => ({
          focusMinutes: acc.focusMinutes + Math.floor(s.durationSecs / 60),
          pomodoros: acc.pomodoros + 1,
        }),
        { focusMinutes: 0, pomodoros: 0 }
      )

    weeklyData.push({
      date: dateStr,
      ...dayStats,
    })
  }

  // チャートの最大値を計算
  const maxFocusMinutes = Math.max(...weeklyData.map((d) => d.focusMinutes), 1)

  // 日付の表示形式（月曜始まり）
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) return 'Today'

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayIndex = (date.getDay() + 6) % 7 // 日曜日を6として月曜始まりに調整
    return days[dayIndex]
  }

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col">
      {/* ヘッダー */}
      <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold mb-4">
        Stats
      </p>

      {/* 本日の統計 */}
      <div className="mb-6">
        {/* 集中時間 */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-cf-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-cf-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-cf-text">
              {todayStats.focusMinutes > 0 ? `${Math.floor(todayStats.focusMinutes / 60)}h ${todayStats.focusMinutes % 60}m` : '0m'}
            </p>
            <p className="text-xs text-cf-subtext">Focus Time Today</p>
          </div>
        </div>

        {/* 完了ポモドーロ数 */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cf-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-cf-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-cf-text">
              {todayStats.pomodoros}
            </p>
            <p className="text-xs text-cf-subtext">Pomodoros Completed</p>
          </div>
        </div>
      </div>

      {/* 週次チャート */}
      <div className="flex-1 flex flex-col">
        <p className="text-xs text-cf-subtext mb-3">Last 7 Days</p>
        <div className="flex-1 flex items-end gap-1">
          {weeklyData.map((data, index) => {
            const heightPercent = (data.focusMinutes / maxFocusMinutes) * 100
            const isToday = data.date === today

            return (
              <motion.div
                key={data.date}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <div className="w-full flex items-end justify-center h-full">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                    className={`w-full max-w-[20px] rounded-t-sm ${
                      isToday ? 'bg-cf-primary' : 'bg-white/20'
                    }`}
                  />
                </div>
                <p className={`text-[10px] ${isToday ? 'text-cf-primary font-bold' : 'text-cf-subtext'}`}>
                  {getDayLabel(data.date)}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
