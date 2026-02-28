interface TodoItemProps {
  id: string
  title: string
  completed: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TodoItem({
  id,
  title,
  completed,
  onToggle,
  onDelete,
}: TodoItemProps) {
  return (
    <div className={`group flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cf-amber/30 transition-all cursor-pointer ${
      completed ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggle(id)}
        className={`size-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
          completed
            ? 'bg-cf-amber'
            : 'border-2 border-cf-amber/50 group-hover:bg-cf-amber/10'
        }`}
      >
        <span className={`material-symbols-outlined text-sm ${
          completed ? 'text-cf-crust font-bold' : 'text-cf-amber opacity-0 group-hover:opacity-100'
        }`}>
          check
        </span>
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-cf-overlay0 line-through' : 'text-cf-subtext1'}`}>
          {title}
        </p>
        <p className="text-[10px] text-cf-overlay0 mt-0.5">
          Personal • No due date
        </p>
      </div>
      <button
        onClick={() => onDelete(id)}
        className={`opacity-0 group-hover:opacity-100 transition-opacity text-cf-overlay0 hover:text-cf-rose`}
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  )
}
