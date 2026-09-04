// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '../db/client'
import { analyticsEvents, tasks, users } from '../db/schema'
import { initializeBootstrap, SAMPLE_TASK_TITLE } from './bootstrap-service'

describe('匿名ユーザーの bootstrap', () => {
  let client: PGlite
  let db: TestDb

  beforeEach(async () => {
    client = new PGlite()
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0000_v1_initial.sql'), 'utf8'))
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0001_v1_constraints.sql'), 'utf8'))
    db = createTestDb(client)
  })

  afterEach(async () => { await client.close() })

  it('初回だけ sample Task と app_opened を作り、再実行で増やさない', async () => {
    const userId = crypto.randomUUID()
    await db.insert(users).values({ id: userId, name: 'Anonymous', email: `${userId}@example.com`, isAnonymous: true })
    const now = new Date('2026-09-04T00:00:00.000Z')

    await initializeBootstrap(db, userId, 'Asia/Tokyo', now)
    await initializeBootstrap(db, userId, 'Asia/Tokyo', now)

    await expect(db.select({ title: tasks.title }).from(tasks).where(eq(tasks.userId, userId))).resolves.toEqual([{ title: SAMPLE_TASK_TITLE }])
    await expect(db.select({ event: analyticsEvents.event }).from(analyticsEvents).where(eq(analyticsEvents.userId, userId))).resolves.toEqual([{ event: 'app_opened' }])
  })
})
