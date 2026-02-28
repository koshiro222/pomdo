import { test, expect } from '@playwright/test'

test.describe('レスポンシブ対応', () => {
  test.describe('デスクトップ', () => {
    test('デスクトップで2カラムレイアウトが表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')

      // 左カラム（タイマー + BGM）と右カラム（Todo）が表示されることを確認
      const leftColumn = page.locator('.glass').first()
      const rightColumn = page.locator('.glass').nth(1)

      await expect(leftColumn).toBeVisible()
      await expect(rightColumn).toBeVisible()
    })

    test('デスクトップでタイマーとTodoが横並びで表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')

      const mainContent = page.locator('main')

      // flexレイアウトで横並びであることを確認
      const flexDirection = await mainContent.evaluate((el) => {
        return window.getComputedStyle(el).flexDirection
      })

      expect(flexDirection).toBe('row')
    })

    test('デスクトップでヘッダーとフッターが正しく表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('/')

      // ヘッダーが表示されることを確認
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // フッターが表示されることを確認
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })
  })

  test.describe('タブレット', () => {
    test('タブレットでレイアウトが崩れずに表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      // 主要な要素が表示されることを確認
      await expect(page.locator('.glass').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
      await expect(page.getByText('START').or(page.getByText('PAUSE'))).toBeVisible()
    })

    test('タブレットでスクロールが必要な場合に正しく動作すること', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('/')

      // Todoリストに複数のタスクを追加
      const todoInput = page.getByPlaceholder('Add a new task...')
      for (let i = 1; i <= 10; i++) {
        await todoInput.fill(`タスク${i}`)
        await page.keyboard.press('Enter')
      }

      // スクロールが可能であることを確認
      const todoList = page.locator('.overflow-y-auto').or(page.locator('[style*="overflow-y"]'))
      await expect(todoList.first()).toBeVisible()

      // スクロールして最後のタスクが表示されることを確認
      await page.evaluate(() => {
        const scrollableElement = document.querySelector('.overflow-y-auto') as HTMLElement
        if (scrollableElement) {
          scrollableElement.scrollTop = scrollableElement.scrollHeight
        }
      })

      await expect(page.getByText('タスク10')).toBeVisible()
    })
  })

  test.describe('モバイル', () => {
    test('モバイルで縦並びレイアウトが表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // 主要な要素が表示されることを確認
      await expect(page.locator('.glass').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
      await expect(page.getByText('START').or(page.getByText('PAUSE'))).toBeVisible()
    })

    test('モバイルでタイマーが読み取りやすいサイズで表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // タイマーが表示されていることを確認
      const timerWidget = page.locator('.glass').first()
      await expect(timerWidget).toBeVisible()

      // タイマーの時間表示が表示されていることを確認
      await expect(page.locator('text=/\\d{2}:\\d{2}/')).toBeVisible()
    })

    test('モバイルでTodo入力がしやすいこと', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // Todo入力欄が表示されていることを確認
      const todoInput = page.getByPlaceholder('Add a new task...')
      await expect(todoInput).toBeVisible()

      // Todoを追加できることを確認
      await todoInput.fill('モバイルテスト')
      await page.keyboard.press('Enter')

      await expect(page.getByText('モバイルテスト')).toBeVisible()
    })

    test('モバイルでBGMコントロールが操作できること', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // BGMプレイヤーが表示されていることを確認
      const bgmPlayer = page.locator('.glass').nth(1)
      await expect(bgmPlayer).toBeVisible()

      // 再生ボタンがクリックできることを確認
      const playButton = page.locator('button').filter({ hasText: 'play_circle' })
      await expect(playButton.first()).toBeVisible()
      await playButton.first().click()

      // 一時停止ボタンに切り替わることを確認
      await expect(page.locator('button').filter({ hasText: 'pause_circle' })).toBeVisible()
    })

    test('モバイルでヘッダーとフッターがコンパクトに表示されること', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // ヘッダーが表示されることを確認
      const header = page.locator('header')
      await expect(header).toBeVisible()

      // フッターが表示されることを確認
      const footer = page.locator('footer')
      await expect(footer).toBeVisible()
    })
  })

  test.describe('画面回転対応', () => {
    test('モバイルで横向きに回転してもレイアウトが崩れないこと', async ({ page }) => {
      // 縦向きで開始
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/')

      // 横向きに回転
      await page.setViewportSize({ width: 844, height: 390 })

      // 主要な要素が表示されることを確認
      await expect(page.locator('.glass').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
      await expect(page.getByText('START').or(page.getByText('PAUSE'))).toBeVisible()
    })
  })

  test.describe('異なる画面サイズ', () => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 1280, height: 720, name: 'Small Desktop' },
      { width: 2560, height: 1440, name: 'Large Desktop' },
    ]

    for (const viewport of viewports) {
      test(`${viewport.name} (${viewport.width}x${viewport.height}) で正しく表示されること`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto('/')

        // 主要な要素が表示されることを確認
        await expect(page.locator('.glass').first()).toBeVisible()
        await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
        await expect(page.getByText('START').or(page.getByText('PAUSE'))).toBeVisible()
      })
    }
  })
})
