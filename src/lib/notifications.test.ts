import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  completionNotificationPreferenceKey,
  loadCompletionNotificationPreference,
  notifyTimerCompleted,
  readBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  restoreDefaultTitle,
  saveCompletionNotificationPreference,
  sendNotificationTest,
  setTimerCompletionTitle,
} from './notifications'

const oldPermissionRequestKey = 'pomdo-notification-permission-requested'

describe('タイマー完了通知', () => {
  let createdNotifications: Array<{ title: string; options?: NotificationOptions }>
  let notificationPermission: NotificationPermission
  let shouldThrowOnNotification: boolean
  let lockRequestCallCount: number
  let originalNotificationDescriptor: PropertyDescriptor | undefined
  let originalLocksDescriptor: PropertyDescriptor | undefined

  beforeEach(() => {
    originalNotificationDescriptor = Object.getOwnPropertyDescriptor(window, 'Notification')
    originalLocksDescriptor = Object.getOwnPropertyDescriptor(navigator, 'locks')
    window.localStorage.clear()
    document.title = 'Pomdo'
    createdNotifications = []
    notificationPermission = 'default'
    shouldThrowOnNotification = false
    lockRequestCallCount = 0

    class MockNotification {
      static get permission(): NotificationPermission { return notificationPermission }
      static requestPermission = vi.fn(async () => {
        notificationPermission = 'granted'
        return notificationPermission
      })

      constructor(title: string, options?: NotificationOptions) {
        if (shouldThrowOnNotification) throw new Error('notification unavailable')
        createdNotifications.push({ title, options })
      }
    }

    Object.defineProperty(window, 'Notification', { configurable: true, value: MockNotification })
    const lockRequest = vi.fn(async (_name: string, callback: () => void | Promise<void>) => {
      lockRequestCallCount += 1
      return callback()
    })
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: lockRequest } })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalLocksDescriptor) Object.defineProperty(navigator, 'locks', originalLocksDescriptor)
    else Reflect.deleteProperty(navigator, 'locks')
    if (originalNotificationDescriptor) Object.defineProperty(window, 'Notification', originalNotificationDescriptor)
    else Reflect.deleteProperty(window, 'Notification')
    restoreDefaultTitle()
  })

  it('設定が未保存ならオンとして読み込み、保存後に値を復元する', () => {
    expect(loadCompletionNotificationPreference()).toEqual({ enabled: true, storageAvailable: true })
    expect(saveCompletionNotificationPreference(false)).toBe(true)
    expect(loadCompletionNotificationPreference()).toEqual({ enabled: false, storageAvailable: true })
    expect(window.localStorage.getItem(completionNotificationPreferenceKey)).toBe('false')
  })

  it('保存値がfalse以外ならオンとして扱う', () => {
    window.localStorage.setItem(completionNotificationPreferenceKey, 'invalid')
    expect(loadCompletionNotificationPreference()).toEqual({ enabled: true, storageAvailable: true })
  })

  it('ブラウザ許可状態とNotification API非対応を区別する', () => {
    expect(readBrowserNotificationPermission()).toBe('default')
    notificationPermission = 'granted'
    expect(readBrowserNotificationPermission()).toBe('granted')
    notificationPermission = 'denied'
    expect(readBrowserNotificationPermission()).toBe('denied')

    Reflect.deleteProperty(window, 'Notification')
    expect(readBrowserNotificationPermission()).toBe('unsupported')
  })

  it('古い許可要求済みキーがあっても明示要求を実行する', async () => {
    window.localStorage.setItem(oldPermissionRequestKey, 'true')

    await expect(requestBrowserNotificationPermission()).resolves.toBe(true)
    expect(window.Notification.requestPermission).toHaveBeenCalledOnce()
    expect(readBrowserNotificationPermission()).toBe('granted')
  })

  it('許可要求がrejectされても例外を外へ出さず失敗として返す', async () => {
    vi.mocked(window.Notification.requestPermission).mockRejectedValueOnce(new Error('permission unavailable'))

    await expect(requestBrowserNotificationPermission()).resolves.toBe(false)
    expect(readBrowserNotificationPermission()).toBe('default')
  })

  it('Focus完了とBreak完了で別の通知を一度だけ作る', async () => {
    notificationPermission = 'granted'
    await notifyTimerCompleted('focus', 'focus-session-1')
    await notifyTimerCompleted('focus', 'focus-session-1')
    await notifyTimerCompleted('break', 'break-123')

    expect(createdNotifications).toEqual([
      { title: '集中セッションが終わりました', options: { tag: 'focus-session-1' } },
      { title: '休憩が終わりました', options: { tag: 'break-123' } },
    ])
    expect(lockRequestCallCount).toBe(3)
  })

  it('完了時に設定がオフならclaimを残し、後からオンにしても通知しない', async () => {
    saveCompletionNotificationPreference(false)

    await notifyTimerCompleted('focus', 'focus-session-2')
    saveCompletionNotificationPreference(true)
    await notifyTimerCompleted('focus', 'focus-session-2')

    expect(createdNotifications).toHaveLength(0)
    expect(window.localStorage.getItem('pomdo-completion-notification-claim:focus-session-2')).toBe('true')
  })

  it('ロック待ちの間に設定が変わっても完了時点の設定で通知を決める', async () => {
    saveCompletionNotificationPreference(false)
    let releaseLock: (() => void) | undefined
    const lockBarrier = new Promise<void>((resolve) => { releaseLock = resolve })
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: {
        request: async (_name: string, callback: () => void | Promise<void>) => {
          await lockBarrier
          await callback()
        },
      },
    })

    const completionNotification = notifyTimerCompleted('focus', 'focus-session-locked')
    saveCompletionNotificationPreference(true)
    releaseLock?.()
    await completionNotification

    expect(createdNotifications).toHaveLength(0)
  })

  it('ブラウザ許可が未設定ならclaimを残して通知しない', async () => {
    await notifyTimerCompleted('break', 'break-456')

    notificationPermission = 'granted'
    await notifyTimerCompleted('break', 'break-456')

    expect(createdNotifications).toHaveLength(0)
    expect(window.localStorage.getItem('pomdo-completion-notification-claim:break-456')).toBe('true')
  })

  it('Web Locks APIが使えない場合は通知を作らない', async () => {
    Reflect.deleteProperty(navigator, 'locks')

    await expect(notifyTimerCompleted('focus', 'focus-session-3')).resolves.toBeUndefined()
    expect(createdNotifications).toHaveLength(0)
  })

  it('保存領域の読み書きに失敗したら通知を作らず例外を外へ出さない', async () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => { throw new Error('storage unavailable') })
    expect(loadCompletionNotificationPreference()).toEqual({ enabled: false, storageAvailable: false })

    await expect(notifyTimerCompleted('focus', 'focus-session-4')).resolves.toBeUndefined()
    vi.mocked(window.localStorage.getItem).mockRestore()
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('storage unavailable') })
    expect(saveCompletionNotificationPreference(true)).toBe(false)
    expect(createdNotifications).toHaveLength(0)
  })

  it('通知生成に失敗しても例外を外へ出さず、タイトル変更は独立して行える', async () => {
    shouldThrowOnNotification = true

    await expect(notifyTimerCompleted('focus', 'focus-session-5')).resolves.toBeUndefined()
    setTimerCompletionTitle()

    expect(document.title).toBe('完了しました — Pomdo')
  })

  it('通知テストはオンかつ許可済みの場合だけ通知を作り、タイトルを変更しない', () => {
    notificationPermission = 'granted'
    expect(sendNotificationTest()).toBe('sent')
    expect(createdNotifications).toEqual([{ title: 'Pomdoの通知テストです', options: undefined }])
    expect(document.title).toBe('Pomdo')

    saveCompletionNotificationPreference(false)
    expect(sendNotificationTest()).toBe('disabled')
  })

  it('通知テストの生成失敗を戻り値で伝える', () => {
    notificationPermission = 'granted'
    shouldThrowOnNotification = true

    expect(sendNotificationTest()).toBe('failed')
  })
})
