// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { and, eq } from 'drizzle-orm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestDb, type TestDb } from '../db/client'
import { analyticsEvents, focusSessions, tasks, users } from '../db/schema'
import { linkAnonymousAccountData } from './account-link-service'

describe('匿名アカウントの結合', () => {
  let client: PGlite
  let db: TestDb

  beforeEach(async () => {
    client = new PGlite()
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0000_v1_initial.sql'), 'utf8'))
    await client.exec(readFileSync(resolve(process.cwd(), 'drizzle/0001_v1_constraints.sql'), 'utf8'))
    db = createTestDb(client)
  })

  afterEach(async () => { await client.close() })

  it('Google側が空なら Task、Focus、analytics、設定を移す', async () => {
    const sourceId = crypto.randomUUID()
    const targetId = crypto.randomUUID()
    const taskId = crypto.randomUUID()
    await db.insert(users).values([
      { id: sourceId, name: 'Anonymous', email: `${sourceId}@example.com`, isAnonymous: true, timezone: 'Asia/Tokyo', soundMuted: true, soundVolume: 0.4, theme: 'dark' },
      { id: targetId, name: 'Google', email: `${targetId}@example.com`, timezone: 'UTC' },
    ])
    await db.insert(tasks).values({ id: taskId, userId: sourceId, title: '引き継ぐ', plannedFor: '2026-09-04' })
    await db.update(users).set({ currentTaskId: taskId }).where(eq(users.id, sourceId))
    await db.insert(focusSessions).values({ id: crypto.randomUUID(), userId: sourceId, taskId, startedAt: new Date('2026-09-04T00:00:00Z'), completedAt: new Date('2026-09-04T00:25:00Z'), durationSecs: 1500, plannedSecs: 1500 })
    await db.insert(analyticsEvents).values([
      { userId: sourceId, event: 'app_opened' },
      { userId: sourceId, event: 'logged_in' },
    ])
    await db.insert(analyticsEvents).values({ userId: targetId, event: 'app_opened' })

    await expect(linkAnonymousAccountData(db, sourceId, targetId)).resolves.toBe('migrated')
    const [migratedTask] = await db.select().from(tasks).where(eq(tasks.id, taskId))
    const migratedSessions = await db.select().from(focusSessions).where(eq(focusSessions.userId, targetId))
    const sourceEvents = await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, sourceId))
    const targetEvents = await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, targetId))
    const [target] = await db.select().from(users).where(eq(users.id, targetId))
    expect(migratedTask?.userId).toBe(targetId)
    expect(migratedSessions).toHaveLength(1)
    expect(sourceEvents).toHaveLength(0)
    expect(targetEvents.map((event) => event.event).sort()).toEqual(['app_opened', 'logged_in'])
    expect(target?.currentTaskId).toBe(taskId)
    expect(target?.timezone).toBe('Asia/Tokyo')
    expect(target?.soundMuted).toBe(true)
    expect(target?.soundVolume).toBe(0.4)
    expect(target?.theme).toBe('dark')
  })

  it('Google側に Task があれば匿名側を変更せず discarded を返す', async () => {
    const sourceId = crypto.randomUUID()
    const targetId = crypto.randomUUID()
    await db.insert(users).values([
      { id: sourceId, name: 'Anonymous', email: `${sourceId}@example.com`, isAnonymous: true },
      { id: targetId, name: 'Google', email: `${targetId}@example.com` },
    ])
    await db.insert(tasks).values([
      { userId: sourceId, title: '匿名側' },
      { userId: targetId, title: 'Google側' },
    ])

    await expect(linkAnonymousAccountData(db, sourceId, targetId)).resolves.toBe('discarded')
    await expect(db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.userId, sourceId), eq(tasks.title, '匿名側')))).resolves.toHaveLength(1)
  })
})
