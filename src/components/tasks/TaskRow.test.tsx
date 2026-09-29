import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TaskRow, type TaskView } from './TaskRow'

const task: TaskView = {
  id: 'task-1',
  title: '記事を読む',
  note: null,
  estimate: 1,
  deckOrder: 'a',
  completedAt: null,
}

function renderTaskRow(onMoveToNow?: () => void) {
  return render(
    <DndContext>
      <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
        <TaskRow task={task} onComplete={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onMoveToNow={onMoveToNow} />
      </SortableContext>
    </DndContext>,
  )
}

describe('TaskRow', () => {
  it('メニュートリガーを押すと編集と削除の項目が表示される', async () => {
    const user = userEvent.setup()
    renderTaskRow()

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))

    expect(screen.getByRole('menuitem', { name: '編集' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: '削除' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Move to Now' })).not.toBeInTheDocument()
  })

  it('Nowへ移動できるタスクではメニューに Move to Now が表示される', async () => {
    const user = userEvent.setup()
    renderTaskRow(vi.fn())

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))

    expect(screen.getByRole('menuitem', { name: 'Move to Now' })).toBeVisible()
  })

  it('メニュー項目を選ぶと対応するcallbackが呼ばれる', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onMoveToNow = vi.fn()
    const user = userEvent.setup()
    render(
      <DndContext>
        <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
          <TaskRow task={task} onComplete={vi.fn()} onDelete={onDelete} onEdit={onEdit} onMoveToNow={onMoveToNow} />
        </SortableContext>
      </DndContext>,
    )

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))
    await user.click(screen.getByRole('menuitem', { name: '編集' }))
    expect(onEdit).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))
    await user.click(screen.getByRole('menuitem', { name: 'Move to Now' }))
    expect(onMoveToNow).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))
    await user.click(screen.getByRole('menuitem', { name: '削除' }))
    expect(onDelete).toHaveBeenCalledOnce()
  })
})
