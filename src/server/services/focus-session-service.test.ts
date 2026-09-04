/// <reference types="vitest/globals" />

import {
  buildCompletedFocusSessionPayload,
  buildInterruptedFocusSessionPayload,
  calculateRemainingSecs,
  classifyStop,
  classifyTabReturn,
  resetLongBreakCountAtLongBreakStart,
} from './focus-session-service'

describe('Focus Session service', () => {
  it('server clock の終了時刻 → client と同じ残り秒数を返す', () => {
    expect(calculateRemainingSecs('2026-01-01T00:00:01.001Z', '2026-01-01T00:00:00.000Z')).toBe(2)
  })

  it('59,999ms の Stop → null、60,000ms の Stop → Interrupted payload になる', () => {
    const commonInput = {
      sessionId: 'session-1',
      taskId: 'task-1',
      startedAt: 0,
      plannedSecs: 1_500,
    }

    expect(buildInterruptedFocusSessionPayload({ ...commonInput, stoppedAt: 59_999 })).toBeNull()
    expect(buildInterruptedFocusSessionPayload({ ...commonInput, stoppedAt: 60_000 })).toEqual({
      id: 'session-1',
      taskId: 'task-1',
      startedAt: '1970-01-01T00:00:00.000Z',
      completedAt: null,
      durationSecs: 60,
      plannedSecs: 1_500,
    })
    expect(classifyStop(0, 60_000)).toBe('interrupted')
  })

  it('予定終了時の Completed → durationSecs は plannedSecs、completedAt は endsAt になる', () => {
    expect(buildCompletedFocusSessionPayload({
      sessionId: 'session-2',
      startedAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-01-01T00:25:00.000Z',
      plannedSecs: 1_500,
    })).toEqual({
      id: 'session-2',
      taskId: null,
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:25:00.000Z',
      durationSecs: 1_500,
      plannedSecs: 1_500,
    })
  })

  it('終了から 60 秒以内は Completed、それを超えると確認が必要になる', () => {
    expect(classifyTabReturn(100_000, 160_000)).toBe('completed')
    expect(classifyTabReturn(100_000, 160_001)).toBe('needs_confirmation')
  })

  it('Long Break 開始 → server 側のカウンタも 0 に戻る', () => {
    expect(resetLongBreakCountAtLongBreakStart('longBreak', 3)).toBe(0)
  })

  it('plannedSecs と endsAt が不一致 → Completed payload を作成しない', () => {
    expect(() => buildCompletedFocusSessionPayload({
      sessionId: 'session-3',
      startedAt: 0,
      endsAt: 1_499_000,
      plannedSecs: 1_500,
    })).toThrow('endsAt は startedAt + plannedSecs と一致する必要があります')
  })

  it('クライアントが終了時刻を改ざんした Completed payload を受け付けない', () => {
    expect(() => buildCompletedFocusSessionPayload({
      sessionId: 'session-4',
      startedAt: 0,
      endsAt: 1_500_000,
      completedAt: 1_501_000,
      plannedSecs: 1_500,
    })).toThrow('completedAt は endsAt と一致する必要があります')
  })
})
