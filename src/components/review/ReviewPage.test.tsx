import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemePreferenceProvider } from '../theme/ThemePreferenceProvider'
import { ReviewPage } from './ReviewPage'

const mocks = vi.hoisted(() => ({
  session: {
    user: { id: 'user-1', theme: 'light' as const },
    ready: true,
    bootstrapError: null as Error | null,
    retryBootstrap: vi.fn(),
    anonymousAuthError: null as Error | null,
    retryAnonymousSignIn: vi.fn(),
  },
  summary: {
    isPending: false,
    isError: false,
    data: {
      totalFocusSecs: 1500,
      completedFocusCount: 1,
      focusedDays: 1,
      todayDate: '2026-09-07',
      calendarDays: Array.from({ length: 365 }, (_, index) => {
        const date = new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)
        const totalFocusSecs = date === '2026-09-04' ? 1_500 : 0
        return {
          date,
          totalFocusSecs,
          completedFocusCount: totalFocusSecs > 0 ? 1 : 0,
          interruptedFocusCount: 0,
        }
      }),
      completedTasks: [{ id: 'task-1', title: '記事を読む' }],
    },
  },
  update: {
    mutateAsync: vi.fn(),
  },
}))

vi.mock('../../hooks/useAppSession', () => ({
  useAppSession: () => mocks.session,
}))

vi.mock('../../hooks/useTurnstileToken', () => ({
  useTurnstileToken: () => ({
    ref: { current: null },
    siteKey: null,
    resolveTurnstileToken: async () => 'turnstile-token',
    onSuccess: vi.fn(),
    onExpire: vi.fn(),
    onError: vi.fn(),
  }),
}))

vi.mock('../../lib/trpc', () => ({
  trpc: {
    review: { summary: { useQuery: () => mocks.summary } },
    settings: { update: { useMutation: () => mocks.update } },
  },
}))

function renderReview() {
  return render(<ThemePreferenceProvider><MemoryRouter initialEntries={['/app/review']}><ReviewPage /></MemoryRouter></ThemePreferenceProvider>)
}

describe('ReviewPage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    mocks.update.mutateAsync.mockReset()
    mocks.update.mutateAsync.mockResolvedValue(undefined)
    mocks.summary.isPending = false
    mocks.summary.isError = false
  })

  it('今日の統計を保ち、フォーカスで記録日の詳細を表示する', () => {
    renderReview()

    expect(screen.getByRole('heading', { level: 1, name: '今日の振り返り' })).toBeVisible()
    expect(screen.queryByText('今日を振り返る')).not.toBeInTheDocument()
    expect(screen.getByText('合計集中時間')).toBeVisible()
    expect(screen.getByText('25分')).toBeVisible()
    expect(screen.getByText('完了した Focus')).toBeVisible()
    expect(screen.getByText('1本')).toBeVisible()
    expect(screen.getByRole('heading', { name: '年間の集中時間' })).toBeVisible()
    const recordedDay = screen.getByRole('button', { name: '2026年9月4日、金曜日、集中時間 25分' })
    expect(recordedDay).toBeVisible()
    expect(screen.queryByText('直近7日')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', { name: '直近7日の集中時間' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '完了したタスク' })).toBeVisible()
    expect(screen.getByText('記事を読む')).toBeVisible()
    expect(screen.getByText('累計 1日')).toBeVisible()

    act(() => recordedDay.focus())
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026年9月4日（金）')
    expect(screen.getByRole('tooltip')).toHaveTextContent('集中時間 25分')
    expect(screen.queryByText(/集中時間がある日を選ぶと/)).not.toBeInTheDocument()
    expect(screen.queryByText('1マスが1日です')).not.toBeInTheDocument()
    expect(document.querySelector('.annual-calendar-selection')).not.toBeInTheDocument()
  }, 10_000)

  it('テーマトグルで Turnstile token 付き settings.update を呼ぶ', async () => {
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }))

    await waitFor(() => expect(mocks.update.mutateAsync).toHaveBeenCalledWith({ theme: 'dark', turnstileToken: 'turnstile-token' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'night')
  })

  it('テーマ保存に失敗しても表示テーマを維持し Toast を表示する', async () => {
    mocks.update.mutateAsync.mockRejectedValueOnce(new Error('save failed'))
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }))

    await waitFor(() => expect(screen.getByText('テーマを保存できませんでした。画面のテーマは維持しています。')).toBeVisible())
    expect(document.documentElement).toHaveAttribute('data-theme', 'night')
    expect(localStorage.getItem('pomdo-theme')).toBe('dark')
  })
})
