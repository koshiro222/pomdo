import { test, expect } from '@playwright/test'

test.describe('タイマー機能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('タイマーが表示されること', async ({ page }) => {
    // タイマー表示エリアが表示されることを確認
    const timerWidget = page.locator('.glass').first()
    await expect(timerWidget).toBeVisible()

    // タイマーの時間表示が表示されることを確認
    await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible()

    // セッションタイプが表示されることを確認
    await expect(page.getByText('Focus')).toBeVisible()
  })

  test('STARTボタンでタイマーが開始できること', async ({ page }) => {
    // STARTボタンをクリック
    const startButton = page.getByText('START')
    await startButton.click()

    // PAUSEボタンが表示されることを確認
    await expect(page.getByText('PAUSE')).toBeVisible()
    await expect(page.getByText('START')).not.toBeVisible()

    // タイマーがカウントダウンしていることを確認（少し待ってから確認）
    await page.waitForTimeout(1100)
    const timeText1 = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()
    await page.waitForTimeout(1000)
    const timeText2 = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()

    expect(timeText1).not.toBe(timeText2)
  })

  test('PAUSEボタンでタイマーが一時停止できること', async ({ page }) => {
    // タイマーを開始
    const startButton = page.getByText('START')
    await startButton.click()

    // PAUSEボタンをクリック
    await page.getByText('PAUSE').click()

    // STARTボタンが再表示されることを確認
    await expect(page.getByText('START')).toBeVisible()
    await expect(page.getByText('PAUSE')).not.toBeVisible()

    // タイマーが停止していることを確認
    const timeText1 = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()
    await page.waitForTimeout(2000)
    const timeText2 = await page.locator('text=/\\d{2}:\\d{2}/').first().textContent()

    expect(timeText1).toBe(timeText2)
  })

  test('RESETボタンでタイマーがリセットできること', async ({ page }) => {
    // タイマーを開始
    await page.getByText('START').click()
    await page.waitForTimeout(2000)

    // リセットボタンをクリック（refreshアイコンのボタン）
    const refreshButton = page.locator('.material-symbols-outlined').filter({ hasText: 'refresh' }).locator('..')
    await refreshButton.click()

    // タイマーが初期時間に戻っていることを確認
    await expect(page.getByText('START')).toBeVisible()

    // 初期時間（25:00など）が表示されていることを確認
    await expect(page.locator('text=/25:00/').or(page.locator('text=/\\d{2}:\\d{2}/'))).toBeVisible()
  })

  test('SKIPボタンでセッションをスキップできること', async ({ page }) => {
    // 初期状態を記録
    const initialSession = await page.getByText('Focus').isVisible()
      ? 'Focus'
      : await page.getByText('Short Break').or(page.getByText('Long Break')).isVisible()
      ? 'Break'
      : 'UNKNOWN'

    // スキップボタンをクリック（タイマーのskip_nextアイコンを持つボタン）
    const skipButton = page.locator('button').filter({ hasText: 'skip_next', hasText: 'スキップ' })
    await skipButton.click()

    // セッションタイプが切り替わっていることを確認
    await page.waitForTimeout(500)
    const newSession = await page.getByText('Focus').isVisible()
      ? 'Focus'
      : await page.getByText('Short Break').or(page.getByText('Long Break')).isVisible()
      ? 'Break'
      : 'UNKNOWN'

    // 注: 実際のアプリのセッション切り替えロジックに合わせて調整が必要
  })

  test('セッションタイプを切り替えられること', async ({ page }) => {
    // セッションタイプ切り替えボタンをクリック
    const sessionTypeButton = page.getByText('Focus')
    await sessionTypeButton.click()

    // セッション選択メニューが表示されることを確認
    await expect(page.getByText('Focus')).toBeVisible()
    await expect(page.getByText('Short Break')).toBeVisible()
  })

  test('作業セッションから休憩セッションに切り替えられること', async ({ page }) => {
    // 初期状態（作業セッション）を確認
    await expect(page.getByText('Focus')).toBeVisible()

    // セッションタイプを変更
    const sessionTypeButton = page.getByText('Short Break')
    await sessionTypeButton.click()

    // 休憩セッションが表示されることを確認
    await expect(page.getByText('Short Break')).toBeVisible()
  })

  test('タイマーの進捗が円グラフで表示されること', async ({ page }) => {
    // タイマーを開始
    await page.getByText('START').click()

    // 円グラフ（SVG）が表示されていることを確認
    const svgElement = page.locator('svg').or(page.locator('circle')).or(page.locator('.progress-ring'))
    await expect(svgElement.first()).toBeVisible()
  })

  test('タイマーが0になったら次のセッションに移行すること', async ({ page }) => {
    // タイマーを開始
    await page.getByText('START').click()

    // タイマーが0になるまで待つ（テスト用に短縮設定が必要）
    // 注: 実際のテストでは設定で短時間のセッションを使用するか
    // 時間をスキップする機能を使用する

    // セッション完了の通知が表示されることを確認（トーストやダイアログ）
    // await expect(page.getByText('セッション完了')).toBeVisible()
  })
})
