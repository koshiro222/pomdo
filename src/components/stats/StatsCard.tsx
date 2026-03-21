import { Clock, Target } from 'lucide-react'
import { useState } from 'react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface WeeklyData {
  date: string
  sessions: number
}

type TabType = 'today' | 'week' | 'month'

export default function StatsCard() {
  const { sessions } = usePomodoro()
  const [activeTab, setActiveTab] = useState<TabType>('today')

  const tabs = [
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: 'Week' },
    { id: 'month' as const, label: 'Month' },
  ]

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
  const weeklyData: WeeklyData[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()

    const daySessions = sessions
      .filter((s) => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === dateStr)
      .length

    weeklyData.push({
      date: getDayLabel(dateStr),
      sessions: daySessions,
    })
  }

  // 日付の表示形式（月曜始まり）
  function getDayLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) return 'Today'

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const dayIndex = (date.getDay() + 6) % 7
    return days[dayIndex]
  }

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col overflow-y-auto min-h-0">
      {/* ヘッダー */}
      <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold mb-4">
        Stats
      </p>

      {/* タブ切り替え */}
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-cf-primary text-white' : 'bg-white/10 text-cf-subtext hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Todayタブ */}
      {activeTab === 'today' && (
        <div className="flex-1">
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
      )}

      {/* Weekタブ */}
      {activeTab === 'week' && (
        <div className="flex-1 flex flex-col">
          <p className="text-xs text-cf-subtext mb-3">Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sessions" fill="#22c55e" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthタブ（プレースホルダー） */}
      {activeTab === 'month' && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-cf-subtext">Month statistics coming soon</p>
        </div>
      )}
    </div>
  )
}
