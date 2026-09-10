import { expect, test } from '@playwright/test'
import { delayAuthenticationRequests, failAppProcedure, openAppAsAnonymous } from './helpers/auth'

test('LP のテーマトグルは即時反映し、リロード後も明示テーマを復元する', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const toggle = page.getByRole('checkbox', { name: 'ダークテーマに切り替え' })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeChecked()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pomdo-theme'))).toBe('dark')
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')

  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeChecked()
})

test('App・Review・Settings の共通ヘッダーでテーマを操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await expect(page.getByRole('checkbox', { name: /テーマに切り替え/ })).toBeVisible()

  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page).toHaveURL(/\/app\/review$/)
  await expect(page.getByRole('link', { name: '戻る' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /テーマに切り替え/ })).toBeVisible()

  await page.getByRole('link', { name: '戻る' }).click()
  await page.getByRole('link', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: /テーマに切り替え/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'system' })).toBeVisible()
  await expect(page.getByRole('slider', { name: '音量' })).toBeVisible()
})

test('Review のテーマ変更は settings.update に Turnstile token を含める', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page.getByRole('heading', { name: 'できた分を、静かに見る。' })).toBeVisible()

  const toggle = page.getByRole('checkbox', { name: /テーマに切り替え/ })
  const nextTheme = (await toggle.getAttribute('aria-label')) === 'ダークテーマに切り替え' ? 'dark' : 'light'
  const updateRequestPromise = page.waitForRequest((request) => request.url().includes('/api/trpc/settings.update'))
  await toggle.click()
  const updateRequest = await updateRequestPromise
  const payload = `${updateRequest.url()} ${updateRequest.postData() ?? ''}`
  expect(payload).toContain(nextTheme)
  expect(payload).toContain('e2e-turnstile-token')
})

test('Focus のストップは破壊的操作の error 表現を使わない', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('button', { name: '15' }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  const stop = page.getByRole('button', { name: 'ストップ' })
  await expect(stop).toBeVisible()
  await expect(stop).not.toHaveClass(/btn-error/)
})

test('App 準備中は spinner を表示する', async ({ page }) => {
  await delayAuthenticationRequests(page)
  await page.goto('/app')
  await expect(page.getByText('あなたの Pomdo を準備しています。')).toBeVisible()
  await expect(page.locator('.loading-spinner[aria-hidden="true"]')).toBeVisible()
  await page.waitForTimeout(1000)
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})

test('Task query 失敗時は再試行できる', async ({ page }) => {
  await failAppProcedure(page, 'tasks.list')
  await page.goto('/app')
  await expect(page.getByText('Taskを読み込めませんでした。')).toBeVisible({ timeout: 15000 })
  await page.unrouteAll({ behavior: 'ignoreErrors' })
  await page.getByRole('button', { name: 'もう一度試す' }).click()
  await expect(page.getByText('Pomdo を5分だけ触ってみる')).toBeVisible()
})

test('Settings の音量 Slider はキーボードで 0.05 刻みに操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: '設定' }).click()
  const slider = page.getByRole('slider', { name: '音量' })
  await slider.focus()
  await page.keyboard.press('Home')
  await expect(slider).toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.press('ArrowUp')
  await expect(slider).toHaveAttribute('aria-valuenow', '0.05')
  await page.keyboard.press('End')
  await expect(slider).toHaveAttribute('aria-valuenow', '1')
})

test('reduced-motion では準備中 spinner の連続回転を停止する', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await delayAuthenticationRequests(page, 1200)
  await page.goto('/app')
  const spinner = page.locator('.loading-spinner[aria-hidden="true"]').first()
  await expect(spinner).toBeVisible()
  await expect.poll(() => spinner.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
  await page.waitForTimeout(1300)
  await page.unrouteAll({ behavior: 'ignoreErrors' })
})
