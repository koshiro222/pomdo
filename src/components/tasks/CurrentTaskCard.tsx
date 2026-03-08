import { Check, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTodos, type Todo } from '../../hooks/useTodos'

interface CurrentTaskCardProps {
  onTodoClick?: (todo: Todo) => void
}

export default function CurrentTaskCard({}: CurrentTaskCardProps) {
  const { todos, selectedTodoId, setSelectedTodoId, updateTodo, deleteTodo } = useTodos()
  const [showMenu, setShowMenu] = useState(false)

  const currentTodo = todos.find((t: Todo) => t.id === selectedTodoId && !t.completed)

  const handleComplete = async () => {
    if (currentTodo) {
      await updateTodo(currentTodo.id, { completed: true })
      setSelectedTodoId(null)
    }
  }

  const handleDelete = async () => {
    if (currentTodo) {
      await deleteTodo(currentTodo.id)
      setShowMenu(false)
    }
  }

  const handleSelectNext = () => {
    const nextTodo = todos.find((t: Todo) => !t.completed && t.id !== selectedTodoId)
    if (nextTodo) {
      setSelectedTodoId(nextTodo.id)
    }
  }

  const completedPomodoros = currentTodo?.completedPomodoros || 0
  const targetPomodoros = currentTodo?.targetPomodoros || 4
  const progress = Math.min((completedPomodoros / targetPomodoros) * 100, 100)
  const hasMoreTodos = todos.some((t: Todo) => !t.completed && t.id !== selectedTodoId)

  return (
    <div className="glass rounded-3xl p-6 h-full flex flex-col relative overflow-hidden">
      {currentTodo ? (
        <>
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold mb-2">
                Current Task
              </p>
              <h3 className="text-xl font-bold text-cf-text line-clamp-2">
                {currentTodo.title}
              </h3>
            </div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-cf-subtext hover:text-cf-text transition-colors p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* メニュー */}
          {showMenu && (
            <div className="absolute top-16 right-4 bg-cf-background/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 py-2 min-w-[120px] z-10">
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                Delete
              </button>
            </div>
          )}

          {/* プログレスセクション */}
          <div className="flex-1 flex flex-col justify-center mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cf-primary/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-cf-primary" />
                </div>
                <span className="text-3xl font-bold text-cf-text">
                  {completedPomodoros}
                </span>
              </div>
              <span className="text-2xl text-cf-subtext">/</span>
              <span className="text-3xl font-bold text-cf-text">
                {targetPomodoros}
              </span>
            </div>

            {/* プログレスバー */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-cf-primary to-green-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-cf-subtext text-center">
              {progress < 100 ? 'In Progress' : 'Completed!'}
            </p>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              className="flex-1 bg-cf-primary hover:bg-cf-primary/80 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
            >
              Complete
            </button>
            {hasMoreTodos && (
              <button
                onClick={handleSelectNext}
                className="bg-white/10 hover:bg-white/20 text-cf-text font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Next
              </button>
            )}
          </div>
        </>
      ) : (
        /* タスク未選択時の表示 */
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-cf-subtext" />
          </div>
          <p className="text-cf-subtext mb-4">No task selected</p>
          <button
            onClick={handleSelectNext}
            disabled={!todos.some((t: Todo) => !t.completed)}
            className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-cf-subtext text-cf-text font-bold py-2 px-6 rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed"
          >
            Select Task
          </button>
        </div>
      )}
    </div>
  )
}
