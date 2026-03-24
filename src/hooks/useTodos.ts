import { useCallback } from 'react'
import { trpc } from '../lib/trpc'
import { useAuth } from './useAuth'
import { storage } from '../lib/storage'
import { useTodosStore, type Todo, type NewTodo, type UpdateTodo } from '../core/store/todos'

export type { Todo, NewTodo, UpdateTodo }

export function useTodos() {
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const {
    localTodos,
    selectedTodoId,
    loading: localLoading,
    error: localError,
    addLocalTodo,
    updateLocalTodo,
    removeLocalTodo,
    reorderLocalTodo,
    setLoading,
    setError,
    initFromStorage,
    clearLocalTodos,
    setSelectedTodoId,
    incrementCompletedPomodoros,
  } = useTodosStore()

  // tRPC queries & mutations
  const todosQuery = trpc.todos.getAll.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })

  const createMutation = trpc.todos.create.useMutation({
    onSuccess: () => {
      utils.todos.getAll.invalidate()
    },
  })

  const updateMutation = trpc.todos.update.useMutation({
    onSuccess: () => {
      utils.todos.getAll.invalidate()
    },
  })

  const deleteMutation = trpc.todos.delete.useMutation({
    onSuccess: () => {
      utils.todos.getAll.invalidate()
    },
  })

  const reorderMutation = trpc.todos.reorder.useMutation({
    onMutate: async ({ id, newOrder }) => {
      // オプティミスティックアップデートのために現在のデータをキャンセル
      await utils.todos.getAll.cancel()

      // 以前のデータを保存してロールバック用にする
      const previousTodos = utils.todos.getAll.getData()

      // オプティミスティックに更新
      utils.todos.getAll.setData(undefined, (old: Todo[] | undefined) => {
        if (!old) return old
        const newTodos = [...old]
        const oldIndex = newTodos.findIndex((t) => t.id === id)
        if (oldIndex === -1) return old

        const [moved] = newTodos.splice(oldIndex, 1)
        newTodos.splice(newOrder, 0, moved)

        // order値を再採番
        return newTodos.map((t, i) => ({ ...t, order: i }))
      })

      return { previousTodos }
    },
    onError: (_err, _variables, context) => {
      // エラー時に以前のデータに戻す
      if (context?.previousTodos) {
        utils.todos.getAll.setData(undefined, context.previousTodos)
      }
    },
    onSettled: () => {
      // 成功・失敗に関わらず、最新データを再取得
      utils.todos.getAll.invalidate()
    },
  })

  // ローカルストレージから初期データを読み込み
  const initLocalTodos = useCallback(() => {
    setLoading(true)
    initFromStorage()
  }, [setLoading, initFromStorage])

  // 初期化時にローカルストレージから読み込み
  if (!user && localTodos.length === 0 && localLoading) {
    initLocalTodos()
  }

  const todos = user ? (todosQuery.data ?? []) : localTodos
  const currentError = user ? (todosQuery.error?.message || null) : localError
  const currentLoading = user ? todosQuery.isLoading : localLoading

  const addTodo = useCallback(
    async (title: string) => {
      try {
        if (user) {
          const created = await createMutation.mutateAsync({ title })
          return created
        } else {
          const added = storage.addTodo({ title })
          if (added) {
            addLocalTodo(added)
          }
          return added
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to add todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, createMutation, addLocalTodo, setError],
  )

  const updateTodo = useCallback(
    async (id: string, updates: UpdateTodo) => {
      try {
        if (user) {
          const updated = await updateMutation.mutateAsync({ id, ...updates })
          return updated
        } else {
          const updated = storage.updateTodo(id, updates)
          if (updated) {
            updateLocalTodo(id, updates)
          }
          return updated
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update todo'
        if (!user) setError(msg)
        return null
      }
    },
    [user, updateMutation, updateLocalTodo, setError],
  )

  const deleteTodo = useCallback(
    async (id: string) => {
      try {
        if (user) {
          await deleteMutation.mutateAsync({ id })
          return true
        } else {
          const deleted = storage.deleteTodo(id)
          if (deleted) {
            removeLocalTodo(id)
          }
          return deleted
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to delete todo'
        if (!user) setError(msg)
        return false
      }
    },
    [user, deleteMutation, removeLocalTodo, setError],
  )

  const reorderTodo = useCallback(
    async (id: string, newOrder: number) => {
      try {
        if (user) {
          // ログイン時はtRPCミューテーションを使用（オプティミスティックアップデート付き）
          reorderMutation.mutate({ id, newOrder })
          return true
        } else {
          // ゲストモードではローカルストレージを直接更新
          storage.reorder(id, newOrder)
          reorderLocalTodo(id, newOrder)
          return true
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to reorder todo'
        if (!user) setError(msg)
        return false
      }
    },
    [user, reorderMutation, reorderLocalTodo, setError],
  )

  const migrateToApi = useCallback(
    async (localTodos: Todo[]): Promise<boolean> => {
      if (!user) return false

      try {
        for (const todo of localTodos) {
          await createMutation.mutateAsync({ title: todo.title })
        }

        storage.clearTodos()
        clearLocalTodos()
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to migrate todos'
        setError(msg)
        return false
      }
    },
    [user, createMutation, clearLocalTodos, setError],
  )

  return {
    todos,
    selectedTodoId,
    loading: currentLoading,
    error: currentError,
    addTodo,
    updateTodo,
    deleteTodo,
    reorderTodo,
    setSelectedTodoId,
    incrementCompletedPomodoros,
    refetch: () => {
      if (user) {
        todosQuery.refetch()
      } else {
        initLocalTodos()
      }
    },
    migrateToApi,
  }
}
