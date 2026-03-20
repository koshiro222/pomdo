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

describe('AdminModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when isOpen is true', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    // "BGM管理"というテキストが存在することを確認
    expect(screen.getByText('BGM管理')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    render(
      <AdminModal
        isOpen={false}
        onClose={mockOnClose}
      />
    )

    // モーダルコンテンツが存在しないことを確認
    expect(screen.queryByText('BGM管理')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    // 背景要素をクリック（fixed inset-0の背景オーバーレイ）
    const backdrop = document.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onClose when Escape key is pressed', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
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
      />
    )

    // 閉じるボタン（X）をクリック
    const closeButton = screen.getByLabelText('閉じる')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show list content in list mode (default)', () => {
    render(
      <AdminModal
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    // デフォルトのlistモードでは「トラック一覧」テキストが表示される
    expect(screen.getByText('トラック一覧（次のタスクで実装）')).toBeInTheDocument()
  })
})
