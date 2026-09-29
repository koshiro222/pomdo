import { useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { TaskAddForm } from './TaskAddForm'
import { TaskBulkDeleteDialog } from './TaskBulkDeleteDialog'
import { TaskDetailsSheet } from './TaskDetailsSheet'
import { TaskRow, type TaskView } from './TaskRow'

function sortOnDeck(tasks: TaskView[]) {
  return [...tasks].sort((left, right) => (left.deckOrder ?? '').localeCompare(right.deckOrder ?? ''))
}

export function TaskList({ currentTask, onDeck, backlog, done, selectedTaskIds, onSelectionChange, onSelectionRemove, onBulkDeleteSuccess, activeFocusTaskId, resolveTurnstileToken, onRefresh, onMoveToNow }: {
  currentTask: TaskView | null
  onDeck: TaskView[]
  backlog: TaskView[]
  done: TaskView[]
  selectedTaskIds: ReadonlySet<string>
  onSelectionChange: (taskId: string, selected: boolean) => void
  onSelectionRemove: (taskIds: string[]) => void
  onBulkDeleteSuccess: (deletedIds: string[]) => void
  activeFocusTaskId: string | null
  resolveTurnstileToken: TurnstileTokenResolver
  onRefresh: () => void
  onMoveToNow: (task: TaskView) => void
}) {
  const [detailsTask, setDetailsTask] = useState<TaskView | null>(null)
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const [bulkDeleteSelectionKey, setBulkDeleteSelectionKey] = useState<string | null>(null)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const [isResolvingBulkDelete, setIsResolvingBulkDelete] = useState(false)
  const bulkDeleteRequestStarted = useRef(false)
  const onDeckHeadingRef = useRef<HTMLHeadingElement>(null)
  const completeTask = trpc.tasks.complete.useMutation()
  const deleteTask = trpc.tasks.delete.useMutation()
  const deleteTasks = trpc.tasks.deleteMany.useMutation()
  const reorder = trpc.tasks.reorder.useMutation()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const orderedOnDeck = useMemo(() => sortOnDeck(onDeck), [onDeck])
  const selectedTasks = useMemo(() => [
    ...(currentTask ? [currentTask] : []),
    ...orderedOnDeck,
    ...backlog,
  ].filter((task) => selectedTaskIds.has(task.id) && !task.completedAt), [backlog, currentTask, orderedOnDeck, selectedTaskIds])
  const selectedTaskKey = selectedTasks.map((task) => task.id).join('\u0000')
  const bulkDeleteOpen = selectedTasks.length > 0 && bulkDeleteSelectionKey === selectedTaskKey
  const applyComplete = async (task: TaskView) => {
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    completeTask.mutate({ id: task.id, turnstileToken }, { onSuccess: () => { onSelectionRemove([task.id]); onRefresh() } })
  }
  const applyDelete = async (task: TaskView) => {
    if (!window.confirm(messages.task.deleteConfirm)) return
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    deleteTask.mutate({ id: task.id, turnstileToken }, { onSuccess: () => { onSelectionRemove([task.id]); onRefresh() } })
  }
  const confirmBulkDelete = async () => {
    if (deleteTasks.isPending || bulkDeleteRequestStarted.current || selectedTasks.length === 0) return
    bulkDeleteRequestStarted.current = true
    setIsResolvingBulkDelete(true)
    let turnstileToken: string | null
    try {
      turnstileToken = await resolveTurnstileToken()
    } catch {
      bulkDeleteRequestStarted.current = false
      setIsResolvingBulkDelete(false)
      setBulkDeleteSelectionKey(null)
      setBulkDeleteError(messages.bulkDelete.error)
      onRefresh()
      return
    }
    if (!turnstileToken) {
      bulkDeleteRequestStarted.current = false
      setIsResolvingBulkDelete(false)
      return
    }
    deleteTasks.mutate({ ids: selectedTasks.map((task) => task.id), turnstileToken }, {
      onSuccess: (deletedIds) => {
        bulkDeleteRequestStarted.current = false
        setIsResolvingBulkDelete(false)
        setBulkDeleteSelectionKey(null)
        setBulkDeleteError(null)
        onBulkDeleteSuccess(deletedIds)
        onRefresh()
      },
      onError: () => {
        bulkDeleteRequestStarted.current = false
        setIsResolvingBulkDelete(false)
        setBulkDeleteSelectionKey(null)
        setBulkDeleteError(messages.bulkDelete.error)
        onRefresh()
      },
    })
  }
  const moveTask = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const target = orderedOnDeck[index]
    if (!target || targetIndex < 0 || targetIndex >= orderedOnDeck.length) return
    const reordered = [...orderedOnDeck]
    reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, target)
    const newIndex = targetIndex
    const previousId = reordered[newIndex - 1]?.id ?? null
    const nextId = reordered[newIndex + 1]?.id ?? null
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    reorder.mutate({ id: target.id, previousId, nextId, turnstileToken }, { onSuccess: onRefresh })
  }
  const renderRows = (tasks: TaskView[], canMoveToNow: boolean, showMove: boolean, canSelect = true) => tasks.map((task, index) => <TaskRow key={task.id} task={task} isNow={currentTask?.id === task.id} isSelected={canSelect && selectedTaskIds.has(task.id)} onSelect={canSelect ? (selected) => { setBulkDeleteSelectionKey(null); onSelectionChange(task.id, selected) } : undefined} onComplete={!task.completedAt ? () => { void applyComplete(task) } : undefined} onDelete={() => { void applyDelete(task) }} onEdit={() => setDetailsTask(task)} onMoveToNow={canMoveToNow ? () => onMoveToNow(task) : undefined} onMove={showMove ? (direction) => { void moveTask(index, direction) } : undefined} />)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedOnDeck.findIndex((task) => task.id === active.id)
    const newIndex = orderedOnDeck.findIndex((task) => task.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const reordered = [...orderedOnDeck]
    const [target] = reordered.splice(oldIndex, 1)
    if (!target) return
    reordered.splice(newIndex, 0, target)
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    reorder.mutate({ id: target.id, previousId: reordered[newIndex - 1]?.id ?? null, nextId: reordered[newIndex + 1]?.id ?? null, turnstileToken }, { onSuccess: onRefresh })
  }
  return <>
    {selectedTasks.length > 0 ? <div className="bulk-delete-toolbar">
      <span role="status" aria-live="polite">{messages.task.selectedCount(selectedTasks.length)}</span>
      <button className="btn btn-error btn-sm" type="button" aria-label={messages.task.deleteSelected(selectedTasks.length)} onClick={() => { setBulkDeleteError(null); setBulkDeleteSelectionKey(selectedTaskKey) }}>{messages.task.deleteSelected(selectedTasks.length)}</button>
    </div> : null}
    {bulkDeleteError ? <p className="bulk-delete-error" role="alert">{bulkDeleteError}</p> : null}
    <section className="section" aria-labelledby="on-deck-heading">
      <h2 id="on-deck-heading" ref={onDeckHeadingRef} tabIndex={-1}>{messages.app.onDeck}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><div className="group-list card card-border"><TaskAddForm bucket="onDeck" resolveTurnstileToken={resolveTurnstileToken} onCreated={onRefresh} /><SortableContext items={orderedOnDeck.map((task) => task.id)} strategy={verticalListSortingStrategy}>{renderRows(orderedOnDeck, true, true)}</SortableContext></div></DndContext>
    </section>
    <section className="disclosure"><button className="disclosure-trigger btn btn-ghost" type="button" aria-expanded={backlogOpen} onClick={() => setBacklogOpen(!backlogOpen)}><span>{messages.app.backlog}</span><span>{backlog.length}</span><ChevronDown size={16} /></button>{backlogOpen ? <div className="group-list disclosure-body card card-border"><TaskAddForm bucket="backlog" resolveTurnstileToken={resolveTurnstileToken} onCreated={onRefresh} />{renderRows(backlog, true, false)}</div> : null}</section>
    <section className="disclosure"><button className="disclosure-trigger btn btn-ghost" type="button" aria-expanded={doneOpen} onClick={() => setDoneOpen(!doneOpen)}><span>{messages.app.done}</span><span>{done.length}</span><ChevronDown size={16} /></button>{doneOpen ? <div className="group-list disclosure-body card card-border">{renderRows(done, false, false, false)}</div> : null}</section>
    <TaskDetailsSheet task={detailsTask} resolveTurnstileToken={resolveTurnstileToken} onClose={() => setDetailsTask(null)} onSaved={onRefresh} onDeleted={() => { if (detailsTask) onSelectionRemove([detailsTask.id]); setDetailsTask(null); onRefresh() }} onDecomposed={() => { if (detailsTask) onSelectionRemove([detailsTask.id]); setDetailsTask(null); onRefresh() }} />
    <TaskBulkDeleteDialog open={bulkDeleteOpen} tasks={selectedTasks} activeFocusTaskId={activeFocusTaskId} fallbackFocusRef={onDeckHeadingRef} isPending={deleteTasks.isPending || isResolvingBulkDelete} onOpenChange={(nextOpen) => setBulkDeleteSelectionKey(nextOpen ? selectedTaskKey : null)} onConfirm={() => { void confirmBulkDelete() }} />
  </>
}
