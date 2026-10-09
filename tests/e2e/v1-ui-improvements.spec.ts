import { expect, test } from '@playwright/test'
import { delayAuthenticationRequests, failAppProcedure, openAppAsAnonymous, signInAsTestIdentity } from './helpers/auth'

const DEMO_VIDEO_URL = 'https://pub-7e2638ec617c45a7a55b30232114a3a0.r2.dev/pomdo-demo.mp4'

test('LPの使ってみるボタンは背景と異なる文字色で表示する', async ({ page }) => {
  await page.route(DEMO_VIDEO_URL, (route) => route.abort())
  await page.goto('/')
  const cta = page.getByRole('link', { name: '使ってみる' })
  await expect(cta).toBeVisible()
  const ctaColors = await cta.evaluate((element) => {
    const style = getComputedStyle(element)
    return { color: style.color, backgroundColor: style.backgroundColor }
  })
  expect(ctaColors.color).not.toBe(ctaColors.backgroundColor)
})

test('LP のテーマトグルは即時反映し、リロード後も明示テーマを復元する', async ({ page }) => {
  await page.route(DEMO_VIDEO_URL, (route) => route.abort())
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  const toggle = page.locator('label.theme-toggle')
  await expect(toggle).toBeVisible()
  await toggle.click()
  await expect(page.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeChecked()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('pomdo-theme'))).toBe('dark')
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('sunset')

  await page.reload()
  await expect(page.getByRole('checkbox', { name: 'ライトテーマに切り替え' })).toBeChecked()
})

test('App・Review・Settings の共通ヘッダーでテーマを操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await expect(page.locator('label.theme-toggle')).toBeVisible()

  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page).toHaveURL(/\/app\/review$/)
  await expect(page.getByRole('link', { name: '戻る' })).toBeVisible()
  await expect(page.locator('label.theme-toggle')).toBeVisible()

  await page.getByRole('link', { name: '戻る' }).click()
  await page.getByRole('link', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible()
  const settingsPage = page.locator('.settings-page')
  await expect(settingsPage.locator('button.btn-soft')).toHaveCount(0)
  await expect(page.locator('label.theme-toggle')).toBeVisible()
  const themeOptions = page.locator('.theme-options')
  await expect(themeOptions).toBeVisible()
  const themeButtons = themeOptions.getByRole('button')
  await expect(themeButtons).toHaveCount(3)
  for (const button of await themeButtons.all()) {
    await expect(button).toHaveClass(/\bbtn\b/)
    await expect(button).not.toHaveClass(/btn-soft/)
  }
  await expect(themeOptions.getByRole('button', { name: 'light' })).toBeVisible()
  await expect(themeOptions.getByRole('button', { name: 'dark' })).toBeVisible()
  await expect(themeOptions.getByRole('button', { name: 'system' })).toHaveAttribute('aria-pressed', 'true')
  await expect(themeOptions.getByRole('button', { name: 'system' })).toHaveClass(/btn-primary/)
  await expect(themeOptions.getByRole('button', { name: 'light' })).toHaveAttribute('aria-pressed', 'false')
  await expect(themeOptions.getByRole('button', { name: 'light' })).not.toHaveClass(/btn-primary/)
  const selectThemeAndWaitForSave = async (theme: 'system' | 'light' | 'dark') => {
    const saveResponse = page.waitForResponse((response) => response.url().includes('/api/trpc/settings.update'))
    await themeOptions.getByRole('button', { name: theme }).click()
    expect((await saveResponse).ok()).toBe(true)
  }
  await selectThemeAndWaitForSave('light')
  await expect(themeOptions.getByRole('button', { name: 'light' })).toHaveAttribute('aria-pressed', 'true')
  await expect(themeOptions.getByRole('button', { name: 'light' })).toHaveClass(/btn-primary/)
  await expect(themeOptions.getByRole('button', { name: 'system' })).not.toHaveClass(/btn-primary/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'cmyk')
  await selectThemeAndWaitForSave('dark')
  await expect(themeOptions.getByRole('button', { name: 'dark' })).toHaveAttribute('aria-pressed', 'true')
  await expect(themeOptions.getByRole('button', { name: 'dark' })).toHaveClass(/btn-primary/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sunset')
  await selectThemeAndWaitForSave('system')
  await expect(themeOptions.getByRole('button', { name: 'system' })).toHaveAttribute('aria-pressed', 'true')
  await expect(themeOptions.getByRole('button', { name: 'system' })).toHaveClass(/btn-primary/)
  await expect(themeOptions.getByRole('button', { name: 'dark' })).not.toHaveClass(/btn-primary/)
  await expect(page.locator('html')).not.toHaveAttribute('data-theme')
  await page.emulateMedia({ colorScheme: 'dark' })
  const systemDarkSurface = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim())
  await page.emulateMedia({ colorScheme: 'light' })
  const systemLightSurface = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-base-100').trim())
  expect(systemDarkSurface).not.toBe(systemLightSurface)
  await page.reload()
  await expect(page.locator('html')).not.toHaveAttribute('data-theme')
  await expect(page.getByRole('button', { name: 'system' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'system' })).toHaveClass(/btn-primary/)
  await expect(themeButtons.first()).not.toHaveClass(/btn-soft/)
  const themeWidths = await themeButtons.evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width))
  expect(Math.max(...themeWidths) - Math.min(...themeWidths)).toBeLessThanOrEqual(1)

  const testSoundButton = page.getByRole('button', { name: 'テスト再生' })
  await expect(testSoundButton).toHaveClass(/btn-sm/)
  await expect(testSoundButton).not.toHaveClass(/btn-soft/)
  await expect(testSoundButton).toHaveCSS('min-height', '34px')
  await expect(testSoundButton).toHaveCSS('padding-left', '11px')
  await expect(testSoundButton).toHaveCSS('padding-right', '11px')
  await expect(testSoundButton).toHaveCSS('padding-top', '6px')
  await expect(testSoundButton).toHaveCSS('padding-bottom', '6px')

  const dataActions = page.locator('.data-actions')
  const dataButtons = dataActions.getByRole('button')
  await expect(dataButtons).toHaveCount(2)
  await expect(dataButtons.nth(0)).toHaveClass(/btn-block/)
  await expect(dataButtons.nth(0)).not.toHaveClass(/btn-soft/)
  await expect(dataButtons.nth(1)).toHaveClass(/btn-block/)
  await expect(dataButtons.nth(1)).toHaveClass(/btn-error/)
  await expect(dataButtons.nth(1)).not.toHaveClass(/btn-soft/)
  await expect(dataButtons.nth(0)).toBeEnabled()
  const dataLayout = await dataActions.evaluate((element) => {
    const buttons = [...element.querySelectorAll('button')]
    const widths = buttons.map((button) => button.getBoundingClientRect().width)
    return { gap: getComputedStyle(element).rowGap, widths }
  })
  expect(dataLayout.gap).toBe('10px')
  expect(dataLayout.widths[0]).toBeCloseTo(dataLayout.widths[1], 1)
  const [download] = await Promise.all([page.waitForEvent('download'), dataButtons.nth(0).click()])
  expect(download.suggestedFilename()).toMatch(/^pomdo-export-\d{8}\.json$/)
  await expect(page.getByRole('slider', { name: '音量' })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(themeOptions.getByRole('button')).toHaveCount(3)
  await expect(dataButtons).toHaveCount(2)
})

