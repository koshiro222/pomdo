import { useRef, type RefObject } from 'react'
import { Dialog } from 'radix-ui'
import { messages } from '../../messages'
import type { TaskView } from './TaskRow'

type TaskToDelete = Pick<TaskView, 'id' | 'title'>

export function TaskBulkDeleteDialog({
  open,
  tasks,
  activeFocusTaskId,
  fallbackFocusRef,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  tasks: TaskToDelete[]
  activeFocusTaskId: string | null
  fallbackFocusRef?: RefObject<HTMLElement | null>
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const cancelButton = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const includesActiveFocusTask = activeFocusTaskId !== null && tasks.some((task) => task.id === activeFocusTaskId)
  const count = tasks.length

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!isPending || nextOpen) onOpenChange(nextOpen) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="bulk-delete-overlay" />
        <Dialog.Content
          ref={contentRef}
          className="bulk-delete-dialog card bg-base-100 border border-base-300"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            const activeElement = document.activeElement
            opener.current = activeElement instanceof HTMLElement && !contentRef.current?.contains(activeElement)
              ? activeElement
              : null
            cancelButton.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            const target = opener.current?.isConnected ? opener.current : fallbackFocusRef?.current
            target?.focus()
            opener.current = null
          }}
        >
          <Dialog.Title className="bulk-delete-title">{messages.bulkDelete.title(count)}</Dialog.Title>
          <Dialog.Description className="bulk-delete-description">
            <span>{messages.bulkDelete.description(count)}</span>
            {includesActiveFocusTask ? <span className="bulk-delete-focus-warning">{messages.bulkDelete.focusWarning}</span> : null}
          </Dialog.Description>
          <ul className="bulk-delete-task-list" aria-label={messages.bulkDelete.taskList}>
            {tasks.map((task) => <li key={task.id}>{task.title}</li>)}
          </ul>
          <div className="bulk-delete-actions">
            <Dialog.Close asChild>
              <button ref={cancelButton} className="btn btn-ghost" type="button" disabled={isPending}>{messages.bulkDelete.cancel}</button>
            </Dialog.Close>
            <button className="btn btn-error" type="button" disabled={isPending || count === 0} onClick={onConfirm}>
              {isPending ? messages.bulkDelete.pending : messages.bulkDelete.confirm(count)}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
