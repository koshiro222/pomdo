import { render, screen, waitFor } from '@testing-library/react'
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
      days: Array.from({ length: 7 }, (_, index) => ({ date: `2026-09-${String(index + 1).padStart(2, '0')}`, totalFocusSecs: index * 60 })),
      completedTasks: [],
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

  it('テーマトグルで Turnstile token 付き settings.update を呼ぶ', async () => {
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }))

    await waitFor(() => expect(mocks.update.mutateAsync).toHaveBeenCalledWith({ theme: 'dark', turnstileToken: 'turnstile-token' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('テーマ保存に失敗しても表示テーマを維持し Toast を表示する', async () => {
    mocks.update.mutateAsync.mockRejectedValueOnce(new Error('save failed'))
    const user = userEvent.setup()
    renderReview()

    await user.click(screen.getByRole('checkbox', { name: 'ダークテーマに切り替え' }))

    await waitFor(() => expect(screen.getByText('テーマを保存できませんでした。画面のテーマは維持しています。')).toBeVisible())
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(localStorage.getItem('pomdo-theme')).toBe('dark')
  })
})
