export const completionNotificationPreferenceKey = 'pomdo-timer-completion-notifications-enabled'

const completionNotificationClaimPrefix = 'pomdo-completion-notification-claim:'
const completionNotificationLockName = 'pomdo-completion-notification'
const defaultDocumentTitle = 'Pomdo'
const timerCompletionDocumentTitle = '完了しました — Pomdo'

export type BrowserNotificationPermission = NotificationPermission | 'unsupported'
export type CompletionNotificationPreference = {
  enabled: boolean
  storageAvailable: boolean
}
export type TimerCompletionKind = 'focus' | 'break'

const completionNotificationTitles: Record<TimerCompletionKind, string> = {
  focus: '集中セッションが終わりました',
  break: '休憩が終わりました',
}

export function loadCompletionNotificationPreference(): CompletionNotificationPreference {
  if (typeof window === 'undefined') return { enabled: false, storageAvailable: false }

  try {
    return {
      enabled: window.localStorage.getItem(completionNotificationPreferenceKey) !== 'false',
      storageAvailable: true,
    }
  } catch {
    return { enabled: false, storageAvailable: false }
  }
}

export function saveCompletionNotificationPreference(enabled: boolean): boolean {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(completionNotificationPreferenceKey, String(enabled))
    return true
  } catch {
    return false
  }
}

export function readBrowserNotificationPermission(): BrowserNotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'

  try {
    return window.Notification.permission
  } catch {
    return 'unsupported'
  }
}

export function requestBrowserNotificationPermission(): Promise<boolean> {
  if (readBrowserNotificationPermission() !== 'default') return Promise.resolve(false)

  try {
    return window.Notification.requestPermission().then(() => true, () => false)
  } catch {
    return Promise.resolve(false)
  }
}

export function setTimerCompletionTitle(): void {
  if (typeof document !== 'undefined') document.title = timerCompletionDocumentTitle
}

export async function notifyTimerCompleted(kind: TimerCompletionKind, runtimeKey: string): Promise<void> {
  const preferenceAtCompletion = loadCompletionNotificationPreference()
  const permissionAtCompletion = readBrowserNotificationPermission()

  try {
    if (typeof navigator === 'undefined' || !navigator.locks) return

    await navigator.locks.request(completionNotificationLockName, () => {
      if (typeof window === 'undefined') return

      const claimKey = `${completionNotificationClaimPrefix}${runtimeKey}`
      if (window.localStorage.getItem(claimKey) !== null) return
      window.localStorage.setItem(claimKey, 'true')

      if (!preferenceAtCompletion.storageAvailable || !preferenceAtCompletion.enabled) return
      if (permissionAtCompletion !== 'granted') return

      new window.Notification(completionNotificationTitles[kind], { tag: runtimeKey })
    })
  } catch {
    return
  }
}

export function sendNotificationTest(): 'sent' | 'disabled' | 'failed' {
  const preference = loadCompletionNotificationPreference()
  if (!preference.storageAvailable) return 'failed'
  if (!preference.enabled || readBrowserNotificationPermission() !== 'granted') return 'disabled'

  try {
    new window.Notification('Pomdoの通知テストです')
    return 'sent'
  } catch {
    return 'failed'
  }
}

export function restoreDefaultTitle(): void {
  if (typeof document !== 'undefined') document.title = defaultDocumentTitle
}
