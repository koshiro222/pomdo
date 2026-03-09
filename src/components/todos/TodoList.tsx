import { useTodos, type Todo } from '../../hooks/useTodos'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'
import { useState, useMemo } from 'react'
import { CheckSquare } from 'lucide-react'

type FilterType = 'all' | 'active' | 'done'

interface TodoListProps {
}

export default function TodoList({ }: TodoListProps) {
  const { todos, selectedTodoId, loading, addTodo, updateTodo, deleteTodo, setSelectedTodoId } = useTodos()
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

  const remainingTodos = todos.filter((t: Todo) => !t.completed).length

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

  if (loading) {
    return (
      <div className="glass rounded-2xl flex flex-col min-h-64 sm:h-full overflow-hidden p-6">
        <div className="text-cf-subtext">Loading...</div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl flex flex-col min-h-64 sm:h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-cf-text">
            <CheckSquare className="text-cf-primary" />
            Tasks
          </h3>
          <span className="text-xs bg-cf-primary/20 text-cf-primary px-2 py-0.5 rounded-full font-bold">
            {remainingTodos} Left
          </span>
        </div>

        {/* フィルタータブ */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'done'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-cf-primary text-white'
                  : 'bg-white/5 text-cf-subtext hover:bg-white/10 hover:text-cf-text'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <TodoInput onAdd={handleAddTodo} />
      </div>

      {/* Todoリスト */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {filteredTodos.length === 0 ? (
          <div className="text-cf-subtext text-center py-8">
            No tasks yet
          </div>
        ) : (
          filteredTodos.map((todo: Todo) => (
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
          ))
        )}
      </div>
    </div>
  )
}
