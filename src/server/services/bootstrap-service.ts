import { eq, sql } from 'drizzle-orm'
import { assertIanaTimeZone } from '../../core/domain/timezone'
import type { Database } from '../db/client'
import { users } from '../db/schema'
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
  await db.execute(sql`
    WITH opened AS (
      INSERT INTO analytics_events (user_id, event)
      VALUES (${userId}, 'app_opened')
      ON CONFLICT (user_id, event) DO NOTHING
      RETURNING user_id
    ), sample_task AS (
      INSERT INTO tasks (user_id, title, note, planned_for, deck_order)
      SELECT opened.user_id, ${SAMPLE_TASK_TITLE}, ${SAMPLE_TASK_NOTE}, ${today}, 'a0'
      FROM opened
      WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = ${userId})
      RETURNING id
    ), set_current_task AS (
      UPDATE users
      SET current_task_id = sample_task.id
      FROM sample_task
      WHERE users.id = ${userId}
      RETURNING users.id
    )
    SELECT 1 FROM set_current_task
  `)
  return {
    today,
    resetLongBreakCount: true,
    currentTask: await findCurrentTask(db, userId),
    tasks: await listTasks(db, userId),
  }
}
