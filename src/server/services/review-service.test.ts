/// <reference types="vitest/globals" />

import {
  buildCalendarYearSummaries,
  countFocusedDays,
  listCompletedTaskIds,
  listTasksCompletedOnDate,
  summarizeToday,
} from './review-service'

const timeZone = 'Asia/Tokyo'

describe('Review service', () => {
  const sessions = [
    {
      taskId: 'task-1',
      startedAt: '2026-01-02T14:00:00.000Z',
      completedAt: '2026-01-02T14:25:00.000Z',
      durationSecs: 1_500,
    },
    {
      taskId: 'task-2',
      startedAt: '2026-01-02T14:30:00.000Z',
      completedAt: null,
      durationSecs: 60,
    },
    {
      taskId: 'task-3',
      startedAt: '2026-01-01T14:00:00.000Z',
      completedAt: '2026-01-01T14:25:00.000Z',
      durationSecs: 1_500,
    },
    {
      taskId: 'task-1',
      startedAt: '2025-12-31T15:00:00.000Z',
      completedAt: null,
      durationSecs: 300,
    },
  ]

  it('Completed/Interrupted が同じ日にある → 合計時間は両方、完了本数は Completed だけになる', () => {
    expect(summarizeToday(sessions, '2026-01-02', timeZone)).toEqual({
      totalFocusSecs: 1_560,
      completedFocusCount: 1,
      interruptedFocusCount: 1,
    })
  })

  it('Tokyo の 23:59:59/00:00:00 → 今日の要約を別日として集計する', () => {
    const boundarySessions = [
      {
        startedAt: '2026-01-02T14:59:59.000Z',
        completedAt: '2026-01-02T15:25:00.000Z',
        durationSecs: 1_500,
      },
      {
        startedAt: '2026-01-02T15:00:00.000Z',
        completedAt: null,
        durationSecs: 60,
      },
    ]
    expect(summarizeToday(boundarySessions, '2026-01-02', timeZone)).toEqual({
      totalFocusSecs: 1_500,
      completedFocusCount: 1,
      interruptedFocusCount: 0,
    })
    expect(summarizeToday(boundarySessions, '2026-01-03', timeZone)).toEqual({
      totalFocusSecs: 60,
      completedFocusCount: 0,
      interruptedFocusCount: 1,
    })
  })

  it('うるう年は 366 日を昇順で返し、既存集計と欠落日の 0 値を保つ', () => {
    const result = buildCalendarYearSummaries([
      { date: '2024-02-29', totalFocusSecs: 1_800, completedFocusCount: 1, interruptedFocusCount: 0 },
      { date: '2024-12-31', totalFocusSecs: 60, completedFocusCount: 0, interruptedFocusCount: 1 },
      { date: '2025-01-01', totalFocusSecs: 300, completedFocusCount: 0, interruptedFocusCount: 1 },
    ], 2024)

    expect(result).toHaveLength(366)
    expect(result[0]).toEqual({
      date: '2024-01-01',
      totalFocusSecs: 0,
      completedFocusCount: 0,
      interruptedFocusCount: 0,
    })
    expect(result[59]).toEqual({
      date: '2024-02-29',
      totalFocusSecs: 1_800,
      completedFocusCount: 1,
      interruptedFocusCount: 0,
    })
    expect(result[365]).toEqual({
      date: '2024-12-31',
      totalFocusSecs: 60,
      completedFocusCount: 0,
      interruptedFocusCount: 1,
    })
    expect(result.map((day) => day.date)).toEqual([...result.map((day) => day.date)].sort())
  })

  it('平年は 365 日を返し、整数でない年は拒否する', () => {
    expect(buildCalendarYearSummaries([], 2023)).toHaveLength(365)
    expect(() => buildCalendarYearSummaries([], 2023.5)).toThrow(RangeError)
  })

  it('Completed が存在するローカル日付 → Interrupted のみの日を除いて Focused Days に数える', () => {
    expect(countFocusedDays(sessions, timeZone)).toBe(2)
    expect(listCompletedTaskIds(sessions)).toEqual(['task-1', 'task-3'])
  })

  it('Focus がない完了 Task も当日の完了一覧に含める', () => {
    const tasks = [
      { id: 'without-focus', completedAt: '2026-01-02T02:00:00.000Z' },
      { id: 'yesterday', completedAt: '2026-01-01T14:59:00.000Z' },
      { id: 'open', completedAt: null },
    ]
    expect(listTasksCompletedOnDate(tasks, '2026-01-02', timeZone).map((task) => task.id)).toEqual(['without-focus'])
  })
})
