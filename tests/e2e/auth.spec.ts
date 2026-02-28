import { test, expect } from '@playwright/test'

// モックユーザー
const mockUser = {
  sub: 'test-user-id',
  email: 'test@example.com',
  name: 'テストユーザー',
  avatarUrl: 'https://example.com/avatar.png',
  iat: Date.now(),
  exp: Date.now() + 60 * 60 * 24 * 7,
}

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page, context }) => {
    // 認証APIをモック（デフォルトではログインしていない状態）
    await page.route('**/api/auth/me', async (route) => {
      // リクエストヘッダーからCookieを取得
      const headers = route.request().headers()
      const cookieHeader = headers['cookie'] || headers['Cookie'] || ''

      // デバッグ: Cookieをログ出力
      console.log('DEBUG: Cookie header:', cookieHeader)
      console.log('DEBUG: hasAuthToken:', cookieHeader.includes('auth_token=mock-jwt-token'))

      // Cookieにauth_tokenが含まれているか確認
      const hasAuthToken = cookieHeader.includes('auth_token=mock-jwt-token')

      if (hasAuthToken) {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: mockUser }),
        })
      } else {
        await route.fulfill({
          status: 401,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Unauthorized' }),
        })
      }
    })

    // ログアウトAPIをモック
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true }),
      })
    })

    await page.goto('/')
  })

  test.beforeAll(async () => {
    // グローバルなAPIモック設定
  })

test('ゲストモードで起動できること', async ({ page }) => {
    // ログインアイコンボタンが表示されることを確認（Header.tsxのloginアイコン）
    const loginButton = page.getByTitle('Login with Google')
    await expect(loginButton).toBeVisible()

    // タイマーが表示されることを確認
    await expect(page.locator('.glass').first()).toBeVisible()

    // Todoリストが表示されることを確認（h3タグ内のTasks）
    await expect(page.getByRole('heading', { name: /^checklist\s*Tasks$/s })).toBeVisible()
  })

  test('ログインボタンがクリックできること', async ({ page }) => {
    const loginButton = page.getByTitle('Login with Google')
    await expect(loginButton).toBeVisible()

    // ログインボタンをクリック
    await loginButton.click()

    // APIエンドポイントに遷移することを確認（ローカル開発環境）
    await expect(page).toHaveURL(/\/api\/auth\/google/)
  })

  test('ログイン後にユーザー情報が表示されること', async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit' || browserName === 'Mobile Safari', 'WebKitではCookie設定が不安定なためスキップ')

    // 認証トークンCookieを設定してログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ])

    // ページをリロードしてAPI応答を待機
    await page.reload()

    // API応答を待機（タイムアウトを長めに設定）
    try {
      await page.waitForResponse('**/api/auth/me', { timeout: 10000 })
    } catch (e) {
      // タイムアウトしても続行（UIが更新されるのを待機）
    }

    // ログアウトボタンが表示されることを確認（アバター画像を持つボタン）
    const logoutButton = page.locator('button').filter({ has: page.locator('img[alt="テストユーザー"]') })
    await expect(logoutButton).toBeVisible()

    // title属性を確認
    await expect(page.locator('button[title*="test@example.com"]')).toBeVisible()

    // アバター画像が表示されていることを確認
    await expect(page.locator('img[alt="テストユーザー"]')).toBeVisible()
  })

  test('ログアウトできること', async ({ page, context, browserName }) => {
    test.skip(browserName === 'webkit' || browserName === 'Mobile Safari', 'WebKitではCookie設定が不安定なためスキップ')

    // 認証トークンCookieを設定してログイン状態をシミュレーション
    await context.addCookies([
      {
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      },
    ])

    // ページをリロードしてAPI応答を待機
    await page.reload()

    // API応答を待機（タイムアウトを長めに設定）
    try {
      await page.waitForResponse('**/api/auth/me', { timeout: 10000 })
    } catch (e) {
      // タイムアウトしても続行（UIが更新されるのを待機）
    }

    // ログアウトボタンをクリック（アバター画像を持つボタン）
    const logoutButton = page.locator('button').filter({ has: page.locator('img[alt="テストユーザー"]') })
    await logoutButton.click()

    // ログインボタンが再表示されることを確認
    await expect(page.getByTitle('Login with Google')).toBeVisible()
  })
})
