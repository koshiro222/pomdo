import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrackList } from './TrackList'

// tRPCフックをモック
const mockTracks = [
  {
    id: '1',
    title: 'Test Track 1',
    artist: 'Artist 1',
    color: '#3b82f6',
    tier: 'free' as const,
    filename: 'test1.mp3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Test Track 2',
    artist: 'Artist 2',
    color: '#10b981',
    tier: 'premium' as const,
    filename: 'test2.mp3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

vi.mock('@/lib/trpc', () => ({
  trpc: {
    bgm: {
      getAll: {
        useQuery: vi.fn(() => ({
          data: mockTracks,
          isLoading: false,
          error: null,
        })),
      },
    },
  },
}))

// TrackItemをモック（まだ実装されていないため）
vi.mock('./TrackItem', () => ({
  TrackItem: ({ track }: { track: any }) => (
    <div data-testid={`track-${track.id}`}>
      {track.title} - {track.artist}
    </div>
  ),
}))

describe('TrackList', () => {
  const mockOnAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render track list', () => {
    // TrackListをレンダリング
    render(<TrackList onAdd={mockOnAdd} />)

    // トラックアイテムが表示されることを確認
    expect(screen.getByTestId('track-1')).toBeInTheDocument()
    expect(screen.getByTestId('track-2')).toBeInTheDocument()
  })

  it('should render empty state when no tracks', () => {
    // tRPCモックで空配列を設定
    const { trpc } = require('@/lib/trpc')
    trpc.bgm.getAll.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })

    // TrackListをレンダリング
    render(<TrackList onAdd={mockOnAdd} />)

    // "トラックがありません"が表示されることを確認
    expect(screen.getByText('トラックがありません')).toBeInTheDocument()
  })

  it('should render loading state', () => {
    // tRPCモックでisLoading=trueを設定
    const { trpc } = require('@/lib/trpc')
    trpc.bgm.getAll.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    // TrackListをレンダリング
    render(<TrackList onAdd={mockOnAdd} />)

    // "Loading..."が表示されることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should call onAdd when add button is clicked', () => {
    // TrackListをレンダリング
    render(<TrackList onAdd={mockOnAdd} />)

    // 追加ボタンを探してクリック
    const addButton = screen.getByRole('button', { name: /追加|add/i }) ||
                      screen.getByText('追加')
    fireEvent.click(addButton)

    // onAddが呼ばれることを確認
    expect(mockOnAdd).toHaveBeenCalledTimes(1)
  })

  it('should render error state', () => {
    // tRPCモックでerrorを設定
    const { trpc } = require('@/lib/trpc')
    trpc.bgm.getAll.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch tracks'),
    })

    // TrackListをレンダリング
    render(<TrackList onAdd={mockOnAdd} />)

    // エラーメッセージが表示されることを確認
    expect(screen.getByText(/error|エラー|失敗/i)).toBeInTheDocument()
  })
})
