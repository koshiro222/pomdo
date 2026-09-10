import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { closestCenter, DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { TaskAddForm } from './TaskAddForm'
import { TaskDetailsSheet } from './TaskDetailsSheet'
import { TaskRow, type TaskView } from './TaskRow'

function sortOnDeck(tasks: TaskView[]) {
  return [...tasks].sort((left, right) => (left.deckOrder ?? '').localeCompare(right.deckOrder ?? ''))
}

export function TaskList({ currentTask, onDeck, backlog, done, resolveTurnstileToken, onRefresh, onMoveToNow }: { currentTask: TaskView | null; onDeck: TaskView[]; backlog: TaskView[]; done: TaskView[]; resolveTurnstileToken: TurnstileTokenResolver; onRefresh: () => void; onMoveToNow: (task: TaskView) => void }) {
  const [detailsTask, setDetailsTask] = useState<TaskView | null>(null)
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [doneOpen, setDoneOpen] = useState(false)
  const completeTask = trpc.tasks.complete.useMutation()
  const deleteTask = trpc.tasks.delete.useMutation()
  const reorder = trpc.tasks.reorder.useMutation()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const orderedOnDeck = useMemo(() => sortOnDeck(onDeck), [onDeck])
  const applyComplete = async (task: TaskView) => {
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    completeTask.mutate({ id: task.id, turnstileToken }, { onSuccess: onRefresh })
  }
  const applyDelete = async (task: TaskView) => {
    if (!window.confirm(messages.task.deleteConfirm)) return
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    deleteTask.mutate({ id: task.id, turnstileToken }, { onSuccess: onRefresh })
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
  const renderRows = (tasks: TaskView[], canMoveToNow: boolean, showMove: boolean) => tasks.map((task, index) => <TaskRow key={task.id} task={task} isNow={currentTask?.id === task.id} onComplete={() => { void applyComplete(task) }} onDelete={() => { void applyDelete(task) }} onEdit={() => setDetailsTask(task)} onMoveToNow={canMoveToNow ? () => onMoveToNow(task) : undefined} onMove={showMove ? (direction) => { void moveTask(index, direction) } : undefined} />)
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
    <section className="section" aria-labelledby="on-deck-heading">
      <h2 id="on-deck-heading">{messages.app.onDeck}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}><div className="group-list card card-border"><TaskAddForm bucket="onDeck" resolveTurnstileToken={resolveTurnstileToken} onCreated={onRefresh} /><SortableContext items={orderedOnDeck.map((task) => task.id)} strategy={verticalListSortingStrategy}>{renderRows(orderedOnDeck, true, true)}</SortableContext></div></DndContext>
    </section>
    <section className="disclosure"><button className="disclosure-trigger btn btn-ghost" type="button" aria-expanded={backlogOpen} onClick={() => setBacklogOpen(!backlogOpen)}><span>{messages.app.backlog}</span><span>{backlog.length}</span><ChevronDown size={16} /></button>{backlogOpen ? <div className="group-list disclosure-body card card-border"><TaskAddForm bucket="backlog" resolveTurnstileToken={resolveTurnstileToken} onCreated={onRefresh} />{renderRows(backlog, true, false)}</div> : null}</section>
    <section className="disclosure"><button className="disclosure-trigger btn btn-ghost" type="button" aria-expanded={doneOpen} onClick={() => setDoneOpen(!doneOpen)}><span>{messages.app.done}</span><span>{done.length}</span><ChevronDown size={16} /></button>{doneOpen ? <div className="group-list disclosure-body card card-border">{renderRows(done, false, false)}</div> : null}</section>
    <TaskDetailsSheet task={detailsTask} resolveTurnstileToken={resolveTurnstileToken} onClose={() => setDetailsTask(null)} onSaved={onRefresh} onDeleted={() => { setDetailsTask(null); onRefresh() }} onDecomposed={() => { setDetailsTask(null); onRefresh() }} />
  </>
}
