import { test, expect } from '@playwright/test'
import { signIn, TEST_USER } from '../helpers/auth'

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ゲストモード: ページが正常に読み込まれ、ログインボタンが表示される', async ({ page }) => {
    await expect(page).toHaveTitle(/Pomdo/)
    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible()
  })

  test('ログインダイアログ: ログインボタンクリックでダイアログが開く', async ({ page }) => {
    await page.getByRole('button', { name: 'Login with Google' }).click()

    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'メールアドレスでログイン' })).toBeVisible()
  })

  test('ダイアログを閉じる: ×ボタンでダイアログが閉じる', async ({ page }) => {
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

    await page.locator('button:has(svg.lucide-x)').click()

    await expect(page.getByRole('heading', { name: 'ログイン' })).not.toBeVisible()
  })

  test('ダイアログを閉じる: ESCキーでダイアログが閉じる', async ({ page }) => {
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.getByRole('heading', { name: 'ログイン' })).not.toBeVisible()
  })

  test('メール/パスワードフォーム: メールアドレスでログインをクリックするとフォームが表示される', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()

    await expect(page.getByRole('textbox', { name: 'you@example.com' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: '••••••••' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible()
  })

  test('不正な認証情報: エラーメッセージが表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Login with Google' }).click()
    await page.getByRole('button', { name: 'メールアドレスでログイン' }).click()

    await page.getByRole('textbox', { name: 'you@example.com' }).fill('wrong@example.com')
    await page.getByRole('textbox', { name: '••••••••' }).fill('wrongpassword')
    await page.getByRole('button', { name: 'ログイン' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('メール/パスワードでサインイン: 正しい認証情報でログインできる', async ({ page }) => {
    await signIn(page)

    await expect(page.getByRole('button', { name: /Logout/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login with Google' })).not.toBeVisible()
  })

  test('ログアウト: ログアウトボタンクリックでゲスト状態に戻る', async ({ page }) => {
    await signIn(page)

    await page.getByRole('button', { name: /Logout/ }).click()

    await expect(page.getByRole('button', { name: 'Login with Google' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Logout/ })).not.toBeVisible()
  })
})
