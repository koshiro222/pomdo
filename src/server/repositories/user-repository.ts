import { and, eq, lt } from 'drizzle-orm'
import type { Database } from '../db/client'
import { users } from '../db/schema'

export async function findUserById(db: Database, userId: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return rows[0] ?? null
}

export async function updateLastSeenIfDue(db: Database, userId: string, now: Date): Promise<void> {
  const threshold = new Date(now.getTime() - 60 * 60 * 1000)
  await db.update(users)
    .set({ lastSeenAt: now, updatedAt: now })
    .where(and(eq(users.id, userId), lt(users.lastSeenAt, threshold)))
}

export async function updateUserSettings(
  db: Database,
  userId: string,
  settings: Partial<Pick<typeof users.$inferInsert, 'soundMuted' | 'soundVolume' | 'theme' | 'timezone'>>,
) {
  const rows = await db.update(users)
    .set({ ...settings, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()
  return rows[0] ?? null
}

export async function markTurnstileVerified(db: Database, userId: string, verifiedAt: Date) {
  await db.update(users)
    .set({ turnstileVerifiedAt: verifiedAt, updatedAt: verifiedAt })
    .where(eq(users.id, userId))
}

export async function setCurrentTaskId(db: Database, userId: string, taskId: string | null) {
  await db.update(users)
    .set({ currentTaskId: taskId, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

export async function deleteUser(db: Database, userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId))
}
