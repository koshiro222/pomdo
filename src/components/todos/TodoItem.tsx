import { Trash2, Check } from 'lucide-react'

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
    <div className="flex items-center gap-3 p-3 bg-ctp-surface0/50 rounded-lg group">
      <button
        onClick={() => onToggle(id)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
          completed
            ? 'bg-ctp-green border-ctp-green text-ctp-base'
            : 'border-ctp-surface1 hover:border-ctp-mauve'
        }`}
      >
        {completed && <Check size={12} />}
      </button>
      <span
        className={`flex-1 text-ctp-text ${
          completed ? 'line-through text-ctp-overlay0' : ''
        }`}
      >
        {title}
      </span>
      <button
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100 text-ctp-red hover:text-ctp-red/80 transition-opacity cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