test('設定のGoogleボタンは両テーマでGoogle配色とフォーカス表示を保つ', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: '設定' }).click()
  const googleButton = page.getByRole('button', { name: 'Googleでログイン' })
  await expect(googleButton).toBeVisible()
  await expect(googleButton).toHaveClass(/\bbtn\b/)
  await expect(googleButton).toHaveClass(/google-login-button/)
  await expect(googleButton).not.toHaveClass(/btn-soft|btn-primary/)
  await expect(googleButton.locator('svg')).toHaveAttribute('aria-hidden', 'true')
  const logoColors = await googleButton.locator('svg path').evaluateAll((paths) => [...new Set(paths.map((path) => path.getAttribute('fill')))])
  expect(logoColors).toEqual(expect.arrayContaining(['#FFC107', '#FF3D00', '#4CAF50', '#1976D2']))

  for (const theme of ['cmyk', 'sunset']) {
    await page.locator('html').evaluate((element, selectedTheme) => element.setAttribute('data-theme', selectedTheme), theme)
    await expect(googleButton).toHaveCSS('background-color', 'rgb(255, 255, 255)')
    await expect(googleButton).toHaveCSS('color', 'rgb(31, 31, 31)')
    await expect(googleButton).toHaveCSS('border-top-color', 'rgb(116, 119, 117)')
    await expect(googleButton).toHaveCSS('border-top-width', '1px')
    await googleButton.hover()
    await expect(googleButton).toHaveCSS('background-color', 'rgb(242, 242, 242)')
    await page.mouse.move(0, 0)
  }

  await page.keyboard.press('Tab')
  for (let attempts = 0; attempts < 20 && !(await googleButton.evaluate((element) => element.matches(':focus'))); attempts += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(googleButton).toBeFocused()
  await expect(googleButton).toHaveCSS('outline-style', 'solid')
  await expect(googleButton).toHaveCSS('outline-width', '2px')
})

