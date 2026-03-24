import { useTodos, type Todo } from '../../hooks/useTodos'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { tapAnimation, hoverAnimation, slideInVariants } from '@/lib/animation'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

type FilterType = 'all' | 'active' | 'done'

interface TodoListProps {
}

export default function TodoList({ }: TodoListProps) {
  const { todos, selectedTodoId, loading, addTodo, updateTodo, deleteTodo, setSelectedTodoId, reorderTodo } = useTodos()
  const [newTodoId, setNewTodoId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')

  const filteredTodos = useMemo(() => {
    switch (filterType) {
      case 'active':
        return todos.filter((t: Todo) => !t.completed)
      case 'done':
        return todos.filter((t: Todo) => t.completed)
      default:
        return todos
    }
  }, [todos, filterType])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t: Todo) => t.id === active.id)
      const newIndex = todos.findIndex((t: Todo) => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTodo(todos[oldIndex].id, newIndex)
      }
    }
  }

  const remainingTodos = todos.filter((t: Todo) => !t.completed).length

  // 選択中タスクの計算
  const selectedTodo = todos.find((t: Todo) => t.id === selectedTodoId && !t.completed)
  const hasMoreTodos = todos.some((t: Todo) => !t.completed && t.id !== selectedTodoId)

  const handleAddTodo = async (title: string) => {
    const result = await addTodo(title)
    if (result?.id) {
      setNewTodoId(result.id)
      setTimeout(() => setNewTodoId(null), 200)
    }
  }

  const handleTodoClick = (todo: Todo) => {
    if (!todo.completed) {
      setSelectedTodoId(todo.id)
    }
  }

  const handleComplete = async () => {
    if (selectedTodo) {
      await updateTodo(selectedTodo.id, { completed: true })
      setSelectedTodoId(null)
    }
  }

  const handleSelectNext = () => {
    const nextTodo = todos.find((t: Todo) => !t.completed && t.id !== selectedTodoId)
    if (nextTodo) {
      setSelectedTodoId(nextTodo.id)
    }
  }

  if (loading) {
    return (
      <div className="bento-card flex flex-col min-h-64 sm:h-full p-4 sm:p-6">
        <div className="text-cf-subtext">Loading...</div>
      </div>
    )
  }

  return (
    <div className="bento-card flex flex-col min-h-64 sm:h-full p-4 sm:p-6">
      {/* ヘッダー */}
      <div className="pb-4 sm:pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest font-bold text-cf-text">
            Tasks
          </h3>
          <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
            {remainingTodos} Left
          </span>
        </div>

        {/* ハイライトセクション */}
        <AnimatePresence mode="popLayout">
          {selectedTodo && (
            <motion.div
              variants={slideInVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white/5 rounded-xl p-3 mb-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-widest text-cf-subtext font-bold mb-1">
                  Current Task
                </p>
                <p className="text-base font-bold text-cf-text truncate">
                  {selectedTodo.title}
                </p>
                <p className="text-sm text-cf-subtext">
                  {selectedTodo.completedPomodoros || 0} done
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-3">
                <motion.button
                  {...tapAnimation}
                  onClick={handleComplete}
                  className="bg-cf-primary hover:bg-cf-primary/80 text-white text-sm font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  ✓ Complete
                </motion.button>
                {hasMoreTodos && (
                  <motion.button
                    {...tapAnimation}
                    onClick={handleSelectNext}
                    className="bg-white/10 hover:bg-white/20 text-cf-text text-sm font-bold py-2 px-3 rounded-lg transition-colors"
                  >
                    → Next
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 仕切り線 */}
      <div className="border-b border-white/10 my-3" />

      {/* フィルタータブ */}
      <div className="flex gap-2 mb-3">
        {(['all', 'active', 'done'] as FilterType[]).map((type) => (
          <motion.button
            key={type}
            {...hoverAnimation}
            {...tapAnimation}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterType === type
                ? 'bg-cf-primary text-white'
                : 'bg-white/5 text-cf-subtext hover:bg-white/10 hover:text-cf-text'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* スクロールエリア（TodoList + TodoInput） */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={todos.map((t: Todo) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5">
              {filteredTodos.length === 0 ? (
                <div className="text-cf-subtext text-center py-8">
                  No tasks yet
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredTodos.map((todo: Todo) => (
                    <TodoItem
                      key={todo.id}
                      id={todo.id}
                      title={todo.title}
                      completed={todo.completed}
                      completedPomodoros={todo.completedPomodoros}
                      isNew={newTodoId === todo.id}
                      isSelected={selectedTodoId === todo.id}
                      onClick={() => handleTodoClick(todo)}
                      onToggle={(id) => updateTodo(id, { completed: !todo.completed })}
                      onDelete={deleteTodo}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* TodoInputを最後に移動 */}
        <TodoInput onAdd={handleAddTodo} />
      </div>
    </div>
  )
}
