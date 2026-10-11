import { act, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import userEvent from '@testing-library/user-event'
import type { DragEndEvent } from '@dnd-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskList } from './TaskList'
import type { TaskView } from './TaskRow'

const mocks = vi.hoisted(() => ({
  complete: { mutate: vi.fn(), isPending: false },
  delete: { mutate: vi.fn(), isPending: false },
  deleteMany: { mutate: vi.fn(), isPending: false },
  reorder: { mutate: vi.fn(), isPending: false },
  onDeckDragEnd: null as ((event: DragEndEvent) => void) | null,
}))

vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...actual,
    DndContext: (props: ComponentProps<typeof actual.DndContext>) => {
      mocks.onDeckDragEnd = props.onDragEnd ?? null
      return <actual.DndContext {...props} />
    },
  }
})

vi.mock('../../lib/trpc', () => ({
  trpc: {
    tasks: {
      complete: { useMutation: () => mocks.complete },
      delete: { useMutation: () => mocks.delete },
      deleteMany: { useMutation: () => mocks.deleteMany },
      reorder: { useMutation: () => mocks.reorder },
    },
  },
}))

vi.mock('./TaskAddForm', () => ({ TaskAddForm: () => null }))
vi.mock('./TaskDetailsSheet', () => ({ TaskDetailsSheet: () => null }))

const nowTask: TaskView = { id: 'now-id', title: 'NowのTask', note: null, estimate: null, deckOrder: null, completedAt: null }
const onDeckTask: TaskView = { id: 'deck-id', title: 'NextのTask', note: null, estimate: null, deckOrder: 'a', completedAt: null }
const secondOnDeckTask: TaskView = { id: 'deck-second-id', title: 'その次のTask', note: null, estimate: null, deckOrder: 'b', completedAt: null }
const thirdOnDeckTask: TaskView = { id: 'deck-third-id', title: '最後のTask', note: null, estimate: null, deckOrder: 'c', completedAt: null }
const backlogTask: TaskView = { id: 'backlog-id', title: 'BacklogのTask', note: null, estimate: null, deckOrder: null, completedAt: null }
const doneTask: TaskView = { id: 'done-id', title: '完了済みのTask', note: null, estimate: null, deckOrder: null, completedAt: new Date('2026-09-04T00:00:00Z') }

function renderList({ selectedTaskIds = new Set([nowTask.id, onDeckTask.id]), activeFocusTaskId = null, onDeck = [onDeckTask, secondOnDeckTask, thirdOnDeckTask], resolveTurnstileToken = async () => 'turnstile-token' }: {
  selectedTaskIds?: ReadonlySet<string>
  activeFocusTaskId?: string | null
  onDeck?: TaskView[]
  resolveTurnstileToken?: () => Promise<string | null>
} = {}) {
  const props = {
    currentTask: nowTask,
    onDeck,
    backlog: [backlogTask],
    done: [doneTask],
    selectedTaskIds,
    onSelectionChange: vi.fn(),
    onSelectionRemove: vi.fn(),
    onBulkDeleteSuccess: vi.fn(),
    activeFocusTaskId,
    resolveTurnstileToken,
    onRefresh: vi.fn(),
    onMoveToNow: vi.fn(),
  }
  return { ...render(<TaskList {...props} />), props }
}

function visibleOnDeckTitles(container: HTMLElement) {
  const section = container.querySelector('section[aria-labelledby="on-deck-heading"]')
  return Array.from(section?.querySelectorAll('.task-row .task-title') ?? []).map((title) => title.textContent)
}

function dragOnDeck(activeId: string, overId: string) {
  if (!mocks.onDeckDragEnd) throw new Error('On Deck のドラッグ終了処理が見つかりません')
  mocks.onDeckDragEnd({ active: { id: activeId }, over: { id: overId } } as DragEndEvent)
}

