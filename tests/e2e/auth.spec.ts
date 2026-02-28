import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ゲストモードで起動できること', async ({ page }) => {
    // ログインアイコンボタンが表示されることを確認（Header.tsxのloginアイコン）
    const loginButton = page.getByTitle('Login with Google')
    await expect(loginButton).toBeVisible()

    // タイマーが表示されることを確認
    await expect(page.locator('.glass').first()).toBeVisible()

    // Todoリストが表示されることを確認（h3タグ内のTasks）
    await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
  })

  test('ログインボタンがクリックできること', async ({ page }) => {
    const loginButton = page.getByTitle('Login with Google')
    await expect(loginButton).toBeVisible()

    // ログインボタンをクリック
    await loginButton.click()

    // APIエンドポイントに遷移することを確認（ローカル開発環境）
    await expect(page).toHaveURL(/\/api\/auth\/google/)
  })

  test('ログイン後にユーザー情報が表示されること', async ({ page, context }) => {
    // 注: 実際のGoogle OAuthはテスト環境では難しいため
    // localStorageを直接設定してシミュレーション
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

    // ログアウトアイコンが表示されることを確認（account_circleアイコン）
    const accountIcon = page.locator('.material-symbols-outlined').filter({ hasText: 'account_circle' })
    await expect(accountIcon).toBeVisible()
  })

  test('ログアウトできること', async ({ page, context }) => {
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

    // ログアウトボタンをクリック（account_circleアイコンを持つボタン）
    const logoutButton = page.locator('button').filter({ has: page.locator('.material-symbols-outlined').filter({ hasText: 'account_circle' }) })
    await logoutButton.click()

    // ログインボタンが再表示されることを確認
    await expect(page.getByTitle('Login with Google')).toBeVisible()
  })
})
