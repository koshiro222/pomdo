import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'

export function TaskAddForm({ bucket, turnstileToken, onCreated }: { bucket: 'onDeck' | 'backlog'; turnstileToken: string | null; onCreated?: () => void }) {
  const [title, setTitle] = useState('')
  const createTask = trpc.tasks.create.useMutation()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    createTask.mutate({ title: cleanTitle, bucket, turnstileToken: turnstileToken ?? undefined }, { onSuccess: () => { setTitle(''); onCreated?.() } })
  }
  return <form className="task-add" onSubmit={submit}>
    <Plus size={18} aria-hidden="true" />
    <label className="visually-hidden" htmlFor={`task-title-${bucket}`}>{messages.task.addPlaceholder}</label>
    <input id={`task-title-${bucket}`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={messages.task.addPlaceholder} maxLength={240} />
    <button className="btn btn-small" type="submit" disabled={createTask.isPending}>{messages.task.add}</button>
  </form>
}
