// @vitest-environment node

import { eq } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { AppContext } from '../../src/server/context'
import type { TestDb } from '../../src/server/db/client'
import { focusSessions, tasks, users } from '../../src/server/db/schema'
import { focusRouter } from '../../src/server/routers/focus'
import { tasksRouter } from '../../src/server/routers/tasks'
import { createPGliteTestDatabase, type PGliteTestDatabase } from '../helpers/pglite-test-database'

describe('tasks.deleteMany integration', () => {
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
    await db.insert(users).values({ id: userId, name: 'Test', email: `${userId}@example.com`, isAnonymous: true })
    return userId
  }

  function context(userId: string | null, now: Date): AppContext {
    return {
      db,
      env: {
        DATABASE_URL: 'postgres://unused',
        GOOGLE_CLIENT_ID: 'test-client',
        GOOGLE_CLIENT_SECRET: 'test-secret',
        BETTER_AUTH_SECRET: 'test-focus-secret-at-least-32-characters-long',
        BETTER_AUTH_URL: 'http://localhost:5173',
        E2E_TEST_MODE: 'true',
      },
      request: new Request('http://localhost:5173/api/trpc'),
      now,
      user: userId ? {
        id: userId,
        name: 'Test',
        email: `${userId}@example.com`,
        isAnonymous: true,
        timezone: 'UTC',
        soundMuted: false,
        soundVolume: 0.7,
        theme: 'system',
        turnstileVerifiedAt: null,
      } : null,
    }
  }

  it('空配列とTurnstile未確認を拒否し、自分の選択Taskだけを削除する', async () => {
    const userId = await createUser()
    const otherUserId = await createUser()
    const selectedTaskId = crypto.randomUUID()
    const unselectedTaskId = crypto.randomUUID()
    const otherUserTaskId = crypto.randomUUID()
    const now = new Date('2026-09-04T00:00:00.000Z')
    await db.insert(tasks).values([
      { id: selectedTaskId, userId, title: '選択したTask' },
      { id: unselectedTaskId, userId, title: '未選択Task' },
      { id: otherUserTaskId, userId: otherUserId, title: '他ユーザーTask' },
    ])
    const caller = tasksRouter.createCaller(context(userId, now))

    await expect(caller.deleteMany({ ids: [selectedTaskId] })).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(caller.deleteMany({ ids: [], turnstileToken: 'e2e-turnstile-token' })).rejects.toMatchObject({ code: 'BAD_REQUEST' })
    await expect(caller.deleteMany({ ids: [selectedTaskId], turnstileToken: 'e2e-turnstile-token' })).resolves.toEqual([selectedTaskId])
    await expect(caller.deleteMany({ ids: [otherUserTaskId], turnstileToken: 'e2e-turnstile-token' })).rejects.toMatchObject({ code: 'NOT_FOUND' })

    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, selectedTaskId))).toHaveLength(0)
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, unselectedTaskId))).toHaveLength(1)
    expect(await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, otherUserTaskId))).toHaveLength(1)
  })

  it('削除後も完了・中断したFocus SessionをTaskなしで記録し、履歴の時間を保つ', async () => {
    const userId = await createUser()
    const completedTaskId = crypto.randomUUID()
    const interruptedTaskId = crypto.randomUUID()
    await db.insert(tasks).values([
      { id: completedTaskId, userId, title: '完了時に削除するTask' },
      { id: interruptedTaskId, userId, title: '中断時に削除するTask' },
    ])

    const startAt = new Date('2026-09-04T00:00:00.000Z')
    const completedSessionId = crypto.randomUUID()
    const startCaller = focusRouter.createCaller(context(userId, startAt))
    const completedProof = await startCaller.start({ sessionId: completedSessionId, taskId: completedTaskId, plannedSecs: 900, turnstileToken: 'e2e-turnstile-token' })
    await tasksRouter.createCaller(context(userId, startAt)).deleteMany({ ids: [completedTaskId], turnstileToken: 'e2e-turnstile-token' })
    await focusRouter.createCaller(context(userId, new Date(startAt.getTime() + 900_000))).complete({
      id: completedSessionId,
      taskId: completedTaskId,
      startedAt: completedProof.now,
      endsAt: new Date(startAt.getTime() + 900_000).toISOString(),
      startToken: completedProof.startToken,
      plannedSecs: 900,
      turnstileToken: 'e2e-turnstile-token',
    })

    const interruptedStartAt = new Date('2026-09-04T01:00:00.000Z')
    const interruptedSessionId = crypto.randomUUID()
    const interruptedProof = await focusRouter.createCaller(context(userId, interruptedStartAt)).start({ sessionId: interruptedSessionId, taskId: interruptedTaskId, plannedSecs: 900, turnstileToken: 'e2e-turnstile-token' })
    await tasksRouter.createCaller(context(userId, interruptedStartAt)).deleteMany({ ids: [interruptedTaskId], turnstileToken: 'e2e-turnstile-token' })
    await focusRouter.createCaller(context(userId, new Date(interruptedStartAt.getTime() + 60_000))).interrupt({
      id: interruptedSessionId,
      taskId: interruptedTaskId,
      startedAt: interruptedProof.now,
      stoppedAt: new Date(interruptedStartAt.getTime() + 60_000).toISOString(),
      startToken: interruptedProof.startToken,
      plannedSecs: 900,
      turnstileToken: 'e2e-turnstile-token',
    })

    const sessions = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId))
    expect(sessions).toHaveLength(2)
    expect(sessions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: completedSessionId, taskId: null, durationSecs: 900, completedAt: expect.any(Date) }),
      expect.objectContaining({ id: interruptedSessionId, taskId: null, durationSecs: 60, completedAt: null }),
    ]))
  })
})
