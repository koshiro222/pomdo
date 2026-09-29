// @vitest-environment node
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { TestDb } from '../../src/server/db/client'
import { focusSessions, tasks, users } from '../../src/server/db/schema'
import { listDailyFocusSummaries } from '../../src/server/repositories/focus-session-repository'
import { recordAnalyticsEvent } from '../../src/server/repositories/analytics-event-repository'
import { createPGliteTestDatabase, type PGliteTestDatabase } from '../helpers/pglite-test-database'

describe('v1 schema', () => {
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

  it('Task削除でFocus Sessionのtask_idだけをNULLにする', async () => {
    const userId = crypto.randomUUID()
    const taskId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, name: 'Test', email: `${userId}@example.com`, isAnonymous: true })
    await db.insert(tasks).values({ id: taskId, userId, title: '確認する', plannedFor: '2026-09-04' })
    await db.insert(focusSessions).values({ id: crypto.randomUUID(), userId, taskId, startedAt: new Date(), durationSecs: 1500, plannedSecs: 1500, completedAt: new Date() })

    await db.delete(tasks).where(eq(tasks.id, taskId))
    const [session] = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId))
    expect(session?.taskId).toBeNull()
    expect(session?.durationSecs).toBe(1500)
  })

  it('日次集計はユーザーの IANA timezone で日付を切り替える', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, name: 'Tokyo', email: `${userId}@example.com`, timezone: 'Asia/Tokyo' })
    await db.insert(focusSessions).values({
      id: crypto.randomUUID(), userId, startedAt: new Date('2026-09-03T15:00:00.000Z'), completedAt: new Date('2026-09-03T15:25:00.000Z'), durationSecs: 1500, plannedSecs: 1500,
    })

    await expect(listDailyFocusSummaries(db, userId)).resolves.toEqual([{
      date: '2026-09-04', totalFocusSecs: 1500, completedFocusCount: 1, interruptedFocusCount: 0,
    }])
  })

  it('analytics event の同じ user/event は冪等に記録できる', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, name: 'Analytics', email: `${userId}@example.com` })
    await expect(recordAnalyticsEvent(db, userId, 'app_opened')).resolves.toBe(true)
    await expect(recordAnalyticsEvent(db, userId, 'app_opened')).resolves.toBe(false)
  })
})
