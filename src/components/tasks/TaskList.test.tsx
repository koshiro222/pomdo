import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskList } from './TaskList'
import type { TaskView } from './TaskRow'

const mocks = vi.hoisted(() => ({
  complete: { mutate: vi.fn(), isPending: false },
  delete: { mutate: vi.fn(), isPending: false },
  deleteMany: { mutate: vi.fn(), isPending: false },
  reorder: { mutate: vi.fn(), isPending: false },
}))

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
const backlogTask: TaskView = { id: 'backlog-id', title: 'BacklogのTask', note: null, estimate: null, deckOrder: null, completedAt: null }
const doneTask: TaskView = { id: 'done-id', title: '完了済みのTask', note: null, estimate: null, deckOrder: null, completedAt: new Date('2026-09-04T00:00:00Z') }

function renderList({ selectedTaskIds = new Set([nowTask.id, onDeckTask.id]), activeFocusTaskId = null }: { selectedTaskIds?: ReadonlySet<string>; activeFocusTaskId?: string | null } = {}) {
  const props = {
    currentTask: nowTask,
    onDeck: [onDeckTask],
    backlog: [backlogTask],
    done: [doneTask],
    selectedTaskIds,
    onSelectionChange: vi.fn(),
    onSelectionRemove: vi.fn(),
    onBulkDeleteSuccess: vi.fn(),
    activeFocusTaskId,
    resolveTurnstileToken: async () => 'turnstile-token',
    onRefresh: vi.fn(),
    onMoveToNow: vi.fn(),
  }
  return { ...render(<TaskList {...props} />), props }
}

describe('TaskList bulk delete', () => {
  beforeEach(() => {
    for (const mutation of Object.values(mocks)) {
      mutation.mutate.mockReset()
      mutation.isPending = false
    }
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