test('匿名ユーザーが設定からGoogle providerへリクエストし、OAuth画面へ遷移しない', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: '設定' }).click()
  await page.route('**/api/auth/sign-in/social', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'E2E OAuth stub' }),
  }))

  const requestPromise = page.waitForRequest((request) => request.url().includes('/api/auth/sign-in/social'))
  await page.getByRole('button', { name: 'Googleでログイン' }).click()
  const request = await requestPromise
  expect(request.postDataJSON()).toMatchObject({ provider: 'google', callbackURL: '/app' })
  await expect(page).toHaveURL(/\/app\/settings$/)
})

test('Focus送信中のGoogleボタンは無効になり、送信失敗後に再操作できる', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: '設定' }).click()
  const sessionResponse = await page.request.get('/api/auth/get-session')
  const session = await sessionResponse.json() as { user?: { id?: string } }
  const ownerUserId = session.user?.id
  expect(ownerUserId).toBeTruthy()
  if (!ownerUserId) throw new Error('匿名セッションの user.id が取得できませんでした')
  await page.evaluate((ownerUserId) => {
    localStorage.setItem('pomdo-focus-outbox', JSON.stringify({
      ownerUserId,
      startToken: crypto.randomUUID(),
      id: crypto.randomUUID(),
      taskId: null,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSecs: 60,
      plannedSecs: 60,
      kind: 'completed',
    }))
  }, ownerUserId)

  let releaseCompleteRequest!: () => void
  let signalCompleteRequest!: () => void
  const completeRequestGate = new Promise<void>((resolve) => { releaseCompleteRequest = resolve })
  const completeRequestStarted = new Promise<void>((resolve) => { signalCompleteRequest = resolve })
  await page.route('**/api/trpc/focus.complete**', async (route) => {
    signalCompleteRequest()
    await completeRequestGate
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'E2E simulated failure' } }),
    })
  })

  const googleButton = page.locator('button.google-login-button')
  await expect(page.getByRole('button', { name: 'Googleでログイン' })).toBeVisible()
  try {
    await googleButton.click()
    await completeRequestStarted
    await expect(googleButton).toBeDisabled()
    await expect(googleButton).toHaveText('送信を確認中…')
    await expect(googleButton).toHaveCSS('opacity', '0.55')
    await expect(googleButton).toHaveCSS('cursor', 'not-allowed')
    await expect(googleButton).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  } finally {
    releaseCompleteRequest()
  }
  await expect(page.getByRole('alert')).toContainText('送信待ちの Focus を保存できませんでした。接続を確認してからもう一度お試しください。')
  await expect(googleButton).toBeEnabled()
  await expect(googleButton).toHaveText('Googleでログイン')
})

test('匿名サインイン失敗時の設定 retry は再試行後に復旧する', async ({ page }) => {
  let signInAttempts = 0
  await page.route('**/api/auth/sign-in/anonymous', async (route) => {
    signInAttempts += 1
    if (signInAttempts === 1) {
      await route.abort('failed')
      return
    }
    await route.continue()
  })
  await page.goto('/app/settings')
  const retry = page.getByRole('alert').getByRole('button', { name: 'もう一度試す' })
  await expect(retry).toBeVisible()
  await expect(retry).toHaveClass(/\bbtn\b/)
  await expect(retry).not.toHaveClass(/btn-soft/)
  await retry.click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible({ timeout: 15_000 })
  expect(signInAttempts).toBeGreaterThanOrEqual(2)
})

test('bootstrap初期化失敗時の設定 retry は再試行後に復旧する', async ({ page }) => {
  let bootstrapAttempts = 0
  await page.route('**/api/trpc/**', async (route) => {
    const requestPath = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    if (requestPath.split(',').includes('bootstrap.initialize')) {
      bootstrapAttempts += 1
      if (bootstrapAttempts === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { message: 'E2E simulated failure' } }) })
        return
      }
    }
    await route.continue()
  })
  await page.goto('/app/settings')
  const retry = page.getByRole('alert').getByRole('button', { name: 'もう一度試す' })
  await expect(retry).toBeVisible()
  await expect(retry).toHaveClass(/\bbtn\b/)
  await expect(retry).not.toHaveClass(/btn-soft/)
  await retry.click()
  await expect(page.getByRole('heading', { name: '設定' })).toBeVisible({ timeout: 15_000 })
  expect(bootstrapAttempts).toBeGreaterThanOrEqual(2)
})

