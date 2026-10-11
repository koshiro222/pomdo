import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import type { PGlite } from '@electric-sql/pglite'
import * as schema from './schema'

export function createDb(databaseUrl: string) {
  return drizzleNeon(neon(databaseUrl), { schema })
}

export function createTestDb(client: PGlite) {
  return drizzlePglite(client, { schema })
}

export type Db = ReturnType<typeof createDb>
export type TestDb = ReturnType<typeof createTestDb>
export type Database = Db | TestDb
