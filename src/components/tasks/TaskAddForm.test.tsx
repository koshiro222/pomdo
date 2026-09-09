import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskAddForm } from './TaskAddForm'

const mocks = vi.hoisted(() => ({
  create: {
    mutate: vi.fn(),
    isPending: false,
  },
}))

vi.mock('../../lib/trpc', () => ({
  trpc: {
    tasks: {
      create: { useMutation: () => mocks.create },
    },
  },
}))

describe('TaskAddForm', () => {
  beforeEach(() => {
    mocks.create.mutate.mockReset()
    mocks.create.isPending = false
  })

  it('Turnstileトークン取得後にTaskを追加する', async () => {
    let resolveToken: ((token: string) => void) | undefined
    const resolveTurnstileToken = () => new Promise<string>((resolve) => { resolveToken = resolve })
    const user = userEvent.setup()
    render(<TaskAddForm bucket="onDeck" resolveTurnstileToken={resolveTurnstileToken} />)

    await user.type(screen.getByPlaceholderText('タスクを追加'), '確認するTask')
    await user.click(screen.getByRole('button', { name: '追加' }))
    expect(mocks.create.mutate).not.toHaveBeenCalled()

    resolveToken?.('turnstile-token')
    await waitFor(() => expect(mocks.create.mutate).toHaveBeenCalledWith({
      title: '確認するTask',
      bucket: 'onDeck',
      turnstileToken: 'turnstile-token',
    }, expect.anything()))
  })
})
