import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'

export function TaskAddForm({ bucket, resolveTurnstileToken, onCreated }: { bucket: 'onDeck' | 'backlog'; resolveTurnstileToken: TurnstileTokenResolver; onCreated?: () => void }) {
  const [title, setTitle] = useState('')
  const [isResolvingTurnstile, setIsResolvingTurnstile] = useState(false)
  const createTask = trpc.tasks.create.useMutation()
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) return
    setIsResolvingTurnstile(true)
    try {
      const turnstileToken = await resolveTurnstileToken()
      if (!turnstileToken) return
      createTask.mutate({ title: cleanTitle, bucket, turnstileToken }, { onSuccess: () => { setTitle(''); onCreated?.() } })
    } finally {
      setIsResolvingTurnstile(false)
    }
  }
  return <form className="task-add" onSubmit={submit}>
    <Plus size={18} aria-hidden="true" />
    <label className="sr-only" htmlFor={`task-title-${bucket}`}>{messages.task.addPlaceholder}</label>
    <input className="input input-ghost" id={`task-title-${bucket}`} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={messages.task.addPlaceholder} maxLength={240} />
    <button className="btn btn-sm min-h-[34px] px-[11px] py-[6px]" type="submit" disabled={createTask.isPending || isResolvingTurnstile}>{messages.task.add}</button>
  </form>
}
