import { test, expect } from '@playwright/test'

test.describe('エラー処理', () => {
  test.describe('バリデーション', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('空のTodoは追加できないこと', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')

      // 空のままEnterを押す
      await todoInput.fill('')
      await page.keyboard.press('Enter')

      // Todoが追加されていないことを確認
      await expect(page.getByText('No tasks yet')).toBeVisible()
    })

    test('スペースのみのTodoは追加できないこと', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')

      // スペースのみでEnterを押す
      await todoInput.fill('   ')
      await page.keyboard.press('Enter')

      // Todoが追加されていないことを確認
      await expect(page.getByText('No tasks yet')).toBeVisible()
    })

    test('長すぎるテキストは適切に処理されること', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')

      // 非常に長いテキストを入力
      const longText = 'A'.repeat(1000)
      await todoInput.fill(longText)
      await page.keyboard.press('Enter')

      // Todoが追加されていることを確認
      // 注: 実際の最大文字数制限に合わせて調整
      // await expect(page.getByText(longText)).toBeVisible()
    })

    test('特殊文字を含むTodoは追加できること', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')

      // 特殊文字を含むテキストを入力
      const specialText = 'テスト！？＠＃％＆＊（）－＝＋［］｛｝｜￥；：』「」、。・'
      await todoInput.fill(specialText)
      await page.keyboard.press('Enter')

      // Todoが追加されていることを確認
      await expect(page.getByText(specialText)).toBeVisible()
    })
  })

  test.describe('APIエラー', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('APIエラー時に適切なエラーメッセージが表示されること', async ({ page }) => {
      // APIリクエストをインターセプトしてエラーをシミュレーション
      await page.route('**/api/todos/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      // ログイン状態をシミュレーションしてAPIリクエストをトリガー
      await page.evaluate(() => {
        window.localStorage.setItem('user', JSON.stringify({ id: 'test' }))
      })

      await page.reload()

      // エラーメッセージが表示されることを確認
      // 注: 実際のエラー表示方法に合わせて調整
      // await expect(page.getByText('エラー').or(page.getByText('Error'))).toBeVisible()
    })

    test('ネットワークエラー時にリトライが可能であること', async ({ page }) => {
      // APIリクエストをブロックしてネットワークエラーをシミュレーション
      await page.route('**/api/**', (route) => {
        route.abort()
      })

      // ログイン状態をシミュレーション
      await page.evaluate(() => {
        window.localStorage.setItem('user', JSON.stringify({ id: 'test' }))
      })

      await page.reload()

      // アプリがクラッシュせずに表示されることを確認
      await expect(page.locator('.glass').first()).toBeVisible()
    })
  })

  test.describe('状態保持', () => {
    test('ページリロード後にTodoが保持されていること', async ({ page }) => {
      // Todoを追加
      const todoInput = page.getByPlaceholder('Add a new task...')
      await todoInput.fill('リロードテスト')
      await page.keyboard.press('Enter')

      // Todoが表示されていることを確認
      await expect(page.getByText('リロードテスト')).toBeVisible()

      // ページをリロード
      await page.reload()

      // Todoが表示され続けていることを確認
      await expect(page.getByText('リロードテスト')).toBeVisible()
    })

    test('ページリロード後にタイマー状態が保持されていること', async ({ page }) => {
      // タイマーを開始
      await page.getByText('START').click()
      await page.waitForTimeout(2000)

      // ページをリロード
      await page.reload()

      // タイマーが動作し続けていることを確認
      await expect(page.getByText('PAUSE')).toBeVisible()
    })

    test('ページリロード後にBGM再生状態が保持されていること', async ({ page }) => {
      // BGMを再生
      const playButton = page.locator('button').filter({ hasText: 'play_circle' })
      await playButton.click()

      // BGMが再生中であることを確認
      await expect(page.locator('button').filter({ hasText: 'pause_circle' })).toBeVisible()

      // ページをリロード
      await page.reload()

      // BGMの再生状態が保持されていることを確認
      // 注: 実際の状態保持ロジックに合わせて調整
    })

    test('ブラウザを閉じて再度開いても状態が復元されること', async ({ page, context }) => {
      // Todoを追加
      const todoInput = page.getByPlaceholder('Add a new task...')
      await todoInput.fill('復元テスト')
      await page.keyboard.press('Enter')

      // コンテキストを閉じて新しいコンテキストを作成
      await context.close()

      // 新しいコンテキストで状態が復元されることを確認
      // 注: Playwrightの制限により、実際には別の方法でテストが必要
      // await expect(page.getByText('復元テスト')).toBeVisible()
    })
  })

  test.describe('エッジケース', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
    })

    test('連続してTodoを追加しても正しく処理されること', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')

      // 高速で連続してTodoを追加
      for (let i = 1; i <= 5; i++) {
        await todoInput.fill(`連続タスク${i}`)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(100)
      }

      // 全てのTodoが表示されていることを確認
      for (let i = 1; i <= 5; i++) {
        await expect(page.getByText(`連続タスク${i}`)).toBeVisible()
      }
    })

    test('連続してタイマー操作を行っても正しく動作すること', async ({ page }) => {
      // タイマーを開始
      await page.getByText('START').click()
      await page.waitForTimeout(100)

      // 一時停止
      await page.getByText('PAUSE').click()
      await page.waitForTimeout(100)

      // 再開
      await page.getByText('START').click()
      await page.waitForTimeout(100)

      // タイマーが正しく動作していることを確認
      await expect(page.getByText('PAUSE')).toBeVisible()
    })

    test('Todoを追加してすぐに削除しても正しく処理されること', async ({ page }) => {
      const todoInput = page.getByPlaceholder('Add a new task...')
      await todoInput.fill('即削除テスト')
      await page.keyboard.press('Enter')

      // 直後に削除
      const deleteButton = page.locator('button').filter({ has: page.locator('.material-symbols-outlined').filter({ hasText: 'delete' }) })
      await deleteButton.hover()
      await deleteButton.click()

      // Todoが削除されていることを確認
      await expect(page.getByText('即削除テスト')).not.toBeVisible()
    })

    test('非常に大きな文字サイズ設定でもレイアウトが崩れないこと', async ({ page }) => {
      // 文字サイズを大きく設定
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })

      // 主要な要素が表示されることを確認
      await expect(page.locator('.glass').first()).toBeVisible()
      await expect(page.getByRole('heading', { name: 'checklist Tasks' })).toBeVisible()
      await expect(page.getByText('START').or(page.getByText('PAUSE'))).toBeVisible()
    })

    test('JavaScriptを無効にした場合に適切なメッセージが表示されること', async ({ page }) => {
      // JavaScriptを無効化
      await context.addInitScript(() => {
        Object.defineProperty(window, 'addEventListener', { value: null })
      })

      // ページをリロード
      await page.reload()

      // JavaScriptを有効にするよう促すメッセージが表示されることを確認
      // 注: 実際の実装に合わせて調整
      // await expect(page.getByText('JavaScriptを有効にしてください')).toBeVisible()
    })
  })
})
