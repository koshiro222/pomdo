import { Check, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTodos, type Todo } from '../../hooks/useTodos'
import { tapAnimation } from '@/lib/animation'

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
  const hasMoreTodos = todos.some((t: Todo) => !t.completed && t.id !== selectedTodoId)

  return (
    <div className="bento-card p-4 sm:p-6 h-full flex flex-col relative">
      {currentTodo ? (
        <>
          {/* ヘッダー */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest font-bold text-cf-text mb-2">
                Current Task
              </p>
              <h3 className="text-xl font-bold text-cf-text line-clamp-2">
                {currentTodo.title}
              </h3>
            </div>
            <motion.button
              {...tapAnimation}
              onClick={() => setShowMenu(!showMenu)}
              className="text-cf-subtext hover:text-cf-text transition-colors p-1"
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          </div>

          {/* メニュー */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-16 right-4 bg-cf-background/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 py-2 min-w-[120px] z-10"
              >
                <motion.button
                  {...tapAnimation}
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  Delete
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* プログレスセクション */}
          <div className="flex-1 flex flex-col justify-center mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cf-primary/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-cf-primary" />
                </div>
                <span className="text-3xl font-bold text-cf-text">
                  {completedPomodoros}
                </span>
              </div>
              <span className="text-2xl text-cf-subtext">done</span>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleComplete}
              className="flex-1 bg-cf-primary hover:bg-cf-primary/80 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Complete
            </motion.button>
            {hasMoreTodos && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectNext}
                className="bg-white/10 hover:bg-white/20 text-cf-text font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Next
              </motion.button>
            )}
          </div>
        </>
      ) : (
        /* タスク未選択時の表示 */
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4"
          >
            <Check className="w-8 h-8 text-cf-subtext" />
          </motion.div>
          <p className="text-cf-subtext mb-4">No task selected</p>
          <motion.button
            whileHover={{ scale: todos.some((t: Todo) => !t.completed) ? 1.02 : 1 }}
            whileTap={{ scale: todos.some((t: Todo) => !t.completed) ? 0.98 : 1 }}
            onClick={handleSelectNext}
            disabled={!todos.some((t: Todo) => !t.completed)}
            className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-cf-subtext text-cf-text font-bold py-2 px-6 rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            Select Task
          </motion.button>
        </div>
      )}
    </div>
  )
}
