import { test, expect } from '@playwright/test'
import { mockAuthAPI, simulateLogin, mockUser } from '../helpers/auth-mock'

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page, context }) => {
    // 認証APIをモック化
    await mockAuthAPI(page)

    await page.goto('/')
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

    // ログイン状態をシミュレーション
    await simulateLogin(context)

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

    // ログイン状態をシミュレーション
    await simulateLogin(context)

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
