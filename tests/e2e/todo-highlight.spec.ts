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

// ---- ゲストモード: ハイライトセクション ----

test.describe('TodoList統合UI - ハイライトセクション - ゲストモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('TODO-01: タスク選択時にハイライトセクションが表示される', async ({ page }) => {
    await addTodo(page, '選択テストタスク')

    await getTodoRow(page, '選択テストタスク').click()

    // ハイライトセクションが表示される
    await expect(page.getByText('Current Task')).toBeVisible()
    // ハイライトセクション内のタスク名（text-base font-boldクラスのpタグ）を確認
    const highlightSection = page.locator('.bg-white\\/5.rounded-xl.p-3').filter({ hasText: 'Current Task' })
    await expect(highlightSection.locator('p.text-base.font-bold')).toHaveText('選択テストタスク')
  })

  test('TODO-02: ハイライトセクションにタスク名と完了数が表示される', async ({ page }) => {
    await addTodo(page, '進捗確認タスク')
    await getTodoRow(page, '進捗確認タスク').click()

    // ハイライトセクション内の要素を確認
    const highlightSection = page.locator('.bg-white\\/5.rounded-xl.p-3').filter({ hasText: 'Current Task' })
    // タスク名が表示される
    await expect(highlightSection.locator('p.text-base.font-bold')).toHaveText('進捗確認タスク')
    // 完了数が表示される（初期値は0 done）
    await expect(highlightSection.getByText('0 done')).toBeVisible()
  })

  test('TODO-03: Completeボタンクリックでタスクが完了する', async ({ page }) => {
    await addTodo(page, '完了テストタスク')
    await getTodoRow(page, '完了テストタスク').click()

    // Completeボタンをクリック
    await page.getByRole('button', { name: '✓ Complete' }).click()

    // タスクが完了状態になる（打ち消し線）
    await expect(page.locator('p.line-through').filter({ hasText: '完了テストタスク' })).toBeVisible()
    // ハイライトセクションが非表示になる
    await expect(page.getByText('Current Task')).not.toBeVisible()
  })

  test('TODO-03: Nextボタンクリックで次のタスクが選択される', async ({ page }) => {
    await addTodo(page, 'タスクA')
    await addTodo(page, 'タスクB')
    await getTodoRow(page, 'タスクA').click()

    // Nextボタンをクリック
    await page.getByRole('button', { name: '→ Next' }).click()

    // タスクBが選択される（ハイライトセクションにタスクBが表示される）
    const highlightSection = page.locator('.bg-white\\/5.rounded-xl.p-3').filter({ hasText: 'Current Task' })
    await expect(highlightSection.locator('p.text-base.font-bold')).toHaveText('タスクB')
  })

  test('TODO-04: CurrentTaskCardコンポーネントがDOMに存在しない', async ({ page }) => {
    await addTodo(page, 'テストタスク')
    await getTodoRow(page, 'テストタスク').click()

    // CurrentTaskCardは独立したカードとして存在しない
    // h3の見出し（CurrentTaskCardのタスク名はh3）が存在しないことを確認
    // 注: TodoList内のハイライトセクションはh3ではなくpタグを使用
    await expect(page.getByRole('heading', { level: 3, name: 'テストタスク' })).not.toBeVisible()
  })

  test('TodoItem選択中スタイル: border-l-2が適用される', async ({ page }) => {
    await addTodo(page, 'スタイル確認タスク')
    await getTodoRow(page, 'スタイル確認タスク').click()

    // 選択中のTodoItemにborder-l-2クラスが適用される
    const selectedTodoItem = getTodoRow(page, 'スタイル確認タスク')
    await expect(selectedTodoItem).toHaveClass(/border-l-2/)
    await expect(selectedTodoItem).toHaveClass(/border-cf-primary/)
  })

  test('タスク未選択時: ハイライトセクションが表示されない', async ({ page }) => {
    await addTodo(page, '未選択タスク')

    // タスクをクリックせず、ハイライトセクションが表示されない
    await expect(page.getByText('Current Task')).not.toBeVisible()
  })
})

// ---- ログインモード: ハイライトセクション ----

test.describe('TodoList統合UI - ハイライトセクション - ログインモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await signIn(page)
    await cleanupTodos(page)
    await page.evaluate(() => localStorage.removeItem('todos-storage'))
    await page.goto('/')
    await page.getByRole('button', { name: /Logout/ }).waitFor({ timeout: 10000 })
  })

  test('TODO-01: タスク選択時にハイライトセクションが表示される', async ({ page }) => {
    await addTodo(page, '選択テストタスク')

    await getTodoRow(page, '選択テストタスク').click()

    await expect(page.getByText('Current Task')).toBeVisible()
    const highlightSection = page.locator('.bg-white\\/5.rounded-xl.p-3').filter({ hasText: 'Current Task' })
    await expect(highlightSection.locator('p.text-base.font-bold')).toHaveText('選択テストタスク')
  })

  test('TODO-03: Completeボタンクリックでタスクが完了する', async ({ page }) => {
    await addTodo(page, '完了テストタスク')
    await getTodoRow(page, '完了テストタスク').click()

    await page.getByRole('button', { name: '✓ Complete' }).click()

    await expect(page.locator('p.line-through').filter({ hasText: '完了テストタスク' })).toBeVisible()
    await expect(page.getByText('Current Task')).not.toBeVisible()
  })

  test('TODO-03: Nextボタンクリックで次のタスクが選択される', async ({ page }) => {
    await addTodo(page, 'タスクA')
    await addTodo(page, 'タスクB')
    await getTodoRow(page, 'タスクA').click()

    await page.getByRole('button', { name: '→ Next' }).click()

    const highlightSection = page.locator('.bg-white\\/5.rounded-xl.p-3').filter({ hasText: 'Current Task' })
    await expect(highlightSection.locator('p.text-base.font-bold')).toHaveText('タスクB')
  })
})
