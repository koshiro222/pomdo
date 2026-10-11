import { and, eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { analyticsEvents } from '../db/schema'

export type AnalyticsEventName = typeof analyticsEvents.$inferInsert['event']

export async function recordAnalyticsEvent(db: Database, userId: string, event: AnalyticsEventName) {
  const rows = await db.insert(analyticsEvents).values({ userId, event }).returning().onConflictDoNothing()
  return rows.length > 0
}

export async function hasAnalyticsEvent(db: Database, userId: string, event: AnalyticsEventName) {
  const rows = await db.select({ id: analyticsEvents.id }).from(analyticsEvents).where(and(
    eq(analyticsEvents.userId, userId),
    eq(analyticsEvents.event, event),
  )).limit(1)
  return rows.length > 0
}
