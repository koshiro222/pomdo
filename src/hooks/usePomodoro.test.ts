import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoro } from './usePomodoro'

vi.mock('../lib/api', () => ({
  api: {
    getPomodoroSessions: vi.fn(() => Promise.resolve({ success: true, data: [] })),
    createPomodoroSession: vi.fn(),
    completePomodoroSession: vi.fn(),
  },
}))

vi.mock('../lib/storage', () => ({
  storage: {
    getPomodoroSessions: vi.fn(() => []),
    addPomodoroSession: vi.fn(),
    updatePomodoroSession: vi.fn(),
  },
}))

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({ user: null })),
}))

describe('usePomodoro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ゲストモードでセッションを開始できる', async () => {
    const { storage } = await import('../lib/storage')
    const mockAdd = vi.fn().mockReturnValue({
      id: 'test-id',
      todoId: null,
      type: 'work',
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationSecs: 1500,
      createdAt: new Date().toISOString(),
    })
    vi.mocked(storage).addPomodoroSession = mockAdd

    const { result } = renderHook(() => usePomodoro())

    await act(async () => {
      await result.current.startSession('work', 1500)
    })

    expect(mockAdd).toHaveBeenCalled()
  })

  it('ログイン時にセッションを開始できる', async () => {
    const { api } = await import('../lib/api')
    const { useAuth } = await import('./useAuth')
    vi.mocked(useAuth).mockReturnValue({ user: { sub: 'user-123', email: '', name: '', iat: 0, exp: 0 }, loading: false, login: vi.fn(), logout: vi.fn(), refetch: vi.fn() })

    const mockCreate = vi.fn().mockResolvedValue({
      success: true,
      data: {
        id: 'test-id',
        userId: 'user-123',
        todoId: null,
        type: 'work',
        startedAt: new Date().toISOString(),
        completedAt: null,
        durationSecs: 1500,
        createdAt: new Date().toISOString(),
      },
    })
    vi.mocked(api.createPomodoroSession).mockImplementation(mockCreate)

    const { result } = renderHook(() => usePomodoro())

    await act(async () => {
      await result.current.startSession('work', 1500)
    })

    expect(mockCreate).toHaveBeenCalled()
  })
})
