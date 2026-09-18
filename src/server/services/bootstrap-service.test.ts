// @vitest-environment node
import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { TestDb } from '../db/client'
import { analyticsEvents, tasks, users } from '../db/schema'
import { initializeBootstrap, SAMPLE_TASK_TITLE } from './bootstrap-service'
import { createPGliteTestDatabase, type PGliteTestDatabase } from '../../../tests/helpers/pglite-test-database'

describe('匿名ユーザーの bootstrap', () => {
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

  it('初回だけ sample Task と app_opened を作り、再実行で増やさない', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, name: 'Anonymous', email: `${userId}@example.com`, isAnonymous: true })
    const now = new Date('2026-09-04T00:00:00.000Z')

    await Promise.all([
      initializeBootstrap(db, userId, 'Asia/Tokyo', now),
      initializeBootstrap(db, userId, 'Asia/Tokyo', now),
    ])
    await initializeBootstrap(db, userId, 'Asia/Tokyo', now)

    await expect(db.select({ title: tasks.title }).from(tasks).where(eq(tasks.userId, userId))).resolves.toEqual([{ title: SAMPLE_TASK_TITLE }])
    await expect(db.select({ event: analyticsEvents.event }).from(analyticsEvents).where(eq(analyticsEvents.userId, userId))).resolves.toEqual([{ event: 'app_opened' }])
  })
})
