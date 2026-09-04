export type FocusOutboxPayload = {
  ownerUserId: string
  startToken: string
  id: string
  taskId: string | null
  startedAt: string
  completedAt: string | null
  stoppedAt?: string | null
  durationSecs: number
  plannedSecs: number
  kind: 'completed' | 'interrupted'
}

const OUTBOX_KEY = 'pomdo-focus-outbox'

function readOutbox(): FocusOutboxPayload | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(OUTBOX_KEY)
  if (!value) return null
  try {
    const payload = JSON.parse(value) as Partial<FocusOutboxPayload>
    if (
      typeof payload.ownerUserId !== 'string' ||
      typeof payload.startToken !== 'string' ||
      payload.startToken.length === 0 ||
      typeof payload.id !== 'string' ||
      (payload.kind !== 'completed' && payload.kind !== 'interrupted') ||
      typeof payload.taskId !== 'string' && payload.taskId !== null ||
      typeof payload.startedAt !== 'string' ||
      typeof payload.plannedSecs !== 'number' ||
      !Number.isInteger(payload.plannedSecs) ||
      typeof payload.durationSecs !== 'number' ||
      !Number.isInteger(payload.durationSecs)
    ) {
      window.localStorage.removeItem(OUTBOX_KEY)
      return null
    }
    return payload as FocusOutboxPayload
  } catch {
    window.localStorage.removeItem(OUTBOX_KEY)
    return null
  }
}

export function queueFocusSession(payload: FocusOutboxPayload): void {
  if (typeof window === 'undefined') return
  const current = readOutbox()
  if (current && current.id !== payload.id) return
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(payload))
}

export function peekFocusSession(): FocusOutboxPayload | null {
  return readOutbox()
}

export function clearFocusSessionOutbox(id: string): void {
  const current = readOutbox()
  if (current?.id === id) window.localStorage.removeItem(OUTBOX_KEY)
}

export async function flushFocusSessionOutbox(ownerUserId: string, send: (payload: FocusOutboxPayload) => Promise<void>): Promise<boolean> {
  const payload = readOutbox()
  if (!payload) return true
  if (payload.ownerUserId !== ownerUserId) return false
  try {
    await send(payload)
    clearFocusSessionOutbox(payload.id)
    return true
  } catch {
    return false
  }
}
