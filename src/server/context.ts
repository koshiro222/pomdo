import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Database } from './db/client'
import { createDb } from './db/client'
import { findUserById, markTurnstileVerified, updateLastSeenIfDue } from './repositories/user-repository'
import { verifyTurnstileToken } from './integrations/turnstile'
import { createAuthInstance, type AuthBindings } from './auth'

export type AppEnvironment = AuthBindings & {
  DATABASE_URL: string
  TURNSTILE_SECRET_KEY?: string
  E2E_TEST_MODE?: string
  ADMIN_CRON_SECRET?: string
  SENTRY_DSN?: string
}

export type SessionUser = {
  id: string
  name: string
  email: string
  image?: string | null
  isAnonymous: boolean
  timezone: string
  soundMuted: boolean
  soundVolume: number
  theme: 'system' | 'light' | 'dark'
  turnstileVerifiedAt?: Date | null
}

export type AppContext = {
  db: Database
  env: AppEnvironment
  request: Request
  now: Date
  user: SessionUser | null
}

export function resolveRequestNow(request: Request, e2eTestMode: string | undefined): Date {
  const requestedNow = e2eTestMode === 'true' ? request.headers.get('x-e2e-now') : null
  return requestedNow && !Number.isNaN(Date.parse(requestedNow)) ? new Date(requestedNow) : new Date()
}

export async function createContext(request: Request, env: AppEnvironment): Promise<AppContext> {
  const db = createDb(env.DATABASE_URL)
  const auth = createAuthInstance(env)
  const session = await auth.api.getSession({ headers: request.headers })
  const user = session?.user ? mapSessionUser(session.user) : null
  const now = resolveRequestNow(request, env.E2E_TEST_MODE)

  if (user) await updateLastSeenIfDue(db, user.id, now)
  return { db, env, request, now, user }
}

function mapSessionUser(value: Record<string, unknown>): SessionUser {
  return {
    id: String(value.id),
    name: String(value.name ?? ''),
    email: String(value.email ?? ''),
    image: typeof value.image === 'string' ? value.image : null,
    isAnonymous: value.isAnonymous === true,
    timezone: typeof value.timezone === 'string' ? value.timezone : 'UTC',
    soundMuted: value.soundMuted === true,
    soundVolume: typeof value.soundVolume === 'number' ? value.soundVolume : 0.7,
    theme: value.theme === 'light' || value.theme === 'dark' ? value.theme : 'system',
    turnstileVerifiedAt: value.turnstileVerifiedAt instanceof Date ? value.turnstileVerifiedAt : null,
  }
}

const t = initTRPC.context<AppContext>().create({ transformer: superjson })

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'セッションが必要です' })
  return next({ ctx: { ...ctx, user: ctx.user } })
})

export const turnstileProcedure = protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
  const databaseUser = await findUserById(ctx.db, ctx.user.id)
  if (!databaseUser) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'ユーザーが見つかりません' })
  if (databaseUser.turnstileVerifiedAt) return next({ ctx: { ...ctx, user: ctx.user } })

  const rawInput = await getRawInput()
  const token = typeof rawInput === 'object' && rawInput !== null && 'turnstileToken' in rawInput
    ? rawInput.turnstileToken
    : undefined
  if (typeof token !== 'string' || token.length === 0) {
    throw new TRPCError({ code: 'FORBIDDEN', message: '確認が完了していません' })
  }
  const verified = await verifyTurnstileToken(
    ctx.env,
    token,
    ctx.request.headers.get('CF-Connecting-IP') ?? undefined,
  )
  if (!verified) throw new TRPCError({ code: 'FORBIDDEN', message: '確認に失敗しました' })
  const verifiedAt = new Date()
  await markTurnstileVerified(ctx.db, ctx.user.id, verifiedAt)
  return next({ ctx: { ...ctx, user: { ...ctx.user, turnstileVerifiedAt: verifiedAt } } })
})
