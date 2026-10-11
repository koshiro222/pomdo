import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskDetailsSheet } from './TaskDetailsSheet'
import type { TaskView } from './TaskRow'

const mocks = vi.hoisted(() => ({
  update: { mutate: vi.fn(), isPending: false },
  delete: { mutate: vi.fn(), isPending: false },
}))

vi.mock('../../lib/trpc', () => ({
  trpc: {
    tasks: {
      update: { useMutation: () => mocks.update },
      delete: { useMutation: () => mocks.delete },
    },
  },
}))

const firstTask: TaskView = {
  id: 'task-1',
  title: '最初のタスク',
  note: '最初のメモ',
  estimate: 2,
  deckOrder: 'a',
  completedAt: null,
}

const secondTask: TaskView = {
  id: 'task-2',
  title: '次のタスク',
  note: null,
  estimate: null,
  deckOrder: 'b',
  completedAt: null,
}

function renderSheet(task: TaskView | null = firstTask) {
  return render(<TaskDetailsSheet task={task} resolveTurnstileToken={async () => 'token'} onClose={vi.fn()} onDeleted={vi.fn()} />)
}

function ControlledSheet() {
  const [task, setTask] = useState<TaskView | null>(null)
  return <>
    <button type="button" onClick={() => setTask(firstTask)}>詳細を開く</button>
    <TaskDetailsSheet task={task} resolveTurnstileToken={async () => 'token'} onClose={() => setTask(null)} onDeleted={vi.fn()} />
  </>
}

describe('TaskDetailsSheet', () => {
  beforeEach(() => {
    mocks.update.mutate.mockReset()
    mocks.delete.mutate.mockReset()
    mocks.update.isPending = false
    mocks.delete.isPending = false
  })

  it('タスクを渡して開くとタイトル・メモ・見積もりが入力欄に反映される', async () => {
    renderSheet()

    await waitFor(() => expect(screen.getByDisplayValue('最初のタスク')).toBeInTheDocument())
    expect(screen.getByDisplayValue('最初のメモ')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'タスクを編集' })).toBeVisible()
  })

  it('異なるタスクへ切り替えるとフォームの入力値が新しいタスクの値にリセットされる', async () => {
    const view = renderSheet()
    await waitFor(() => expect(screen.getByDisplayValue('最初のタスク')).toBeInTheDocument())

    view.rerender(<TaskDetailsSheet task={secondTask} resolveTurnstileToken={async () => 'token'} onClose={vi.fn()} onDeleted={vi.fn()} />)

    await waitFor(() => expect(screen.getByDisplayValue('次のタスク')).toBeInTheDocument())
    expect(screen.queryByDisplayValue('最初のタスク')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('未設定')).toBeInTheDocument()
  })

  it('初期状態でタスクがなければダイアログを表示しない', () => {
    renderSheet(null)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('表示中のタスクを閉じるとダイアログを閉じる', async () => {
    const onClose = vi.fn()
    const view = render(<TaskDetailsSheet task={firstTask} resolveTurnstileToken={async () => 'token'} onClose={onClose} onDeleted={vi.fn()} />)
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'タスクを編集' })).toBeInTheDocument())

    view.rerender(<TaskDetailsSheet task={null} resolveTurnstileToken={async () => 'token'} onClose={onClose} onDeleted={vi.fn()} />)

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('ダイアログを閉じると開く操作をしたボタンへフォーカスを戻す', async () => {
    const user = userEvent.setup()
    render(<ControlledSheet />)

    await user.click(screen.getByRole('button', { name: '詳細を開く' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'タスクを編集' })).toBeInTheDocument())
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.getByRole('button', { name: '詳細を開く' })).toHaveFocus())
  })

  it('保存すると表示中タスクの値とTurnstileトークンを更新mutationへ渡す', async () => {
    const user = userEvent.setup()
    renderSheet()
    await waitFor(() => expect(screen.getByDisplayValue('最初のタスク')).toBeInTheDocument())

    const titleInput = screen.getByRole('textbox', { name: 'タイトル' })
    await user.clear(titleInput)
    await user.type(titleInput, '更新したタスク')
    await user.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => expect(mocks.update.mutate).toHaveBeenCalledWith({
      id: 'task-1',
      title: '更新したタスク',
      note: '最初のメモ',
      estimate: 2,
      turnstileToken: 'token',
    }, expect.anything()))
  })
})
