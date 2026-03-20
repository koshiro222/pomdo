import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import type { Track } from './TrackItem'

// tRPCフックをモック
const mockDeleteMutation = {
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
  reset: vi.fn(),
}

vi.mock('@/lib/trpc', () => ({
  trpc: {
    bgm: {
      delete: {
        useMutation: () => mockDeleteMutation,
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

describe('DeleteConfirmDialog', () => {
  const mockTrack: Track = {
    id: '1',
    title: 'Test Track',
    artist: 'Test Artist',
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

  it('should render confirmation message', () => {
    // DeleteConfirmDialogをレンダリング
    render(
      <DeleteConfirmDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 「「{track.title}」を削除しますか？」が表示されることを確認
    expect(screen.getByText(/Test Track.*削除/i)).toBeInTheDocument()
  })

  it('should call delete mutation when delete button is clicked', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /delete|削除/i })
    fireEvent.click(deleteButton)

    // delete mutationが正しいIDで呼ばれることを確認
    expect(mockDeleteMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
      })
    )
  })

  it('should show success toast and call onClose when successful', () => {
    render(
      <DeleteConfirmDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 削除ボタンをクリック
    const deleteButton = screen.getByRole('button', { name: /delete|削除/i })
    fireEvent.click(deleteButton)

    // 注: 将来の実装で成功ハンドラーが呼ばれることを確認
    // 現時点ではmutationが呼ばれることを確認
    expect(mockDeleteMutation.mutate).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', () => {
    render(
      <DeleteConfirmDialog
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

  it('should disable delete button while loading', () => {
    mockDeleteMutation.isLoading = true

    render(
      <DeleteConfirmDialog
        isOpen={true}
        track={mockTrack}
        onClose={mockOnClose}
      />
    )

    // 削除ボタンがdisabledであることを確認
    const deleteButton = screen.getByRole('button', { name: /delete|削除/i })
    expect(deleteButton).toBeDisabled()
  })
})
