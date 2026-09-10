const PERMISSION_REQUESTED_KEY = 'pomdo-notification-permission-requested'
const DEFAULT_TITLE = 'Pomdo'

export async function requestNotificationPermissionOnce(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (window.localStorage.getItem(PERMISSION_REQUESTED_KEY) === 'true') return Notification.permission
  window.localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true')
  // 権限ダイアログがブラウザによって未解決のままでも Focus 開始を妨げない。
  void Notification.requestPermission().catch(() => undefined)
  return Notification.permission
}

export function notifyFocusCompleted(): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification('集中セッションが終わりました')
  }
  if (typeof document !== 'undefined') document.title = '完了しました — Pomdo'
}

export function restoreDefaultTitle(): void {
  if (typeof document !== 'undefined') document.title = DEFAULT_TITLE
}
