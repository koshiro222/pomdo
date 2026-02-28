import { test, expect } from '@playwright/test'

test.describe('マイグレーション（ゲスト→ログイン）', () => {
  test.beforeEach(async ({ page, context }) => {
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

    // Todoが表示されることを確認
    await expect(page.getByText('ゲストタスク')).toBeVisible()

    // localStorageにデータが保存されていることを確認
    const localStorageData = await page.evaluate(() => {
      return window.localStorage.getItem('todos')
    })
    expect(localStorageData).toBeTruthy()
  })

  test('ゲスト→ログイン遷移でマイグレーションダイアログが表示されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('マイグレーションテスト')
    await page.keyboard.press('Enter')

    // ログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'mock_user',
        value: JSON.stringify({
          id: 'test-user',
          name: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.reload()

    // マイグレーションダイアログが表示されることを確認
    // ダイアログのセレクタは実際の実装に合わせて調整
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行')).or(page.getByText('移行'))).toBeVisible({ timeout: 3000 })
  })

  test('マイグレーションダイアログで「はい」を選択するとデータが移行されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('移行タスク')
    await page.keyboard.press('Enter')

    // ログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'mock_user',
        value: JSON.stringify({
          id: 'test-user',
          name: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.reload()

    // マイグレーションダイアログが表示されるのを待つ
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行'))).toBeVisible({ timeout: 3000 })

    // 「はい」ボタンをクリック
    const yesButton = page.getByRole('button', { name: 'はい' }).or(page.getByRole('button', { name: 'Yes' })).or(page.getByRole('button', { name: '移行する' }))
    await yesButton.click()

    // ダイアログが閉じることを確認
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行'))).not.toBeVisible()

    // Todoが表示され続けていることを確認
    await expect(page.getByText('移行タスク')).toBeVisible()
  })

  test('マイグレーションダイアログで「いいえ」を選択するとデータが破棄されること', async ({ page, context }) => {
    // ゲスト状態でTodoを作成
    const todoInput = page.getByPlaceholder('Add a new task...')
    await todoInput.fill('破棄タスク')
    await page.keyboard.press('Enter')

    // localStorageのデータを記録
    const localStorageBefore = await page.evaluate(() => {
      return window.localStorage.getItem('todos')
    })
    expect(localStorageBefore).toBeTruthy()

    // ログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'mock_user',
        value: JSON.stringify({
          id: 'test-user',
          name: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.reload()

    // マイグレーションダイアログが表示されるのを待つ
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行'))).toBeVisible({ timeout: 3000 })

    // 「いいえ」ボタンをクリック
    const noButton = page.getByRole('button', { name: 'いいえ' }).or(page.getByRole('button', { name: 'No' })).or(page.getByRole('button', { name: '破棄する' }))
    await noButton.click()

    // ダイアログが閉じることを確認
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行'))).not.toBeVisible()

    // Todoが表示されないことを確認（サーバーから取得される空の状態）
    await expect(page.getByText('破棄タスク')).not.toBeVisible()
  })

  test('ゲスト状態でタイマーを使用してからログインすると状態が保持されること', async ({ page, context }) => {
    // タイマーを開始
    await page.getByText('START').click()
    await page.waitForTimeout(2000)

    // タイマーの状態を記録
    const timerStateBefore = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()

    // ログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'mock_user',
        value: JSON.stringify({
          id: 'test-user',
          name: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.reload()

    // マイグレーションダイアログが表示される場合は閉じる
    const migrateDialog = page.getByText('マイグレーション').or(page.getByText('データ移行'))
    if (await migrateDialog.isVisible({ timeout: 2000 })) {
      await page.getByRole('button', { name: 'はい' }).or(page.getByRole('button', { name: 'Yes' })).click()
    }

    // タイマーの状態が維持されていることを確認
    await expect(page.getByText('PAUSE')).toBeVisible()
  })

  test('ゲスト状態でデータがない場合、ログイン時にマイグレーションダイアログが表示されないこと', async ({ page, context }) => {
    // データがない状態でログイン

    // ログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'mock_user',
        value: JSON.stringify({
          id: 'test-user',
          name: 'テストユーザー',
          avatarUrl: 'https://example.com/avatar.png',
        }),
        domain: 'localhost',
        path: '/',
      },
    ])

    await page.reload()

    // マイグレーションダイアログが表示されないことを確認
    await expect(page.getByText('マイグレーション').or(page.getByText('データ移行'))).not.toBeVisible({ timeout: 3000 })
  })
})
