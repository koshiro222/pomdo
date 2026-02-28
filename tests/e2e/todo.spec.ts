import { test, expect } from '@playwright/test'

test.describe('Todo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Todoが追加できること', async ({ page }) => {
    // Todo入力欄を取得
    const todoInput = page.getByPlaceholder('Add a new task...')
    await expect(todoInput).toBeVisible()

    // Todoを追加
    await todoInput.fill('テストタスク')
    await page.keyboard.press('Enter')

    // Todoが表示されることを確認
    await expect(page.getByText('テストタスク')).toBeVisible()
  })

  test('Todoが完了できること', async ({ page }) => {
    // Todoを追加
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('完了テスト')
    await page.keyboard.press('Enter')

    // チェックボタンをクリック（checkアイコンを持つbutton）
    const checkButton = page.locator('button').filter({ has: page.locator('.material-symbols-outlined').filter({ hasText: 'check' }) }).first()
    await checkButton.click()

    // 完了状態になっていることを確認
    await expect(page.getByText('完了テスト')).toHaveCSS('text-decoration-line', 'line-through')
  })

  test('Todoを削除できること', async ({ page }) => {
    // Todoを追加
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('削除テスト')
    await page.keyboard.press('Enter')

    // 削除ボタンをクリック（deleteアイコンを持つbutton）
    const deleteButton = page.locator('button').filter({ has: page.locator('.material-symbols-outlined').filter({ hasText: 'delete' }) })
    await deleteButton.hover() // 削除ボタンはhoverで表示される
    await deleteButton.click()

    // 削除されていることを確認
    await expect(page.getByText('削除テスト')).not.toBeVisible()
  })

  test('複数のTodoを追加して管理できること', async ({ page }) => {
    // 複数のTodoを追加
    const todoInput = page.getByPlaceholder('Add a new task...')
    const todos = ['タスク1', 'タスク2', 'タスク3']

    for (const todo of todos) {
      await todoInput.fill(todo)
      await page.keyboard.press('Enter')
    }

    // 全てのTodoが表示されていることを確認
    for (const todo of todos) {
      await expect(page.getByText(todo)).toBeVisible()
    }

    // 残りタスク数が表示されることを確認
    await expect(page.getByText('3 Left')).toBeVisible()
  })

  test('空のTodoは追加できないこと', async ({ page }) => {
    const todoInput = page.getByPlaceholder('Add a new task...')

    // 空のままEnterを押す
    await page.keyboard.press('Enter')

    // Todoが追加されていないことを確認（"No tasks yet"が表示されるはず）
    await expect(page.getByText('No tasks yet')).toBeVisible()
  })

  test('タスク完了後に残りタスク数が減ること', async ({ page }) => {
    // Todoを追加
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('タスク1')
    await page.keyboard.press('Enter')
    await todoInput.fill('タスク2')
    await page.keyboard.press('Enter')

    // 残り2タスクであることを確認
    await expect(page.getByText('2 Left')).toBeVisible()

    // 1つ完了
    const checkButton = page.locator('button').filter({ has: page.locator('.material-symbols-outlined').filter({ hasText: 'check' }) }).first()
    await checkButton.click()

    // 残り1タスクであることを確認
    await expect(page.getByText('1 Left')).toBeVisible()
  })
})
