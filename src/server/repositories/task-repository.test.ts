// @vitest-environment node

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { TestDb } from '../db/client'
import { focusSessions, tasks, users } from '../db/schema'
import { createPGliteTestDatabase, type PGliteTestDatabase } from '../../../tests/helpers/pglite-test-database'
import { deleteTasks } from './task-repository'

describe('task repository bulk delete', () => {
  let testDatabase: PGliteTestDatabase
  let db: TestDb

  beforeAll(async () => {
    testDatabase = await createPGliteTestDatabase()
    db = testDatabase.db
  })

  beforeEach(async () => {
    await testDatabase.truncateTables()
  })

  afterAll(async () => { await testDatabase.close() })

  async function createUser(userId = crypto.randomUUID()): Promise<string> {
    await db.insert(users).values({ id: userId, name: 'Test', email: `${userId}@example.com` })
    return userId
  }

  it('所有者の選択Taskだけを削除し、Now参照とFocus SessionのTask参照をNULLにする', async () => {
    const userId = await createUser()
    const otherUserId = await createUser()
    const selectedTaskId = crypto.randomUUID()
    const unselectedTaskId = crypto.randomUUID()
    const otherUserTaskId = crypto.randomUUID()
    await db.insert(tasks).values([
      { id: selectedTaskId, userId, title: '選択Task' },
      { id: unselectedTaskId, userId, title: '未選択Task' },
      { id: otherUserTaskId, userId: otherUserId, title: '他ユーザーTask' },
    ])
    await db.update(users).set({ currentTaskId: selectedTaskId }).where(eq(users.id, userId))
    await db.insert(focusSessions).values({
      id: crypto.randomUUID(),
      userId,
      taskId: selectedTaskId,
      startedAt: new Date('2026-09-04T00:00:00.000Z'),
      completedAt: new Date('2026-09-04T00:25:00.000Z'),
      durationSecs: 1500,
      plannedSecs: 1500,
    })

    const deleted = await deleteTasks(db, userId, [selectedTaskId, otherUserTaskId])

    expect(deleted).toEqual([{ id: selectedTaskId }])
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, selectedTaskId))).toHaveLength(0)
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, unselectedTaskId))).toHaveLength(1)
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, otherUserTaskId))).toHaveLength(1)
    expect((await db.select({ currentTaskId: users.currentTaskId }).from(users).where(eq(users.id, userId)))[0]?.currentTaskId).toBeNull()
    expect(await db.select({ taskId: focusSessions.taskId, durationSecs: focusSessions.durationSecs }).from(focusSessions)).toEqual([
      { taskId: null, durationSecs: 1500 },
    ])
  })

  it('空配列では何も削除せず空配列を返す', async () => {
    const userId = await createUser()
    const taskId = crypto.randomUUID()
    await db.insert(tasks).values({ id: taskId, userId, title: '残すTask' })

    await expect(deleteTasks(db, userId, [])).resolves.toEqual([])
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId))).toHaveLength(1)
  })
})
