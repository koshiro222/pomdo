import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm'
import type { Database, TestDb } from '../db/client'
import { tasks, users } from '../db/schema'

type TaskRow = typeof tasks.$inferSelect
type BatchDatabase = {
  batch: (queries: readonly unknown[]) => Promise<unknown>
}
type TaskIdReturningDelete = {
  returning: (selection: { id: typeof tasks.id }) => PromiseLike<Array<{ id: string }>>
}

function getBatch(database: Database): BatchDatabase['batch'] | null {
  const candidate = database as unknown as Partial<BatchDatabase>
  return typeof candidate.batch === 'function' ? candidate.batch.bind(database) : null
}

async function runBatch<T>(
  database: Database,
  queries: readonly unknown[],
  fallback: () => Promise<T[]>,
): Promise<T[]> {
  const batch = getBatch(database)
  if (!batch) return fallback()
  const results = await batch(queries)
  if (!Array.isArray(results) || !Array.isArray(results[0])) return []
  return results[0] as T[]
}

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
  if (updates.length === 0) return
  const queries = updates.map((update) => db.update(tasks)
      .set({ deckOrder: update.deckOrder, updatedAt: new Date() })
      .where(and(eq(tasks.id, update.id), eq(tasks.userId, userId))))
  await runBatch(db, queries, async () => {
    for (const query of queries) await query
    return []
  })
}

export async function deleteTask(db: Database, userId: string, taskId: string) {
  const deleteQuery = db.delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
  const clearCurrentTaskQuery = db.update(users)
    .set({ currentTaskId: null, updatedAt: new Date() })
    .where(and(eq(users.id, userId), eq(users.currentTaskId, taskId)))
  const rows = await runBatch<TaskRow>(db, [deleteQuery, clearCurrentTaskQuery], async () => {
    const deletedRows = await deleteQuery
    if (deletedRows.length > 0) await clearCurrentTaskQuery
    return deletedRows
  })
  return rows[0] ?? null
}

export async function deleteTasks(db: Database, userId: string, taskIds: string[]) {
  if (taskIds.length === 0) return []
  const deleteQuery = db.delete(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, taskIds))) as unknown as TaskIdReturningDelete
  return deleteQuery.returning({ id: tasks.id })
}

type TaskReplacementPlan = {
  replacementTasks: Array<typeof tasks.$inferInsert>
  deckOrderUpdates: readonly { id: string; deckOrder: string }[]
  currentTaskReplacementId: string | null
}

function buildTaskReplacementQueries(
  db: Database,
  userId: string,
  sourceTaskId: string,
  plan: TaskReplacementPlan,
) {
  const deleteSourceQuery = db.delete(tasks)
    .where(and(eq(tasks.id, sourceTaskId), eq(tasks.userId, userId)))
  const insertReplacementQuery = db.insert(tasks).values(plan.replacementTasks)
  const updateDeckOrderQueries = plan.deckOrderUpdates.map((update) => db.update(tasks)
    .set({ deckOrder: update.deckOrder, updatedAt: new Date() })
    .where(and(eq(tasks.id, update.id), eq(tasks.userId, userId))))
  const updateCurrentTaskQuery = plan.currentTaskReplacementId
    ? db.update(users)
      .set({ currentTaskId: plan.currentTaskReplacementId, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.currentTaskId, sourceTaskId)))
    : null

  return { deleteSourceQuery, insertReplacementQuery, updateDeckOrderQueries, updateCurrentTaskQuery }
}

async function executeTaskReplacementQueries(
  queries: ReturnType<typeof buildTaskReplacementQueries>,
): Promise<void> {
  await queries.insertReplacementQuery
  if (queries.updateCurrentTaskQuery) await queries.updateCurrentTaskQuery
  await queries.deleteSourceQuery
  for (const query of queries.updateDeckOrderQueries) await query
}

export async function replaceTaskWithDecomposedTasks(
  db: Database,
  userId: string,
  sourceTaskId: string,
  plan: TaskReplacementPlan,
): Promise<void> {
  const batch = getBatch(db)
  if (batch) {
    const queries = buildTaskReplacementQueries(db, userId, sourceTaskId, plan)
    const allQueries = [
      queries.insertReplacementQuery,
      ...(queries.updateCurrentTaskQuery ? [queries.updateCurrentTaskQuery] : []),
      queries.deleteSourceQuery,
      ...queries.updateDeckOrderQueries,
    ]
    await batch(allQueries)
    return
  }

  const transaction = (db as Partial<TestDb>).transaction
  if (typeof transaction !== 'function') throw new Error('Task置換に対応するトランザクション機能がありません')
  await transaction.call(db, async (transactionDb) => {
    await executeTaskReplacementQueries(buildTaskReplacementQueries(transactionDb as unknown as Database, userId, sourceTaskId, plan))
  })
}

export async function completeTask(db: Database, userId: string, taskId: string) {
  const now = new Date()
  const completeQuery = db.update(tasks)
    .set({ completedAt: now, deckOrder: null, updatedAt: now })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning()
  const clearCurrentTaskQuery = db.update(users)
    .set({ currentTaskId: null, updatedAt: now })
    .where(and(eq(users.id, userId), eq(users.currentTaskId, taskId)))
  const rows = await runBatch<TaskRow>(db, [completeQuery, clearCurrentTaskQuery], async () => {
    const updatedRows = await completeQuery
    if (updatedRows.length > 0) await clearCurrentTaskQuery
    return updatedRows
  })
  return rows[0] ?? null
}

export async function moveTaskToNow(
  db: Database,
  userId: string,
  taskId: string,
  input: Partial<typeof tasks.$inferInsert>,
) {
  const moveQuery = db.update(tasks)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId), isNull(tasks.completedAt)))
    .returning()
  const setCurrentTaskQuery = db.update(users)
    .set({ currentTaskId: taskId, updatedAt: new Date() })
    .where(and(
      eq(users.id, userId),
      sql`exists (select 1 from tasks where tasks.id = ${taskId} and tasks.user_id = ${userId} and tasks.completed_at is null)`,
    ))
  const rows = await runBatch<TaskRow>(db, [moveQuery, setCurrentTaskQuery], async () => {
    const updatedRows = await moveQuery
    if (updatedRows.length > 0) await setCurrentTaskQuery
    return updatedRows
  })
  return rows[0] ?? null
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
