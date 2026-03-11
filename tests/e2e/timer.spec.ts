import { test, expect, type Page } from '@playwright/test'
import { signIn } from '../helpers/auth'

// ---- ヘルパー ----

/** localStorage のタイマー状態をリセットし、Focus 25分の初期状態にする */
async function resetTimerState(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem('timer-storage'))
  await page.reload()
}

// ---- ゲストモード ----

test.describe('タイマー動作 - ゲストモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('デフォルト表示: Focus セッション、25:00 が表示される', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Focus' })).toBeVisible()
  })

  test('セッション切り替え: Short Break で 05:00 が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Short Break' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
  })

  test('セッション切り替え: Long Break で 15:00 が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Long Break' }).click()

    await expect(page.getByText('15:00')).toBeVisible()
  })

  test('タイマー開始: START クリックで PAUSE ボタンに変わる', async ({ page }) => {
    await page.getByRole('button', { name: 'START' }).click()

    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'START' })).not.toBeVisible()
  })

  test('タイマー一時停止: PAUSE クリックで START ボタンに戻る', async ({ page }) => {
    await page.getByRole('button', { name: 'START' }).click()
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()

    await page.getByRole('button', { name: 'PAUSE' }).click()

    await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'PAUSE' })).not.toBeVisible()
  })

  test('リセット: リセットボタンで初期時間に戻る', async ({ page }) => {
    // Short Break に切り替えて START
    await page.getByRole('button', { name: 'Short Break' }).click()
    await expect(page.getByText('05:00')).toBeVisible()
    await page.getByRole('button', { name: 'START' }).click()
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'PAUSE' }).click()

    // リセット
    await page.getByRole('button', { name: 'リセット' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  })

  test('スキップ: スキップボタンで次のセッションに移る', async ({ page }) => {
    // Focus から始まる → スキップで Short Break (05:00) へ
    await expect(page.getByText('25:00')).toBeVisible()

    await page.getByRole('button', { name: 'スキップ' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Short Break' })).toBeVisible()
  })
})

// ---- ログインモード ----

test.describe('タイマー動作 - ログインモード', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await signIn(page)
    await page.evaluate(() => localStorage.removeItem('timer-storage'))
    await page.goto('/')
    await page.getByRole('button', { name: /Logout/ }).waitFor({ timeout: 10000 })
  })

  test('デフォルト表示: Focus セッション、25:00 が表示される', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Focus' })).toBeVisible()
  })

  test('セッション切り替え: Short Break で 05:00 が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Short Break' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
  })

  test('セッション切り替え: Long Break で 15:00 が表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'Long Break' }).click()

    await expect(page.getByText('15:00')).toBeVisible()
  })

  test('タイマー開始: START クリックで PAUSE ボタンに変わる', async ({ page }) => {
    await page.getByRole('button', { name: 'START' }).click()

    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'START' })).not.toBeVisible()
  })

  test('タイマー一時停止: PAUSE クリックで START ボタンに戻る', async ({ page }) => {
    await page.getByRole('button', { name: 'START' }).click()
    await expect(page.getByRole('button', { name: 'PAUSE' })).toBeVisible()

    await page.getByRole('button', { name: 'PAUSE' }).click()

    await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'PAUSE' })).not.toBeVisible()
  })

  test('リセット: リセットボタンで初期時間に戻る', async ({ page }) => {
    await page.getByRole('button', { name: 'Short Break' }).click()
    await expect(page.getByText('05:00')).toBeVisible()
    await page.getByRole('button', { name: 'START' }).click()
    await page.waitForTimeout(2000)
    await page.getByRole('button', { name: 'PAUSE' }).click()

    await page.getByRole('button', { name: 'リセット' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'START' })).toBeVisible()
  })

  test('スキップ: スキップボタンで次のセッションに移る', async ({ page }) => {
    await expect(page.getByText('25:00')).toBeVisible()

    await page.getByRole('button', { name: 'スキップ' }).click()

    await expect(page.getByText('05:00')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Short Break' })).toBeVisible()
  })
})
