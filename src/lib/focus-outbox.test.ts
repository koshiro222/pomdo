import { beforeEach, describe, expect, it } from 'vitest'
import { flushFocusSessionOutbox, peekFocusSession, queueFocusSession, type FocusOutboxPayload } from './focus-outbox'

const payload: FocusOutboxPayload = {
  ownerUserId: 'user-1',
  startToken: 'signed-start-proof',
  id: '00000000-0000-4000-8000-000000000001',
  taskId: null,
  startedAt: '2026-09-04T00:00:00.000Z',
  completedAt: '2026-09-04T00:25:00.000Z',
  durationSecs: 1500,
  plannedSecs: 1500,
  kind: 'completed',
}

describe('Focus の送信待ち outbox', () => {
  beforeEach(() => window.localStorage.clear())

  it('1 件だけ保持し、別の実績で既存 payload を上書きしない', () => {
    queueFocusSession(payload)
    queueFocusSession({ ...payload, id: '00000000-0000-4000-8000-000000000002' })
    expect(peekFocusSession()?.id).toBe(payload.id)
  })

  it('所有者が違う flush は送信せず payload を保持する', async () => {
    queueFocusSession(payload)
    const send = async () => { throw new Error('呼ばれてはいけない') }
    await expect(flushFocusSessionOutbox('user-2', send)).resolves.toBe(false)
    expect(peekFocusSession()?.ownerUserId).toBe('user-1')
  })

  it('送信成功時だけ削除し、失敗時は次回へ残す', async () => {
    queueFocusSession(payload)
    await expect(flushFocusSessionOutbox('user-1', async () => undefined)).resolves.toBe(true)
    expect(peekFocusSession()).toBeNull()

    queueFocusSession(payload)
    await expect(flushFocusSessionOutbox('user-1', async () => { throw new Error('offline') })).resolves.toBe(false)
    expect(peekFocusSession()?.id).toBe(payload.id)
  })
})
