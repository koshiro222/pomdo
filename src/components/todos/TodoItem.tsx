import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

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
    <div className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-all ${
      completed ? 'opacity-60' : ''
    }`}>
      <Checkbox
        checked={completed}
        onCheckedChange={() => onToggle(id)}
        className="data-[state=checked]:bg-cf-success data-[state=checked]:border-cf-success"
      />
      <p className={cn(
        'flex-1 text-sm font-medium transition-colors',
        completed ? 'text-cf-subtext line-through' : 'text-cf-text'
      )}>
        {title}
      </p>
      <button
        onClick={() => onDelete(id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger"
      >
        <span className="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  )
}
