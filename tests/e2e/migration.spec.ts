import { test, expect } from '@playwright/test'
import { mockAuthAPI, simulateLogin } from '../helpers/auth-mock'

test.describe('マイグレーション（ゲスト→ログイン）', () => {
  test.skip(({ browserName }) => browserName === 'webkit' || browserName === 'Mobile Safari', 'WebKitではCookie設定が不安定なためスキップ')
  test.beforeEach(async ({ page, context }) => {
    // 認証APIをモック化
    await mockAuthAPI(page)

    // Todo APIをモック化（状態を持たせる）
    const todos: any[] = []
    await page.route('**/api/todos', async (route) => {
      const method = route.request().method()
      const url = route.request().url()
      console.log(`API Route called: ${method} ${url}`)

      if (method === 'GET') {
        console.log(`Returning ${todos.length} todos`)
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, data: [...todos] }),
        })
      } else if (method === 'POST') {
        const body = await route.request().postDataJSON()
        console.log(`Creating todo:`, body)
        const newTodo = { id: `api-todo-${Date.now()}-${Math.random()}`, ...body, completed: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        todos.push(newTodo)
        console.log(`Total todos after POST: ${todos.length}`)
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: newTodo,
          }),
        })
      }
    })

    // localStorageをクリア
    await context.clearCookies()
    await page.goto('/')
  })

  test('ゲスト状態でTodoを作成できること', async ({ page }) => {
    // ログインしていないことを確認
    await expect(page.getByTitle('Login with Google')).toBeVisible()

    // Todoを追加
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('ゲストタスク')
    await page.keyboard.press('Enter')

    // Todoが表示されるのを待つ
    await expect(page.getByText('ゲストタスク')).toBeVisible()

    // localStorageにデータが保存されるのを待つ
    await page.waitForFunction(
      () => {
        const data = window.localStorage.getItem('pomdo_todos')
        return data !== null
      },
      { timeout: 5000 }
    )

    // localStorageにデータが保存されていることを確認
    const localStorageData = await page.evaluate(() => {
      return window.localStorage.getItem('pomdo_todos')
    })
    expect(localStorageData).toBeTruthy()
  })

  test('ゲスト→ログイン遷移でマイグレーションダイアログが表示されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('マイグレーションテスト')
    await page.keyboard.press('Enter')

    // ログイン状態をシミュレーション
    await simulateLogin(context)

    await page.reload()

    // マイグレーションダイアログが表示されることを確認
    await expect(page.getByText('Migrate Todos')).toBeVisible({ timeout: 3000 })
  })

  test('マイグレーションダイアログで「はい」を選択するとデータが移行されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('移行タスク')
    await page.keyboard.press('Enter')

    // Todoが表示されるのを待つ
    await expect(page.getByText('移行タスク')).toBeVisible()

    // ログイン状態をシミュレーション
    await simulateLogin(context)

    await page.reload()

    // マイグレーションダイアログが表示されるのを待つ
    await expect(page.getByText('Migrate Todos')).toBeVisible({ timeout: 3000 })

    // 「Migrate」ボタンをクリック
    const migrateButton = page.getByRole('button', { name: 'Migrate' })
    await migrateButton.click()

    // ダイアログが閉じることを確認
    await expect(page.getByText('Migrate Todos')).not.toBeVisible()

    // ページをリロードして、TodoがAPIから取得されたことを確認
    await page.reload()

    // Todoが表示されることを確認
    await expect(page.getByText('移行タスク')).toBeVisible()
  })

  test('マイグレーションダイアログで「いいえ」を選択するとデータが破棄されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('破棄タスク')
    await page.keyboard.press('Enter')

    // Todoが表示されるのを待つ
    await expect(page.getByText('破棄タスク')).toBeVisible()

    // localStorageにデータが保存されるのを待つ
    await page.waitForFunction(
      () => {
        const data = window.localStorage.getItem('pomdo_todos')
        return data !== null
      },
      { timeout: 5000 }
    )

    // localStorageのデータを記録
    const localStorageBefore = await page.evaluate(() => {
      return window.localStorage.getItem('pomdo_todos')
    })
    expect(localStorageBefore).toBeTruthy()

    // ログイン状態をシミュレーション
    await simulateLogin(context)

    await page.reload()

    // マイグレーションダイアログが表示されるのを待つ
    await expect(page.getByText('Migrate Todos')).toBeVisible({ timeout: 3000 })

    // 「Skip & Clear」ボタンをクリック
    const skipButton = page.getByRole('button', { name: 'Skip & Clear' })
    await skipButton.click()

    // ダイアログが閉じることを確認
    await expect(page.getByText('Migrate Todos')).not.toBeVisible()

    // localStorageがクリアされるのを待つ
    await page.waitForFunction(
      () => {
        const data = window.localStorage.getItem('pomdo_todos')
        return data === null
      },
      { timeout: 5000 }
    )

    // APIレスポンスを待つ
    try {
      await page.waitForResponse('**/api/todos', { timeout: 5000 })
    } catch {
      // タイムアウトしても続行
    }

    // Todoが表示されないことを確認（サーバーから取得される空の状態）
    await expect(page.getByText('破棄タスク')).not.toBeVisible()
  })

  test.skip('ゲスト状態でタイマーを使用してからログインすると状態が保持されること', async ({ page, context }) => {
    // タイマーの状態保持は別機能（Issue #29）として実装予定
    // マイグレーション（Issue #28）のスコープ外のためスキップ

    // タイマーを開始
    await page.getByText('START').click()
    await page.waitForTimeout(2000)

    // タイマーの状態を記録
    const timerStateBefore = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()

    // ログイン状態をシミュレーション
    await simulateLogin(context)

    await page.reload()

    // マイグレーションダイアログが表示される場合は閉じる
    const migrateDialog = page.getByText('Migrate Todos')
    if (await migrateDialog.isVisible({ timeout: 2000 })) {
      const migrateButton = page.getByRole('button', { name: 'Migrate' })
      await migrateButton.click()
    }

    // タイマーの状態が維持されていることを確認
    await expect(page.getByText('PAUSE')).toBeVisible()
  })

  test('ゲスト状態でデータがない場合、ログイン時にマイグレーションダイアログが表示されないこと', async ({ page, context }) => {
    // データがない状態でログイン

    // ログイン状態をシミュレーション
    await simulateLogin(context)

    await page.reload()

    // マイグレーションダイアログが表示されないことを確認
    await expect(page.getByText('Migrate Todos')).not.toBeVisible({ timeout: 3000 })
  })
})
