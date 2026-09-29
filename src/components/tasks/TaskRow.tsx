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

export function TaskRow({ task, isNow = false, isSelected = false, completedFocusCount = 0, onSelect, onComplete, onDelete, onMoveToNow, onEdit, onMove }: {
  task: TaskView
  isNow?: boolean
  completedFocusCount?: number
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  onComplete?: () => void
  onDelete: () => void
  onMoveToNow?: () => void
  onEdit?: () => void
  onMove?: (direction: 'up' | 'down') => void
}) {
  const sortable = useSortable({ id: task.id })
  const sortableEnabled = onMove !== undefined
  const progress = task.estimate === null ? `${completedFocusCount} 本` : `${Math.min(completedFocusCount, task.estimate)} / ${task.estimate} 本${completedFocusCount > task.estimate ? `  ${completedFocusCount}` : ''}`
  return <article ref={sortableEnabled ? sortable.setNodeRef : undefined} style={sortableEnabled ? { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition } : undefined} className={`task-row ${task.completedAt ? 'done' : ''} ${isNow ? 'is-now' : ''} ${isSelected ? 'is-selected' : ''} ${sortable.isDragging ? 'is-dragging' : ''}`}>
    {task.completedAt
      ? <button className="check btn btn-circle btn-sm btn-primary" type="button" aria-label={`${task.title}を完了`} disabled><Check size={15} /></button>
      : <input className="task-select checkbox checkbox-primary" type="checkbox" checked={isSelected} aria-label={messages.task.selectForDelete(task.title)} onClick={(event) => event.stopPropagation()} onChange={(event) => onSelect?.(event.currentTarget.checked)} />}
    <button className="task-main btn btn-ghost" type="button" onClick={onMoveToNow ?? onEdit}>
      <span className="task-title">{task.title}</span>
      <span className="task-meta">{progress}{task.note ? ` · ${task.note}` : ''}</span>
    </button>
    {sortableEnabled ? <button className="drag-handle btn btn-ghost btn-square btn-sm" type="button" aria-label={`${task.title}をドラッグして並べ替え`} {...sortable.attributes} {...sortable.listeners}>⠿</button> : null}
    {onMove ? <span className="reorder-buttons"><button className="btn btn-ghost btn-square btn-xs" type="button" aria-label={`${task.title}を上へ`} onClick={() => onMove('up')}><ChevronUp size={15} /></button><button className="btn btn-ghost btn-square btn-xs" type="button" aria-label={`${task.title}を下へ`} onClick={() => onMove('down')}><ChevronDown size={15} /></button></span> : null}
    {isNow ? <span className="now-badge badge badge-primary">NOW</span> : null}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="iconbtn small btn btn-ghost btn-square" type="button" aria-label={`${task.title}のメニュー`}><MoreHorizontal size={18} /></button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="dropdown-menu-content" align="end" sideOffset={4}>
          <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onEdit?.()}>{messages.task.edit}</DropdownMenu.Item>
          {onMoveToNow ? <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onMoveToNow()}>{messages.task.moveToNow}</DropdownMenu.Item> : null}
          {!task.completedAt && onComplete ? <DropdownMenu.Item className="dropdown-menu-item" onSelect={() => onComplete()}>{messages.task.complete}</DropdownMenu.Item> : null}
          <DropdownMenu.Separator className="dropdown-menu-separator" />
          <DropdownMenu.Item className="dropdown-menu-item dropdown-menu-item-danger" onSelect={() => onDelete()}>{messages.task.delete}</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  </article>
}
