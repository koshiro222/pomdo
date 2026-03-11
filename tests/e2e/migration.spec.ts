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

// ---- マイグレーション ----

test.describe('マイグレーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('ゲストTodo作成後にログインするとマイグレーションダイアログが表示される', async ({
    page,
  }) => {
    // ゲストでTodoを作成
    await addTodo(page, 'ゲストタスク1')
    await addTodo(page, 'ゲストタスク2')
    await expect(getTodoRow(page, 'ゲストタスク1')).toBeVisible()
    await expect(getTodoRow(page, 'ゲストタスク2')).toBeVisible()

    // ログイン
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()
    await page.getByRole('textbox', { name: 'you@example.com' }).fill('pomdo.test.x7k2q@example.com')
    await page.getByRole('textbox', { name: '••••••••' }).fill('Px9mK#vL3nR@2025')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // マイグレーションダイアログが表示される
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).toBeVisible()
    await expect(page.getByText(/You have 2 todo\(s\) stored locally/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Migrate' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skip & Clear' })).toBeVisible()

    // ダイアログ内にTodoが表示される
    await expect(page.getByText('ゲストタスク1')).toBeVisible()
    await expect(page.getByText('ゲストタスク2')).toBeVisible()
  })

  test('移行する: ゲストTodoがDBに保存され、一覧に残る', async ({ page }) => {
    // ゲストでTodoを作成
    await addTodo(page, '移行タスク1')
    await addTodo(page, '移行タスク2')
    await expect(getTodoRow(page, '移行タスク1')).toBeVisible()
    await expect(getTodoRow(page, '移行タスク2')).toBeVisible()

    // ログイン
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()
    await page.getByRole('textbox', { name: 'you@example.com' }).fill('pomdo.test.x7k2q@example.com')
    await page.getByRole('textbox', { name: '••••••••' }).fill('Px9mK#vL3nR@2025')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // マイグレーションダイアログが表示される
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).toBeVisible()

    // 移行ボタンをクリック
    await page.getByRole('button', { name: 'Migrate' }).click()

    // ダイアログが閉じる
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).not.toBeVisible()

    // ログイン状態になる
    await expect(page.getByRole('button', { name: /Logout/ })).toBeVisible()

    // Todoが一覧に残る
    await expect(getTodoRow(page, '移行タスク1')).toBeVisible()
    await expect(getTodoRow(page, '移行タスク2')).toBeVisible()

    // 後始末
    await cleanupTodos(page)
  })

  test('Skip & Clear: ゲストTodoは破棄され、空の一覧になる', async ({ page }) => {
    // ゲストでTodoを作成
    await addTodo(page, '破棄タスク1')
    await addTodo(page, '破棄タスク2')
    await expect(getTodoRow(page, '破棄タスク1')).toBeVisible()
    await expect(getTodoRow(page, '破棄タスク2')).toBeVisible()

    // ログイン
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()
    await page.getByRole('textbox', { name: 'you@example.com' }).fill('pomdo.test.x7k2q@example.com')
    await page.getByRole('textbox', { name: '••••••••' }).fill('Px9mK#vL3nR@2025')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // マイグレーションダイアログが表示される
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).toBeVisible()

    // Skip & Clearボタンをクリック
    await page.getByRole('button', { name: 'Skip & Clear' }).click()

    // ダイアログが閉じる
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).not.toBeVisible()

    // ログイン状態になる
    await expect(page.getByRole('button', { name: /Logout/ })).toBeVisible()

    // Todoが破棄され、空の一覧になる
    await expect(page.getByText('No tasks yet')).toBeVisible()
    await expect(page.getByText('0 Left')).toBeVisible()
  })

  test('ゲストTodoがない状態でログインしてもダイアログが表示されない', async ({
    page,
  }) => {
    // Todoを作成せずにログイン
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()
    await page.getByRole('textbox', { name: 'you@example.com' }).fill('pomdo.test.x7k2q@example.com')
    await page.getByRole('textbox', { name: '••••••••' }).fill('Px9mK#vL3nR@2025')
    await page.getByRole('button', { name: 'ログイン' }).click()

    // マイグレーションダイアログは表示されない
    await expect(page.getByRole('heading', { name: 'Migrate Todos' })).not.toBeVisible()

    // ログイン状態になる
    await expect(page.getByRole('button', { name: /Logout/ })).toBeVisible()
  })
})
