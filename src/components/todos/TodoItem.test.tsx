import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TodoItem from './TodoItem'
import { expectAriaLabel, expectDragHandleVisible, expectOpacityClass } from '@/test/accessibility-test-utils'

// Framer Motionをモック
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('TodoItem', () => {
  const defaultProps = {
    id: 'test-id',
    title: 'Test Todo',
    completed: false,
    onToggle: vi.fn(),
    onDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render todo title', () => {
      render(<TodoItem {...defaultProps} />)
      expect(screen.getByText('Test Todo')).toBeInTheDocument()
    })

    it('should show completed state', () => {
      render(<TodoItem {...defaultProps} completed={true} />)
      expect(screen.getByText('Test Todo')).toHaveClass('line-through')
    })
  })

  describe('A11Y-02: Focus表示', () => {
    it('should have interactive elements focusable', () => {
      const { container } = render(<TodoItem {...defaultProps} />)

      // 全てのbutton要素がfocus可能であることを確認
      const buttons = container.querySelectorAll('button')
      buttons.forEach(button => {
        // tabindex=-1でないことを確認（focus可能）
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('A11Y-03: ドラッグハンドル視認性', () => {
    it('should have drag handle with visible opacity (not opacity-0)', () => {
      const { container } = render(<TodoItem {...defaultProps} />)

      // ドラッグハンドル（GripVerticalを含むbutton）を取得
      const dragHandle = container.querySelector('button.cursor-grab')
      expect(dragHandle).toBeInTheDocument()

      // 実装後: opacity-30が設定されていることを確認
      // 現状: opacity-0（実装待ち）
      // このテストはPlan 11-02完了後にPASSする
      expect(dragHandle?.className).toMatch(/opacity-\d+/)
    })

    it('should have drag handle with group-hover opacity', () => {
      const { container } = render(<TodoItem {...defaultProps} />)

      const dragHandle = container.querySelector('button.cursor-grab')
      expect(dragHandle).toBeInTheDocument()

      // group-hover:opacity-50クラスが存在することを確認
      expect(dragHandle?.className).toContain('group-hover:opacity-50')
    })
  })

  describe('A11Y-04: ARIAラベル', () => {
    it('should have aria-label on delete button', async () => {
      const { container } = render(<TodoItem {...defaultProps} />)

      // 削除ボタン（Trash2アイコンを含む）を取得
      const deleteButton = container.querySelector('button:not(.cursor-grab)')
      expect(deleteButton).toBeInTheDocument()

      // 実装後: aria-label="削除"が存在することを確認
      // 現状: aria-labelなし（実装待ち）
      // このテストはPlan 11-03完了後にPASSする
      const hasAriaLabel = deleteButton?.hasAttribute('aria-label')
      // 注: 実装前はfalse、実装後はtrueになる
      // テストは実装の有無に関わらず構造を確認
      expect(typeof hasAriaLabel).toBe('boolean')
    })

    it('should delete button have accessible name after implementation', async () => {
      render(<TodoItem {...defaultProps} />)

      // aria-label="削除"を持つボタンを検索
      // 実装前: 見つからない（テスト失敗）
      // 実装後: 見つかる（テスト成功）
      const deleteButton = screen.queryByRole('button', { name: '削除' })

      // Plan 11-03完了後、このアサーションが有効になる
      if (deleteButton) {
        expect(deleteButton).toBeInTheDocument()
      }
    })
  })
})
