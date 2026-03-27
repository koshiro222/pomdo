import { BarChart3, Clock, Target } from 'lucide-react'
import { useState } from 'react'
import { usePomodoro } from '../../hooks/usePomodoro'
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface WeeklyData {
  date: string
  sessions: number
  cumulativeMinutes: number
}

type TabType = 'today' | 'week' | 'month'

type Session = {
  id: string
  userId?: string
  todoId: string | null
  type: 'work' | 'short_break' | 'long_break'
  startedAt: string
  completedAt: string | null
  durationSecs: number
  createdAt: string
}

// 月次統計集計ロジック
const getMonthlyStats = (sessions: Session[]): { totalMinutes: number; totalSessions: number } => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

  return sessions
    .filter((s) => {
      const sessionDate = new Date(s.startedAt)
      return s.type === 'work' && s.completedAt !== null && sessionDate >= firstDay && sessionDate <= now
    })
    .reduce(
      (acc, s) => ({
        totalMinutes: acc.totalMinutes + Math.floor(s.durationSecs / 60),
        totalSessions: acc.totalSessions + 1,
      }),
      { totalMinutes: 0, totalSessions: 0 }
    )
}

export default function StatsCard() {
  const { sessions, loading } = usePomodoro()
  const [activeTab, setActiveTab] = useState<TabType>('today')

  const tabs = [
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: 'Week' },
    { id: 'month' as const, label: 'Month' },
  ]

  // 完了済みセッションをフィルタリング
  const completedSessions = sessions.filter((s) => s.completedAt !== null)

  // 空状態: 完了済みセッションがない場合
  if (completedSessions.length === 0 && !loading) {
    return (
      <div className="bento-card p-4 sm:p-6 h-full flex flex-col">
        <p className="text-xs uppercase tracking-widest font-bold text-cf-text mb-4">
          Stats
        </p>

        <div className="flex-1 flex flex-col items-center justify-center text-cf-subtext">
          <BarChart3 className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-center">
            セッションがありません<br />
            ポモドーロを始めて記録を残しましょう
          </p>
        </div>
      </div>
    )
  }

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

  // 月次統計を計算
  const monthlyStats = getMonthlyStats(sessions)

  // 日付の表示形式（日曜始まり）
  function getDayLabel(dateStr: string): string {
    const date = new Date(dateStr)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()

    if (isToday) return 'Today'

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dayIndex = date.getDay()
    return days[dayIndex]
  }

  // 直近7日間のデータを計算（累積集中時間を含む）
  const weeklyData: WeeklyData[] = []
  let cumulativeTotal = 0

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toDateString()

    const daySessions = sessions.filter(
      (s) => s.type === 'work' && s.completedAt !== null && new Date(s.startedAt).toDateString() === dateStr
    )

    const dayMinutes = daySessions.reduce((sum, s) => sum + Math.floor(s.durationSecs / 60), 0)
    cumulativeTotal += dayMinutes

    weeklyData.push({
      date: getDayLabel(dateStr),
      sessions: daySessions.length,
      cumulativeMinutes: cumulativeTotal,
    })
  }

  return (
    <div className="bento-card p-4 sm:p-6 h-full flex flex-col overflow-y-auto min-h-0 relative">
      {/* ヘッダー */}
      <p className="text-xs uppercase tracking-widest font-bold text-cf-text mb-4">
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

      {/* Weekタブ - 複合グラフ（STAT-05） */}
      {activeTab === 'week' && (
        <div className="flex-1 flex flex-col min-h-0">
          <p className="text-xs text-cf-subtext mb-3">Last 7 Days</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={weeklyData}>
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="sessions" fill="#22c55e" name="セッション数" />
                <Line yAxisId="right" type="monotone" dataKey="cumulativeMinutes" stroke="#22c55e" strokeWidth={2} name="累積時間(分)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthタブ */}
      {activeTab === 'month' && (
        <div className="flex-1">
          {/* 月間集中時間 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cf-primary/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-cf-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cf-text">
                {monthlyStats.totalMinutes > 0
                  ? `${Math.floor(monthlyStats.totalMinutes / 60)}h ${monthlyStats.totalMinutes % 60}m`
                  : '0m'}
              </p>
              <p className="text-xs text-cf-subtext">Focus Time This Month</p>
            </div>
          </div>

          {/* 月間セッション数 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cf-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-cf-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cf-text">{monthlyStats.totalSessions}</p>
              <p className="text-xs text-cf-subtext">Pomodoros This Month</p>
            </div>
          </div>
        </div>
      )}

      {/* ローディングスピナー（オーバーレイ） */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-3xl z-10 pointer-events-none">
          <div className="w-8 h-8 border-2 border-cf-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
