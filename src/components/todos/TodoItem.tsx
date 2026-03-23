import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import { slideInVariants, tapAnimation, hoverAnimation } from '@/lib/animation'

interface TodoItemProps {
  id: string
  title: string
  completed: boolean
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
    <motion.div
      onClick={onClick}
      {...hoverAnimation}
      variants={slideInVariants}
      initial={isNew ? 'hidden' : 'visible'}
      animate="visible"
      className={`group flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/5 hover:border-cf-primary/30 transition-colors ${
        completed ? 'opacity-60' : ''
      } ${isSelected && !completed ? 'bg-cf-primary/20 border-cf-primary/50' : ''} ${onClick && !completed ? 'cursor-pointer' : ''}`}
    >
      {/* ドラッグハンドル */}
      <motion.button
        {...tapAnimation}
        onClick={(e) => e.stopPropagation()}
        className="opacity-30 group-hover:opacity-50 transition-opacity cursor-grab active:cursor-grabbing text-cf-subtext"
      >
        <GripVertical className="text-sm" />
      </motion.button>
      <Checkbox
        ref={checkboxRef}
        checked={completed}
        onCheckedChange={() => {
          onToggle(id)
        }}
        className="data-[state=checked]:bg-cf-success data-[state=checked]:border-cf-success transition-transform"
      />
      <div className="flex-1 flex flex-col gap-1">
        <motion.p
          animate={{
            opacity: completed ? 0.6 : 1,
            scaleX: completed ? 0.98 : 1,
          }}
          transition={{ duration: 0.3 }}
          className={cn(
            'text-sm font-medium transition-colors',
            completed ? 'text-cf-subtext line-through' : 'text-cf-text'
          )}
        >
          {title}
        </motion.p>
        {/* ポモドーロ表示 */}
        {(completedPomodoros || 0) > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: completedPomodoros || 0 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-sm bg-cf-primary"
              />
            ))}
          </div>
        )}
      </div>
      <motion.button
        {...tapAnimation}
        onClick={(e) => {
          e.stopPropagation()
          onDelete(id)
        }}
        className="p-3 opacity-0 group-hover:opacity-100 transition-opacity text-cf-subtext hover:text-cf-danger hover:bg-white/10"
        aria-label="削除"
      >
        <Trash2 className="text-lg" />
      </motion.button>
    </motion.div>
  )
}
