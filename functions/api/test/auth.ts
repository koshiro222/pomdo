import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { serializeSignedCookie } from 'better-call'
import { and, eq } from 'drizzle-orm'
import { createAuthInstance, type AuthBindings } from '../../../src/server/auth'
import { createDb } from '../../../src/server/db/client'
import { accounts, focusSessions, sessions, tasks, users } from '../../../src/server/db/schema'
import { linkAnonymousAccountData } from '../../../src/server/services/account-link-service'
import { recordAnalyticsEvent } from '../../../src/server/repositories/analytics-event-repository'

export const testAuthApp = new Hono<{ Bindings: AuthBindings & { DATABASE_URL: string } }>()

testAuthApp.post('/', async (context) => {
  if (context.env.E2E_TEST_MODE !== 'true') return context.json({ error: 'Not found' }, 404)
  const payload: { identity?: string; seedExistingData?: boolean } = await context.req.json<{ identity?: string; seedExistingData?: boolean }>().catch(() => ({ identity: undefined }))
  if (!payload.identity || typeof payload.identity !== 'string') return context.json({ error: 'identity is required' }, 400)
  const db = createDb(context.env.DATABASE_URL)
  const auth = createAuthInstance(context.env)
  const currentSession = await auth.api.getSession({ headers: context.req.raw.headers })
  const identityKey = payload.identity.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 48)
  const email = `e2e-${identityKey}@example.test`
  const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1)
  let targetUser = existingUsers[0]
  if (!targetUser) {
    const createdUsers = await db.insert(users).values({
      id: `e2e-${identityKey}`,
      name: `Google Test ${payload.identity}`,
      email,
      isAnonymous: false,
      timezone: 'Asia/Tokyo',
    }).returning()
    targetUser = createdUsers[0]
    if (!targetUser) return context.json({ error: 'test user could not be created' }, 500)
    await db.insert(accounts).values({
      id: `e2e-account-${identityKey}`,
      accountId: payload.identity,
      providerId: 'google',
      userId: targetUser.id,
    })
  }

  if (payload.seedExistingData && targetUser) {
    const existingTask = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, targetUser.id)).limit(1)
    if (existingTask.length === 0) {
      const seededTask = await db.insert(tasks).values({ userId: targetUser.id, title: 'Google側の既存タスク', plannedFor: '2026-09-04', deckOrder: 'a0' }).returning()
      if (seededTask[0]) await db.update(users).set({ currentTaskId: seededTask[0].id }).where(eq(users.id, targetUser.id))
    }
    const existingSession = await db.select({ id: focusSessions.id }).from(focusSessions).where(eq(focusSessions.userId, targetUser.id)).limit(1)
    if (existingSession.length === 0) {
      const completedAt = new Date('2026-09-04T00:25:00.000Z')
      await db.insert(focusSessions).values({
        id: crypto.randomUUID(), userId: targetUser.id, startedAt: new Date('2026-09-04T00:00:00.000Z'), completedAt, durationSecs: 1500, plannedSecs: 1500,
      })
    }
  }

  const anonymousUserId = currentSession?.user.isAnonymous ? currentSession.user.id : null
  const linkResult = anonymousUserId && anonymousUserId !== targetUser.id
    ? await linkAnonymousAccountData(db, anonymousUserId, targetUser.id)
    : null
  if (anonymousUserId && anonymousUserId !== targetUser.id) await db.delete(users).where(and(eq(users.id, anonymousUserId), eq(users.isAnonymous, true)))
  await recordAnalyticsEvent(db, targetUser.id, 'logged_in')

  const token = crypto.randomUUID()
  await db.insert(sessions).values({
    id: crypto.randomUUID(), userId: targetUser.id, token, expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  })
  const headers = new Headers({ 'content-type': 'application/json' })
  headers.append('set-cookie', await serializeSignedCookie('better-auth.session_token', token, context.env.BETTER_AUTH_SECRET, {
    httpOnly: true,
    maxAge: 90 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  }))
  return new Response(JSON.stringify({ identity: payload.identity, linkResult }), { status: 200, headers })
})

export const onRequest = handle(testAuthApp)
