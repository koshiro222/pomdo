import { expect, test } from '@playwright/test'
import { openAppAsAnonymous, signInAsTestIdentity } from './helpers/auth'

test('匿名サインインが遅れてもAppの初期データを待てる', async ({ page }) => {
  let finishDelayedSignIn!: () => void
  let delayedSignInWasRequested = false
  const delayedSignInFinished = new Promise<void>((resolve) => { finishDelayedSignIn = resolve })
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    delayedSignInWasRequested = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 6_000))
      await route.continue()
    } finally {
      finishDelayedSignIn()
    }
  })
  try {
    await openAppAsAnonymous(page)
  } finally {
    if (delayedSignInWasRequested) await delayedSignInFinished
  }
  expect(delayedSignInWasRequested).toBe(true)
})

test('匿名データを既存データのないテストGoogle identityへ引き継げる', async ({ page }) => {
  await openAppAsAnonymous(page)
  const result = await signInAsTestIdentity(page, `empty-${crypto.randomUUID()}`)
  expect(result).toBe('migrated')
  await page.getByRole('link', { name: '設定' }).click()
  const logout = page.getByRole('button', { name: 'ログアウト' })
  await expect(logout).toBeVisible()
  await expect(logout).toHaveClass(/btn-outline/)
  await expect(page.getByText('匿名アカウント')).not.toBeVisible()
})

test('既存データのあるidentityでは匿名側を引き継がず破棄結果を表示できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  const result = await signInAsTestIdentity(page, `existing-${crypto.randomUUID()}`, true)
  expect(result).toBe('discarded')
  await page.getByRole('link', { name: '設定' }).click()
  await expect(page.getByRole('status')).toContainText('既存データ')
})

test('テスト専用認証 endpoint は本番モードで公開しない', async ({ page }) => {
  test.skip(!process.env.E2E_DISABLED_BASE_URL, 'E2E_TEST_MODE=false の別起動 URL が必要です')
  const response = await page.request.post(`${process.env.E2E_DISABLED_BASE_URL}/api/test/auth`, { data: { identity: 'not-used' } })
  expect(response.status()).toBe(404)
})
