import type { FocusTimestamp } from '../../core/domain/focus-session'
import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

export type TaskDateValue = string | Date | number

export interface TaskRecord {
  id: string
  plannedFor?: string | null
  planned_for?: string | null
  completedAt?: FocusTimestamp | null
  completed_at?: FocusTimestamp | null
  deckOrder?: string | null
  deck_order?: string | null
  estimate?: number | null
  createdAt?: FocusTimestamp
  created_at?: FocusTimestamp
}

export interface TaskBuckets<T extends TaskRecord = TaskRecord> {
  todayTasks: T[]
  onDeck: T[]
  backlog: T[]
  todaysDone: T[]
  archive: T[]
}

export interface EstimateProgress {
  completedCount: number
  estimate: number | null
  remainingCount: number | null
  isComplete: boolean
  overflowCount: number
}

function assertTimeZone(timeZone: string): void {
  if (!timeZone || !timeZone.trim()) {
    throw new TypeError('IANA timezone が必要です')
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format()
  } catch {
    throw new RangeError(`不正な IANA timezone です: ${timeZone}`)
  }
}

function assertDateOnly(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new RangeError(`日付は YYYY-MM-DD 形式である必要があります: ${value}`)
  }

  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new RangeError(`存在しない日付です: ${value}`)
  }
}

function formatDateParts(value: TaskDateValue, timeZone: string): string {
  assertTimeZone(timeZone)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    assertDateOnly(value)
    return value
  }

  const date = value instanceof Date
    ? value
    : typeof value === 'number'
      ? new Date(value)
      : new Date(value)
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError(`日時を解釈できません: ${String(value)}`)
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function readPlannedFor(task: TaskRecord): string | null | undefined {
  return task.plannedFor !== undefined ? task.plannedFor : task.planned_for
}

function readCompletedAt(task: TaskRecord): FocusTimestamp | null | undefined {
  return task.completedAt !== undefined ? task.completedAt : task.completed_at
}

function readDeckOrder(task: TaskRecord): string | null | undefined {
  return task.deckOrder !== undefined ? task.deckOrder : task.deck_order
}

function writeTaskFields<T extends TaskRecord>(
  task: T,
  fields: { plannedFor: string | null; deckOrder: string | null },
): T {
  if (task.plannedFor === undefined && task.planned_for !== undefined) {
    return {
      ...task,
      planned_for: fields.plannedFor,
      deck_order: fields.deckOrder,
    }
  }

  if (task.planned_for !== undefined || task.deck_order !== undefined) {
    return {
      ...task,
      plannedFor: fields.plannedFor,
      planned_for: fields.plannedFor,
      deckOrder: fields.deckOrder,
      deck_order: fields.deckOrder,
    }
  }

  return {
    ...task,
    plannedFor: fields.plannedFor,
    deckOrder: fields.deckOrder,
  }
}

/** planned_for / completed_at とユーザーの今日から Task の表示先を導出する。 */
export function deriveTaskBuckets<T extends TaskRecord>(
  tasks: readonly T[],
  today: TaskDateValue,
  timeZone: string,
  currentTaskId: string | null = null,
): TaskBuckets<T> {
  assertTimeZone(timeZone)
  const todayDate = formatDateParts(today, timeZone)
  const buckets: TaskBuckets<T> = {
    todayTasks: [],
    onDeck: [],
    backlog: [],
    todaysDone: [],
    archive: [],
  }

  for (const task of tasks) {
    const completedAt = readCompletedAt(task)
    if (completedAt !== null && completedAt !== undefined) {
      const completedDate = formatDateParts(completedAt, timeZone)
      if (completedDate >= todayDate) {
        buckets.todaysDone.push(task)
      } else {
        buckets.archive.push(task)
      }
      continue
    }

    if (readPlannedFor(task) === todayDate) {
      buckets.todayTasks.push(task)
      if (task.id !== currentTaskId) {
        buckets.onDeck.push(task)
      }
    } else {
      buckets.backlog.push(task)
    }
  }

  return buckets
}

