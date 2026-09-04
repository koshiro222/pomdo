import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Link, useNavigate } from 'react-router'
import type { AuthUser } from '../../hooks/useAuth'
import { useAppSession } from '../../hooks/useAppSession'
import { applyTheme, type Theme } from '../../lib/theme'
import { playFocusChime } from '../../lib/sound'
import { readAccountLinkNotice } from '../../lib/account-link-notice'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { useFocusRuntime } from '../../core/store/focus-runtime'
import { GoogleLoginButton } from '../auth/GoogleLoginButton'
import { Toast } from '../ui/Toast'

const DEV_TURNSTILE_TOKEN = 'e2e-turnstile-token'
const DEV_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'

export function SettingsPage() {
  const { user, logout, loading, ready, bootstrapError, retryBootstrap, anonymousAuthError, retryAnonymousSignIn } = useAppSession()
  if (loading || !ready || !user) return <main className="page-shell loading-state">{anonymousAuthError ? <><p>匿名アカウントを作成できませんでした。</p><button className="btn" type="button" onClick={retryAnonymousSignIn}>もう一度試す</button></> : bootstrapError ? <><p>Pomdo の準備に失敗しました。</p><button className="btn" type="button" onClick={retryBootstrap}>もう一度試す</button></> : <p>設定を準備しています。</p>}</main>
  return <SettingsContent key={user.id} user={user} logout={logout} />
}

function SettingsContent({ user, logout }: { user: AuthUser; logout: () => Promise<void> }) {
  const navigate = useNavigate()
  const update = trpc.settings.update.useMutation()
  const deleteMutation = trpc.account.delete.useMutation({ onSuccess: () => { void logout().then(() => navigate('/')) } })
  const exportQuery = trpc.account.export.useQuery()
  const [theme, setTheme] = useState<Theme>(user.theme)
  const [muted, setMuted] = useState(user.soundMuted)
  const [volume, setVolume] = useState(user.soundVolume)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [linkNotice, setLinkNotice] = useState<string | null>(readAccountLinkNotice)
  const effectiveTurnstileToken = turnstileToken ?? (import.meta.env.DEV ? DEV_TURNSTILE_TOKEN : null)
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? DEV_TURNSTILE_SITE_KEY : null)
  const save = (input: { theme?: Theme; soundMuted?: boolean; soundVolume?: number }) => update.mutate({ ...input, turnstileToken: effectiveTurnstileToken ?? undefined })
  const exportData = () => {
    if (!exportQuery.data) return
    const blob = new Blob([JSON.stringify(exportQuery.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `pomdo-export-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  const deleteAccount = () => {
    const runtime = useFocusRuntime.getState()
    if (runtime.mode === 'focus' && runtime.endsAt !== null) {
      setLinkNotice('Focus 実行中はアカウントを削除できません。終了してからお試しください。')
      return
    }
    if (window.confirm('アカウントとデータをすべて削除しますか？')) deleteMutation.mutate({ turnstileToken: effectiveTurnstileToken ?? undefined })
  }
  const logoutSafely = () => {
    const runtime = useFocusRuntime.getState()
    if (runtime.mode === 'focus' && runtime.endsAt !== null) {
      setLinkNotice('Focus 実行中はログアウトできません。終了してからお試しください。')
      return
    }
    void logout()
  }
  return <main className="page-shell settings-page"><div className="page-heading"><div><p className="kicker">自分に合わせる</p><h1>{messages.settings.title}</h1></div><Link to="/app">アプリへ戻る</Link></div>
    {turnstileSiteKey ? <Turnstile siteKey={turnstileSiteKey} options={{ appearance: 'interaction-only' }} onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} /> : null}
    <section className="settings-group"><h2>{messages.settings.sound}</h2><label className="setting-row"><span>{messages.settings.volume}</span><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); save({ soundVolume: value }) }} aria-label={messages.settings.volume} /></label><label className="setting-row"><span>{messages.settings.muted}</span><input type="checkbox" checked={muted} onChange={(event) => { setMuted(event.target.checked); save({ soundMuted: event.target.checked }) }} /></label><button className="btn btn-small" type="button" onClick={() => playFocusChime(volume, muted)}>{messages.settings.testSound}</button></section>
    <section className="settings-group"><h2>{messages.settings.theme}</h2><div className="segmented">{(['system', 'light', 'dark'] as const).map((value) => <button key={value} type="button" aria-pressed={theme === value} onClick={() => { setTheme(value); applyTheme(value); save({ theme: value }) }}>{messages.settings[value]}</button>)}</div></section>
    <section className="settings-group"><h2>{messages.settings.account}</h2>{user.isAnonymous ? <><p className="muted">{messages.settings.anonymous}</p><GoogleLoginButton turnstileToken={effectiveTurnstileToken} /><p className="warning">{messages.settings.googleWarning}</p></> : <button className="btn" type="button" onClick={logoutSafely}>ログアウト</button>}</section>
    <section className="settings-group"><h2>{messages.settings.data}</h2><button className="btn" type="button" onClick={exportData} disabled={!exportQuery.data}>{messages.settings.export}</button><button className="btn btn-danger" type="button" onClick={deleteAccount}>{messages.settings.delete}</button></section>
    <section className="settings-group"><h2>{messages.settings.timezone}</h2><p className="muted">{user.timezone}</p></section><Toast message={linkNotice} onClose={() => setLinkNotice(null)} />
  </main>
}
