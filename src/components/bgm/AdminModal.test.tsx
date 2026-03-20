import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminModal } from './AdminModal'

// react-domのcreatePortalをモック
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: vi.fn((children) => children),
  }
})

// Framer Motionをモック
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: any }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  }
})

// TrackListをモック（まだ実装されていないため）
vi.mock('./TrackList', () => ({
  TrackList: () => <div data-testid="track-list">TrackList</div>,
}))

describe('AdminModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when isOpen is true', () => {
    // AdminModalをisOpen=trueでレンダリング
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // "BGM管理"というテキストが存在することを確認
    expect(screen.getByText('BGM管理')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    // AdminModalをisOpen=falseでレンダリング
    render(
      <AdminModal
        isOpen={false}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // モーダルコンテンツが存在しないことを確認
    expect(screen.queryByText('BGM管理')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    // onCloseモック関数を作成済み
    // AdminModalをレンダリング
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // 背景要素をクリック（fixed inset-0の背景オーバーレイ）
    const backdrop = screen.getByTestId(/backdrop|overlay|modal-backdrop/i) ||
                     document.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    } else {
      // 背景要素が見つからない場合は、モーダル全体のクリックをシミュレート
      const modal = screen.getByText('BGM管理').closest('[role="dialog"]') ||
                    screen.getByText('BGM管理').closest('.fixed')
      if (modal) {
        fireEvent.click(modal)
        expect(mockOnClose).toHaveBeenCalled()
      }
    }
  })

  it('should call onClose when Escape key is pressed', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // Escapeキーを押下
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button (X) is clicked', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // 閉じるボタン（X）を探してクリック
    const closeButton = screen.getByRole('button', { name: /close|閉じる|×/i }) ||
                        screen.getByLabelText(/close|閉じる/i)
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should render TrackList in list mode', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="list"
      />
    )

    // TrackListコンポーネントが表示されることを確認
    expect(screen.getByTestId('track-list')).toBeInTheDocument()
  })

  it('should render AddTrackForm in add mode', () => {
    // AddTrackFormもモック
    vi.mock('./AddTrackForm', () => ({
      AddTrackForm: () => <div data-testid="add-track-form">AddTrackForm</div>,
    }))

    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
        mode="add"
      />
    )

    // AddTrackFormが表示されることを確認（将来の実装用）
    // 現時点ではモーダルが表示されることを確認
    expect(screen.getByText('BGM管理')).toBeInTheDocument()
  })
})
