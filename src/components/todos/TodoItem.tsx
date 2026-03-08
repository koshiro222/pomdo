import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { Trash2, GripVertical } from 'lucide-react'

interface TodoItemProps {
  id: string
  title: string
  completed: boolean
  targetPomodoros?: number
  completedPomodoros?: number
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
  targetPomodoros = 0,
  completedPomodoros = 0,
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
      {/* ドラッグハンドル */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
      >
        <GripVertical className="text-sm" />
      </button>
      <Checkbox
        ref={checkboxRef}
        checked={completed}
        onCheckedChange={() => {
          onToggle(id)
        }}
        className="data-[state=checked]:bg-cf-success data-[state=checked]:border-cf-success transition-transform"
      />
      <div className="flex-1 flex flex-col gap-1">
        <p className={cn(
          'text-sm font-medium transition-colors',
          completed ? 'text-cf-subtext line-through' : 'text-cf-text'
        )}>
          {title}
        </p>
        {/* ポモドーロ表示 */}
        {targetPomodoros > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: targetPomodoros }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-sm',
                  i < (completedPomodoros || 0)
                    ? 'bg-cf-primary'
                    : 'bg-white/20'
                )}
              />
            ))}
          </div>
        )}
      </div>
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
