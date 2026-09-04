import {
  calculateElapsedSecs,
  classifyStop,
  timestampToEpochMs,
  timestampToIsoString,
  type FocusTimestamp,
  type StopClassification,
  type TabReturnClassification,
} from '../../core/domain/focus-session'

export {
  calculateElapsedSecs,
  calculateRemainingSecs,
  classifyStop,
  classifyTabReturn,
  advanceFocusCycle,
  incrementLongBreakCount,
  shouldSuggestLongBreak,
  resetLongBreakCountAtLongBreakStart,
} from '../../core/domain/focus-session'
export type {
  FocusCycleAdvance,
  FocusMode,
  FocusTimestamp,
  StopClassification,
  TabReturnClassification,
} from '../../core/domain/focus-session'

export interface FocusSessionPayload {
  id: string
  taskId: string | null
  startedAt: string
  completedAt: string | null
  durationSecs: number
  plannedSecs: number
}

export interface CompletedFocusSessionPayloadInput {
  id?: string
  sessionId?: string
  taskId?: string | null
  startedAt: FocusTimestamp
  endsAt?: FocusTimestamp
  completedAt?: FocusTimestamp
  plannedSecs: number
}

export interface InterruptedFocusSessionPayloadInput {
  id?: string
  sessionId?: string
  taskId?: string | null
  startedAt: FocusTimestamp
  stoppedAt: FocusTimestamp
  plannedSecs: number
}

function assertSessionIdentifier(id: string | undefined, sessionId: string | undefined): string {
  const resolvedId = sessionId ?? id
  if (!resolvedId || resolvedId.trim() === '') {
    throw new TypeError('Focus Session の id が必要です')
  }
  return resolvedId
}

function assertPlannedSecs(plannedSecs: number): void {
  if (!Number.isInteger(plannedSecs) || plannedSecs <= 0) {
    throw new RangeError('plannedSecs は正の整数である必要があります')
  }
}

/** Completed として保存する payload を組み立てる。 */
export function buildCompletedFocusSessionPayload(
  input: CompletedFocusSessionPayloadInput,
): FocusSessionPayload {
  const id = assertSessionIdentifier(input.id, input.sessionId)
  assertPlannedSecs(input.plannedSecs)
  const completionTime = input.completedAt ?? input.endsAt
  if (completionTime === undefined) {
    throw new TypeError('Completed Focus Session には endsAt または completedAt が必要です')
  }

  const startedAtMs = timestampToEpochMs(input.startedAt)
  const endsAtMs = input.endsAt === undefined ? undefined : timestampToEpochMs(input.endsAt)
  if (endsAtMs !== undefined && endsAtMs !== startedAtMs + input.plannedSecs * 1000) {
    throw new RangeError('endsAt は startedAt + plannedSecs と一致する必要があります')
  }
  if (input.completedAt !== undefined && endsAtMs !== undefined && timestampToEpochMs(input.completedAt) !== endsAtMs) {
    throw new RangeError('completedAt は endsAt と一致する必要があります')
  }
  if (timestampToEpochMs(completionTime) < startedAtMs) {
    throw new RangeError('completedAt は startedAt より前にできません')
  }

  return {
    id,
    taskId: input.taskId ?? null,
    startedAt: timestampToIsoString(input.startedAt),
    completedAt: timestampToIsoString(completionTime),
    durationSecs: input.plannedSecs,
    plannedSecs: input.plannedSecs,
  }
}

/**
 * Stop の結果から Interrupted payload を組み立てる。
 * 60 秒未満なら null を返し、DB への insert 自体を発生させない。
 */
export function buildInterruptedFocusSessionPayload(
  input: InterruptedFocusSessionPayloadInput,
): FocusSessionPayload | null {
  const id = assertSessionIdentifier(input.id, input.sessionId)
  assertPlannedSecs(input.plannedSecs)

  if (classifyStop(input.startedAt, input.stoppedAt) === 'discard') {
    return null
  }

  const durationSecs = calculateElapsedSecs(input.startedAt, input.stoppedAt)
  if (durationSecs > input.plannedSecs) {
    throw new RangeError('Interrupted の durationSecs は plannedSecs を超えられません')
  }

  return {
    id,
    taskId: input.taskId ?? null,
    startedAt: timestampToIsoString(input.startedAt),
    completedAt: null,
    durationSecs,
    plannedSecs: input.plannedSecs,
  }
}

/** 実行中の Focus Session payload が DB の整合条件を満たすかを確認する。 */
export function validateFocusSessionPayload(payload: FocusSessionPayload): void {
  if (!payload.id || !payload.startedAt) {
    throw new TypeError('Focus Session payload の必須値が不正です')
  }
  assertPlannedSecs(payload.plannedSecs)
  const startedAtMs = timestampToEpochMs(payload.startedAt)
  if (payload.completedAt !== null && timestampToEpochMs(payload.completedAt) < startedAtMs) {
    throw new RangeError('completedAt は startedAt より前にできません')
  }
  if (!Number.isInteger(payload.durationSecs) || payload.durationSecs < 0 || payload.durationSecs > payload.plannedSecs) {
    throw new RangeError('durationSecs は 0 以上 plannedSecs 以下の整数である必要があります')
  }
  if (payload.completedAt === null && payload.durationSecs < 60) {
    throw new RangeError('Interrupted の durationSecs は 60 秒以上である必要があります')
  }
  if (payload.completedAt !== null && payload.durationSecs !== payload.plannedSecs) {
    throw new RangeError('Completed の durationSecs は plannedSecs と一致する必要があります')
  }
}

// router 側で読みやすい別名も公開する。判定処理そのものは上の一箇所だけに置く。
export const createCompletedFocusSessionPayload = buildCompletedFocusSessionPayload
export const createInterruptedFocusSessionPayload = buildInterruptedFocusSessionPayload

// import した型を server service の公開 API に含めるためのコンパイル時参照。
export type FocusSessionStopResult = StopClassification
export type FocusSessionTabReturnResult = TabReturnClassification

// timestampToEpochMs は payload を組み立てる利用者が server clock と比較する際にも使える。
