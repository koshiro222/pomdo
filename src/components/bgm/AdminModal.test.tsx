import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminModal } from './AdminModal'

// react-domのcreatePortalをモック
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    createPortal: vi.fn((children) => children),
  }
})

// Framer Motionのモック
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// tapAnimationをモック
vi.mock('@/lib/animation', () => ({
  tapAnimation: {}
}))

// TrackListとAddTrackFormをモック
vi.mock('./TrackList', () => ({
  TrackList: ({ onAdd }: { onAdd: () => void }) => (
    <div>
      <div>トラック一覧</div>
      <button onClick={onAdd}>追加</button>
    </div>
  ),
}))

vi.mock('./AddTrackForm', () => ({
  AddTrackForm: ({ onBack }: { onBack: () => void }) => (
    <div>
      <div>追加フォーム</div>
      <button onClick={onBack}>戻る</button>
    </div>
  ),
}))

describe('AdminModal', () => {
  const mockOnClose = vi.fn()

  const renderComponent = (isOpen = true) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    })

    return render(
      <QueryClientProvider client={queryClient}>
        <AdminModal isOpen={isOpen} onClose={mockOnClose} />
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal when isOpen is true', () => {
    renderComponent()

    // "BGM管理"というテキストが存在することを確認
    expect(screen.getByText('BGM管理')).toBeInTheDocument()
  })

  it('should not render modal when isOpen is false', () => {
    renderComponent(false)

    // モーダルコンテンツが存在しないことを確認
    expect(screen.queryByText('BGM管理')).not.toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    renderComponent()

    // 背景要素をクリック（fixed inset-0の背景オーバーレイ）
    const backdrop = document.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onClose when Escape key is pressed', () => {
    renderComponent()

    // Escapeキーを押下
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when close button (X) is clicked', () => {
    renderComponent()

    // 閉じるボタン（X）をクリック
    const closeButton = screen.getByLabelText('閉じる')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should show list content in list mode (default)', () => {
    renderComponent()

    // デフォルトのlistモードでは「トラック一覧」テキストが表示される
    expect(screen.getByText('トラック一覧')).toBeInTheDocument()
  })

  it('should show add form when add mode is activated', () => {
    renderComponent()

    // 追加ボタンをクリック（TrackList内のボタン）
    const addButton = screen.getByText('追加')
    fireEvent.click(addButton)

    // 追加フォームが表示される
    expect(screen.getByText('追加フォーム')).toBeInTheDocument()
  })
})
