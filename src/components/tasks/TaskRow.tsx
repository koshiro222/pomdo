import { Check, ChevronDown, ChevronUp, MoreHorizontal } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DropdownMenu } from 'radix-ui'
import { messages } from '../../messages'

export type TaskView = {
  id: string
  title: string
  note: string | null
  estimate: number | null
  deckOrder: string | null
  completedAt: Date | string | null
}

export function TaskRow({ task, isNow = false, completedFocusCount = 0, onComplete, onDelete, onMoveToNow, onEdit, onMove }: {
  task: TaskView
  isNow?: boolean
  completedFocusCount?: number
  onComplete: () => void
  onDelete: () => void
  onMoveToNow?: () => void
  onEdit?: () => void
  onMove?: (direction: 'up' | 'down') => void
}) {
  const sortable = useSortable({ id: task.id })
  const sortableEnabled = onMove !== undefined
  const progress = task.estimate === null ? `${completedFocusCount} 本` : `${Math.min(completedFocusCount, task.estimate)} / ${task.estimate} 本${completedFocusCount > task.estimate ? `  ${completedFocusCount}` : ''}`
  return <article ref={sortableEnabled ? sortable.setNodeRef : undefined} style={sortableEnabled ? { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition } : undefined} className={`task-row ${task.completedAt ? 'done' : ''} ${isNow ? 'is-now' : ''} ${sortable.isDragging ? 'is-dragging' : ''}`}>
    <button className="check" type="button" aria-label={`${task.title}を完了`} onClick={onComplete} disabled={Boolean(task.completedAt)}><Check size={15} /></button>
    <button className="task-main" type="button" onClick={onMoveToNow ?? onEdit}>
      <span className="task-title">{task.title}</span>
      <span className="task-meta">{progress}{task.note ? ` · ${task.note}` : ''}</span>
    </button>
    {sortableEnabled ? <button className="drag-handle" type="button" aria-label={`${task.title}をドラッグして並べ替え`} {...sortable.attributes} {...sortable.listeners}>⠿</button> : null}
    {onMove ? <span className="reorder-buttons"><button type="button" aria-label={`${task.title}を上へ`} onClick={() => onMove('up')}><ChevronUp size={15} /></button><button type="button" aria-label={`${task.title}を下へ`} onClick={() => onMove('down')}><ChevronDown size={15} /></button></span> : null}
    {isNow ? <span className="now-badge">NOW</span> : null}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="iconbtn small" type="button" aria-label={`${task.title}のメニュー`}><MoreHorizontal size={18} /></button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdown-menu-content" align="end" sideOffset={4}>
          <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onEdit?.()}>{messages.task.edit}</DropdownMenu.Item>
          {onMoveToNow ? <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onMoveToNow()}>{messages.task.moveToNow}</DropdownMenu.Item> : null}
          <DropdownMenu.Separator className="dropdown-menu-separator" />
          <DropdownMenu.Item className="dropdown-menu-item dropdown-menu-item-danger" onSelect={() => onDelete()}>{messages.task.delete}</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </article>
}
