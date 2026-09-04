const NOTICE_KEY = 'pomdo-account-link-result'
export const ACCOUNT_LINK_SNAPSHOT_KEY = 'pomdo-account-link-snapshot'

export type AccountLinkSnapshot = {
  userId: string
  taskIds: string[]
  focusSessionIds: string[]
}

function formatNotice(result: string | null): string | null {
  if (result === 'discarded') return 'Google側に既存データがあるため、この匿名データは引き継がれませんでした。'
  if (result === 'migrated') return '匿名データをGoogleアカウントへ引き継ぎました。'
  return null
}

export function readAccountLinkNotice(options: { preserve?: boolean } = {}): string | null {
  if (typeof window === 'undefined') return null
  const localResult = window.localStorage.getItem(NOTICE_KEY)
  if (localResult) {
    if (!options.preserve) window.localStorage.removeItem(NOTICE_KEY)
    return formatNotice(localResult)
  }
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(`${NOTICE_KEY}=`))
  if (!cookie) return null
  let result: string
  try {
    result = decodeURIComponent(cookie.slice(NOTICE_KEY.length + 1))
  } catch {
    result = ''
  }
  if (!options.preserve) document.cookie = `${NOTICE_KEY}=; Max-Age=0; Path=/; SameSite=Lax`
  return formatNotice(result)
}

export function saveAccountLinkSnapshot(snapshot: AccountLinkSnapshot): void {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(ACCOUNT_LINK_SNAPSHOT_KEY, JSON.stringify(snapshot))
}

export function readAccountLinkSnapshot(): AccountLinkSnapshot | null {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(ACCOUNT_LINK_SNAPSHOT_KEY)
  if (!value) return null
  window.sessionStorage.removeItem(ACCOUNT_LINK_SNAPSHOT_KEY)
  try {
    const snapshot = JSON.parse(value) as Partial<AccountLinkSnapshot>
    if (typeof snapshot.userId !== 'string' || !Array.isArray(snapshot.taskIds) || !Array.isArray(snapshot.focusSessionIds) || !snapshot.taskIds.every((id) => typeof id === 'string') || !snapshot.focusSessionIds.every((id) => typeof id === 'string')) return null
    return { userId: snapshot.userId, taskIds: snapshot.taskIds, focusSessionIds: snapshot.focusSessionIds }
  } catch {
    return null
  }
}
