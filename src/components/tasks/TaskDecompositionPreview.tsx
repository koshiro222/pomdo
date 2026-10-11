import { useEffect, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'

type DecompositionItem = {
  id: string
  title: string
  note: string | null
}

function createItemId(): string {
  return crypto.randomUUID()
}

function SortableDecompositionItem({
  item,
  index,
  onTitleChange,
  onNoteChange,
  onDelete,
}: {
  item: DecompositionItem
  index: number
  onTitleChange: (value: string) => void
  onNoteChange: (value: string) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const titleInputId = `decomposition-title-${item.id}`
  const noteInputId = `decomposition-note-${item.id}`
  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`decomposition-item card card-border ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="decomposition-item-heading">
        <button
          className="drag-handle btn btn-ghost btn-sm"
          type="button"
          aria-label={`${item.title || messages.decomposition.itemTitle}をドラッグして並べ替え`}
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} aria-hidden="true" />
        </button>
        <span className="decomposition-item-number" aria-hidden="true">{index + 1}</span>
        <div className="decomposition-item-actions">
          <button className="btn btn-ghost btn-xs" type="button" onClick={onDelete} aria-label={`${item.title || messages.decomposition.itemTitle}を${messages.decomposition.delete}`}>
            ×
          </button>
        </div>
      </div>
      <label className="field" htmlFor={titleInputId}>
        <span>{messages.decomposition.itemTitle}</span>
        <input id={titleInputId} className="input" value={item.title} onChange={(event) => onTitleChange(event.target.value)} maxLength={240} required autoFocus={index === 0} />
      </label>
      <label className="field" htmlFor={noteInputId}>
        <span>{messages.decomposition.itemNote}</span>
        <textarea id={noteInputId} className="textarea" value={item.note ?? ''} onChange={(event) => onNoteChange(event.target.value)} maxLength={2000} />
      </label>
    </article>
  )
}

export function TaskDecompositionPreview({
  taskId,
  resolveTurnstileToken,
  onCancel,
  onDecomposed,
}: {
  taskId: string
  resolveTurnstileToken: TurnstileTokenResolver
  onCancel: () => void
  onDecomposed: () => void
}) {
  const [items, setItems] = useState<DecompositionItem[]>([])
  const [hasPreview, setHasPreview] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isResolvingTurnstile, setIsResolvingTurnstile] = useState(false)
  const [turnstileError, setTurnstileError] = useState(false)
  const requestedPreview = useRef<string | null>(null)
  const preview = trpc.tasks.decomposePreview.useMutation({
    onSuccess: (proposal) => {
      setItems(proposal.items.map((item) => ({ ...item, id: createItemId() })))
      setHasPreview(true)
    },
    onError: () => setHasPreview(false),
  })
  const requestPreview = preview.mutate
  const confirm = trpc.tasks.decomposeConfirm.useMutation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (hasPreview) return
    const requestKey = `${taskId}:${retryCount}`
    if (requestedPreview.current === requestKey) return
    let active = true
    void (async () => {
      const turnstileToken = await resolveTurnstileToken()
      if (!active || requestedPreview.current === requestKey) return
      if (!turnstileToken) {
        setTurnstileError(true)
        return
      }
      setTurnstileError(false)
      requestedPreview.current = requestKey
      requestPreview({ id: taskId, turnstileToken })
    })()
    return () => { active = false }
  }, [hasPreview, requestPreview, resolveTurnstileToken, retryCount, taskId])

  const updateItem = (itemId: string, update: Partial<Pick<DecompositionItem, 'title' | 'note'>>) => {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, ...update } : item))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return
    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === event.active.id)
      const newIndex = current.findIndex((item) => item.id === event.over?.id)
      return oldIndex < 0 || newIndex < 0 ? current : arrayMove(current, oldIndex, newIndex)
    })
  }

  const canConfirm = items.length > 0 && items.every((item) => item.title.trim().length > 0)
  const handleConfirm = async () => {
    if (!canConfirm || confirm.isPending) return
    setIsResolvingTurnstile(true)
    try {
      const turnstileToken = await resolveTurnstileToken()
      if (!turnstileToken) return
      confirm.mutate(
        {
          id: taskId,
          items: items.map(({ title, note }) => ({ title, note })),
          turnstileToken,
        },
        { onSuccess: onDecomposed },
      )
    } finally {
      setIsResolvingTurnstile(false)
    }
  }

  const isLoading = !hasPreview && !preview.isError && !turnstileError
  if (isLoading) {
    return <div className="decomposition-state"><div className="decomposition-loading text-accent" role="status" aria-live="polite"><span className="loading loading-spinner" aria-hidden="true" />{messages.decomposition.loading}</div><div className="decomposition-actions"><button className="btn btn-ghost" type="button" onClick={onCancel}>{messages.decomposition.cancel}</button></div></div>
  }

  if (preview.isError || turnstileError) {
    return <div className="decomposition-state"><div className="alert alert-error" role="alert">{turnstileError ? messages.decomposition.verificationError : messages.decomposition.error}</div><div className="decomposition-actions"><button className="btn" type="button" onClick={() => { setTurnstileError(false); setRetryCount((count) => count + 1) }}>{messages.decomposition.retry}</button><button className="btn btn-ghost" type="button" onClick={onCancel}>{messages.decomposition.cancel}</button></div></div>
  }

  return <div className="decomposition-preview">
    <p className="decomposition-description bg-accent/10 text-accent-content rounded-box p-3">{messages.decomposition.description}</p>
    {items.length === 0 ? <p className="decomposition-empty" role="status">{messages.decomposition.empty}</p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="decomposition-list">
          {items.map((item, index) => <SortableDecompositionItem key={item.id} item={item} index={index} onTitleChange={(title) => updateItem(item.id, { title })} onNoteChange={(note) => updateItem(item.id, { note })} onDelete={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} />)}
        </div>
      </SortableContext>
    </DndContext>}
    {confirm.isError ? <div className="alert alert-error decomposition-confirm-error" role="alert">{messages.decomposition.confirmError}</div> : null}
    <div className="decomposition-actions">
      <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={confirm.isPending}>{messages.decomposition.cancel}</button>
      <button className="btn btn-accent" type="button" onClick={() => { void handleConfirm() }} disabled={!canConfirm || confirm.isPending || isResolvingTurnstile}>{confirm.isPending || isResolvingTurnstile ? messages.decomposition.confirming : messages.decomposition.confirm}</button>
    </div>
  </div>
}
