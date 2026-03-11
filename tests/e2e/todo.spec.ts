import { test, expect, type Page } from '@playwright/test'
import { signIn, cleanupTodos } from '../helpers/auth'

// ---- ヘルパー ----

async function addTodo(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: 'Add a new task...' }).click()
  await page.getByRole('textbox', { name: 'Add a new task...' }).fill(title)
  await page.keyboard.press('Enter')
}

function getTodoRow(page: Page, title: string) {
  return page.locator('div.group').filter({ hasText: title })
}

async function deleteTodo(page: Page, title: string): Promise<void> {
  const row = getTodoRow(page, title)
  await row.hover()
  await row.locator('button').last().click()
}

// ---- ゲストモード ----

test.describe('Todo CRUD - ゲストモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('Todo追加: テキスト入力→Enterでリストに表示される', async ({ page }) => {
    await addTodo(page, 'テストタスク')

    await expect(getTodoRow(page, 'テストタスク')).toBeVisible()
  })

  test('Todo完了: チェックボタンクリックで打ち消し線が入る', async ({ page }) => {
    await addTodo(page, '完了タスク')

    await getTodoRow(page, '完了タスク').getByRole('checkbox').click()

    await expect(page.locator('p.line-through').filter({ hasText: '完了タスク' })).toBeVisible()
  })

  test('Todo削除: 削除ボタンクリックで消える', async ({ page }) => {
    await addTodo(page, '削除タスク')
    await expect(getTodoRow(page, '削除タスク')).toBeVisible()

    await deleteTodo(page, '削除タスク')

    await expect(getTodoRow(page, '削除タスク')).not.toBeVisible()
  })

  test('残りタスク数: 追加・完了・削除に応じて変わる', async ({ page }) => {
    await expect(page.getByText('0 Left')).toBeVisible()

    await addTodo(page, 'タスクA')
    await expect(page.getByText('1 Left')).toBeVisible()

    await addTodo(page, 'タスクB')
    await expect(page.getByText('2 Left')).toBeVisible()

    await getTodoRow(page, 'タスクA').getByRole('checkbox').click()
    await expect(page.getByText('1 Left')).toBeVisible()

    await deleteTodo(page, 'タスクB')
    await expect(page.getByText('0 Left')).toBeVisible()
  })

  test('空 Todo: 空文字では追加できない', async ({ page }) => {
    await page.getByRole('button', { name: 'Add a new task...' }).click()
    await page.keyboard.press('Enter')

    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('フィルター: Active/Done/All で絞り込みが機能する', async ({ page }) => {
    await addTodo(page, 'アクティブタスク')
    await addTodo(page, '完了タスク')
    await getTodoRow(page, '完了タスク').getByRole('checkbox').click()

    // Active フィルター
    await page.getByRole('button', { name: 'Active' }).click()
    await expect(getTodoRow(page, 'アクティブタスク')).toBeVisible()
    await expect(getTodoRow(page, '完了タスク')).not.toBeVisible()

    // Done フィルター
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(getTodoRow(page, '完了タスク')).toBeVisible()
    await expect(getTodoRow(page, 'アクティブタスク')).not.toBeVisible()

    // All フィルター
    await page.getByRole('button', { name: 'All' }).click()
    await expect(getTodoRow(page, 'アクティブタスク')).toBeVisible()
    await expect(getTodoRow(page, '完了タスク')).toBeVisible()
  })

  test('タスク選択: クリックで CurrentTaskCard に表示される', async ({ page }) => {
    await addTodo(page, '選択タスク')

    await getTodoRow(page, '選択タスク').click()

    await expect(page.getByText('Current Task')).toBeVisible()
    await expect(page.getByRole('heading', { name: '選択タスク', level: 3 })).toBeVisible()
  })
})

// ---- ログインモード ----

test.describe('Todo CRUD - ログインモード', () => {
  test.beforeEach(async ({ page }) => {
    // ゲストデータが残っているとマイグレーションダイアログが出るので先にクリア
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await signIn(page)
    await cleanupTodos(page)
    // ログイン後に persist が DB Todos を todos-storage に保存するため明示的に削除
    await page.evaluate(() => localStorage.removeItem('todos-storage'))
    await page.goto('/')
    // auth が再解決される前に addTodo が呼ばれるとゲストモードで動作するため待機
    await page.getByRole('button', { name: /Logout/ }).waitFor({ timeout: 10000 })
  })

  test('Todo追加: テキスト入力→Enterでリストに表示される', async ({ page }) => {
    await addTodo(page, 'テストタスク')

    await expect(getTodoRow(page, 'テストタスク')).toBeVisible()
  })

  test('Todo完了: チェックボタンクリックで打ち消し線が入る', async ({ page }) => {
    await addTodo(page, '完了タスク')

    await getTodoRow(page, '完了タスク').getByRole('checkbox').click()

    await expect(page.locator('p.line-through').filter({ hasText: '完了タスク' })).toBeVisible()
  })

  test('Todo削除: 削除ボタンクリックで消える', async ({ page }) => {
    await addTodo(page, '削除タスク')
    await expect(getTodoRow(page, '削除タスク')).toBeVisible()

    await deleteTodo(page, '削除タスク')

    await expect(getTodoRow(page, '削除タスク')).not.toBeVisible()
  })

  test('残りタスク数: 追加・完了・削除に応じて変わる', async ({ page }) => {
    await expect(page.getByText('0 Left')).toBeVisible()

    await addTodo(page, 'タスクA')
    await expect(page.getByText('1 Left')).toBeVisible()

    await addTodo(page, 'タスクB')
    await expect(page.getByText('2 Left')).toBeVisible()

    await getTodoRow(page, 'タスクA').getByRole('checkbox').click()
    await expect(page.getByText('1 Left')).toBeVisible()

    await deleteTodo(page, 'タスクB')
    await expect(page.getByText('0 Left')).toBeVisible()
  })

  test('空 Todo: 空文字では追加できない', async ({ page }) => {
    await page.getByRole('button', { name: 'Add a new task...' }).click()
    await page.keyboard.press('Enter')

    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('フィルター: Active/Done/All で絞り込みが機能する', async ({ page }) => {
    await addTodo(page, 'アクティブタスク')
    await addTodo(page, '完了タスク')
    await getTodoRow(page, '完了タスク').getByRole('checkbox').click()

    // Active フィルター
    await page.getByRole('button', { name: 'Active' }).click()
    await expect(getTodoRow(page, 'アクティブタスク')).toBeVisible()
    await expect(getTodoRow(page, '完了タスク')).not.toBeVisible()

    // Done フィルター
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(getTodoRow(page, '完了タスク')).toBeVisible()
    await expect(getTodoRow(page, 'アクティブタスク')).not.toBeVisible()

    // All フィルター
    await page.getByRole('button', { name: 'All' }).click()
    await expect(getTodoRow(page, 'アクティブタスク')).toBeVisible()
    await expect(getTodoRow(page, '完了タスク')).toBeVisible()
  })

  test('タスク選択: クリックで CurrentTaskCard に表示される', async ({ page }) => {
    await addTodo(page, '選択タスク')

    await getTodoRow(page, '選択タスク').click()

    await expect(page.getByText('Current Task')).toBeVisible()
    await expect(page.getByRole('heading', { name: '選択タスク', level: 3 })).toBeVisible()
  })
})
