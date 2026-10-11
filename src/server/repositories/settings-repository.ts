import type { Database } from '../db/client'
import { updateUserSettings } from './user-repository'

export async function updateSettings(
  db: Database,
  userId: string,
  input: { soundMuted?: boolean; soundVolume?: number; theme?: 'system' | 'light' | 'dark'; timezone?: string },
) {
  return updateUserSettings(db, userId, input)
}
