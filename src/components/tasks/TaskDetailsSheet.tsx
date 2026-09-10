import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Dialog } from 'radix-ui'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { TaskDecompositionPreview } from './TaskDecompositionPreview'
import type { TaskView } from './TaskRow'

const DRAG_CLOSE_PROJECTED_DISTANCE_PX = 120
const DRAG_UP_RUBBER_BAND_RATIO = 0.2
const DRAG_VELOCITY_DECAY = 0.998

type DragState = {
  startClientY: number
  lastClientY: number
  lastTimeMs: number
  lastOffsetPx: number
  velocityPxPerSec: number
}

export function TaskDetailsSheet({ task, resolveTurnstileToken, onClose, onDeleted, onSaved, onDecomposed }: { task: TaskView | null; resolveTurnstileToken: TurnstileTokenResolver; onClose: () => void; onDeleted: () => void; onSaved?: () => void; onDecomposed?: () => void }) {
  const [displayedTask, setDisplayedTask] = useState<TaskView | null>(task)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [estimate, setEstimate] = useState('')
  const [isDecomposing, setIsDecomposing] = useState(false)
  const [isResolvingTurnstile, setIsResolvingTurnstile] = useState(false)
  const updateTask = trpc.tasks.update.useMutation()
  const deleteTask = trpc.tasks.delete.useMutation()
  const titleInput = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<DragState | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const taskRef = useRef(task)
  taskRef.current = task
  const isOpen = task !== null

  useEffect(() => {
    const currentTask = taskRef.current
    if (!currentTask) return
    setDisplayedTask(currentTask)
    setTitle(currentTask.title)
    setNote(currentTask.note ?? '')
    setEstimate(currentTask.estimate?.toString() ?? '')
    setIsDecomposing(false)
  }, [task?.id])

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const content = contentRef.current
    if (!content) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      startClientY: event.clientY,
      lastClientY: event.clientY,
      lastTimeMs: performance.now(),
      lastOffsetPx: 0,
      velocityPxPerSec: 0,
    }
    content.style.animation = 'none'
    content.style.transition = 'none'
  }

  const continueDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const content = contentRef.current
    const drag = dragState.current
    if (!content || !drag) return
    const draggedDistancePx = event.clientY - drag.startClientY
    const appliedOffsetPx = draggedDistancePx < 0 ? draggedDistancePx * DRAG_UP_RUBBER_BAND_RATIO : draggedDistancePx
    content.style.transform = `translateY(${appliedOffsetPx}px)`
    const nowMs = performance.now()
    const elapsedMs = nowMs - drag.lastTimeMs
    drag.velocityPxPerSec = elapsedMs > 0 ? (event.clientY - drag.lastClientY) / elapsedMs * 1000 : 0
    drag.lastClientY = event.clientY
    drag.lastTimeMs = nowMs
    drag.lastOffsetPx = appliedOffsetPx
  }

  const endDrag = () => {
    const content = contentRef.current
    const drag = dragState.current
    if (!content || !drag) return
    dragState.current = null
    const projectedDistancePx = drag.lastOffsetPx + drag.velocityPxPerSec * DRAG_VELOCITY_DECAY / 1000 / (1 - DRAG_VELOCITY_DECAY)
    const shouldClose = projectedDistancePx > DRAG_CLOSE_PROJECTED_DISTANCE_PX
    if (!shouldClose && drag.lastOffsetPx === 0 && drag.velocityPxPerSec === 0) {
      content.style.transition = ''
      content.style.transform = ''
      content.style.animation = ''
      return
    }
    content.style.transition = 'transform var(--dur) var(--ease-spring)'
    content.style.transform = shouldClose ? 'translateY(100%)' : 'translateY(0)'
    const handOffToStateDrivenAnimation = (event: TransitionEvent) => {
      if (event.propertyName !== 'transform') return
      content.removeEventListener('transitionend', handOffToStateDrivenAnimation)
      content.style.transition = ''
      content.style.transform = ''
      content.style.animation = ''
      if (shouldClose) onClose()
    }
    content.addEventListener('transitionend', handOffToStateDrivenAnimation)
  }

  if (!displayedTask) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsResolvingTurnstile(true)
    try {
      const turnstileToken = await resolveTurnstileToken()
      if (!turnstileToken) return
      updateTask.mutate({ id: displayedTask.id, title: title.trim(), note: note || null, estimate: estimate ? Number(estimate) : null, turnstileToken }, { onSuccess: () => { onSaved?.(); onClose() } })
    } finally {
      setIsResolvingTurnstile(false)
    }
  }

  const deleteTaskFromSheet = async () => {
    if (!window.confirm(messages.task.deleteConfirm)) return
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) return
    deleteTask.mutate({ id: displayedTask.id, turnstileToken }, { onSuccess: onDeleted })
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-scrim" />
        <Dialog.Content
          ref={contentRef}
          className={`sheet ${isDecomposing ? 'decomposition-sheet' : ''}`}
          onOpenAutoFocus={(event) => {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
            event.preventDefault()
            titleInput.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            openerRef.current?.focus()
          }}
        >
          {isDecomposing ? <>
            <Dialog.Title>{messages.decomposition.title}</Dialog.Title>
            <Dialog.Description className="sr-only">分解案を確認して編集します</Dialog.Description>
            <div className="grabber" aria-hidden="true" onPointerDown={beginDrag} onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
            <TaskDecompositionPreview taskId={displayedTask.id} resolveTurnstileToken={resolveTurnstileToken} onCancel={() => setIsDecomposing(false)} onDecomposed={() => { onDecomposed?.(); if (!onDecomposed) onClose() }} />
          </> : <>
            <Dialog.Title>タスクを編集</Dialog.Title>
            <Dialog.Description className="sr-only">タスクのタイトル・メモ・見積もりを編集します</Dialog.Description>
            <div className="grabber" aria-hidden="true" onPointerDown={beginDrag} onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag} />
            <form onSubmit={(event) => { void submit(event) }}>
              <label className="field"><span>タイトル</span><input ref={titleInput} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={240} /></label>
              <label className="field"><span>{messages.task.note}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} /></label>
              <label className="field"><span>{messages.task.estimate}（1〜8）</span><input type="number" min="1" max="8" value={estimate} onChange={(event) => setEstimate(event.target.value)} placeholder={messages.task.noEstimate} /></label>
              <div className="sheet-actions"><Dialog.Close asChild><button className="btn btn-ghost" type="button">キャンセル</button></Dialog.Close><button className="btn btn-primary" type="submit" disabled={updateTask.isPending || isResolvingTurnstile}>保存</button><button className="btn" type="button" onClick={() => setIsDecomposing(true)}>{messages.task.decompose}</button><button className="btn btn-error" type="button" onClick={() => { void deleteTaskFromSheet() }} disabled={deleteTask.isPending}>{messages.task.delete}</button></div>
            </form>
          </>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
