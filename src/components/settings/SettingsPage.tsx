import { useCallback, useEffect, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Link, useNavigate } from 'react-router'
import { Slider, Switch } from 'radix-ui'
import type { AuthUser } from '../../hooks/useAuth'
import { useAppSession } from '../../hooks/useAppSession'
import { useTurnstileToken } from '../../hooks/useTurnstileToken'
import { resolveNextTheme, type Theme } from '../../lib/theme'
import { useThemePreference } from '../../hooks/useThemePreference'
import { playFocusChime } from '../../lib/sound'
import { readAccountLinkNotice } from '../../lib/account-link-notice'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { useFocusRuntime } from '../../core/store/focus-runtime'
import { GoogleLoginButton } from '../auth/GoogleLoginButton'
import { AppHeader } from '../layout/AppHeader'
import { Toast } from '../ui/Toast'

export function SettingsPage() {
  const { user, logout, loading, ready, bootstrapError, retryBootstrap, anonymousAuthError, retryAnonymousSignIn } = useAppSession()
  const { theme, toggleTheme } = useThemePreference()
  const header = <AppHeader theme={theme} onToggleTheme={toggleTheme} />
  if (anonymousAuthError) return <>{header}<main className="page-shell loading-state"><div className="alert alert-error" role="alert"><p>匿名アカウントを作成できませんでした。</p><button className="btn" type="button" onClick={retryAnonymousSignIn}>{messages.app.retry}</button></div></main></>
  if (bootstrapError) return <>{header}<main className="page-shell loading-state"><div className="alert alert-error" role="alert"><p>Pomdo の準備に失敗しました。</p><button className="btn" type="button" onClick={retryBootstrap}>{messages.app.retry}</button></div></main></>
  if (loading || !ready || !user) return <><>{header}</><main className="page-shell loading-state" aria-live="polite"><span className="loading loading-spinner loading-lg" aria-hidden="true" /><p>設定を準備しています。</p></main></>
  return <SettingsContent key={user.id} user={user} logout={logout} />
}

