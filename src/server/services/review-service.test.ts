/// <reference types="vitest/globals" />

import {
  countFocusedDays,
  listCompletedTaskIds,
  listTasksCompletedOnDate,
  summarizeRecentSevenDays,
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

  it('Tokyo の 23:59:59/00:00:00 → 直近 7 日を別日として集計する', () => {
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
    const result = summarizeRecentSevenDays(boundarySessions, '2026-01-03', timeZone)
    expect(result).toHaveLength(7)
    expect(result[4]).toEqual({
      date: '2026-01-01',
      totalFocusSecs: 0,
      completedFocusCount: 0,
      interruptedFocusCount: 0,
    })
    expect(result[5]).toEqual({
      date: '2026-01-02',
      totalFocusSecs: 1_500,
      completedFocusCount: 1,
      interruptedFocusCount: 0,
    })
    expect(result[6]).toEqual({
      date: '2026-01-03',
      totalFocusSecs: 60,
      completedFocusCount: 0,
      interruptedFocusCount: 1,
    })
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
