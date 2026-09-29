import { useCallback, useEffect, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Link } from 'react-router'
import { useAppSession } from '../../hooks/useAppSession'
import { useThemePreference } from '../../hooks/useThemePreference'
import { useTurnstileToken } from '../../hooks/useTurnstileToken'
import { resolveNextTheme } from '../../lib/theme'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { AppHeader } from '../layout/AppHeader'
import { Toast } from '../ui/Toast'

function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}分`
}

export function ReviewPage() {
  const { user, ready, bootstrapError, retryBootstrap, anonymousAuthError, retryAnonymousSignIn } = useAppSession()
  const summary = trpc.review.summary.useQuery(undefined, { enabled: Boolean(user && ready) })
  const update = trpc.settings.update.useMutation()
  const { theme, toggleTheme, adoptServerTheme } = useThemePreference()
  const [toast, setToast] = useState<string | null>(null)
  const { ref: turnstileRef, siteKey: turnstileSiteKey, resolveTurnstileToken, onSuccess: onTurnstileSuccess, onExpire: onTurnstileExpire, onError: onTurnstileError } = useTurnstileToken()
  const resolveProtectedActionToken = useCallback(async () => {
    const token = await resolveTurnstileToken()
    if (!token) setToast('確認が完了していないため保存できません。ページを再読み込みして、もう一度お試しください。')
    return token
  }, [resolveTurnstileToken])
  const persistTheme = useCallback(async (nextTheme: 'system' | 'light' | 'dark') => {
    const turnstileToken = await resolveProtectedActionToken()
    if (!turnstileToken) return
    try {
      await update.mutateAsync({ theme: nextTheme, turnstileToken })
    } catch {
      setToast('テーマを保存できませんでした。画面のテーマは維持しています。')
    }
  }, [resolveProtectedActionToken, update])
  const toggleAndPersistTheme = useCallback(() => {
    const nextTheme = resolveNextTheme(theme)
    toggleTheme()
    if (user && ready) void persistTheme(nextTheme)
  }, [persistTheme, ready, theme, toggleTheme, user])
  useEffect(() => {
    if (user) adoptServerTheme(user.id, user.theme)
  }, [adoptServerTheme, user])
  const header = <AppHeader theme={theme} onToggleTheme={toggleAndPersistTheme} />
  const turnstile = turnstileSiteKey ? <Turnstile ref={turnstileRef} siteKey={turnstileSiteKey} options={{ appearance: 'interaction-only' }} onSuccess={onTurnstileSuccess} onExpire={onTurnstileExpire} onError={onTurnstileError} /> : null
  if (anonymousAuthError) return <><>{header}</>{turnstile}<main className="page-shell loading-state"><div className="alert alert-error" role="alert"><p>匿名アカウントを作成できませんでした。</p><button className="btn btn-outline" type="button" onClick={retryAnonymousSignIn}>{messages.app.retry}</button></div></main><Toast message={toast} onClose={() => setToast(null)} /></>
  if (bootstrapError) return <><>{header}</>{turnstile}<main className="page-shell loading-state"><div className="alert alert-error" role="alert"><p>Pomdo の準備に失敗しました。</p><button className="btn btn-outline" type="button" onClick={retryBootstrap}>{messages.app.retry}</button></div></main><Toast message={toast} onClose={() => setToast(null)} /></>
  if (!ready || summary.isPending) return <><>{header}</>{turnstile}<main className="page-shell loading-state" role="status" aria-live="polite"><span className="loading loading-spinner loading-lg" aria-hidden="true" /><p>振り返りを準備しています。</p></main><Toast message={toast} role="alert" onClose={() => setToast(null)} /></>
  if (summary.isError || !summary.data) return <><>{header}</>{turnstile}<main className="page-shell loading-state"><div className="alert alert-error" role="alert"><p>振り返りを読み込めませんでした。</p></div></main><Toast message={toast} onClose={() => setToast(null)} /></>
  const maxSeconds = Math.max(1, ...summary.data.days.map((day) => day.totalFocusSecs))
  return <><>{header}</>{turnstile}<main className="page-shell review-page">
    <div className="page-heading"><div><h1>今日の振り返り</h1></div><Link to="/app">アプリへ戻る</Link></div>
    <section className="stats-grid"><div className="card bg-base-100 border border-base-300 shadow-sm"><span>合計集中時間</span><strong>{formatMinutes(summary.data.totalFocusSecs)}</strong></div><div className="card bg-base-100 border border-base-300 shadow-sm"><span>完了した Focus</span><strong>{summary.data.completedFocusCount}本</strong></div></section>
    <section className="review-card card bg-base-100 border border-base-300 shadow-sm"><h2>直近7日</h2><div className="bar-chart" role="img" aria-label="直近7日の集中時間"><svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-hidden="true">{summary.data.days.map((day, index) => { const height = Math.max(4, (day.totalFocusSecs / maxSeconds) * 130); return <rect key={day.date} x={22 + index * 96} y={140 - height} width="52" height={height} rx="8" className={index === 6 ? 'today-bar' : 'day-bar'} /> })}</svg>{summary.data.days.map((day) => <span key={day.date}>{day.date.slice(5)}</span>)}</div><p className="chart-caption">棒グラフは Completed と Interrupted の合計です。</p></section>
    <section className="review-card card bg-base-100 border border-base-300 shadow-sm"><div className="review-card-heading"><h2>完了したタスク</h2><span>{summary.data.completedTasks.length}件</span></div>{summary.data.completedTasks.length > 0 ? <ul className="completed-list">{summary.data.completedTasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul> : <p className="muted">今日完了したタスクはまだありません。</p>}</section>
    <p className="focused-days">Completed Focus があった日 <strong>累計 {summary.data.focusedDays}日</strong></p>
  </main><Toast message={toast} onClose={() => setToast(null)} /></>
}