function SettingsContent({ user, logout }: { user: AuthUser; logout: () => Promise<void> }) {
  const navigate = useNavigate()
  const update = trpc.settings.update.useMutation()
  const deleteMutation = trpc.account.delete.useMutation({ onSuccess: () => { void logout().then(() => navigate('/')) } })
  const exportQuery = trpc.account.export.useQuery()
  const [muted, setMuted] = useState(user.soundMuted)
  const [volume, setVolume] = useState(user.soundVolume)
  const [linkNotice, setLinkNotice] = useState<string | null>(readAccountLinkNotice)
  const { ref: turnstileRef, siteKey: turnstileSiteKey, resolveTurnstileToken, onSuccess: onTurnstileSuccess, onExpire: onTurnstileExpire, onError: onTurnstileError } = useTurnstileToken()
  const resolveProtectedActionToken = useCallback(async () => {
    const token = await resolveTurnstileToken()
    if (!token) setLinkNotice('確認が完了していないため保存できません。ページを再読み込みして、もう一度お試しください。')
    return token
  }, [resolveTurnstileToken])
  const save = useCallback(async (input: { theme?: Theme; soundMuted?: boolean; soundVolume?: number }) => {
    const turnstileToken = await resolveProtectedActionToken()
    if (!turnstileToken) return false
    try {
      await update.mutateAsync({ ...input, turnstileToken })
      return true
    } catch {
      setLinkNotice('設定を保存できませんでした。画面の変更は維持しています。')
      return false
    }
  }, [resolveProtectedActionToken, update])
  const { theme, toggleTheme, selectTheme, adoptServerTheme } = useThemePreference()
  const persistTheme = useCallback(async (nextTheme: Theme) => { await save({ theme: nextTheme }) }, [save])
  const toggleAndPersistTheme = useCallback(() => {
    const nextTheme = resolveNextTheme(theme)
    toggleTheme()
    void persistTheme(nextTheme)
  }, [persistTheme, theme, toggleTheme])
  useEffect(() => { adoptServerTheme(user.id, user.theme) }, [adoptServerTheme, user.id, user.theme])
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
  const deleteAccount = async () => {
    const runtime = useFocusRuntime.getState()
    if (runtime.mode === 'focus' && runtime.endsAt !== null) {
      setLinkNotice('Focus 実行中はアカウントを削除できません。終了してからお試しください。')
      return
    }
    if (!window.confirm('アカウントとデータをすべて削除しますか？')) return
    const turnstileToken = await resolveProtectedActionToken()
    if (!turnstileToken) return
    deleteMutation.mutate({ turnstileToken })
  }
  const logoutSafely = () => {
    const runtime = useFocusRuntime.getState()
    if (runtime.mode === 'focus' && runtime.endsAt !== null) {
      setLinkNotice('Focus 実行中はログアウトできません。終了してからお試しください。')
      return
    }
    void logout()
  }
  return <><AppHeader theme={theme} onToggleTheme={toggleAndPersistTheme} /><main className="page-shell settings-page"><div className="page-heading"><div><p className="kicker">自分に合わせる</p><h1>{messages.settings.title}</h1></div><Link to="/app">アプリへ戻る</Link></div>
    {turnstileSiteKey ? <Turnstile ref={turnstileRef} siteKey={turnstileSiteKey} options={{ appearance: 'interaction-only' }} onSuccess={onTurnstileSuccess} onExpire={onTurnstileExpire} onError={onTurnstileError} /> : null}
    <section className="settings-group card bg-base-100 border border-base-300 shadow-sm"><h2>{messages.settings.sound}</h2><div className="setting-row"><span>{messages.settings.volume}</span><Slider.Root className="slider-root" min={0} max={1} step={0.05} value={[volume]} onValueChange={([value]) => { setVolume(value); void save({ soundVolume: value }) }}><Slider.Track className="slider-track"><Slider.Range className="slider-range" /></Slider.Track><Slider.Thumb className="slider-thumb" aria-label={messages.settings.volume} /></Slider.Root></div><label className="setting-row"><span>{messages.settings.muted}</span><Switch.Root className="switch-root" checked={muted} onCheckedChange={(checked) => { setMuted(checked); void save({ soundMuted: checked }) }}><Switch.Thumb className="switch-thumb" /></Switch.Root></label><button className="btn btn-sm min-h-[34px] px-[11px] py-[6px]" type="button" onClick={() => playFocusChime(volume, muted)}>{messages.settings.testSound}</button></section>
    <section className="settings-group card bg-base-100 border border-base-300 shadow-sm"><h2>{messages.settings.theme}</h2><div className="theme-options">{(['system', 'light', 'dark'] as const).map((value) => <button className={`btn btn-sm ${theme === value ? 'btn-primary' : ''}`} key={value} type="button" aria-pressed={theme === value} onClick={() => { selectTheme(value); void persistTheme(value) }}>{messages.settings[value]}</button>)}</div></section>
    <section className="settings-group card bg-base-100 border border-base-300 shadow-sm"><h2>{messages.settings.account}</h2>{user.isAnonymous ? <><p className="muted">{messages.settings.anonymous}</p><GoogleLoginButton resolveTurnstileToken={resolveProtectedActionToken} /><p className="warning">{messages.settings.googleWarning}</p></> : <button className="btn" type="button" onClick={logoutSafely}>ログアウト</button>}</section>
    <section className="settings-group card bg-base-100 border border-base-300 shadow-sm"><h2>{messages.settings.data}</h2><div className="data-actions"><button className="btn btn-block" type="button" onClick={exportData} disabled={!exportQuery.data}>{messages.settings.export}</button><button className="btn btn-error btn-block" type="button" onClick={() => { void deleteAccount() }} disabled={deleteMutation.isPending}>{messages.settings.delete}</button></div></section>
    <section className="settings-group card bg-base-100 border border-base-300 shadow-sm"><h2>{messages.settings.timezone}</h2><p className="muted">{user.timezone}</p></section><Toast message={linkNotice} onClose={() => setLinkNotice(null)} />
  </main></>
}