test('認証済みユーザーのログアウトは通常ボタンでsign-outを送る', async ({ page }) => {
  await openAppAsAnonymous(page)
  await signInAsTestIdentity(page, `settings-${crypto.randomUUID()}`)
  await page.getByRole('link', { name: '設定' }).click()
  const logout = page.getByRole('button', { name: 'ログアウト' })
  await expect(logout).toBeVisible()
  await expect(logout).toHaveClass(/\bbtn\b/)
  await expect(logout).not.toHaveClass(/btn-soft/)
  const signOutRequest = page.waitForRequest((request) => request.url().includes('/api/auth/sign-out'))
  await logout.click()
  await signOutRequest
  await expect(page).toHaveURL(/\/app\/settings$/)
})

test('desktop本文は960px以内に揃い、Taskシートは528px以内に保つ', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openAppAsAnonymous(page)

  const appWidths = await page.evaluate(() => {
    const header = document.querySelector('.appbar-inner')!.getBoundingClientRect()
    const content = document.querySelector('.app-wrap')!.getBoundingClientRect()
    return {
      headerWidth: header.width,
      contentWidth: content.width,
      centerDifference: Math.abs((header.left + header.right) / 2 - (content.left + content.right) / 2),
    }
  })
  expect(appWidths.headerWidth).toBeLessThanOrEqual(960)
  expect(appWidths.contentWidth).toBeLessThanOrEqual(960)
  expect(appWidths.centerDifference).toBeLessThanOrEqual(1)

  await page.getByRole('button', { name: '編集' }).click()
  const sheet = page.locator('.sheet')
  await expect(sheet).toBeVisible()
  const sheetWidth = await sheet.evaluate((element) => element.getBoundingClientRect().width)
  expect(sheetWidth).toBeLessThanOrEqual(528)
  await page.keyboard.press('Escape')

  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page.getByRole('heading', { name: '年間の集中時間' })).toBeVisible()
  const reviewWidth = await page.locator('.review-page').evaluate((element) => element.getBoundingClientRect().width)
  expect(reviewWidth).toBeLessThanOrEqual(960)
})

test('Appの設定ギアはテーマトグルと同じ色で、Tabフォーカスを表示する', async ({ page }) => {
  await openAppAsAnonymous(page)
  const settingsLink = page.getByRole('link', { name: '設定' })

  for (const theme of ['cmyk', 'sunset']) {
    await page.locator('html').evaluate((element, selectedTheme) => element.setAttribute('data-theme', selectedTheme), theme)
    await expect.poll(() => page.evaluate(() => {
      const settings = document.querySelector('.settings-icon-link svg')!
      const toggle = document.querySelector('.theme-toggle svg')!
      return getComputedStyle(settings).color === getComputedStyle(toggle).color
    })).toBe(true)
    const defaultColors = await page.evaluate(() => ({
      settings: getComputedStyle(document.querySelector('.settings-icon-link svg')!).color,
      toggle: getComputedStyle(document.querySelector('.theme-toggle svg')!).color,
    }))
    expect(defaultColors.settings).toBe(defaultColors.toggle)

    await settingsLink.hover()
    await expect.poll(() => page.evaluate(() => {
      const settings = document.querySelector('.settings-icon-link svg')!
      const toggle = document.querySelector('.theme-toggle svg')!
      return getComputedStyle(settings).color === getComputedStyle(toggle).color
    })).toBe(true)
    const hoverColors = await page.evaluate(() => ({
      settings: getComputedStyle(document.querySelector('.settings-icon-link svg')!).color,
      toggle: getComputedStyle(document.querySelector('.theme-toggle svg')!).color,
    }))
    expect(hoverColors.settings).toBe(hoverColors.toggle)
    await page.mouse.move(0, 0)
  }

  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(settingsLink).toBeFocused()
  const focusOutline = await settingsLink.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(focusOutline).not.toBe('none')
})

