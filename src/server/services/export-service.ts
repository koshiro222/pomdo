import type { Database } from '../db/client'
import { listFocusSessions } from '../repositories/focus-session-repository'
import { listTasks } from '../repositories/task-repository'
import { findUserById } from '../repositories/user-repository'

export async function buildUserExport(db: Database, userId: string, exportedAt = new Date()) {
  const [user, userTasks, sessions] = await Promise.all([
    findUserById(db, userId),
    listTasks(db, userId),
    listFocusSessions(db, userId),
  ])
  if (!user) throw new Error('ユーザーが見つかりません')
  return {
    exportedAt: exportedAt.toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      settings: {
        timezone: user.timezone,
        soundMuted: user.soundMuted,
        soundVolume: user.soundVolume,
        theme: user.theme,
      },
    },
    tasks: userTasks,
    focusSessions: sessions,
  }
}

export type UserExport = Awaited<ReturnType<typeof buildUserExport>>
