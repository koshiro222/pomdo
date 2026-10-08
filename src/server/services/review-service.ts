import type { FocusTimestamp } from '../../core/domain/focus-session'

export interface ReviewFocusSession {
  startedAt?: FocusTimestamp
  started_at?: FocusTimestamp
  completedAt?: FocusTimestamp | null
  completed_at?: FocusTimestamp | null
  durationSecs?: number
  duration_secs?: number
  taskId?: string | null
  task_id?: string | null
}

export interface TodayReviewSummary {
  totalFocusSecs: number
  completedFocusCount: number
  interruptedFocusCount: number
}

export interface DailyReviewSummary extends TodayReviewSummary {
  date: string
}

export interface ReviewTask {
  completedAt?: FocusTimestamp | null
  completed_at?: FocusTimestamp | null
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

function readStartedAt(session: ReviewFocusSession): FocusTimestamp {
  const startedAt = session.startedAt ?? session.started_at
  if (startedAt === undefined) {
    throw new TypeError('Focus Session に startedAt が必要です')
  }
  return startedAt
}

function readCompletedAt(session: ReviewFocusSession): FocusTimestamp | null {
  return session.completedAt !== undefined ? session.completedAt : session.completed_at ?? null
}

function readDurationSecs(session: ReviewFocusSession): number {
  const durationSecs = session.durationSecs ?? session.duration_secs
  if (durationSecs === undefined || !Number.isInteger(durationSecs) || durationSecs < 0) {
    throw new RangeError('durationSecs は 0 以上の整数である必要があります')
  }
  return durationSecs
}

function formatSessionDate(value: FocusTimestamp, timeZone: string): string {
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

function parseCalendarDate(value: string | Date | number, timeZone: string): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (
      parsed.getUTCFullYear() !== year
      || parsed.getUTCMonth() !== month - 1
      || parsed.getUTCDate() !== day
    ) {
      throw new RangeError(`存在しない日付です: ${value}`)
    }
    return value
  }
  return formatSessionDate(value, timeZone)
}

function summarizeSessionsForDate(
  sessions: readonly ReviewFocusSession[],
  date: string,
  timeZone: string,
): DailyReviewSummary {
  let totalFocusSecs = 0
  let completedFocusCount = 0
  let interruptedFocusCount = 0

  for (const session of sessions) {
    if (formatSessionDate(readStartedAt(session), timeZone) !== date) {
      continue
    }

    totalFocusSecs += readDurationSecs(session)
    if (readCompletedAt(session) === null) {
      interruptedFocusCount += 1
    } else {
      completedFocusCount += 1
    }
  }

  return {
    date,
    totalFocusSecs,
    completedFocusCount,
    interruptedFocusCount,
  }
}

/** 今日の合計は Completed と Interrupted、完了本数は Completed だけを数える。 */
export function summarizeToday(
  sessions: readonly ReviewFocusSession[],
  today: string | Date | number,
  timeZone: string,
): TodayReviewSummary {
  assertTimeZone(timeZone)
  const todayDate = parseCalendarDate(today, timeZone)
  const summary = summarizeSessionsForDate(sessions, todayDate, timeZone)
  return {
    totalFocusSecs: summary.totalFocusSecs,
    completedFocusCount: summary.completedFocusCount,
    interruptedFocusCount: summary.interruptedFocusCount,
  }
}

/** 年内の日別集計をそろえ、記録がない日を 0 で埋める。 */
export function buildCalendarYearSummaries(
  dailySummaries: readonly DailyReviewSummary[],
  year: number,
): DailyReviewSummary[] {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new RangeError('year は 1 以上 9999 以下の整数である必要があります')
  }

  const summariesByDate = new Map(dailySummaries.map((summary) => [summary.date, summary]))
  const firstDay = new Date(0)
  firstDay.setUTCFullYear(year, 0, 1)
  firstDay.setUTCHours(0, 0, 0, 0)
  const daysInYear = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365

  return Array.from({ length: daysInYear }, (_, index) => {
    const date = new Date(firstDay.getTime())
    date.setUTCDate(date.getUTCDate() + index)
    const dateString = date.toISOString().slice(0, 10)
    return summariesByDate.get(dateString) ?? {
      date: dateString,
      totalFocusSecs: 0,
      completedFocusCount: 0,
      interruptedFocusCount: 0,
    }
  })
}

/** Completed Focus が存在するローカル日付の累積数を返す。 */
export function countFocusedDays(
  sessions: readonly ReviewFocusSession[],
  timeZone: string,
): number {
  assertTimeZone(timeZone)
  const focusedDates = new Set<string>()
  for (const session of sessions) {
    if (readCompletedAt(session) !== null) {
      focusedDates.add(formatSessionDate(readStartedAt(session), timeZone))
    }
  }
  return focusedDates.size
}

/** Review で表示する、Completed Focus に紐づいた重複のない Task ID を返す。 */
export function listCompletedTaskIds(sessions: readonly ReviewFocusSession[]): string[] {
  const taskIds = new Set<string>()
  for (const session of sessions) {
    const taskId = session.taskId !== undefined ? session.taskId : session.task_id
    if (readCompletedAt(session) !== null && taskId !== null && taskId !== undefined) {
      taskIds.add(taskId)
    }
  }
  return [...taskIds]
}

/** Focus の有無にかかわらず、指定したローカル日付に完了した Task を返す。 */
export function listTasksCompletedOnDate<T extends ReviewTask>(
  tasks: readonly T[],
  date: string | Date | number,
  timeZone: string,
): T[] {
  assertTimeZone(timeZone)
  const targetDate = parseCalendarDate(date, timeZone)
  return tasks.filter((task) => {
    const completedAt = task.completedAt !== undefined ? task.completedAt : task.completed_at
    return completedAt !== null && completedAt !== undefined && formatSessionDate(completedAt, timeZone) === targetDate
  })
}
