import { expect, test } from '@playwright/test'
import { failAppProcedure, openAppAsAnonymous, setServerNowFromBrowserClock } from './helpers/auth'

test('Reviewを直接開いて年間カレンダーをdesktop・mobileで表示する', async ({ page }) => {
  await page.goto('/app/review')
  await expect(page.getByRole('heading', { name: '年間の集中時間' })).toBeVisible()
  await expect(page.getByText('合計集中時間')).toBeVisible()
  const calendar = page.getByRole('group', { name: /\d{4}年の集中時間/ })
  await expect(calendar).toBeVisible()
  await expect(page.getByText('直近7日')).toHaveCount(0)
  await expect(page.getByRole('img', { name: '直近7日の集中時間' })).toHaveCount(0)
  await expect(page.locator('.annual-calendar-month')).toHaveCount(12)
  const calendarYear = Number((await page.locator('.annual-calendar-heading strong').innerText()).replace('年', ''))
  const expectedDays = new Date(Date.UTC(calendarYear, 1, 29)).getUTCDate() === 29 ? 366 : 365
  const dayDates = await calendar.locator('.annual-calendar-day').evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset.date))
  expect(dayDates).toHaveLength(expectedDays)
  expect(new Set(dayDates).size).toBe(expectedDays)

  const weeklyLayout = page.locator('.annual-calendar-week-layout')
  await expect.poll(() => weeklyLayout.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.setViewportSize({ width: 768, height: 900 })
  await expect.poll(() => weeklyLayout.evaluate((element) => getComputedStyle(element).display)).toBe('grid')
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => weeklyLayout.evaluate((element) => getComputedStyle(element).display)).toBe('block')
  const monthGrid = page.locator('.annual-calendar-month-days').first()
  const mobileColumns = await monthGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
  expect(mobileColumns).toBe(7)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
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
  await expect(page.getByRole('heading', { name: '年間の集中時間' })).toBeVisible()
  await expect(page.getByRole('group', { name: '2026年の集中時間' })).toBeVisible()
  const recordedDay = page.getByRole('button', { name: /^2026年9月4日、.*集中時間/ })
  await expect(recordedDay).toBeVisible()
  await recordedDay.click()
  await expect(page.locator('.annual-calendar-selection')).toContainText('2026年9月4日')
  await expect(page.locator('.annual-calendar-selection')).toContainText('集中時間 15分')
  await expect(page.getByText('直近7日')).toHaveCount(0)
  await expect(page.getByText(/累計 \d+日/)).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.locator('.annual-calendar-week-layout').evaluate((element) => getComputedStyle(element).display)).toBe('block')
  await recordedDay.focus()
  await page.keyboard.press('Space')
  await expect(page.locator('.annual-calendar-selection')).toContainText('2026年9月4日')
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

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

test('Review APIが失敗した場合は既存のエラー表示を保つ', async ({ page }) => {
  await failAppProcedure(page, 'review.summary')
  await page.goto('/app/review')
  await expect(page.getByText('振り返りを読み込めませんでした。')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByRole('group', { name: /\d{4}年の集中時間/ })).toHaveCount(0)
})
