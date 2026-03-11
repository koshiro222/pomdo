import { test, expect, type Page } from '@playwright/test'

/**
 * Audio 要素をモックする。
 * - play(): 即座に 'play' イベントを発火し resolved Promise を返す
 * - pause(): 即座に 'pause' イベントを発火
 * - load(): no-op（404 エラーを防ぐ）
 * これにより実際の音声ファイルなしで再生/停止の UI 状態変化をテストできる。
 */
async function mockAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // paused プロパティを上書き（初期値 true）
    Object.defineProperty(window.HTMLMediaElement.prototype, 'paused', {
      get: function () {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (this as any)._mockPaused !== false
      },
      configurable: true,
    })
    window.HTMLMediaElement.prototype.play = async function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this as any)._mockPaused = false
      this.dispatchEvent(new Event('play'))
    }
    window.HTMLMediaElement.prototype.pause = function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this as any)._mockPaused = true
      this.dispatchEvent(new Event('pause'))
    }
    window.HTMLMediaElement.prototype.load = function () {}
  })
}

test.describe('BGM再生 - ゲストモード', () => {
  test.beforeEach(async ({ page }) => {
    await mockAudio(page)
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('初期表示: BGMラベル・トラック名・アーティスト名・再生ボタンが表示される', async ({ page }) => {
    await expect(page.getByText('BGM')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 01' })).toBeVisible()
    await expect(page.getByText('Chill Beats')).toBeVisible()
    await expect(page.getByRole('button', { name: '再生' })).toBeVisible()
    await expect(page.getByRole('button', { name: '前の曲' })).toBeVisible()
    await expect(page.getByRole('button', { name: '次の曲' })).toBeVisible()
  })

  test('再生: 再生ボタンクリックで一時停止ボタンに変わる', async ({ page }) => {
    await page.getByRole('button', { name: '再生' }).click()
    await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible()
  })

  test('一時停止: 一時停止ボタンクリックで再生ボタンに戻る', async ({ page }) => {
    await page.getByRole('button', { name: '再生' }).click()
    await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible()

    await page.getByRole('button', { name: '一時停止' }).click()
    await expect(page.getByRole('button', { name: '再生' })).toBeVisible()
  })

  test('次の曲: 次の曲ボタンクリックでトラック名が変わる', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 01' })).toBeVisible()

    await page.getByRole('button', { name: '次の曲' }).click()

    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 02' })).toBeVisible()
    await expect(page.getByText('Relax Sounds')).toBeVisible()
  })

  test('前の曲: 前の曲ボタンクリックでトラック名が変わる（ループ）', async ({ page }) => {
    // Lo-Fi Study 01 から前へ →末尾の Lo-Fi Study 02 にループ
    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 01' })).toBeVisible()

    await page.getByRole('button', { name: '前の曲' }).click()

    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 02' })).toBeVisible()
  })

  test('ボリュームスライダー: 表示・操作できる', async ({ page }) => {
    const slider = page.getByRole('slider')
    await expect(slider).toBeVisible()
    await expect(slider).toHaveValue('0.5')

    await slider.fill('0.8')
    await expect(slider).toHaveValue('0.8')
  })

  test('プレイリスト展開: プレイリストボタンクリックでトラックリストが表示される', async ({ page }) => {
    await page.getByRole('button', { name: 'プレイリスト' }).click()

    await expect(page.getByRole('button', { name: 'Lo-Fi Study 01 Chill Beats' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lo-Fi Study 02 Relax Sounds' })).toBeVisible()
  })

  test('プレイリスト縮小: 縮小ボタンクリックでトラックリストが非表示になる', async ({ page }) => {
    await page.getByRole('button', { name: 'プレイリスト' }).click()
    await expect(page.getByRole('button', { name: 'Lo-Fi Study 01 Chill Beats' })).toBeVisible()

    await page.getByRole('button', { name: '縮小' }).click()
    await expect(page.getByRole('button', { name: 'Lo-Fi Study 01 Chill Beats' })).not.toBeVisible()
  })

  test('プレイリストからトラック選択: クリックでトラックが切り替わる', async ({ page }) => {
    // 次の曲に移動してから、プレイリストで Lo-Fi Study 01 を選択
    await page.getByRole('button', { name: '次の曲' }).click()
    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 02' })).toBeVisible()

    await page.getByRole('button', { name: 'プレイリスト' }).click()
    await page.getByRole('button', { name: 'Lo-Fi Study 01 Chill Beats' }).click()

    await expect(page.getByRole('heading', { name: 'Lo-Fi Study 01' })).toBeVisible()
  })
})
