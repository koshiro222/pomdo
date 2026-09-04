/**
 * Focus Session と Break の実行モード。
 *
 * 実行中の状態はサーバーに保存せず、終了時の実績だけを保存するため、
 * この型はクライアントの永続状態とサーバーの判定で共通に使える。
 */
export type FocusMode = 'focus' | 'shortBreak' | 'longBreak'

export type FocusTimestamp = Date | number | string

export const FOCUS_MODE = {
  FOCUS: 'focus',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak',
} as const satisfies Record<string, FocusMode>

export const SHORT_BREAK_SECS = 5 * 60
export const LONG_BREAK_SECS = 15 * 60
export const MINIMUM_INTERRUPTED_SECS = 60
export const TAB_RETURN_GRACE_SECS = 60
export const LONG_BREAK_INTERVAL = 3

function convertTimestampToEpochMs(value: FocusTimestamp): number {
  const epochMs = value instanceof Date
    ? value.getTime()
    : typeof value === 'number'
      ? value
      : Date.parse(value)

  if (!Number.isFinite(epochMs)) {
    throw new RangeError(`日時を解釈できません: ${String(value)}`)
  }

  return epochMs
}

export function timestampToEpochMs(value: FocusTimestamp): number {
  return convertTimestampToEpochMs(value)
}

export function timestampToIsoString(value: FocusTimestamp): string {
  return new Date(convertTimestampToEpochMs(value)).toISOString()
}

/** 終了予定時刻との差分から、表示する残り秒数を算出する。 */
export function calculateRemainingSecs(endsAt: FocusTimestamp, now: FocusTimestamp): number {
  const remainingMs = convertTimestampToEpochMs(endsAt) - convertTimestampToEpochMs(now)
  return Math.max(0, Math.ceil(remainingMs / 1000))
}

/** 実際に経過した秒数を、部分秒を切り捨てて算出する。 */
export function calculateElapsedSecs(startedAt: FocusTimestamp, endedAt: FocusTimestamp): number {
  const elapsedMs = convertTimestampToEpochMs(endedAt) - convertTimestampToEpochMs(startedAt)
  return Math.max(0, Math.floor(elapsedMs / 1000))
}

/**
 * 円盤に表示する残り時間の割合を返す。
 * 開始時は 1、終了時は 0 で、入力が範囲外でも 0〜1 に収める。
 */
export function calculateRemainingFraction(remainingSecs: number, plannedSecs: number): number {
  if (!Number.isFinite(plannedSecs) || plannedSecs <= 0) {
    throw new RangeError('plannedSecs は正の有限値である必要があります')
  }
  if (!Number.isFinite(remainingSecs)) {
    throw new RangeError('remainingSecs は有限値である必要があります')
  }

  return Math.min(1, Math.max(0, remainingSecs / plannedSecs))
}

/** 円盤の扇形を描くための SVG path を作る。 */
export function buildFocusWedgePath(
  fraction: number,
  options: { center?: number; radius?: number } = {},
): string {
  if (!Number.isFinite(fraction)) {
    throw new RangeError('扇形の割合は有限値である必要があります')
  }

  const center = options.center ?? 132
  const radius = options.radius ?? 120
  if (!Number.isFinite(center) || !Number.isFinite(radius) || radius <= 0) {
    throw new RangeError('円盤の中心と半径は正しい有限値である必要があります')
  }

  const clampedFraction = Math.min(1, Math.max(0, fraction))
  if (clampedFraction === 0) {
    return ''
  }

  // 1 周ちょうどは始点と終点が同じになり、SVG の arc だけでは描けない。
  const drawableFraction = clampedFraction === 1 ? 0.99999 : clampedFraction
  const angle = drawableFraction * Math.PI * 2
  const endX = center + radius * Math.sin(angle)
  const endY = center - radius * Math.cos(angle)
  const largeArcFlag = drawableFraction > 0.5 ? 1 : 0

  return [
    `M${center},${center}`,
    `L${center},${center - radius}`,
    `A${radius},${radius} 0 ${largeArcFlag} 1 ${endX.toFixed(2)},${endY.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export type StopClassification = 'discard' | 'interrupted'

/** ストップ時に、実績を保存するかを 60 秒境界で判定する。 */
export function classifyStop(startedAt: FocusTimestamp, stoppedAt: FocusTimestamp): StopClassification {
  const elapsedMs = convertTimestampToEpochMs(stoppedAt) - convertTimestampToEpochMs(startedAt)
  return elapsedMs < MINIMUM_INTERRUPTED_SECS * 1000 ? 'discard' : 'interrupted'
}

export type TabReturnClassification = 'active' | 'completed' | 'needs_confirmation'

/**
 * タブ復帰時の扱いを判定する。
 * 終了から 60 秒以内は Completed とし、それを超えた場合だけ確認対象にする。
 */
export function classifyTabReturn(
  endsAt: FocusTimestamp,
  now: FocusTimestamp,
): TabReturnClassification {
  const overdueMs = convertTimestampToEpochMs(now) - convertTimestampToEpochMs(endsAt)

  if (overdueMs < 0) {
    return 'active'
  }
  if (overdueMs <= TAB_RETURN_GRACE_SECS * 1000) {
    return 'completed'
  }
  return 'needs_confirmation'
}

export interface FocusCycleAdvance {
  nextMode: FocusMode
  longBreakCount: number
  suggestLongBreak: boolean
}

function assertLongBreakCount(longBreakCount: number): void {
  if (!Number.isInteger(longBreakCount) || longBreakCount < 0) {
    throw new RangeError('longBreakCount は 0 以上の整数である必要があります')
  }
}

/** Completed Focus の本数を Long Break カウンタへ加える。 */
export function incrementLongBreakCount(longBreakCount: number): number {
  assertLongBreakCount(longBreakCount)
  return longBreakCount + 1
}

/** Long Break を実際に開始した瞬間だけ、次のサイクルへ向けてカウンタを戻す。 */
export function resetLongBreakCountAtLongBreakStart(
  mode: FocusMode,
  longBreakCount: number,
): number {
  assertLongBreakCount(longBreakCount)
  if (mode === 'longBreak') {
    return 0
  }
  if (mode === 'focus' || mode === 'shortBreak') {
    return longBreakCount
  }
  throw new RangeError(`不明な Focus モードです: ${mode}`)
}

/** Long Break を提案する本数に到達したかを判定する。 */
export function shouldSuggestLongBreak(longBreakCount: number): boolean {
  assertLongBreakCount(longBreakCount)
  return longBreakCount >= LONG_BREAK_INTERVAL
}

/**
 * セッション完了後に提案する次のモードを算出する。
 * Break の開始や Long Break カウンタのリセットは行わない。
 * リセットは「Long Break を実際に開始した瞬間」に呼び出し側で行う。
 */
export function advanceFocusCycle(mode: FocusMode, longBreakCount: number): FocusCycleAdvance {
  assertLongBreakCount(longBreakCount)

  if (mode === 'focus') {
    const nextLongBreakCount = incrementLongBreakCount(longBreakCount)
    const suggestLongBreak = shouldSuggestLongBreak(nextLongBreakCount)
    return {
      nextMode: suggestLongBreak ? 'longBreak' : 'shortBreak',
      longBreakCount: nextLongBreakCount,
      suggestLongBreak,
    }
  }

  if (mode === 'shortBreak' || mode === 'longBreak') {
    return {
      nextMode: 'focus',
      longBreakCount,
      suggestLongBreak: false,
    }
  }

  throw new RangeError(`不明な Focus モードです: ${mode}`)
}
