import { FcGoogle } from 'react-icons/fc'
import { useState } from 'react'
import type { TurnstileTokenResolver } from '../../hooks/useTurnstileToken'
import { messages } from '../../messages'
import { useAuth } from '../../hooks/useAuth'
import { flushFocusSessionOutbox, peekFocusSession } from '../../lib/focus-outbox'
import { saveAccountLinkSnapshot } from '../../lib/account-link-notice'
import { trpc } from '../../lib/trpc'
import { useFocusRuntime } from '../../core/store/focus-runtime'

export function GoogleLoginButton({ resolveTurnstileToken }: { resolveTurnstileToken: TurnstileTokenResolver }) {
  const { login, user } = useAuth()
  const completeFocus = trpc.focus.complete.useMutation()
  const interruptFocus = trpc.focus.interrupt.useMutation()
  const tasksQuery = trpc.tasks.list.useQuery(undefined, { enabled: Boolean(user) })
  const sessionsQuery = trpc.focus.sessions.useQuery(undefined, { enabled: Boolean(user) })
  const [isPreparing, setIsPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const prepareLogin = async () => {
    const runtime = useFocusRuntime.getState()
    if (runtime.mode === 'focus' && runtime.endsAt !== null) {
      setError('Focus 実行中はアカウントを切り替えられません。終了してからお試しください。')
      return false
    }
    const pending = peekFocusSession()
    if (!pending) return true
    if (!user || pending.ownerUserId !== user.id) {
      setError('送信待ちの Focus が別のアカウントのものです。先に現在のアカウントで送信してください。')
      return false
    }
    const turnstileToken = await resolveTurnstileToken()
    if (!turnstileToken) {
      setError('確認が完了していないため、ログイン前の送信ができません。ページを再読み込みして、もう一度お試しください。')
      return false
    }
    const flushed = await flushFocusSessionOutbox(user.id, async (payload) => {
      if (payload.kind === 'completed') {
        if (!payload.completedAt) throw new Error('Completed payload が不正です')
        await completeFocus.mutateAsync({
          id: payload.id,
          taskId: payload.taskId,
          startedAt: payload.startedAt,
          startToken: payload.startToken,
          endsAt: payload.completedAt,
          completedAt: payload.completedAt,
          plannedSecs: payload.plannedSecs,
          turnstileToken: turnstileToken ?? undefined,
        })
      } else {
        if (!payload.stoppedAt) throw new Error('Interrupted payload が不正です')
        await interruptFocus.mutateAsync({
          id: payload.id,
          taskId: payload.taskId,
          startedAt: payload.startedAt,
          startToken: payload.startToken,
          stoppedAt: payload.stoppedAt,
          plannedSecs: payload.plannedSecs,
          turnstileToken: turnstileToken ?? undefined,
        })
      }
    })
    if (!flushed) {
      setError('送信待ちの Focus を保存できませんでした。接続を確認してからもう一度お試しください。')
      return false
    }
    return true
  }

  const handleClick = async () => {
    setError(null)
    setIsPreparing(true)
    try {
      if (await prepareLogin()) {
        if (user) {
          const [taskResult, sessionResult] = await Promise.all([tasksQuery.refetch(), sessionsQuery.refetch()])
          saveAccountLinkSnapshot({
            userId: user.id,
            taskIds: taskResult.data ? [
              ...taskResult.data.todayTasks,
              ...taskResult.data.backlog,
              ...taskResult.data.todaysDone,
              ...taskResult.data.archive,
            ].map((task) => task.id) : [],
            focusSessionIds: (sessionResult.data ?? []).map((session) => session.id),
          })
        }
        login()
      }
    } finally {
      setIsPreparing(false)
    }
  }

  return <div className="account-login"><button className="btn btn-primary" type="button" onClick={() => void handleClick()} disabled={isPreparing}><FcGoogle size={16} aria-hidden="true" /> {isPreparing ? '送信を確認中…' : messages.settings.google}</button>{error ? <p className="warning" role="alert">{error}</p> : null}</div>
}
