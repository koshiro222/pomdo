import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskDecompositionPreview } from './TaskDecompositionPreview'

const mocks = vi.hoisted(() => ({
  preview: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  },
  previewOptions: null as { onSuccess?: (proposal: { items: Array<{ title: string; note: string | null }> }) => void } | null,
  confirm: {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
  },
}))

vi.mock('../../lib/trpc', () => ({
  trpc: {
    tasks: {
      decomposePreview: { useMutation: (options: typeof mocks.previewOptions) => { mocks.previewOptions = options; return mocks.preview } },
      decomposeConfirm: { useMutation: () => mocks.confirm },
    },
  },
}))

const proposal = {
  items: [
    { title: '最初のTask', note: '最初のメモ' },
    { title: '次のTask', note: null },
    { title: '<script>alert(1)</script>', note: 'HTMLにしない' },
  ],
}

function renderPreview(turnstileToken: string | null = 'token') {
  return render(<TaskDecompositionPreview taskId="00000000-0000-4000-8000-000000000001" resolveTurnstileToken={async () => turnstileToken} onCancel={vi.fn()} onDecomposed={vi.fn()} />)
}

describe('TaskDecompositionPreview', () => {
  beforeEach(() => {
    mocks.preview.mutate.mockReset()
    mocks.confirm.mutate.mockReset()
    mocks.preview.isPending = false
    mocks.preview.isError = false
    mocks.previewOptions = null
    mocks.confirm.isPending = false
    mocks.confirm.isError = false
  })

  it('preview開始中とエラーを表示する', async () => {
    const view = renderPreview()
    expect(screen.getByRole('status')).toHaveTextContent('分解案を作成しています')

    view.unmount()
    mocks.preview.isError = true
    renderPreview()
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('分解案を作成できませんでした'))
  })

  it('Turnstileトークン取得後にpreviewを開始する', async () => {
    const view = renderPreview(null)

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('確認に失敗しました'))
    view.rerender(<TaskDecompositionPreview taskId="00000000-0000-4000-8000-000000000001" resolveTurnstileToken={async () => 'token'} onCancel={vi.fn()} onDecomposed={vi.fn()} />)

    await waitFor(() => expect(mocks.preview.mutate).toHaveBeenCalledWith({
      id: '00000000-0000-4000-8000-000000000001',
      turnstileToken: 'token',
    }))
    expect(mocks.preview.mutate).toHaveBeenCalledOnce()
  })

  it('成功した分解案を編集、削除、上下移動できる', async () => {
    mocks.preview.mutate.mockImplementation(() => mocks.previewOptions?.onSuccess?.(proposal))
    const user = userEvent.setup()
    renderPreview()
    await waitFor(() => expect(screen.getByDisplayValue('最初のTask')).toBeInTheDocument())

    expect(screen.queryByText('<script>alert(1)</script>')).not.toBeInTheDocument()
    const titleInput = screen.getByDisplayValue('最初のTask')
    await user.clear(titleInput)
    await user.type(titleInput, '編集したTask')
    await user.click(screen.getByRole('button', { name: '次のTaskをこの分解案を削除' }))
    await user.click(screen.getByRole('button', { name: '編集したTaskを下へ' }))

    expect(screen.getByDisplayValue('編集したTask')).toBeInTheDocument()
    expect(screen.getByDisplayValue('HTMLにしない')).toBeInTheDocument()
    expect(screen.getByDisplayValue('<script>alert(1)</script>')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '分解を確定する' })).toBeEnabled()
  })

  it('全削除後は確定できず、キャンセルでは確定mutationを呼ばない', async () => {
    mocks.preview.mutate.mockImplementation(() => mocks.previewOptions?.onSuccess?.(proposal))
    const onCancel = vi.fn()
    const user = userEvent.setup()
    render(<TaskDecompositionPreview taskId="00000000-0000-4000-8000-000000000001" resolveTurnstileToken={async () => 'token'} onCancel={onCancel} onDecomposed={vi.fn()} />)
    await waitFor(() => expect(screen.getByDisplayValue('最初のTask')).toBeInTheDocument())
    for (const label of ['最初のTask', '次のTask', '<script>alert(1)</script>']) await user.click(screen.getByRole('button', { name: `${label}をこの分解案を削除` }))
    expect(screen.getByRole('button', { name: '分解を確定する' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(mocks.confirm.mutate).not.toHaveBeenCalled()
  })

  it('確定成功時に親callbackを呼ぶ', async () => {
    mocks.preview.mutate.mockImplementation(() => mocks.previewOptions?.onSuccess?.(proposal))
    const onDecomposed = vi.fn()
    mocks.confirm.mutate.mockImplementation((_input, options) => options.onSuccess({ items: [] }))
    const user = userEvent.setup()
    render(<TaskDecompositionPreview taskId="00000000-0000-4000-8000-000000000001" resolveTurnstileToken={async () => 'token'} onCancel={vi.fn()} onDecomposed={onDecomposed} />)
    await waitFor(() => expect(screen.getByDisplayValue('最初のTask')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: '分解を確定する' }))
    expect(onDecomposed).toHaveBeenCalledOnce()
    expect(mocks.confirm.mutate).toHaveBeenCalledWith(expect.objectContaining({ id: '00000000-0000-4000-8000-000000000001' }), expect.anything())
  })
})
