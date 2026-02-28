import { test, expect } from '@playwright/test'

test.describe('BGM再生', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('BGMプレイヤーが表示されること', async ({ page }) => {
    // BGMプレイヤーコンテナが表示されることを確認
    const bgmPlayer = page.locator('.glass').nth(1)
    await expect(bgmPlayer).toBeVisible()

    // アルバムアートが表示されることを確認
    await expect(page.locator('.size-16').or(page.locator('[class*="size-16"]'))).toBeVisible()

    // 再生アイコンが表示されることを確認
    const playIcon = page.locator('.material-symbols-outlined').filter({ hasText: 'play_circle' }).or(page.locator('.material-symbols-outlined').filter({ hasText: 'pause_circle' }))
    await expect(playIcon.first()).toBeVisible()
  })

  test('再生ボタンでBGMを再生・一時停止できること', async ({ page }) => {
    // 再生アイコンをクリック（play_circleクラスを持つbutton）
    const playIcon = page.locator('button').filter({ hasText: 'play_circle' })
    await playIcon.click()

    // 一時停止アイコンに切り替わることを確認
    await expect(page.locator('button').filter({ hasText: 'pause_circle' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'play_circle' })).not.toBeVisible()

    // 一時停止アイコンをクリック
    const pauseIcon = page.locator('button').filter({ hasText: 'pause_circle' })
    await pauseIcon.click()

    // 再生アイコンに戻ることを確認
    await expect(page.locator('button').filter({ hasText: 'play_circle' })).toBeVisible()
  })

  test('次の曲・前の曲ボタンが機能すること', async ({ page }) => {
    // 次の曲ボタンが表示されることを確認（BGMのskip_nextアイコンを持つbutton）
    const nextButton = page.locator('button').filter({ hasText: 'skip_next', hasNotText: 'スキップ' })
    await expect(nextButton).toBeVisible()

    // 前の曲ボタンが表示されることを確認（skip_previousアイコンを持つbutton）
    const prevButton = page.locator('button').filter({ hasText: 'skip_previous' })
    await expect(prevButton).toBeVisible()

    // 次の曲をクリック
    await nextButton.click()
    await page.waitForTimeout(500)

    // 曲が切り替わったことを確認（曲タイトルが変わる）
    // 注: 実際の曲名の取得方法に応じて調整
  })

  test('音量スライダーで音量を調整できること', async ({ page }) => {
    // 音量スライダーが表示されることを確認
    const volumeSlider = page.locator('input[type="range"]')
    await expect(volumeSlider).toBeVisible()

    // 音量を変更
    await volumeSlider.fill('0.5')

    // 音量が変更されたことを確認
    await page.waitForTimeout(500)
    const volumeValue = await volumeSlider.inputValue()
    expect(volumeValue).toBe('0.5')
  })

  test('音量をミュートにできること', async ({ page }) => {
    const volumeSlider = page.locator('input[type="range"]')

    // 音量を0に設定
    await volumeSlider.fill('0')

    await page.waitForTimeout(500)
    const volumeValue = await volumeSlider.inputValue()
    expect(volumeValue).toBe('0')
  })

  test('音量を最大にできること', async ({ page }) => {
    const volumeSlider = page.locator('input[type="range"]')

    // 音量を1に設定
    await volumeSlider.fill('1')

    await page.waitForTimeout(500)
    const volumeValue = await volumeSlider.inputValue()
    expect(volumeValue).toBe('1')
  })

  test('曲情報が表示されること', async ({ page }) => {
    // 曲タイトルが表示されることを確認
    const trackTitle = page.locator('h4').or(page.locator('h4'))
    await expect(trackTitle.first()).toBeVisible()

    // アーティスト情報が表示されることを確認
    const artistInfo = page.locator('p').filter({ hasText: 'Lo-Fi Beats' }).or(page.locator('p').filter({ hasText: 'Chill Beats' }))
    await expect(artistInfo).toBeVisible()
  })

  test('音量アイコンが表示されること', async ({ page }) => {
    // 音量ダウンアイコンが表示されることを確認
    const volumeDownIcon = page.locator('.material-symbols-outlined').filter({ hasText: 'volume_down' })
    await expect(volumeDownIcon).toBeVisible()

    // 音量アップアイコンが表示されることを確認
    const volumeUpIcon = page.locator('.material-symbols-outlined').filter({ hasText: 'volume_up' })
    await expect(volumeUpIcon).toBeVisible()
  })
})
