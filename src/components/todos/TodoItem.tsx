import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'

interface TodoItemProps {
  id: string
  title: string
  completed: boolean
  isNew?: boolean
  isSelected?: boolean
  onClick?: () => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TodoItem({
  id,
  title,
  completed,
  isNew = false,
  isSelected = false,
  onClick,
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
    <div
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-all ${isNew ? 'todo-item-enter' : ''} ${
        completed ? 'opacity-60' : ''
      } ${isSelected && !completed ? 'bg-cf-primary/20 border-cf-primary/50' : ''} ${onClick && !completed ? 'cursor-pointer' : ''}`}
    >
      <Checkbox
        ref={checkboxRef}
        checked={completed}
        onCheckedChange={() => {
          onToggle(id)
        }}
        className="data-[state=checked]:bg-cf-success data-[state=checked]:border-cf-success transition-transform"
      />
      <p className={cn(
        'flex-1 text-sm font-medium transition-colors',
        completed ? 'text-cf-subtext line-through' : 'text-cf-text'
      )}>
        {title}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger"
      >
        <Trash2 className="text-lg" />
      </button>
    </div>
  )
}
