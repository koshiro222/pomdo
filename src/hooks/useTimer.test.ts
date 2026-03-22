import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTimer } from './useTimer'
import type { SessionType } from './useTimer'
import { useTimerStore } from '../core/store/timer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 各テストの前にストアをリセット
    useTimerStore.setState({
      isActive: false,
      sessionType: 'work',
      remainingSecs: 25 * 60,
      pomodoroCount: 0,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初期状態ではタイマーが停止している', () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.isActive).toBe(false)
    expect(result.current.remainingSecs).toBe(25 * 60)
    expect(result.current.sessionType).toBe('work')
    expect(result.current.pomodoroCount).toBe(0)
  })

  it('開始するとタイマーがカウントダウンする', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    expect(result.current.isActive).toBe(true)
    expect(result.current.remainingSecs).toBe(25 * 60)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.remainingSecs).toBe(25 * 60 - 1)
  })

  it('一時停止するとタイマーが停止する', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.remainingSecs).toBe(25 * 60 - 1)

    act(() => {
      result.current.pause()
    })

    expect(result.current.isActive).toBe(false)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.remainingSecs).toBe(25 * 60 - 1)
  })

  it('リセットするとタイマーが初期状態に戻る', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(60000)
    })

    expect(result.current.remainingSecs).toBe(25 * 60 - 60)

    act(() => {
      result.current.reset()
    })

    expect(result.current.isActive).toBe(false)
    expect(result.current.remainingSecs).toBe(25 * 60)
  })

  it('スキップすると次のセッションタイプに切り替わる', () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.sessionType).toBe('work')
    expect(result.current.totalSecs).toBe(25 * 60)

    act(() => {
      result.current.skip()
    })

    expect(result.current.sessionType).toBe('short_break')
    expect(result.current.totalSecs).toBe(5 * 60)

    act(() => {
      result.current.skip()
    })

    expect(result.current.sessionType).toBe('work')
  })

  it('作業セッション完了時に pomodoroCount が増加する', async () => {
    const { result } = renderHook(() => useTimer())

    expect(result.current.pomodoroCount).toBe(0)

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(result.current.pomodoroCount).toBe(1)
  })

  it('休憩セッション完了時に pomodoroCount は増加しない', async () => {
    const { result } = renderHook(() => useTimer({ initialSessionType: 'short_break' }))

    expect(result.current.pomodoroCount).toBe(0)

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000)
    })

    expect(result.current.pomodoroCount).toBe(0)
  })

  it('onSessionStart コールバックがタイマー開始時に呼ばれる', async () => {
    const onSessionStart = vi.fn().mockResolvedValue('session-id-123')
    const { result } = renderHook(() => useTimer({ onSessionStart }))

    await act(async () => {
      await result.current.start()
    })

    expect(onSessionStart).toHaveBeenCalledWith('work', 25 * 60)
  })

  it('onSessionComplete コールバックがセッション完了時に呼ばれる', async () => {
    const onSessionStart = vi.fn().mockResolvedValue('session-id-123')
    const onSessionComplete = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useTimer({ onSessionStart, onSessionComplete }))

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(onSessionComplete).toHaveBeenCalledWith('session-id-123')
  })

  it('4ポモドーロ後に長休憩になる', async () => {
    const sessionOrder: SessionType[] = []

    const trackSession = (type: SessionType) => {
      sessionOrder.push(type)
    }

    const { result } = renderHook(() =>
      useTimer({
        onSessionStart: (type) => {
          trackSession(type)
          return Promise.resolve('session-id')
        },
      }),
    )

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(result.current.sessionType).toBe('short_break')
  })

  it('セッション完了時は一時停止状態である', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(result.current.isActive).toBe(false)
    expect(result.current.sessionType).toBe('short_break')
  })

  it('セッション完了から3秒後に自動で開始される', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(result.current.isActive).toBe(false)

    // 3秒経過
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isActive).toBe(true)
  })

  it('skipした時は一時停止状態のまま', async () => {
    const { result } = renderHook(() => useTimer())

    await act(async () => {
      await result.current.start()
    })

    // スキップ
    act(() => {
      result.current.skip()
    })

    expect(result.current.isActive).toBe(false)
    expect(result.current.sessionType).toBe('short_break')

    // 3秒待っても開始されない
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.isActive).toBe(false)
  })
})
