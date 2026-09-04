import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { analyticsEvents, focusSessions, tasks, users } from '../db/schema'

export type AccountLinkResult = 'migrated' | 'discarded'

export async function linkAnonymousAccountData(
  db: Database,
  anonymousUserId: string,
  newUserId: string,
): Promise<AccountLinkResult> {
  return db.transaction(async (transaction) => {
    const [source] = await transaction.select().from(users).where(eq(users.id, anonymousUserId)).limit(1)
    if (!source) return 'discarded'

    const [existingTask] = await transaction.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, newUserId)).limit(1)
    const [existingSession] = await transaction.select({ id: focusSessions.id }).from(focusSessions).where(eq(focusSessions.userId, newUserId)).limit(1)
    if (existingTask || existingSession) return 'discarded'

    await transaction.update(tasks).set({ userId: newUserId }).where(eq(tasks.userId, anonymousUserId))
    await transaction.update(focusSessions).set({ userId: newUserId }).where(eq(focusSessions.userId, anonymousUserId))
    const sourceEvents = await transaction.select().from(analyticsEvents).where(eq(analyticsEvents.userId, anonymousUserId))
    if (sourceEvents.length > 0) {
      await transaction.insert(analyticsEvents).values(sourceEvents.map((event) => ({
        id: crypto.randomUUID(),
        userId: newUserId,
        event: event.event,
        createdAt: event.createdAt,
      }))).onConflictDoNothing()
      await transaction.delete(analyticsEvents).where(eq(analyticsEvents.userId, anonymousUserId))
    }
    await transaction.update(users).set({
      currentTaskId: source.currentTaskId,
      timezone: source.timezone,
      soundMuted: source.soundMuted,
      soundVolume: source.soundVolume,
      theme: source.theme,
      updatedAt: new Date(),
    }).where(eq(users.id, newUserId))

    return 'migrated'
  })
}

export async function countDomainData(db: Database, userId: string): Promise<number> {
  const [task, session] = await Promise.all([
    db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId)).limit(1),
    db.select({ id: focusSessions.id }).from(focusSessions).where(eq(focusSessions.userId, userId)).limit(1),
  ])
  return task.length + session.length
}