test('reduced-transparencyではヘッダーのぼかしを外し、Reviewを表示できる', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'reduced-transparency の emulation は Chromium CDP を使う')
  const devtools = await page.context().newCDPSession(page)
  await devtools.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }],
  })
  await page.goto('/app/review')
  await expect(page.getByRole('heading', { name: '年間の集中時間' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.matchMedia('(prefers-reduced-transparency: reduce)').matches)).toBe(true)
  const headerBackdrop = await page.locator('.appbar').evaluate((element) => getComputedStyle(element).backdropFilter)
  expect(headerBackdrop).toBe('none')
  await expect(page.getByRole('group', { name: /\d{4}年の集中時間/ })).toBeVisible()
})

test('LP動画は指定属性で表示し、読み込み失敗時もCTAと画面幅を保つ', async ({ page }) => {
  let releaseVideoRequest!: () => void
  const videoRequestGate = new Promise<void>((resolve) => { releaseVideoRequest = resolve })
  let videoRequestStarted = false
  await page.route(DEMO_VIDEO_URL, async (route) => {
    videoRequestStarted = true
    await videoRequestGate
    await route.abort()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const video = page.locator('.demo-video')
  await expect(video).toBeVisible()
  await expect(video).toHaveAttribute('src', DEMO_VIDEO_URL)
  await expect(video).toHaveAttribute('autoplay')
  await expect.poll(() => video.evaluate((element) => (element as HTMLVideoElement).muted)).toBe(true)
  await expect(video).toHaveAttribute('loop')
  await expect(video).toHaveAttribute('playsinline')
  await expect(video).not.toHaveAttribute('controls')
  await expect(page.getByRole('slider', { name: 'デモの残り時間' })).toHaveCount(0)
  await expect.poll(() => videoRequestStarted).toBe(true)
  const mobileLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    videoWidth: document.querySelector('video')!.getBoundingClientRect().width,
  }))
  expect(mobileLayout.documentWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth)
  expect(mobileLayout.videoWidth).toBeLessThan(mobileLayout.viewportWidth)

  releaseVideoRequest()
  await expect(page.getByRole('status')).toContainText('動画を再生できませんでした。')
  await expect(page.getByRole('status')).toContainText('タイマーを始めたら、今やることに集中。終わったら、次のタスクへ進みます。')
  await expect(page.getByRole('link', { name: '使ってみる' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'プライバシーポリシー' })).toBeVisible()

  await page.setViewportSize({ width: 1440, height: 900 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440)
})

test('reduced-motionでは初期表示を静止させ、表示中の動画も設定変更で停止する', async ({ page }) => {
  let releaseVideoRequest!: () => void
  const videoRequestGate = new Promise<void>((resolve) => { releaseVideoRequest = resolve })
  let videoRequestStarted = false
  await page.addInitScript(() => {
    const browserWindow = window as Window & { pomdoVideoPauseCalls: number }
    browserWindow.pomdoVideoPauseCalls = 0
    const pauseVideo = HTMLMediaElement.prototype.pause
    HTMLMediaElement.prototype.pause = function pause() {
      browserWindow.pomdoVideoPauseCalls += 1
      return pauseVideo.call(this)
    }
  })
  await page.route(DEMO_VIDEO_URL, async (route) => {
    videoRequestStarted = true
    await videoRequestGate
    await route.abort()
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.demo-video-fallback')).toContainText('タイマーを始めたら、今やることに集中。終わったら、次のタスクへ進みます。')
  await expect(page.locator('video')).toHaveCount(0)
  expect(videoRequestStarted).toBe(false)

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const video = page.locator('.demo-video')
  await expect(video).toBeVisible()
  await expect(video).toHaveAttribute('autoplay')
  await expect.poll(() => videoRequestStarted).toBe(true)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(video).toHaveCount(0)
  await expect.poll(() => page.evaluate(() => (window as Window & { pomdoVideoPauseCalls: number }).pomdoVideoPauseCalls)).toBeGreaterThan(0)
  await expect(page.getByRole('link', { name: '使ってみる' })).toBeVisible()
  releaseVideoRequest()
})

test('Review のテーマ変更は settings.update に Turnstile token を含める', async ({ page }) => {
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: /振り返りを見る/ }).click()
  await expect(page.getByRole('heading', { name: '今日の振り返り' })).toBeVisible()
  await expect(page.getByText('今日を振り返る')).toHaveCount(0)
  await expect(page.getByText('合計集中時間')).toBeVisible()

  const toggleInput = page.getByRole('checkbox', { name: /テーマに切り替え/ })
  const toggle = page.locator('label.theme-toggle')
  const nextTheme = (await toggleInput.getAttribute('aria-label')) === 'ダークテーマに切り替え' ? 'dark' : 'light'
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
