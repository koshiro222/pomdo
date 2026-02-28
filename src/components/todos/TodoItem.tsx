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
    <div className={`group flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer ${
      completed ? 'opacity-60' : ''
    }`}>
      <button
        onClick={() => onToggle(id)}
        className={`size-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
          completed
            ? 'bg-primary'
            : 'border-2 border-primary/50 group-hover:bg-primary/10'
        }`}
      >
        <span className={`material-symbols-outlined text-sm ${
          completed ? 'text-background-dark font-bold' : 'text-primary opacity-0 group-hover:opacity-100'
        }`}>
          check
        </span>
      </button>
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
          {title}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Personal • No due date
        </p>
      </div>
      <button
        onClick={() => onDelete(id)}
        className={`opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400`}
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  )
}
