import { eq, sql } from 'drizzle-orm'
import type { Database } from '../db/client'
import { focusSessions, tasks } from '../db/schema'

export type AccountLinkResult = 'migrated' | 'discarded'

export async function linkAnonymousAccountData(
  db: Database,
  anonymousUserId: string,
  newUserId: string,
): Promise<AccountLinkResult> {
  const result = await db.execute(sql`
    WITH source_user AS (
      SELECT id, current_task_id, timezone, sound_muted, sound_volume, theme
      FROM users
      WHERE id = ${anonymousUserId}
      FOR UPDATE
    ), target_user AS (
      SELECT id
      FROM users
      WHERE id = ${newUserId}
      FOR UPDATE
    ), can_migrate AS (
      SELECT source_user.*
      FROM source_user
      INNER JOIN target_user ON true
      WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = ${newUserId})
        AND NOT EXISTS (SELECT 1 FROM focus_sessions WHERE user_id = ${newUserId})
    ), moved_tasks AS (
      UPDATE tasks
      SET user_id = ${newUserId}
      WHERE user_id = ${anonymousUserId}
        AND EXISTS (SELECT 1 FROM can_migrate)
      RETURNING id
    ), moved_sessions AS (
      UPDATE focus_sessions
      SET user_id = ${newUserId}
      WHERE user_id = ${anonymousUserId}
        AND EXISTS (SELECT 1 FROM can_migrate)
      RETURNING id
    ), copied_events AS (
      INSERT INTO analytics_events (id, user_id, event, created_at)
      SELECT gen_random_uuid(), ${newUserId}, event, created_at
      FROM analytics_events
      WHERE user_id = ${anonymousUserId}
        AND EXISTS (SELECT 1 FROM can_migrate)
      ON CONFLICT (user_id, event) DO NOTHING
      RETURNING id
    ), deleted_events AS (
      DELETE FROM analytics_events
      WHERE user_id = ${anonymousUserId}
        AND EXISTS (SELECT 1 FROM can_migrate)
      RETURNING id
    ), updated_target AS (
      UPDATE users
      SET current_task_id = can_migrate.current_task_id,
          timezone = can_migrate.timezone,
          sound_muted = can_migrate.sound_muted,
          sound_volume = can_migrate.sound_volume,
          theme = can_migrate.theme,
          updated_at = now()
      FROM can_migrate
      WHERE users.id = ${newUserId}
      RETURNING users.id
    )
    SELECT CASE WHEN EXISTS (SELECT 1 FROM updated_target) THEN 'migrated' ELSE 'discarded' END AS result
  `)
  const resultRows = (result as unknown as { rows?: unknown }).rows
  const firstRow = Array.isArray(resultRows) ? resultRows[0] as { result?: unknown } | undefined : undefined
  return firstRow?.result === 'migrated' ? 'migrated' : 'discarded'
}

export async function countDomainData(db: Database, userId: string): Promise<number> {
  const [task, session] = await Promise.all([
    db.select({ id: tasks.id }).from(tasks).where(eq(tasks.userId, userId)).limit(1),
    db.select({ id: focusSessions.id }).from(focusSessions).where(eq(focusSessions.userId, userId)).limit(1),
  ])
  return task.length + session.length
}
