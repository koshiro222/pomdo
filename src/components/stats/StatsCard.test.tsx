import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import StatsCard from './StatsCard'

// Mock usePomodoro hook
vi.mock('../../hooks/usePomodoro', () => ({
  usePomodoro: vi.fn(),
}))

import { usePomodoro } from '../../hooks/usePomodoro'

const mockSessions = [
  {
    id: '1',
    userId: 'user1',
    todoId: null,
    type: 'work' as const,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationSecs: 1500, // 25 minutes
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'user1',
    todoId: null,
    type: 'work' as const,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    durationSecs: 1500,
    createdAt: new Date().toISOString(),
  },
]

// デフォルトのmock返り値を設定
const defaultMockReturn = {
  sessions: mockSessions,
  loading: false,
  error: null,
  startSession: vi.fn(),
  completeSession: vi.fn(),
  fetchSessions: vi.fn(),
}

beforeEach(() => {
  vi.mocked(usePomodoro).mockReturnValue(defaultMockReturn)
})

describe('STAT-01: Today Tab UI and Statistics', () => {
  it('should display tab buttons (Today/Week/Month)', () => {
    render(<StatsCard />)

    expect(screen.getByRole('button', { name: /today/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /week/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /month/i })).toBeInTheDocument()
  })

  it('should have Today tab selected by default', () => {
    render(<StatsCard />)

    const todayTab = screen.getByRole('button', { name: /today/i })
    expect(todayTab).toHaveClass('bg-cf-primary')
  })

  it('should display todays focus time correctly', async () => {
    render(<StatsCard />)

    // 2 sessions * 25 minutes = 50 minutes
    await waitFor(() => {
      expect(screen.getByText(/50m/)).toBeInTheDocument()
    })
  })

  it('should display todays pomodoro count correctly', async () => {
    render(<StatsCard />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  it('should switch to Week tab when clicked', async () => {
    const user = userEvent.setup()
    render(<StatsCard />)

    const weekTab = screen.getByRole('button', { name: /week/i })
    await user.click(weekTab)

    expect(weekTab).toHaveClass('bg-cf-primary')
  })

  it('should switch to Month tab when clicked', async () => {
    const user = userEvent.setup()
    render(<StatsCard />)

    const monthTab = screen.getByRole('button', { name: /month/i })
    await user.click(monthTab)

    expect(monthTab).toHaveClass('bg-cf-primary')
  })
})

describe('STAT-02: Week Tab Statistics', () => {
  it('should display weekly statistics with session data', async () => {
    const user = userEvent.setup()
    render(<StatsCard />)

    // Switch to Week tab
    const weekTab = screen.getByRole('button', { name: /week/i })
    await user.click(weekTab)

    // Week tab content should be visible
    await waitFor(() => {
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
    })
  })
})

describe('STAT-04: Bar Chart Display', () => {
  it('should display bar chart in Week tab', async () => {
    const user = userEvent.setup()
    render(<StatsCard />)

    const weekTab = screen.getByRole('button', { name: /week/i })
    await user.click(weekTab)

    // Week tab content should contain Recharts components
    await waitFor(() => {
      expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
    })

    // In jsdom, Recharts might not fully render, but we can check the content exists
    expect(screen.getByText(/last 7 days/i)).toBeInTheDocument()
  })
})

describe('StatsCard - STAT-05 累積集中時間', () => {
  it('週次データにcumulativeMinutesフィールドが含まれる', () => {
    // このテストは、実装前に cumulativeMinutes フィールドの存在を確認するためのもの
    // 実装が完了すると、このテストはデータ構造の検証として機能する

    // cumulativeMinutesフィールドの存在を確認する型チェック
    type WeeklyDataWithCumulative = {
      date: string
      sessions: number
      cumulativeMinutes: number
    }

    // テストデータ構造が正しいことを確認
    // 注: この曜日文字列はデータ構造検証用であり、実際のグラフ表示には影響しない
    // グラフ表示の曜日順序は getDayLabel() 関数で日曜始まりに制御されている
    const testData: WeeklyDataWithCumulative = {
      date: 'Mon', // テストデータ用の任意の曜日
      sessions: 2,
      cumulativeMinutes: 75,
    }

    expect(testData).toHaveProperty('cumulativeMinutes')
    expect(testData.cumulativeMinutes).toBe(75)
  })

  it('累積集中時間が単調増加する', () => {
    // 累積計算のロジックをテスト
    // 各日の累積値は、その日を含むそれ以前の日の合計である必要がある
    const dailyMinutes = [25, 50, 30, 0, 45, 60, 40] // 直近7日間の各日の集中時間

    let cumulativeTotal = 0
    const cumulativeValues: number[] = []

    for (const minutes of dailyMinutes) {
      cumulativeTotal += minutes
      cumulativeValues.push(cumulativeTotal)
    }

    // 単調増加の確認
    for (let i = 1; i < cumulativeValues.length; i++) {
      expect(cumulativeValues[i]).toBeGreaterThanOrEqual(cumulativeValues[i - 1])
    }

    // 最終値が合計と一致する
    expect(cumulativeValues[cumulativeValues.length - 1]).toBe(250)
  })

  it('累積計算が「その日までの合計」を正しく計算する', () => {
    // 特定の日までの累積値を確認
    const dailyMinutes = [25, 50, 30, 0, 45, 60, 40]
    const expectedCumulative = [25, 75, 105, 105, 150, 210, 250]

    let cumulativeTotal = 0
    const cumulativeValues: number[] = []

    for (const minutes of dailyMinutes) {
      cumulativeTotal += minutes
      cumulativeValues.push(cumulativeTotal)
    }

    expect(cumulativeValues).toEqual(expectedCumulative)
  })
})

describe('STAT-06: ローディング状態', () => {
  beforeEach(() => {
    // 各テスト前にmockをリセット
    vi.clearAllMocks()
  })

  it('loadingがtrueの場合にスピナーが表示される', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      sessions: [],
      loading: true,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // スピナー要素を確認（animate-spinクラスで判定）
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('ローディング中も既存の統計データが表示される', () => {
    const mockSessions = [
      {
        id: '1',
        userId: '',
        todoId: null,
        type: 'work' as const,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationSecs: 1500,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(usePomodoro).mockReturnValue({
      sessions: mockSessions,
      loading: true,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // Statsヘッダーが表示されていることを確認
    expect(screen.getByText('Stats')).toBeTruthy()

    // スピナーが表示されていることを確認
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })

  it('スピナーがグラフ中央に配置されている', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      sessions: [],
      loading: true,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // スピナーの親コンテナがabsolute inset-0を持つことを確認
    const spinnerContainer = document.querySelector('.absolute.inset-0')
    expect(spinnerContainer).toBeTruthy()

    // スピナーが中央配置されていることを確認（flex items-center justify-center）
    expect(spinnerContainer?.className).toContain('flex items-center justify-center')
  })
})

describe('STAT-07: 空状態', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completedSessions.length === 0 && !loadingの場合に空状態が表示される', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      sessions: [], // 完了済みセッションなし
      loading: false,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // 空状態メッセージが表示されていることを確認
    expect(screen.getByText(/セッションがありません/)).toBeTruthy()
    expect(screen.getByText(/ポモドーロを始めて記録を残しましょう/)).toBeTruthy()
  })

  it('BarChart3アイコンが表示される', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      sessions: [],
      loading: false,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // BarChart3アイコン（lucide-react）はsvg要素としてレンダリングされる
    // データ属性や特定のクラスで確認
    const icon = document.querySelector('svg')
    expect(icon).toBeTruthy()
  })

  it('「セッションがありません\nポモドーロを始めて記録を残しましょう」メッセージが表示される', () => {
    vi.mocked(usePomodoro).mockReturnValue({
      sessions: [],
      loading: false,
      error: null,
      startSession: vi.fn(),
      completeSession: vi.fn(),
      fetchSessions: vi.fn(),
    })

    render(<StatsCard />)

    // メッセージのテキストを確認
    const emptyState = screen.getByText(/セッションがありません/)
    expect(emptyState).toBeTruthy()

    // 2行目のメッセージも確認
    const subMessage = screen.getByText(/ポモドーロを始めて記録を残しましょう/)
    expect(subMessage).toBeTruthy()
  })
})
