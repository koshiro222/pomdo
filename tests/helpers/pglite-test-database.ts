import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { createTestDb, type TestDb } from '../../src/server/db/client'

const pgliteMigrationFilePaths = [
  'drizzle/0000_v1_initial.sql',
  'drizzle/0001_v1_constraints.sql',
] as const

const pgliteTestTableNames = [
  'accounts',
  'analytics_events',
  'focus_sessions',
  'sessions',
  'tasks',
  'users',
  'verifications',
] as const

const truncatePGliteTestTablesSql = `TRUNCATE TABLE ${pgliteTestTableNames.map((tableName) => `"${tableName}"`).join(', ')} CASCADE`

export type PGliteTestDatabase = {
  db: TestDb
  truncateTables: () => Promise<void>
  close: () => Promise<void>
}

export async function createPGliteTestDatabase(): Promise<PGliteTestDatabase> {
  const client = new PGlite()

  try {
    for (const migrationPath of pgliteMigrationFilePaths) {
      await client.exec(readFileSync(resolve(process.cwd(), migrationPath), 'utf8'))
    }
  } catch (error) {
    await client.close()
    throw error
  }

  return {
    db: createTestDb(client),
    async truncateTables() {
      await client.exec(truncatePGliteTestTablesSql)
    },
    async close() {
      await client.close()
    },
  }
}
