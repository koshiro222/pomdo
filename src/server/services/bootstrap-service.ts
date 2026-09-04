import { and, eq } from 'drizzle-orm'
import { assertIanaTimeZone } from '../../core/domain/timezone'
import type { Database } from '../db/client'
import { analyticsEvents, tasks, users } from '../db/schema'
import { findCurrentTask, listTasks, sweepOverdueTasksForUser } from '../repositories/task-repository'

export const SAMPLE_TASK_TITLE = 'Pomdo を5分だけ触ってみる'
export const SAMPLE_TASK_NOTE = 'タスクを1つ足して、円盤の再生ボタンを押すだけ。'

function formatDateInTimeZone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date)
}

export async function initializeBootstrap(db: Database, userId: string, timezone?: string, now = new Date()) {
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const user = userRows[0]
  if (!user) throw new Error('ユーザーが見つかりません')
  if (timezone && timezone !== user.timezone) {
    assertIanaTimeZone(timezone)
    await db.update(users).set({ timezone, updatedAt: now }).where(eq(users.id, userId))
    user.timezone = timezone
  }
  const today = formatDateInTimeZone(now, user.timezone)

  await sweepOverdueTasksForUser(db, userId, today)
  await db.transaction(async (transaction) => {
    await transaction.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update')
    const alreadyOpened = await transaction.select({ id: analyticsEvents.id }).from(analyticsEvents).where(and(
      eq(analyticsEvents.userId, userId),
      eq(analyticsEvents.event, 'app_opened'),
    )).limit(1)
    if (alreadyOpened.length > 0) return

    const existingTasks = await transaction.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId)).limit(1)
    if (existingTasks.length === 0) {
      const sampleRows = await transaction.insert(tasks).values({
        userId,
        title: SAMPLE_TASK_TITLE,
        note: SAMPLE_TASK_NOTE,
        plannedFor: today,
        deckOrder: 'a0',
      }).returning()
      const sampleTask = sampleRows[0]
      if (sampleTask) await transaction.update(users).set({ currentTaskId: sampleTask.id }).where(eq(users.id, userId))
    }

    await transaction.insert(analyticsEvents).values({ userId, event: 'app_opened' }).onConflictDoNothing()
  })
  return {
    today,
    resetLongBreakCount: true,
    currentTask: await findCurrentTask(db, userId),
    tasks: await listTasks(db, userId),
  }
}
