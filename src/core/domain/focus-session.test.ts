import {
  advanceFocusCycle,
  buildFocusWedgePath,
  calculateRemainingFraction,
  calculateRemainingSecs,
  classifyStop,
  classifyTabReturn,
  incrementLongBreakCount,
  resetLongBreakCountAtLongBreakStart,
  shouldSuggestLongBreak,
} from './focus-session'

describe('Focus Session の純粋なドメイン判定', () => {
  it('終了まで 1,001ms の状態 → 残時間を ceil して 2 秒と表示する', () => {
    expect(calculateRemainingSecs(10_001, 9_000)).toBe(2)
  })

  it('終了時刻を過ぎた状態 → 残時間を 0 秒で表示する', () => {
    expect(calculateRemainingSecs(10_000, 10_001)).toBe(0)
  })

  it('残り時間 0/予定時間 → 扇形 0、予定時間と同じ → 扇形 1 になる', () => {
    expect(calculateRemainingFraction(0, 1_500)).toBe(0)
    expect(calculateRemainingFraction(1_500, 1_500)).toBe(1)
    expect(buildFocusWedgePath(0)).toBe('')
    expect(buildFocusWedgePath(1)).not.toBe('')
  })

  it('59,999ms でストップ → 実績を破棄する', () => {
    expect(classifyStop(0, 59_999)).toBe('discard')
  })

  it('60,000ms でストップ → Interrupted として記録する', () => {
    expect(classifyStop(0, 60_000)).toBe('interrupted')
  })

  it('終了前の復帰 → active、終了直後の復帰 → Completed と判定する', () => {
    expect(classifyTabReturn(100_000, 99_999)).toBe('active')
    expect(classifyTabReturn(100_000, 100_001)).toBe('completed')
  })

  it('終了超過 60 秒以内 → Completed、超過後 → 記録確認が必要と判定する', () => {
    expect(classifyTabReturn(100_000, 160_000)).toBe('completed')
    expect(classifyTabReturn(100_000, 160_001)).toBe('needs_confirmation')
  })

  it('Completed Focus 3 本目 → Long Break を提案し、Short Break ではカウンタを保持する', () => {
    expect(shouldSuggestLongBreak(incrementLongBreakCount(2))).toBe(true)
    expect(advanceFocusCycle('focus', 2)).toEqual({
      nextMode: 'longBreak',
      longBreakCount: 3,
      suggestLongBreak: true,
    })
    expect(advanceFocusCycle('shortBreak', 3)).toEqual({
      nextMode: 'focus',
      longBreakCount: 3,
      suggestLongBreak: false,
    })
  })

  it('Long Break を実際に開始 → カウンタを 0 に戻し、Short Break の開始では保持する', () => {
    expect(resetLongBreakCountAtLongBreakStart('longBreak', 3)).toBe(0)
    expect(resetLongBreakCountAtLongBreakStart('shortBreak', 3)).toBe(3)
  })
})
