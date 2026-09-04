import { Link } from 'react-router'
import { useAppSession } from '../../hooks/useAppSession'
import { trpc } from '../../lib/trpc'

function formatMinutes(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}分`
}

export function ReviewPage() {
  const { ready, bootstrapError, retryBootstrap, anonymousAuthError, retryAnonymousSignIn } = useAppSession()
  const summary = trpc.review.summary.useQuery(undefined, { enabled: ready })
  if (!ready || summary.isPending) return <main className="page-shell">{anonymousAuthError ? <><p>匿名アカウントを作成できませんでした。</p><button className="btn" type="button" onClick={retryAnonymousSignIn}>もう一度試す</button></> : bootstrapError ? <><p>Pomdo の準備に失敗しました。</p><button className="btn" type="button" onClick={retryBootstrap}>もう一度試す</button></> : <p>振り返りを準備しています。</p>}</main>
  if (summary.isError || !summary.data) return <main className="page-shell"><p>振り返りを読み込めませんでした。</p></main>
  const maxSeconds = Math.max(1, ...summary.data.days.map((day) => day.totalFocusSecs))
  return <main className="page-shell review-page">
    <div className="page-heading"><div><p className="kicker">今日を振り返る</p><h1>できた分を、静かに見る。</h1></div><Link to="/app">アプリへ戻る</Link></div>
    <section className="stats-grid"><div><span>合計集中時間</span><strong>{formatMinutes(summary.data.totalFocusSecs)}</strong></div><div><span>完了した Focus</span><strong>{summary.data.completedFocusCount}本</strong></div></section>
    <section className="review-card"><h2>直近7日</h2><div className="bar-chart" role="img" aria-label="直近7日の集中時間"><svg viewBox="0 0 700 180" preserveAspectRatio="none" aria-hidden="true">{summary.data.days.map((day, index) => { const height = Math.max(4, (day.totalFocusSecs / maxSeconds) * 130); return <rect key={day.date} x={22 + index * 96} y={140 - height} width="52" height={height} rx="8" className={index === 6 ? 'today-bar' : 'day-bar'} /> })}</svg>{summary.data.days.map((day) => <span key={day.date}>{day.date.slice(5)}</span>)}</div><p className="chart-caption">棒グラフは Completed と Interrupted の合計です。</p></section>
    <section className="review-card"><div className="review-card-heading"><h2>完了したタスク</h2><span>{summary.data.completedTasks.length}件</span></div>{summary.data.completedTasks.length > 0 ? <ul className="completed-list">{summary.data.completedTasks.map((task) => <li key={task.id}>{task.title}</li>)}</ul> : <p className="muted">今日完了したタスクはまだありません。</p>}</section>
    <p className="focused-days">Completed Focus があった日 <strong>累計 {summary.data.focusedDays}日</strong></p>
  </main>
}
