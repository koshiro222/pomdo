import { expect, test, type BrowserContext } from '@playwright/test'
import { openAppAsAnonymous, setServerNowFromBrowserClock, signInAsTestIdentity } from './helpers/auth'

const preferenceKey = 'pomdo-timer-completion-notifications-enabled'
const notificationLogKey = 'pomdo-e2e-notification-log'

async function installNotificationDouble(context: BrowserContext, permission: NotificationPermission): Promise<void> {
  await context.addInitScript((initialPermission) => {
    const state = { permissionRequests: 0, notifications: [] as Array<{ title: string; options?: NotificationOptions }> }
    Object.defineProperty(window, '__pomdoNotificationState', { configurable: true, value: state })

    class NotificationDouble {
      static permission: NotificationPermission = initialPermission

      static requestPermission(): Promise<NotificationPermission> {
        state.permissionRequests += 1
        NotificationDouble.permission = 'granted'
        return Promise.resolve(NotificationDouble.permission)
      }

      constructor(title: string, options?: NotificationOptions) {
        const notification = { title, options }
        state.notifications.push(notification)
        const storedNotifications = JSON.parse(localStorage.getItem('pomdo-e2e-notification-log') ?? '[]') as typeof state.notifications
        storedNotifications.push(notification)
        localStorage.setItem('pomdo-e2e-notification-log', JSON.stringify(storedNotifications))
      }
    }

    Object.defineProperty(window, 'Notification', { configurable: true, value: NotificationDouble })
  }, permission)
}

async function readNotificationLog(page: import('@playwright/test').Page): Promise<Array<{ title: string; options?: NotificationOptions }>> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), notificationLogKey)
}

test('Focus開始では許可を求めず、設定画面の操作で許可して通知テストを送れる', async ({ context, page }) => {
  await installNotificationDouble(context, 'default')
  await page.addInitScript(() => localStorage.setItem('pomdo-notification-permission-requested', 'true'))
  await openAppAsAnonymous(page)

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as Window & { __pomdoNotificationState: { permissionRequests: number } }).__pomdoNotificationState.permissionRequests)).toBe(0)

  await page.getByRole('link', { name: '設定' }).click()
  const completionSwitch = page.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })
  await expect(completionSwitch).toBeChecked()
  await expect(page.getByText('ブラウザの通知はまだ許可されていません。')).toBeVisible()
  await expect(page.getByRole('button', { name: '通知テスト' })).toBeDisabled()

  await page.getByRole('button', { name: '通知を許可' }).click()
  await expect.poll(() => page.evaluate(() => (window as Window & { __pomdoNotificationState: { permissionRequests: number } }).__pomdoNotificationState.permissionRequests)).toBe(1)
  await expect(page.getByText('ブラウザの通知は許可されています。')).toBeVisible()
  const timerBeforeTest = await page.evaluate(() => localStorage.getItem('pomdo-focus-runtime'))
  const titleBeforeTest = await page.title()
  await page.getByRole('button', { name: '通知テスト' }).click()
  await expect.poll(async () => (await readNotificationLog(page)).length).toBe(1)
  expect((await readNotificationLog(page))[0]).toEqual({ title: 'Pomdoの通知テストです' })
  expect(await page.evaluate(() => localStorage.getItem('pomdo-focus-runtime'))).toBe(timerBeforeTest)
  expect(await page.title()).toBe(titleBeforeTest)
  expect(await page.evaluate(() => localStorage.getItem('pomdo-notification-permission-requested'))).toBe('true')
})

test('完了通知設定を別タブとアカウントで共有し、許可状態を画面復帰時に更新する', async ({ context, page }) => {
  await installNotificationDouble(context, 'granted')
  await openAppAsAnonymous(page)
  await page.getByRole('link', { name: '設定' }).click()
  await expect(page.getByRole('heading', { name: '完了通知' })).toBeVisible()

  const otherPage = await context.newPage()
  await otherPage.goto('/app/settings')
  const currentSwitch = page.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })
  const otherSwitch = otherPage.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })
  await expect(otherSwitch).toBeChecked()

  let settingsUpdateRequestCount = 0
  page.on('request', (request) => {
    if (request.url().includes('/api/trpc/settings.update')) settingsUpdateRequestCount += 1
  })
  await currentSwitch.click()
  await expect(currentSwitch).not.toBeChecked()
  await expect(otherSwitch).not.toBeChecked()
  expect(await page.evaluate((key) => localStorage.getItem(key), preferenceKey)).toBe('false')
  expect(settingsUpdateRequestCount).toBe(0)

  await otherPage.evaluate(() => {
    Object.defineProperty(Notification, 'permission', { configurable: true, value: 'denied' })
    window.dispatchEvent(new PageTransitionEvent('pageshow'))
  })
  await expect(otherPage.locator('#browser-notification-permission-state')).toContainText('ブラウザの通知は拒否されています')
  await expect(otherPage.getByRole('button', { name: '通知を許可' })).toHaveCount(0)

  await otherPage.evaluate(() => {
    Object.defineProperty(Notification, 'permission', { configurable: true, value: 'granted' })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(otherPage.getByText('ブラウザの通知は許可されています。')).toBeVisible()
  await expect(otherSwitch).not.toBeChecked()

  await signInAsTestIdentity(page, `issue175-notification-${Date.now()}`)
  await expect(page.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })).not.toBeChecked()

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const keyboardSwitch = page.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })
  await keyboardSwitch.focus()
  await page.keyboard.press('Space')
  await expect(keyboardSwitch).toBeChecked()
  await expect(keyboardSwitch).toHaveCSS('outline-style', 'solid')
})

