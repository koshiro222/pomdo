import { expect, test } from '@playwright/test'
import { openAppAsAnonymous, setServerNowFromBrowserClock } from './helpers/auth'

test('Reviewを直接開いても匿名ブートストラップされる', async ({ page }) => {
  await page.goto('/app/review')
  await expect(page.getByRole('heading', { name: '直近7日' })).toBeVisible()
  await expect(page.getByText('合計集中時間')).toBeVisible()
})

test('ReviewとSettingsから記録を確認し、アカウントを削除してLPへ戻れる', async ({ page }) => {
  test.setTimeout(60_000)
  const fixedNow = new Date('2026-09-04T09:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((value) => localStorage.setItem('pomdo-e2e-now', value), fixedNow.toISOString())
  await openAppAsAnonymous(page)
  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15' }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await page.clock.runFor('00:15:01')
  await expect(page.getByText('ひと区切り。少し休みますか？')).toBeVisible()
  await page.getByRole('button', { name: 'もう1本' }).click()

  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page).toHaveURL(/\/app\/review$/)
  await expect(page.getByRole('img', { name: '直近7日の集中時間' })).toBeVisible()
  await expect(page.getByText('直近7日')).toBeVisible()
  await expect(page.getByText(/累計 \d+日/)).toBeVisible()

  await page.getByRole('link', { name: 'アプリへ戻る' }).click()
  await page.getByRole('link', { name: '設定' }).click()
  await page.getByRole('button', { name: 'JSONをエクスポート' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  const deleteResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/trpc/account.delete') && response.request().method() === 'POST',
    { timeout: 15_000 },
  )
  page.once('dialog', (dialog) => void dialog.accept())
  await page.getByRole('button', { name: 'アカウントを削除' }).click()
  const deleteResponse = await deleteResponsePromise
  expect(deleteResponse.status()).toBe(200)
  await expect(page).toHaveURL(/\/$/, { timeout: 15_000 })
  await expect(page.getByRole('link', { name: '使ってみる' })).toBeVisible()
})
