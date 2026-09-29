import { betterAuth } from 'better-auth'
import { anonymous } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createDb } from './db/client'
import * as schema from './db/schema'
import { linkAnonymousAccountData } from './services/account-link-service'
import { recordLoggedIn } from './services/analytics-service'

export type AuthBindings = {
  DATABASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  FRONTEND_URL?: string
  E2E_TEST_MODE?: string
}

export function createAuthInstance(environment: AuthBindings) {
  const db = createDb(environment.DATABASE_URL)
  const localOrigins = environment.E2E_TEST_MODE === 'true' || environment.BETTER_AUTH_URL.includes('localhost')
    ? ['http://localhost:5173', 'http://localhost:8788']
    : []

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    secret: environment.BETTER_AUTH_SECRET,
    baseURL: environment.BETTER_AUTH_URL,
    basePath: '/api/auth',
    trustedOrigins: [environment.FRONTEND_URL ?? environment.BETTER_AUTH_URL, ...localOrigins],
    socialProviders: {
      google: {
        clientId: environment.GOOGLE_CLIENT_ID,
        clientSecret: environment.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [anonymous({
      onLinkAccount: async ({ anonymousUser, newUser, ctx }) => {
        const result = await linkAnonymousAccountData(
          db,
          anonymousUser.user.id,
          newUser.user.id,
        )
        await recordLoggedIn(db, newUser.user.id)
        ctx.setCookie('pomdo-account-link-result', result, {
          httpOnly: false,
          maxAge: 5 * 60,
          path: '/',
          sameSite: 'lax',
        })
      },
    })],
    user: {
      additionalFields: {
        isAnonymous: { type: 'boolean', input: false, defaultValue: false },
        timezone: { type: 'string', input: true, defaultValue: 'UTC' },
        soundMuted: { type: 'boolean', input: true, defaultValue: false },
        soundVolume: { type: 'number', input: true, defaultValue: 0.7 },
        theme: { type: 'string', input: true, defaultValue: 'system' },
        lastSeenAt: { type: 'date', input: false, defaultValue: () => new Date() },
        turnstileVerifiedAt: { type: 'date', input: false, required: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 90,
      updateAge: 60 * 60 * 24,
    },
  })
}
