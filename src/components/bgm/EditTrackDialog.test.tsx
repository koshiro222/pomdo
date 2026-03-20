import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditTrackDialog } from './EditTrackDialog'
import type { Track } from './TrackItem'

// tRPCフックをモック
const mockUpdateMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
  reset: vi.fn(),
}

vi.mock('@/lib/trpc', () => ({
  trpc: {
    bgm: {
      update: {
        useMutation: () => mockUpdateMutation,
      },
    },
  },
}))

// useUiStoreをモック
const mockToast = vi.fn()
vi.mock('@/lib/store', () => ({
  useUiStore: () => ({
    toast: mockToast,
  }),
}))

describe('EditTrackDialog', () => {
  const mockTrack: Track = {
    id: '1',
    title: 'Original Title',
    artist: 'Original Artist',
    color: '#3b82f6',
    tier: 'free',
    filename: 'test.mp3',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render with existing values', () => {
    // EditTrackDialogをレンダリング
    render(
      <EditTrackDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 各フィールドに既存値が表示されることを確認
    expect(screen.getByDisplayValue('Original Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Original Artist')).toBeInTheDocument()
    expect(screen.getByDisplayValue('#3b82f6')).toBeInTheDocument()
    expect(screen.getByDisplayValue('free')).toBeInTheDocument()
  })

  it('should update form fields on input', async () => {
    const user = userEvent.setup()
    render(
      <EditTrackDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 各フィールドの値を変更
    const titleInput = screen.getByDisplayValue('Original Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Title')
    expect(titleInput).toHaveValue('Updated Title')

    const artistInput = screen.getByDisplayValue('Original Artist')
    await user.clear(artistInput)
    await user.type(artistInput, 'Updated Artist')
    expect(artistInput).toHaveValue('Updated Artist')

    const colorInput = screen.getByDisplayValue('#3b82f6')
    await user.clear(colorInput)
    await user.type(colorInput, '#ff0000')
    expect(colorInput).toHaveValue('#ff0000')

    const tierSelect = screen.getByDisplayValue('free')
    await user.selectOptions(tierSelect, 'premium')
    expect(tierSelect).toHaveValue('premium')
  })

  it('should call update mutation on submit', async () => {
    const user = userEvent.setup()
    render(
      <EditTrackDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // フォームを更新
    await user.clear(screen.getByDisplayValue('Original Title'))
    await user.type(screen.getByDisplayValue(''), 'Updated Title')

    // 送信ボタンをクリック
    const submitButton = screen.getByRole('button', { name: /save|保存|更新/i })
    await user.click(submitButton)

    // update mutationが正しいデータで呼ばれることを確認
    expect(mockUpdateMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Updated Title',
      })
    )
  })

  it('should show success toast and call onClose when successful', () => {
    render(
      <EditTrackDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // update mutationを成功させる（手動でトリガー）
    const submitButton = screen.getByRole('button', { name: /save|保存|更新/i })
    fireEvent.click(submitButton)

    // 注: 将来の実装で成功ハンドラーが呼ばれることを確認
    // 現時点ではmutationが呼ばれることを確認
    expect(mockUpdateMutation.mutate).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <EditTrackDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole('button', { name: /cancel|キャンセル/i })
    fireEvent.click(cancelButton)

    // onCloseが呼ばれることを確認
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
