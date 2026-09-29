import { useRef, useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskBulkDeleteDialog } from './TaskBulkDeleteDialog'
import type { TaskView } from './TaskRow'

const tasks: TaskView[] = [
  { id: 'task-1', title: '申請書を作る', note: null, estimate: null, deckOrder: 'a', completedAt: null },
  { id: 'task-2', title: '資料を確認する', note: null, estimate: null, deckOrder: 'b', completedAt: null },
]

function renderDialog({ activeFocusTaskId = null, onConfirm = vi.fn() }: { activeFocusTaskId?: string | null; onConfirm?: () => void } = {}) {
  const onOpenChange = vi.fn()
  const view = render(
    <TaskBulkDeleteDialog
      open
      tasks={tasks}
      activeFocusTaskId={activeFocusTaskId}
      isPending={false}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />,
  )
  return { ...view, onConfirm, onOpenChange }
}

function ControlledDialog({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(true)
  return <TaskBulkDeleteDialog open={open} tasks={tasks} activeFocusTaskId={null} isPending={false} onOpenChange={setOpen} onConfirm={onConfirm} />
}

function FocusRestoringDialog() {
  const [open, setOpen] = useState(false)
  const [showOpener, setShowOpener] = useState(true)
  const fallbackFocusRef = useRef<HTMLHeadingElement>(null)
  return <>
    {showOpener ? <button type="button" onClick={() => setOpen(true)}>確認を開く</button> : null}
    <h2 ref={fallbackFocusRef} tabIndex={-1}>Task一覧</h2>
    <TaskBulkDeleteDialog
      open={open}
      tasks={tasks}
      activeFocusTaskId={null}
      fallbackFocusRef={fallbackFocusRef}
      isPending={false}
      onOpenChange={setOpen}
      onConfirm={() => { setShowOpener(false); setOpen(false) }}
    />
  </>
}

describe('TaskBulkDeleteDialog', () => {
  it('件数と全Task名を一覧に表示し、実行中Focus対象があれば注意を説明に含める', () => {
    renderDialog({ activeFocusTaskId: 'task-2' })

    const dialog = screen.getByRole('dialog', { name: '選択した2件のタスクを削除' })
    expect(dialog).toHaveAccessibleDescription(/2件のタスクを削除します/)
    expect(dialog).toHaveAccessibleDescription(/タイマーは続き/)
    const taskList = within(screen.getByRole('list', { name: '削除するTaskの一覧' }))
    expect(taskList.getByText('申請書を作る')).toBeVisible()
    expect(taskList.getByText('資料を確認する')).toBeVisible()
  })

  it('対象Taskと関係ない実行中Focusの注意は表示しない', () => {
    renderDialog({ activeFocusTaskId: 'other-task' })

    expect(screen.queryByText(/タイマーは続き/)).not.toBeInTheDocument()
  })

  it('最初にCancelへフォーカスし、CancelとEscapeでは確定しない', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const { onOpenChange, unmount } = renderDialog({ onConfirm })

    await waitFor(() => expect(screen.getByRole('button', { name: 'キャンセル' })).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onConfirm).not.toHaveBeenCalled()

    unmount()
    render(<ControlledDialog onConfirm={onConfirm} />)
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('閉じた後は起点へ戻り、起点が消えた後は一覧見出しへ戻る', async () => {
    const user = userEvent.setup()
    render(<FocusRestoringDialog />)
    const opener = screen.getByRole('button', { name: '確認を開く' })

    await user.click(opener)
    await user.click(screen.getByRole('button', { name: 'キャンセル' }))
    await waitFor(() => expect(opener).toHaveFocus())

    await user.click(opener)
    await user.click(screen.getByRole('button', { name: '2件を削除する' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Task一覧' })).toHaveFocus())
  })

  it('確認は一度だけ実行でき、pending中は再実行できない', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const view = renderDialog({ onConfirm })
    const confirm = screen.getByRole('button', { name: '2件を削除する' })
    await user.click(confirm)
    expect(onConfirm).toHaveBeenCalledOnce()

    view.rerender(
      <TaskBulkDeleteDialog
        open
        tasks={tasks}
        activeFocusTaskId={null}
        isPending
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    )
    const pendingButton = screen.getByRole('button', { name: '削除しています…' })
    expect(pendingButton).toBeDisabled()
    await user.click(pendingButton)
    expect(onConfirm).toHaveBeenCalledOnce()
  })
})
