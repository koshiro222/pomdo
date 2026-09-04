/// <reference types="vitest/globals" />

import {
  buildDeckOrder,
  calculateEstimateProgress,
  clearCurrentTask,
  deriveTaskBuckets,
  promoteTaskToNow,
  sweepOverdueTasks,
} from './task-service'
import type { TaskRecord } from './task-service'

const timeZone = 'Asia/Tokyo'

describe('Task service', () => {
  it('Tokyo の今日 → Today/On Deck、未完了の昨日以前 → Backlog、完了日 → Today\'s Done/Archive に分ける', () => {
    const tasks = [
      { id: 'now', plannedFor: '2026-01-02', completedAt: null },
      { id: 'deck', plannedFor: '2026-01-02', completedAt: null },
      { id: 'backlog', plannedFor: null, completedAt: null },
      { id: 'done-today', plannedFor: '2026-01-02', completedAt: '2026-01-02T15:00:00.000Z' },
      { id: 'done-archive', plannedFor: null, completedAt: '2026-01-01T14:59:59.000Z' },
    ]

    expect(deriveTaskBuckets(tasks, '2026-01-02', timeZone, 'now')).toEqual({
      todayTasks: [tasks[0], tasks[1]],
      onDeck: [tasks[1]],
      backlog: [tasks[2]],
      todaysDone: [tasks[3]],
      archive: [tasks[4]],
    })
  })

  it('期限超過の未完了 Task → plannedFor/deckOrder を消去し、Now だけ今日へ戻す', () => {
    const tasks = [
      { id: 'overdue', plannedFor: '2026-01-01', deckOrder: 'U', completedAt: null },
      { id: 'current', plannedFor: '2026-01-01', deckOrder: 'V', completedAt: null },
      { id: 'done', plannedFor: '2026-01-01', deckOrder: 'W', completedAt: '2026-01-01T00:00:00.000Z' },
    ]

    expect(sweepOverdueTasks(tasks, '2026-01-02', timeZone, 'current')).toEqual([
      { ...tasks[0], plannedFor: null, deckOrder: null },
      { ...tasks[1], plannedFor: '2026-01-02' },
      tasks[2],
    ])
  })

  it('Backlog Task の昇格 → plannedFor が今日になり、Now を解除すると null になる', () => {
    const task = { id: 'backlog', plannedFor: null, deckOrder: null, completedAt: null }
    expect(promoteTaskToNow(task, '2026-01-02', timeZone)).toEqual({
      ...task,
      plannedFor: '2026-01-02',
    })
    expect(clearCurrentTask('backlog', 'backlog')).toBeNull()
    expect(clearCurrentTask('other', 'backlog')).toBe('other')
  })

  it('Estimate 未設定 → 本数のみ、4 本を超過 → 4/4 完了と超過本数を保持する', () => {
    expect(calculateEstimateProgress(null, 2)).toEqual({
      completedCount: 2,
      estimate: null,
      remainingCount: null,
      isComplete: false,
      overflowCount: 0,
    })
    expect(calculateEstimateProgress(4, 5)).toEqual({
      completedCount: 5,
      estimate: 4,
      remainingCount: 0,
      isComplete: true,
      overflowCount: 1,
    })
  })

  it('隣接キーの間 → 前後の順序を壊さない deck_order を作る', () => {
    const middle = buildDeckOrder('a0', 'a1')
    expect('a0' < middle && middle < 'a1').toBe(true)
    const exhausted = buildDeckOrder('a0', 'a01')
    expect('a0' < exhausted && exhausted < 'a01').toBe(true)
    const orderInput: TaskRecord[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const ordered = buildDeckOrder(orderInput)
    const keys = ordered.map((task) => task.deckOrder ?? '')
    expect(new Set(keys).size).toBe(3)
    expect(keys[0] < keys[1] && keys[1] < keys[2]).toBe(true)
  })

  it('Estimate の最小/最大値 → 有効、0 本から 8 本 → 残数を正しく返す', () => {
    expect(calculateEstimateProgress(1, 0).remainingCount).toBe(1)
    expect(calculateEstimateProgress(8, 7).remainingCount).toBe(1)
    expect(() => calculateEstimateProgress(0, 0)).toThrow('estimate は未設定または 1〜8')
    expect(() => calculateEstimateProgress(9, 0)).toThrow('estimate は未設定または 1〜8')
  })
})
