import { DndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { render, screen, waitFor } from '@testing-library/react'
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
  it('メニュートリガーを押すと編集・完了・削除の項目が表示される', async () => {
    const user = userEvent.setup()
    renderTaskRow()

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))

    expect(screen.getByRole('menuitem', { name: '編集' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: '完了' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: '削除' })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Move to Now' })).not.toBeInTheDocument()
  })

  it('Task名付きcheckboxのSpace操作は選択callbackだけを呼ぶ', async () => {
    const onSelect = vi.fn()
    const onComplete = vi.fn()
    const onDelete = vi.fn()
    const onEdit = vi.fn()
    const onMoveToNow = vi.fn()
    const user = userEvent.setup()
    render(
      <DndContext>
        <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
          <TaskRow task={task} onSelect={onSelect} onComplete={onComplete} onDelete={onDelete} onEdit={onEdit} onMoveToNow={onMoveToNow} />
        </SortableContext>
      </DndContext>,
    )

    await user.tab()
    expect(screen.getByRole('checkbox', { name: '記事を読むを削除対象に選択' })).toHaveFocus()
    await user.keyboard(' ')

    expect(onSelect).toHaveBeenCalledWith(true)
    expect(onComplete).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
    expect(onEdit).not.toHaveBeenCalled()
    expect(onMoveToNow).not.toHaveBeenCalled()
  })

  it('キーボードでメニューを開き、完了項目を選べる', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()
    render(
      <DndContext>
        <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
          <TaskRow task={task} onComplete={onComplete} onDelete={vi.fn()} onEdit={vi.fn()} />
        </SortableContext>
      </DndContext>,
    )

    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: '記事を読むのメニュー' })).toHaveFocus()
    await user.keyboard('{Enter}')
    const completeItem = screen.getByRole('menuitem', { name: '完了' })
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '編集' })).toHaveFocus())
    await user.keyboard('{ArrowDown}')
    expect(completeItem).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(onComplete).toHaveBeenCalledOnce()
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
    const onComplete = vi.fn()
    const onMoveToNow = vi.fn()
    const user = userEvent.setup()
    render(
      <DndContext>
        <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
          <TaskRow task={task} onComplete={onComplete} onDelete={onDelete} onEdit={onEdit} onMoveToNow={onMoveToNow} />
        </SortableContext>
      </DndContext>,
    )

    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))
    await user.click(screen.getByRole('menuitem', { name: '完了' }))
    expect(onComplete).toHaveBeenCalledOnce()

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

  it('完了済みTaskはdisabled表示を保ち、選択checkboxと完了メニューを表示しない', async () => {
    const completedTask = { ...task, completedAt: new Date('2026-09-04T00:00:00Z') }
    const user = userEvent.setup()
    render(
      <DndContext>
        <SortableContext items={[task.id]} strategy={verticalListSortingStrategy}>
          <TaskRow task={completedTask} onSelect={vi.fn()} onComplete={vi.fn()} onDelete={vi.fn()} />
        </SortableContext>
      </DndContext>,
    )

    expect(screen.getByRole('button', { name: '記事を読むを完了' })).toBeDisabled()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '記事を読むのメニュー' }))
    expect(screen.queryByRole('menuitem', { name: '完了' })).not.toBeInTheDocument()
  })
})
