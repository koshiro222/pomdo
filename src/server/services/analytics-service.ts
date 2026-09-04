import type { Database } from '../db/client'
import { recordAnalyticsEvent } from '../repositories/analytics-event-repository'

export async function recordFirstTaskCreated(db: Database, userId: string) {
  await recordAnalyticsEvent(db, userId, 'first_task_created')
}

export async function recordFirstFocusCompleted(db: Database, userId: string) {
  await recordAnalyticsEvent(db, userId, 'first_focus_completed')
}

export async function recordLoggedIn(db: Database, userId: string) {
  await recordAnalyticsEvent(db, userId, 'logged_in')
}
