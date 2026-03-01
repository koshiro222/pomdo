import { useTodos, type Todo } from '../../hooks/useTodos'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import { useState } from 'react'

interface TodoListProps {
  pomodoroCount?: number
  targetPomodoros?: number
}

export default function TodoList({ pomodoroCount = 0, targetPomodoros = 4 }: TodoListProps) {
  const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos()
  const [newTodoId, setNewTodoId] = useState<string | null>(null)

  const remainingTodos = todos.filter((t: Todo) => !t.completed).length
  const progress = Math.min((pomodoroCount / targetPomodoros) * 100, 100)

  const handleAddTodo = async (title: string) => {
    const result = await addTodo(title)
    if (result?.id) {
      setNewTodoId(result.id)
      setTimeout(() => setNewTodoId(null), 200)
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl flex flex-col h-full overflow-hidden p-4 lg:p-6">
        <div className="text-cf-subtext">Loading...</div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl flex flex-col h-full overflow-hidden todo-list-mobile">
      {/* ヘッダー */}
      <div className="p-4 lg:p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <h3 className="text-base lg:text-lg font-bold flex items-center gap-2 text-cf-text">
            <span className="material-symbols-outlined text-cf-primary text-lg lg:text-xl">checklist</span>
            Tasks
          </h3>
          <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
            {remainingTodos} Left
          </span>
        </div>
        <TodoInput onAdd={handleAddTodo} />
      </div>

      {/* Todoリスト */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 flex flex-col gap-2 lg:gap-3">
        {todos.length === 0 ? (
          <div className="text-cf-subtext text-center py-6 lg:py-8 text-sm lg:text-base">
            No tasks yet
          </div>
        ) : (
          todos.map((todo: Todo) => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              title={todo.title}
              completed={todo.completed}
              isNew={newTodoId === todo.id}
              onToggle={(id) => updateTodo(id, { completed: !todo.completed })}
              onDelete={deleteTodo}
            />
          ))
        )}
      </div>

      {/* セッション進捗バー */}
      <div className="p-4 lg:p-6 bg-white/5 mt-auto">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-cf-subtext font-bold mb-1">
              Session Progress
            </p>
            <h5 className="text-xs lg:text-sm font-bold text-cf-text">
              {pomodoroCount} of {targetPomodoros} pomodoros done
            </h5>
          </div>
          <span className="text-cf-primary font-bold text-xs">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 lg:mt-3 overflow-hidden">
          <div
            className="h-full bg-cf-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}
