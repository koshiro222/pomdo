import { useEffect, useRef, useState, type FormEvent } from 'react'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import type { TaskView } from './TaskRow'

export function TaskDetailsSheet({ task, turnstileToken, onClose, onDeleted, onSaved }: { task: TaskView | null; turnstileToken: string | null; onClose: () => void; onDeleted: () => void; onSaved?: () => void }) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [note, setNote] = useState(task?.note ?? '')
  const [estimate, setEstimate] = useState(task?.estimate?.toString() ?? '')
  const updateTask = trpc.tasks.update.useMutation()
  const deleteTask = trpc.tasks.delete.useMutation()
  const titleInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLElement>(null)
  const opener = useRef<HTMLElement | null>(typeof document === 'undefined' ? null : document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const onCloseRef = useRef(onClose)
  const taskId = task?.id
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!taskId) return undefined
    titleInput.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])') ?? [])
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    const openerElement = opener.current
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      openerElement?.focus()
    }
  }, [taskId])
  if (!task) return null
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    updateTask.mutate({ id: task.id, title: title.trim(), note: note || null, estimate: estimate ? Number(estimate) : null, turnstileToken: turnstileToken ?? undefined }, { onSuccess: () => { onSaved?.(); onClose() } })
  }
  return <div className="sheet-scrim open" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
    <section ref={dialog} className="sheet open" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
      <div className="grabber" aria-hidden="true" />
      <h2 id="task-sheet-title">タスクを編集</h2>
      <form onSubmit={submit}>
        <label className="field"><span>タイトル</span><input ref={titleInput} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={240} /></label>
        <label className="field"><span>{messages.task.note}</span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} /></label>
        <label className="field"><span>{messages.task.estimate}（1〜8）</span><input type="number" min="1" max="8" value={estimate} onChange={(event) => setEstimate(event.target.value)} placeholder={messages.task.noEstimate} /></label>
        <div className="sheet-actions"><button className="btn btn-ghost" type="button" onClick={onClose}>キャンセル</button><button className="btn btn-primary" type="submit" disabled={updateTask.isPending}>保存</button><button className="btn btn-danger" type="button" onClick={() => { if (window.confirm(messages.task.deleteConfirm)) deleteTask.mutate({ id: task.id, turnstileToken: turnstileToken ?? undefined }, { onSuccess: onDeleted }) }}>{messages.task.delete}</button></div>
      </form>
    </section>
  </div>
}
