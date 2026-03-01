import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

interface TodoItemProps {
  id: string
  title: string
  completed: boolean
  isNew?: boolean
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TodoItem({
  id,
  title,
  completed,
  isNew = false,
  onToggle,
  onDelete,
}: TodoItemProps) {
  const checkboxRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (completed && checkboxRef.current) {
      checkboxRef.current.classList.add('check-icon-animate')
      setTimeout(() => {
        checkboxRef.current?.classList.remove('check-icon-animate')
      }, 300)
    }
  }, [completed])

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-all ${isNew ? 'todo-item-enter' : ''} ${
      completed ? 'opacity-60' : ''
    }`}>
      <Checkbox
        ref={checkboxRef}
        checked={completed}
        onCheckedChange={() => onToggle(id)}
        className="data-[state=checked]:bg-cf-success data-[state=checked]:border-cf-success transition-transform"
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