/** 昨日以前に予定されていた未完了 Task を Backlog に戻す。 */
export function sweepOverdueTasks<T extends TaskRecord>(
  tasks: readonly T[],
  today: TaskDateValue,
  timeZone: string,
  currentTaskId: string | null = null,
): T[] {
  assertTimeZone(timeZone)
  const todayDate = formatDateParts(today, timeZone)

  return tasks.map((task) => {
    const isCurrentTask = task.id === currentTaskId
    const completedAt = readCompletedAt(task)
    const isIncomplete = completedAt === null || completedAt === undefined
    const plannedFor = readPlannedFor(task)

    if (!isIncomplete) {
      return task
    }
    if (isCurrentTask && plannedFor !== todayDate) {
      return writeTaskFields(task, { plannedFor: todayDate, deckOrder: readDeckOrder(task) ?? null })
    }
    if (plannedFor !== null && plannedFor !== undefined && plannedFor < todayDate) {
      return writeTaskFields(task, { plannedFor: null, deckOrder: null })
    }
    return task
  })
}

function resolveEstimate(estimate: number | null | undefined): number | null {
  if (estimate === null || estimate === undefined) {
    return null
  }
  if (!Number.isInteger(estimate) || estimate < 1 || estimate > 8) {
    throw new RangeError('estimate は未設定または 1〜8 の整数である必要があります')
  }
  return estimate
}

/** Completed Focus 本数を Estimate の表示用進捗へ変換する。 */
export function calculateEstimateProgress(
  estimate: number | null | undefined,
  completedFocusCount: number,
): EstimateProgress
export function calculateEstimateProgress(
  task: Pick<TaskRecord, 'estimate'>,
  completedFocusCount: number,
): EstimateProgress
export function calculateEstimateProgress(
  estimateOrTask: number | null | undefined | Pick<TaskRecord, 'estimate'>,
  completedFocusCount: number,
): EstimateProgress {
  if (!Number.isInteger(completedFocusCount) || completedFocusCount < 0) {
    throw new RangeError('completedFocusCount は 0 以上の整数である必要があります')
  }

  const estimate = estimateOrTask !== null && typeof estimateOrTask === 'object'
    ? resolveEstimate(estimateOrTask.estimate)
    : resolveEstimate(estimateOrTask)
  const isComplete = estimate !== null && completedFocusCount >= estimate

  return {
    completedCount: completedFocusCount,
    estimate,
    remainingCount: estimate === null ? null : Math.max(0, estimate - completedFocusCount),
    isComplete,
    overflowCount: estimate === null ? 0 : Math.max(0, completedFocusCount - estimate),
  }
}

/** Backlog の Task を今日へ移し、Now に昇格させるための Task patch を返す。 */
export function promoteTaskToNow<T extends TaskRecord>(
  task: T,
  today: TaskDateValue,
  timeZone: string,
): T {
  assertTimeZone(timeZone)
  const todayDate = formatDateParts(today, timeZone)
  return writeTaskFields(task, {
    plannedFor: todayDate,
    deckOrder: readDeckOrder(task) ?? null,
  })
}

/** current_task_id を明示的にクリアする。対象 ID が違えば既存の Now を保つ。 */
export function clearCurrentTask(
  currentTaskId: string | null,
  taskIdToClear?: string,
): string | null {
  if (taskIdToClear === undefined || currentTaskId === taskIdToClear) {
    return null
  }
  return currentTaskId
}

/**
 * 隣接する deck_order の間に新しいキーを作る。
 * 配列を渡した場合は、配列順を保ったままキーを付与したコピーを返す。
 */
export function buildDeckOrder(previousKey: string | null, nextKey: string | null): string
export function buildDeckOrder<T extends TaskRecord>(tasks: readonly T[]): T[]
export function buildDeckOrder<T extends TaskRecord>(
  previousKeyOrTasks: string | null | readonly T[],
  nextKey?: string | null,
): string | T[] {
  if (previousKeyOrTasks !== null && typeof previousKeyOrTasks !== 'string') {
    const keys = generateNKeysBetween(null, null, previousKeyOrTasks.length)
    return previousKeyOrTasks.map((task, index) => {
      return writeTaskFields(task, {
        plannedFor: task.plannedFor ?? task.planned_for ?? null,
        deckOrder: keys[index] ?? null,
      })
    })
  }

  return generateKeyBetween(previousKeyOrTasks, nextKey ?? null)
}

export { formatDateParts as formatTaskCalendarDate }
