import { deleteTasks } from '../repositories/task-repository'

export class NoTasksDeletedError extends Error {
  constructor() {
    super('削除できるタスクがありません')
    this.name = 'NoTasksDeletedError'
  }
}

/** 選択された所有者の Task を削除し、実際に削除できた ID だけを返す。 */
export async function deleteSelectedTasks(
  db: Parameters<typeof deleteTasks>[0],
  userId: string,
  taskIds: string[],
): Promise<string[]> {
  const uniqueTaskIds = [...new Set(taskIds)]
  if (uniqueTaskIds.length === 0) throw new NoTasksDeletedError()

  const deletedTasks = await deleteTasks(db, userId, uniqueTaskIds)
  if (deletedTasks.length === 0) throw new NoTasksDeletedError()
  return deletedTasks.map(({ id }) => id)
}
