import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import type { Database } from '../db/client'
import { focusSessions, users } from '../db/schema'

export type FocusSessionInsert = typeof focusSessions.$inferInsert

export async function insertFocusSession(db: Database, input: FocusSessionInsert) {
  const rows = await db.insert(focusSessions).values(input).onConflictDoNothing().returning()
  return rows[0] ?? null
}

export async function findFocusSession(db: Database, userId: string, sessionId: string) {
  const rows = await db.select().from(focusSessions).where(and(
    eq(focusSessions.id, sessionId),
    eq(focusSessions.userId, userId),
  )).limit(1)
  return rows[0] ?? null
}

export async function listFocusSessions(db: Database, userId: string) {
  return db.select().from(focusSessions).where(eq(focusSessions.userId, userId)).orderBy(desc(focusSessions.startedAt))
}

export async function listSessionsStartedSince(db: Database, userId: string, since: Date) {
  return db.select().from(focusSessions).where(and(
    eq(focusSessions.userId, userId),
    gte(focusSessions.startedAt, since),
  )).orderBy(desc(focusSessions.startedAt))
}

export async function listCompletedSessions(db: Database, userId: string) {
  return db.select().from(focusSessions).where(and(
    eq(focusSessions.userId, userId),
    isNotNull(focusSessions.completedAt),
  )).orderBy(desc(focusSessions.completedAt))
}

export async function listInterruptedSessions(db: Database, userId: string) {
  return db.select().from(focusSessions).where(and(
    eq(focusSessions.userId, userId),
    isNull(focusSessions.completedAt),
  )).orderBy(desc(focusSessions.startedAt))
}

export async function countUserFocusSessions(db: Database, userId: string) {
  const rows = await db.select({ id: focusSessions.id }).from(focusSessions).where(eq(focusSessions.userId, userId)).limit(1)
  return rows.length
}

export async function listSessionsInRange(db: Database, userId: string, from: Date, to: Date) {
  return db.select().from(focusSessions).where(and(
    eq(focusSessions.userId, userId),
    gte(focusSessions.startedAt, from),
    lt(focusSessions.startedAt, to),
  )).orderBy(desc(focusSessions.startedAt))
}

export async function listDailyFocusSummaries(db: Database, userId: string) {
  const localDate = sql<string>`(${focusSessions.startedAt} AT TIME ZONE ${users.timezone})::date`
  return db.select({
    date: localDate,
    totalFocusSecs: sql<number>`coalesce(sum(${focusSessions.durationSecs}), 0)::int`.mapWith(Number),
    completedFocusCount: sql<number>`count(*) filter (where ${focusSessions.completedAt} is not null)`.mapWith(Number),
    interruptedFocusCount: sql<number>`count(*) filter (where ${focusSessions.completedAt} is null)`.mapWith(Number),
  }).from(focusSessions).innerJoin(users, eq(focusSessions.userId, users.id)).where(eq(focusSessions.userId, userId)).groupBy(localDate).orderBy(localDate)
}
