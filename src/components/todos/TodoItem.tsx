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
    <div className={`group flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-all cursor-pointer ${
      completed ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggle(id)}
        className={`size-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
          completed
            ? 'bg-cf-success'
            : 'border-2 border-cf-primary/50 group-hover:bg-cf-primary/10'
        }`}
      >
        <span className={`material-symbols-outlined text-sm ${
          completed ? 'text-white font-bold' : 'text-cf-primary opacity-0 group-hover:opacity-100'
        }`}>
          check
        </span>
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-cf-subtext line-through' : 'text-cf-text'}`}>
          {title}
        </p>
        <p className="text-[10px] text-cf-subtext mt-0.5">
          Personal • No due date
        </p>
      </div>
      <button
        onClick={() => onDelete(id)}
        className={`opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger`}
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  )
}
