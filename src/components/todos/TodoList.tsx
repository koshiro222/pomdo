import { useTodos } from '../../hooks/useTodos'
import TodoInput from './TodoInput'
import TodoItem from './TodoItem'

export default function TodoList() {
  const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos()

  if (loading) {
    return (
      <div className="widget p-6">
        <h2 className="text-lg font-bold text-ctp-text mb-4">Todos</h2>
        <div className="text-ctp-overlay0">Loading...</div>
      </div>
    )
  }

  return (
    <div className="widget p-6">
      <h2 className="text-lg font-bold text-ctp-text mb-4">
        Todos ({todos.length})
      </h2>
      <TodoInput onAdd={addTodo} />
      <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
        {todos.length === 0 ? (
          <div className="text-ctp-overlay0 text-center py-8">
            No todos yet
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              id={todo.id}
              title={todo.title}
              completed={todo.completed}
              onToggle={(id) => updateTodo(id, { completed: !todo.completed })}
              onDelete={deleteTodo}
            />
          ))
        )}
      </div>
    </div>
  )
}
