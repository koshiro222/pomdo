import { describe, expect, it } from 'vitest'
import { createFocusStartProof, verifyFocusStartProof } from './focus-proof'

describe('Focus 開始証明', () => {
  const input = {
    userId: 'user-1',
    sessionId: '00000000-0000-4000-8000-000000000001',
    taskId: null,
    startedAt: '2026-09-04T00:00:00.000Z',
    plannedSecs: 1500,
  } as const

  it('サーバーが署名した開始情報だけを復元できる', async () => {
    const token = await createFocusStartProof('test-secret', input)
    await expect(verifyFocusStartProof('test-secret', token)).resolves.toEqual(input)
    await expect(verifyFocusStartProof('another-secret', token)).resolves.toBeNull()
  })

  it('payload の改変を拒否する', async () => {
    const token = await createFocusStartProof('test-secret', input)
    const [encodedPayload, signature] = token.split('.')
    const tamperedPayload = btoa(JSON.stringify({ ...input, plannedSecs: 2700 }))
      .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
    await expect(verifyFocusStartProof('test-secret', `${tamperedPayload}.${signature}`)).resolves.toBeNull()
    await expect(verifyFocusStartProof('test-secret', `${encodedPayload}.${signature}.extra`)).resolves.toBeNull()
  })

  it('開始証明にセッション ID を含める', async () => {
    const token = await createFocusStartProof('test-secret', input)
    const proof = await verifyFocusStartProof('test-secret', token)
    expect(proof?.sessionId).not.toBe('00000000-0000-4000-8000-000000000002')
  })
})
