import { and, asc, desc, eq, isNotNull, isNull, lt, ne } from 'drizzle-orm'
import type { Database } from '../db/client'
import { tasks, users } from '../db/schema'

export async function listTasks(db: Database, userId: string) {
  return db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(asc(tasks.deckOrder), desc(tasks.createdAt))
}

export async function findTaskById(db: Database, userId: string, taskId: string) {
  const rows = await db.select().from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .limit(1)
  return rows[0] ?? null
}

export async function countUserTasks(db: Database, userId: string) {
  const rows = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId)).limit(1)
  return rows.length
}

export async function createTask(db: Database, input: typeof tasks.$inferInsert) {
  const rows = await db.insert(tasks).values(input).returning()
  return rows[0]
}

export async function updateTask(db: Database, userId: string, taskId: string, input: Partial<typeof tasks.$inferInsert>) {
  const rows = await db.update(tasks)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
  return rows[0] ?? null
}

export async function updateDeckOrders(
  db: Database,
  userId: string,
  updates: readonly { id: string; deckOrder: string }[],
) {
  await db.transaction(async (transaction) => {
    for (const update of updates) {
      await transaction.update(tasks)
        .set({ deckOrder: update.deckOrder, updatedAt: new Date() })
        .where(and(eq(tasks.id, update.id), eq(tasks.userId, userId)))
    }
  })
}

export async function deleteTask(db: Database, userId: string, taskId: string) {
  return db.transaction(async (transaction) => {
    const rows = await transaction.delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning()
    if (rows.length > 0) await transaction.update(users).set({ currentTaskId: null, updatedAt: new Date() }).where(and(eq(users.id, userId), eq(users.currentTaskId, taskId)))
    return rows[0] ?? null
  })
}

export async function completeTask(db: Database, userId: string, taskId: string) {
  return db.transaction(async (transaction) => {
    const rows = await transaction.update(tasks)
      .set({ completedAt: new Date(), deckOrder: null, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning()
    if (rows.length > 0) await transaction.update(users).set({ currentTaskId: null, updatedAt: new Date() }).where(and(eq(users.id, userId), eq(users.currentTaskId, taskId)))
    return rows[0] ?? null
  })
}

export async function moveTaskToNow(
  db: Database,
  userId: string,
  taskId: string,
  input: Partial<typeof tasks.$inferInsert>,
) {
  return db.transaction(async (transaction) => {
    const rows = await transaction.update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.completedAt)))
      .returning()
    if (rows.length > 0) await transaction.update(users).set({ currentTaskId: taskId, updatedAt: new Date() }).where(eq(users.id, userId))
    return rows[0] ?? null
  })
}

export async function clearCurrentTask(db: Database, userId: string, taskId: string) {
  await db.update(users).set({ currentTaskId: null, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.currentTaskId, taskId)))
}

export async function findCurrentTask(db: Database, userId: string) {
  const rows = await db.select({ task: tasks })
    .from(users)
    .leftJoin(tasks, and(eq(users.currentTaskId, tasks.id), eq(tasks.userId, users.id)))
    .where(eq(users.id, userId))
    .limit(1)
  return rows[0]?.task ?? null
}

export async function sweepOverdueTasksForUser(db: Database, userId: string, today: string) {
  const userRows = await db.select({ currentTaskId: users.currentTaskId }).from(users).where(eq(users.id, userId)).limit(1)
  const currentTaskId = userRows[0]?.currentTaskId
  const conditions = [eq(tasks.userId, userId), lt(tasks.plannedFor, today)]
  if (currentTaskId) conditions.push(ne(tasks.id, currentTaskId))
  await db.update(tasks).set({ plannedFor: null, deckOrder: null, updatedAt: new Date() })
    .where(and(...conditions))
  if (currentTaskId) {
    await db.update(tasks).set({ plannedFor: today, updatedAt: new Date() })
      .where(and(eq(tasks.id, currentTaskId), eq(tasks.userId, userId)))
  }
}

export async function findDeckTasks(db: Database, userId: string, today: string) {
  return db.select().from(tasks).where(and(
    eq(tasks.userId, userId),
    eq(tasks.plannedFor, today),
    isNull(tasks.completedAt),
  )).orderBy(asc(tasks.deckOrder), asc(tasks.createdAt))
}

export async function findBacklogTasks(db: Database, userId: string) {
  return db.select().from(tasks).where(and(
    eq(tasks.userId, userId),
    isNull(tasks.plannedFor),
    isNull(tasks.completedAt),
  )).orderBy(desc(tasks.createdAt))
}

export async function findCompletedTasks(db: Database, userId: string) {
  return db.select().from(tasks).where(and(eq(tasks.userId, userId), isNotNull(tasks.completedAt))).orderBy(desc(tasks.completedAt))
}