test('FocusとBreakの完了で種類に合ったブラウザ通知を送る', async ({ context, page }) => {
  test.setTimeout(60_000)
  await installNotificationDouble(context, 'granted')
  const fixedNow = new Date('2026-10-10T09:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((key) => localStorage.setItem(key, 'true'), preferenceKey)
  await openAppAsAnonymous(page)

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15', exact: true }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()

  const focusCompletion = page.waitForResponse((response) => response.url().includes('/api/trpc/focus.complete'))
  await page.clock.runFor('00:15:01')
  expect((await focusCompletion).ok()).toBe(true)
  await expect(page.getByRole('button', { name: '休憩する（5分）' })).toBeVisible()
  await expect(page).toHaveTitle('完了しました — Pomdo')
  await expect.poll(async () => (await readNotificationLog(page)).length).toBe(1)
  expect((await readNotificationLog(page))[0].title).toBe('集中セッションが終わりました')

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '休憩する（5分）' }).click()
  await expect(page.getByRole('button', { name: 'スキップ' })).toBeVisible()
  await page.clock.runFor('00:05:01')
  await expect(page.getByRole('button', { name: '▶ はじめる' })).toBeVisible()
  await expect.poll(async () => (await readNotificationLog(page)).length).toBe(2)
  expect((await readNotificationLog(page)).map(({ title }) => title)).toEqual([
    '集中セッションが終わりました',
    '休憩が終わりました',
  ])
})

test('同じFocus完了を2タブで処理しても通知は1件だけ送る', async ({ context, page }) => {
  test.setTimeout(60_000)
  await installNotificationDouble(context, 'granted')
  const fixedNow = new Date('2026-10-10T10:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((key) => localStorage.setItem(key, 'true'), preferenceKey)
  await openAppAsAnonymous(page)

  const otherPage = await context.newPage()
  await otherPage.clock.install({ time: fixedNow })
  await otherPage.goto('/app')
  await expect(otherPage.getByText('Pomdo を5分だけ触ってみる')).toBeVisible({ timeout: 15_000 })

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15', exact: true }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  await expect(page.getByRole('button', { name: 'ストップ' })).toBeVisible()
  await expect(otherPage.getByRole('button', { name: 'ストップ' })).toBeVisible({ timeout: 15_000 })

  await Promise.all([
    page.clock.runFor('00:15:01'),
    otherPage.clock.runFor('00:15:01'),
  ])
  await expect.poll(async () => (await readNotificationLog(page)).length).toBeGreaterThan(0)
  expect((await readNotificationLog(page)).filter(({ title }) => title === '集中セッションが終わりました')).toHaveLength(1)
})

test('実行中に別タブで通知をオフにしてもFocusを記録し、中断と休憩スキップでは通知しない', async ({ context, page }) => {
  test.setTimeout(60_000)
  await installNotificationDouble(context, 'granted')
  const fixedNow = new Date('2026-10-10T11:00:00+09:00')
  await page.clock.install({ time: fixedNow })
  await page.addInitScript((key) => localStorage.setItem(key, 'true'), preferenceKey)
  await openAppAsAnonymous(page)

  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '15', exact: true }).click()
  await page.getByRole('button', { name: '▶ はじめる' }).click()

  const settingsPage = await context.newPage()
  await settingsPage.goto('/app/settings')
  const completionSwitch = settingsPage.getByRole('switch', { name: 'タイマー完了時にブラウザ通知を表示する' })
  await expect(completionSwitch).toBeVisible({ timeout: 15_000 })
  await expect(completionSwitch).toBeChecked()
  await completionSwitch.click()
  await expect(completionSwitch).not.toBeChecked()

  const focusCompletion = page.waitForResponse((response) => response.url().includes('/api/trpc/focus.complete'))
  await page.clock.runFor('00:15:01')
  expect((await focusCompletion).ok()).toBe(true)
  await expect(page.getByRole('button', { name: '休憩する（5分）' })).toBeVisible()
  await expect(page).toHaveTitle('完了しました — Pomdo')
  expect(await readNotificationLog(page)).toHaveLength(0)

  await page.getByRole('button', { name: '休憩する（5分）' }).click()
  await page.getByRole('button', { name: 'スキップ' }).click()
  await setServerNowFromBrowserClock(page)
  await page.getByRole('button', { name: '▶ はじめる' }).click()
  const interruption = page.waitForResponse((response) => response.url().includes('/api/trpc/focus.interrupt'))
  await page.getByRole('button', { name: 'ストップ' }).click()
  expect((await interruption).ok()).toBe(true)
  expect(await readNotificationLog(page)).toHaveLength(0)
})