describe('TaskList', () => {
  beforeEach(() => {
    for (const mutation of [mocks.complete, mocks.delete, mocks.deleteMany, mocks.reorder]) {
      mutation.mutate.mockReset()
      mutation.isPending = false
    }
    mocks.onDeckDragEnd = null
  })

  it('ドロップ直後から並べ替え、表示順に隣接IDを使って保存する', async () => {
    let resolveToken!: (token: string | null) => void
    const resolveTurnstileToken = vi.fn(() => new Promise<string | null>((resolve) => { resolveToken = resolve }))
    const { container, props, rerender } = renderList({ resolveTurnstileToken })
    const handle = screen.getByRole('button', { name: '最後のTaskをドラッグして並べ替え' })
    handle.focus()

    act(() => dragOnDeck(thirdOnDeckTask.id, onDeckTask.id))
    expect(visibleOnDeckTitles(container)).toEqual(['最後のTask', 'NextのTask', 'その次のTask'])
    expect(handle).toHaveFocus()
    expect(handle).toHaveAttribute('aria-disabled', 'true')
    expect(handle).not.toBeDisabled()
    expect(resolveTurnstileToken).toHaveBeenCalledOnce()
    expect(mocks.reorder.mutate).not.toHaveBeenCalled()

    act(() => dragOnDeck(secondOnDeckTask.id, onDeckTask.id))
    expect(mocks.reorder.mutate).not.toHaveBeenCalled()

    await act(async () => {
      resolveToken('turnstile-token')
      await Promise.resolve()
    })
    expect(mocks.reorder.mutate).toHaveBeenCalledWith({
      id: thirdOnDeckTask.id,
      previousId: null,
      nextId: onDeckTask.id,
      turnstileToken: 'turnstile-token',
    }, expect.any(Object))

    const options = mocks.reorder.mutate.mock.calls[0]?.[1]
    act(() => options?.onSuccess())
    expect(props.onRefresh).toHaveBeenCalledOnce()
    expect(visibleOnDeckTitles(container)).toEqual(['最後のTask', 'NextのTask', 'その次のTask'])

    rerender(<TaskList {...props} onDeck={[
      { ...thirdOnDeckTask, deckOrder: 'a' },
      { ...onDeckTask, deckOrder: 'b' },
      { ...secondOnDeckTask, deckOrder: 'c' },
    ]} />)
    expect(visibleOnDeckTitles(container)).toEqual(['最後のTask', 'NextのTask', 'その次のTask'])
  })

  it.each([
    ['tokenがnull', async () => null],
    ['token取得がreject', async () => { throw new Error('token resolver failed') }],
  ])('%s の場合は元の順序へ戻して alert を表示する', async (_scenario, resolveTurnstileToken) => {
    const { container } = renderList({ resolveTurnstileToken })
    act(() => dragOnDeck(thirdOnDeckTask.id, onDeckTask.id))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Taskの順序を保存できませんでした'))
    expect(visibleOnDeckTitles(container)).toEqual(['NextのTask', 'その次のTask', '最後のTask'])
    expect(mocks.reorder.mutate).not.toHaveBeenCalled()
  })

  it('mutation失敗時は元の順序とTaskの選択状態を戻す', async () => {
    const { container } = renderList()
    act(() => dragOnDeck(thirdOnDeckTask.id, onDeckTask.id))
    await waitFor(() => expect(mocks.reorder.mutate).toHaveBeenCalledOnce())

    const options = mocks.reorder.mutate.mock.calls[0]?.[1]
    act(() => options?.onError(new Error('reorder failed')))

    expect(visibleOnDeckTitles(container)).toEqual(['NextのTask', 'その次のTask', '最後のTask'])
    expect(screen.getByRole('checkbox', { name: 'NextのTaskを削除対象に選択' })).toBeChecked()
    expect(screen.getByRole('alert')).toHaveTextContent('Taskの順序を保存できませんでした')
  })

  it('古い props のまま続けて並べ替えが失敗したら、2回目の開始順へ戻す', async () => {
    const { container } = renderList()
    act(() => dragOnDeck(thirdOnDeckTask.id, onDeckTask.id))
    await waitFor(() => expect(mocks.reorder.mutate).toHaveBeenCalledOnce())
    const firstOptions = mocks.reorder.mutate.mock.calls[0]?.[1]
    act(() => firstOptions?.onSuccess())
    expect(visibleOnDeckTitles(container)).toEqual(['最後のTask', 'NextのTask', 'その次のTask'])

    act(() => dragOnDeck(thirdOnDeckTask.id, secondOnDeckTask.id))
    await waitFor(() => expect(mocks.reorder.mutate).toHaveBeenCalledTimes(2))
    const secondOptions = mocks.reorder.mutate.mock.calls[1]?.[1]
    act(() => secondOptions?.onError(new Error('reorder failed')))

    expect(visibleOnDeckTitles(container)).toEqual(['最後のTask', 'NextのTask', 'その次のTask'])
    expect(screen.getByRole('alert')).toHaveTextContent('Taskの順序を保存できませんでした')
  })

  it('pending中は削除を再実行できない', async () => {
    mocks.deleteMany.isPending = true
    const user = userEvent.setup()
    renderList()

    await user.click(screen.getByRole('button', { name: '選択した2件のタスクを削除' }))
    expect(screen.getByRole('button', { name: '削除しています…' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: '削除しています…' }))
    expect(mocks.deleteMany.mutate).not.toHaveBeenCalled()
  })

  it('API失敗時はDialogを閉じ、alertと選択を維持して再取得する', async () => {
    const user = userEvent.setup()
    const { props } = renderList()

    await user.click(screen.getByRole('button', { name: '選択した2件のタスクを削除' }))
    await user.click(screen.getByRole('button', { name: '2件を削除する' }))
    expect(mocks.deleteMany.mutate).toHaveBeenCalledWith({ ids: [nowTask.id, onDeckTask.id], turnstileToken: 'turnstile-token' }, expect.any(Object))
    const options = mocks.deleteMany.mutate.mock.calls[0]?.[1]
    await act(async () => options?.onError(new Error('request failed')))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('選択したTaskを削除できませんでした')
    expect(screen.getByText('2件を削除対象として選択中')).toBeInTheDocument()
    expect(props.onSelectionRemove).not.toHaveBeenCalled()
    expect(props.onBulkDeleteSuccess).not.toHaveBeenCalled()
    expect(props.onRefresh).toHaveBeenCalledOnce()
  })

  it('成功時は実際に削除されたIDを親へ通知し、再取得する', async () => {
    const user = userEvent.setup()
    const { props } = renderList({ activeFocusTaskId: nowTask.id })

    await user.click(screen.getByRole('button', { name: '選択した2件のタスクを削除' }))
    const dialog = screen.getByRole('dialog', { name: '選択した2件のタスクを削除' })
    expect(dialog).toHaveAccessibleDescription(/タイマーは続き/)
    await user.click(screen.getByRole('button', { name: '2件を削除する' }))
    const options = mocks.deleteMany.mutate.mock.calls[0]?.[1]
    await act(async () => options?.onSuccess([nowTask.id, onDeckTask.id]))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(props.onSelectionRemove).not.toHaveBeenCalled()
    expect(props.onBulkDeleteSuccess).toHaveBeenCalledWith([nowTask.id, onDeckTask.id])
    expect(props.onRefresh).toHaveBeenCalledOnce()
  })

  it("Backlog折りたたみ後も選択数を保ち、Today's Doneに選択checkboxを表示しない", async () => {
    const user = userEvent.setup()
    const { props } = renderList({ selectedTaskIds: new Set([backlogTask.id]) })
    const backlogToggle = screen.getAllByRole('button', { name: /^Backlog/ })[0]
    if (!backlogToggle) throw new Error('Backlogの開閉ボタンがありません')

    expect(screen.getByText('1件を削除対象として選択中')).toBeInTheDocument()
    await user.click(backlogToggle)
    expect(screen.getByRole('checkbox', { name: 'BacklogのTaskを削除対象に選択' })).toBeChecked()
    await user.click(backlogToggle)
    expect(screen.getByText('1件を削除対象として選択中')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /今日完了したこと/ }))
    expect(screen.queryByRole('checkbox', { name: '完了済みのTaskを削除対象に選択' })).not.toBeInTheDocument()
    expect(props.onSelectionChange).not.toHaveBeenCalled()
  })
})
