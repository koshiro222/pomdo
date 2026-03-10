import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createDb } from './db'
import * as schema from './schema'

export type AuthBindings = {
  DATABASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

export function createAuthInstance(env: AuthBindings) {
  const db = createDb(env.DATABASE_URL)
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
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        // Issue #119 でメール送信を実装予定
        console.log(`[emailVerification] user=${user.email} url=${url}`)
      },
    },
    advanced: {
      database: {
        // DB の id カラムが uuid 型のため、nanoid ではなく UUID を生成する
        generateId: () => crypto.randomUUID(),
      },
    },
  })
}
