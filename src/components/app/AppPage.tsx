import { useCallback, useEffect, useRef, useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import { Link } from 'react-router'
import { useAppSession } from '../../hooks/useAppSession'
import { flushFocusSessionOutbox, peekFocusSession, queueFocusSession, type FocusOutboxPayload } from '../../lib/focus-outbox'
import { requestNotificationPermissionOnce, notifyFocusCompleted } from '../../lib/notifications'
import { playFocusChime } from '../../lib/sound'
import { trpc } from '../../lib/trpc'
import { messages } from '../../messages'
import { readAccountLinkNotice, readAccountLinkSnapshot } from '../../lib/account-link-notice'
import { advanceFocusCycle, classifyTabReturn, type FocusMode } from '../../core/domain/focus-session'
import { useFocusRuntime, calculateRuntimeRemainingSecs, initializeFocusRuntimeStorageSync } from '../../core/store/focus-runtime'
import { AppHeader } from '../layout/AppHeader'
import { NowCard } from './NowCard'
import { TaskList } from '../tasks/TaskList'
import { TaskDetailsSheet } from '../tasks/TaskDetailsSheet'
import { TimerControls } from '../timer/TimerControls'
import { TimerDisc } from '../timer/TimerDisc'
import { Toast } from '../ui/Toast'
import type { TaskView } from '../tasks/TaskRow'

const DEV_TURNSTILE_TOKEN = 'e2e-turnstile-token'
const DEV_TURNSTILE_SITE_KEY = '1x00000000000000000000AA'

type FocusRuntimeSnapshot = {
  startedAt: number
  endsAt: number
  sessionId: string
  ownerUserId: string
  taskId: string | null
  startToken: string
  plannedSecs: number
  mode: Extract<FocusMode, 'focus'>
  longBreakCount: number
}

function createRuntimeSessionKey(snapshot: { sessionId: string | null; startedAt: number | null }): string {
  return snapshot.sessionId ?? `break-${snapshot.startedAt ?? 'unknown'}`
}

export function AppPage() {
  const { user, loading, ready, bootstrapError, retryBootstrap, anonymousAuthError, retryAnonymousSignIn } = useAppSession()
  const utils = trpc.useUtils()
  const tasksQuery = trpc.tasks.list.useQuery(undefined, { enabled: Boolean(user && ready) })
  const sessionsQuery = trpc.focus.sessions.useQuery(undefined, { enabled: Boolean(user && ready) })
  const startFocus = trpc.focus.start.useMutation()
  const completeFocus = trpc.focus.complete.useMutation()
  const interruptFocus = trpc.focus.interrupt.useMutation()
  const completeTask = trpc.tasks.complete.useMutation()
  const moveTaskToNow = trpc.tasks.moveToNow.useMutation()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [justFocusChoice, setJustFocusChoice] = useState(false)
  const [breakSuggestion, setBreakSuggestion] = useState<'shortBreak' | 'longBreak' | null>(null)
  const [detailsTask, setDetailsTask] = useState<TaskView | null>(null)
  const [toast, setToast] = useState<string | null>(() => readAccountLinkNotice())
  const [tabReturnPrompt, setTabReturnPrompt] = useState<FocusRuntimeSnapshot | null>(null)
  const [nextTaskSuggestion, setNextTaskSuggestion] = useState<TaskView | null>(null)
  const completedRuntimeId = useRef<string | null>(null)
  const completedBreakRuntimeId = useRef<string | null>(null)
  const promptedRuntimeId = useRef<string | null>(null)
  const runtime = useFocusRuntime()
  const isActive = runtime.endsAt !== null
  const remainingSecs = calculateRuntimeRemainingSecs(runtime.endsAt, now)
  const tabReturnNeedsConfirmation = runtime.mode === 'focus'
    && runtime.startedAt !== null
    && runtime.endsAt !== null
    && user !== null
    && runtime.ownerUserId === user.id
    && Boolean(runtime.startToken)
    && classifyTabReturn(runtime.endsAt, now) === 'needs_confirmation'
  const recoverySnapshot: FocusRuntimeSnapshot | null = tabReturnPrompt ?? (
    tabReturnNeedsConfirmation && runtime.startedAt !== null && runtime.endsAt !== null && runtime.startToken && runtime.sessionId && runtime.ownerUserId
      ? {
          startedAt: runtime.startedAt,
          endsAt: runtime.endsAt,
          sessionId: runtime.sessionId,
          ownerUserId: runtime.ownerUserId,
          taskId: runtime.taskId,
          plannedSecs: runtime.plannedSecs,
          mode: 'focus',
          longBreakCount: runtime.longBreakCount,
          startToken: runtime.startToken,
        }
      : null
  )
  const effectiveTurnstileToken = turnstileToken ?? (import.meta.env.DEV ? DEV_TURNSTILE_TOKEN : null)
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? DEV_TURNSTILE_SITE_KEY : null)
  const currentTask = tasksQuery.data?.currentTask ?? null
  const taskList = tasksQuery.data
  const completedFocusCounts = new Map<string, number>()
  for (const session of sessionsQuery.data ?? []) if (session.completedAt && session.taskId) completedFocusCounts.set(session.taskId, (completedFocusCounts.get(session.taskId) ?? 0) + 1)
  const refresh = useCallback(() => { void utils.tasks.list.invalidate(); void utils.review.summary.invalidate(); void sessionsQuery.refetch() }, [sessionsQuery, utils.review.summary, utils.tasks.list])
  const timerCompletionPending = isActive && runtime.mode === 'focus' && remainingSecs === 0 && !recoverySnapshot

  useEffect(() => initializeFocusRuntimeStorageSync(), [])
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (import.meta.env.DEV) window.localStorage.setItem('pomdo-e2e-now', new Date(now).toISOString()) }, [now])
  useEffect(() => { if (ready) useFocusRuntime.getState().resetLongBreakCount() }, [ready])
  useEffect(() => {
    if (runtime.mode === 'focus' && runtime.endsAt !== null && (!runtime.startToken || !runtime.sessionId)) useFocusRuntime.getState().clearSession()
  }, [runtime.endsAt, runtime.mode, runtime.sessionId, runtime.startToken])
  useEffect(() => {
    if (runtime.endsAt === null || runtime.ownerUserId === user?.id) return
    useFocusRuntime.getState().clearSession()
    if (user) setToast('アカウントが変わったため、実行中の Focus を破棄しました。')
  }, [runtime.endsAt, runtime.ownerUserId, user])
  useEffect(() => {
    if (!tabReturnNeedsConfirmation || !runtime.startedAt || !runtime.endsAt || !runtime.startToken || !runtime.sessionId || !runtime.ownerUserId || promptedRuntimeId.current === createRuntimeSessionKey(runtime)) return
    promptedRuntimeId.current = createRuntimeSessionKey(runtime)
    setTabReturnPrompt({
      startedAt: runtime.startedAt,
      endsAt: runtime.endsAt,
      sessionId: runtime.sessionId,
      ownerUserId: runtime.ownerUserId,
      taskId: runtime.taskId,
      plannedSecs: runtime.plannedSecs,
      mode: 'focus',
      longBreakCount: runtime.longBreakCount,
      startToken: runtime.startToken,
    })
  }, [now, runtime, tabReturnNeedsConfirmation])
  useEffect(() => {
    if (!isActive || runtime.mode === 'focus' || remainingSecs > 0 || !runtime.startedAt) return
    const sessionId = createRuntimeSessionKey(runtime)
    if (completedBreakRuntimeId.current === sessionId) return
    completedBreakRuntimeId.current = sessionId
    notifyFocusCompleted()
    playFocusChime(user?.soundVolume ?? 0.7, user?.soundMuted ?? false)
    useFocusRuntime.getState().clearSession()
    useFocusRuntime.setState({ plannedSecs: 25 * 60 })
  }, [isActive, now, remainingSecs, runtime, user])
  useEffect(() => {
    if (!user) return
    void flushFocusSessionOutbox(user.id, async (payload) => {
      const input = { ...payload, turnstileToken: effectiveTurnstileToken ?? undefined }
      if (payload.kind === 'completed') await completeFocus.mutateAsync({ id: input.id, taskId: input.taskId, startedAt: input.startedAt, startToken: input.startToken, completedAt: input.completedAt ?? undefined, endsAt: input.completedAt ?? input.startedAt, plannedSecs: input.plannedSecs, turnstileToken: input.turnstileToken })
      else await interruptFocus.mutateAsync({ id: input.id, taskId: input.taskId, startedAt: input.startedAt, startToken: input.startToken, stoppedAt: input.stoppedAt ?? new Date().toISOString(), plannedSecs: input.plannedSecs, turnstileToken: input.turnstileToken })
    })
  }, [completeFocus, effectiveTurnstileToken, interruptFocus, user])
  useEffect(() => {
    if (!user || !taskList || toast) return
    const snapshot = readAccountLinkSnapshot()
    if (!snapshot || snapshot.userId === user.id) return
    const taskIds = new Set([
      ...taskList.todayTasks,
      ...taskList.backlog,
      ...taskList.todaysDone,
      ...taskList.archive,
    ].map((task) => task.id))
    const focusSessionIds = new Set((sessionsQuery.data ?? []).map((session) => session.id))
    const preserved = snapshot.taskIds.some((id) => taskIds.has(id)) || snapshot.focusSessionIds.some((id) => focusSessionIds.has(id))
    if (!preserved) setToast('匿名データを確認できませんでした。Google側に既存データがある場合は引き継がれません。')
  }, [sessionsQuery.data, taskList, toast, user])
  const completeRuntimeSession = useCallback((snapshot: FocusRuntimeSnapshot) => {
    const payload: FocusOutboxPayload = {
      id: snapshot.sessionId,
      ownerUserId: snapshot.ownerUserId,
      startToken: snapshot.startToken,
      taskId: snapshot.taskId,
      startedAt: new Date(snapshot.startedAt).toISOString(),
      completedAt: new Date(snapshot.endsAt).toISOString(),
      durationSecs: snapshot.plannedSecs,
      plannedSecs: snapshot.plannedSecs,
      kind: 'completed',
    }
    completeFocus.mutate({
      id: payload.id,
      taskId: payload.taskId,
      startedAt: payload.startedAt,
      startToken: payload.startToken,
      endsAt: payload.completedAt ?? payload.startedAt,
      completedAt: payload.completedAt ?? undefined,
      plannedSecs: payload.plannedSecs,
      turnstileToken: effectiveTurnstileToken ?? undefined,
    }, {
      onError: () => queueFocusSession(payload),
      onSettled: () => {
        const cycle = advanceFocusCycle(snapshot.mode, snapshot.longBreakCount)
        setBreakSuggestion(cycle.suggestLongBreak ? 'longBreak' : 'shortBreak')
        useFocusRuntime.getState().incrementLongBreakCount()
        useFocusRuntime.getState().clearSession()
        setTabReturnPrompt(null)
        refresh()
      },
    })
    notifyFocusCompleted()
    playFocusChime(user?.soundVolume ?? 0.7, user?.soundMuted ?? false)
  }, [completeFocus, effectiveTurnstileToken, refresh, user])
  useEffect(() => {
    if (!isActive || runtime.mode !== 'focus' || runtime.ownerUserId !== user?.id || remainingSecs > 0 || tabReturnNeedsConfirmation || !runtime.startedAt || !runtime.endsAt || !runtime.startToken) return
    const sessionId = createRuntimeSessionKey(runtime)
    if (completedRuntimeId.current === sessionId) return
    completedRuntimeId.current = sessionId
    if (!runtime.sessionId) return
    if (!runtime.ownerUserId) return
    completeRuntimeSession({ startedAt: runtime.startedAt, endsAt: runtime.endsAt, sessionId: runtime.sessionId, ownerUserId: runtime.ownerUserId, taskId: runtime.taskId, startToken: runtime.startToken, plannedSecs: runtime.plannedSecs, mode: 'focus', longBreakCount: runtime.longBreakCount })
  }, [completeRuntimeSession, isActive, now, remainingSecs, runtime, tabReturnNeedsConfirmation, user?.id])

  if (loading || !ready || !user || !taskList) return <><AppHeader /><main className="page-shell loading-state">{anonymousAuthError ? <><p>匿名アカウントを作成できませんでした。</p><button className="btn" type="button" onClick={retryAnonymousSignIn}>もう一度試す</button></> : bootstrapError ? <><p>Pomdo の準備に失敗しました。</p><button className="btn" type="button" onClick={retryBootstrap}>もう一度試す</button></> : <p>あなたの Pomdo を準備しています。</p>}</main></>
  const start = async (taskId: string | null = currentTask?.id ?? null) => {
    if (!taskId && !justFocusChoice) { setJustFocusChoice(true); return }
    const pendingOutbox = peekFocusSession()
    if (pendingOutbox) {
      setToast('前回の Focus を送信中です。再送が完了してから次を始めてください。')
      return
    }
    await requestNotificationPermissionOnce()
    const sessionId = crypto.randomUUID()
    const response = await startFocus.mutateAsync({ sessionId, taskId, plannedSecs: runtime.plannedSecs, turnstileToken: effectiveTurnstileToken ?? undefined })
    const startedAt = Date.parse(response.now)
    useFocusRuntime.getState().startSession({ startedAt, endsAt: startedAt + runtime.plannedSecs * 1000, sessionId, ownerUserId: user.id, taskId, startToken: response.startToken, plannedSecs: runtime.plannedSecs, mode: 'focus' })
    completedRuntimeId.current = null
    setJustFocusChoice(false)
  }
  const stop = () => {
    if (!runtime.startedAt || !runtime.sessionId || !runtime.startToken) return
    const payload: FocusOutboxPayload = { id: runtime.sessionId, ownerUserId: user?.id ?? '', startToken: runtime.startToken, taskId: runtime.taskId, startedAt: new Date(runtime.startedAt).toISOString(), completedAt: null, stoppedAt: new Date().toISOString(), durationSecs: Math.max(0, Math.floor((Date.now() - runtime.startedAt) / 1000)), plannedSecs: runtime.plannedSecs, kind: 'interrupted' }
    interruptFocus.mutate({ id: payload.id, taskId: payload.taskId, startedAt: payload.startedAt, startToken: payload.startToken, stoppedAt: new Date().toISOString(), plannedSecs: payload.plannedSecs, turnstileToken: effectiveTurnstileToken ?? undefined }, { onError: () => { if (payload.durationSecs >= 60) queueFocusSession(payload) }, onSettled: () => { useFocusRuntime.getState().clearSession(); refresh() } })
  }
  const startBreak = () => { if (!breakSuggestion) return; const seconds = breakSuggestion === 'longBreak' ? 15 * 60 : 5 * 60; if (breakSuggestion === 'longBreak') useFocusRuntime.getState().resetLongBreakCount(); useFocusRuntime.getState().startBreak(breakSuggestion, seconds, user.id); setBreakSuggestion(null) }
  const skipBreak = () => { useFocusRuntime.getState().clearSession(); useFocusRuntime.setState({ plannedSecs: 25 * 60 }) }
  const discardRecoveredFocus = () => { useFocusRuntime.getState().clearSession(); setTabReturnPrompt(null) }
  const completeRecoveredFocus = () => {
    if (!recoverySnapshot) return
    completedRuntimeId.current = createRuntimeSessionKey(recoverySnapshot)
    completeRuntimeSession(recoverySnapshot)
  }
  const completeNowTask = () => {
    if (!currentTask) return
    completeTask.mutate({ id: currentTask.id, turnstileToken: effectiveTurnstileToken ?? undefined }, {
      onSuccess: () => {
        setNextTaskSuggestion(taskList.onDeck[0] ?? null)
        refresh()
      },
    })
  }
  const promoteSuggestedTask = () => {
    if (!nextTaskSuggestion) return
    moveTaskToNow.mutate({ id: nextTaskSuggestion.id, turnstileToken: effectiveTurnstileToken ?? undefined }, {
      onSuccess: () => {
        setNextTaskSuggestion(null)
        refresh()
      },
    })
  }
  return <div className="app-shell"><AppHeader /><main className="app-wrap">
    {turnstileSiteKey ? <Turnstile siteKey={turnstileSiteKey} options={{ appearance: 'interaction-only' }} onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} onError={() => setTurnstileToken(null)} /> : null}
    <NowCard task={currentTask} completedFocusCount={currentTask ? completedFocusCounts.get(currentTask.id) ?? 0 : 0} onComplete={completeNowTask} onEdit={() => setDetailsTask(currentTask)} onJustFocus={() => setJustFocusChoice(true)} />
    {nextTaskSuggestion ? <div className="break-suggestion task-suggestion" role="status"><p>次は「{nextTaskSuggestion.title}」にしますか？</p><button className="btn btn-primary" type="button" onClick={promoteSuggestedTask}>Nowにする</button><button className="btn" type="button" onClick={() => setNextTaskSuggestion(null)}>あとで</button></div> : null}
    <section className="timer-block" aria-label="Focus timer"><TimerDisc remainingSecs={isActive ? remainingSecs : runtime.plannedSecs} plannedSecs={runtime.plannedSecs} mode={runtime.mode} />{recoverySnapshot ? <div className="break-suggestion" role="alert"><p>終了から時間が経っています。この Focus を記録しますか？</p><button className="btn btn-primary" type="button" onClick={completeRecoveredFocus}>記録する</button><button className="btn" type="button" onClick={discardRecoveredFocus}>破棄する</button></div> : timerCompletionPending ? <p className="muted" role="status">完了を記録しています。</p> : <TimerControls isActive={isActive} mode={runtime.mode} preset={runtime.plannedSecs} onPresetChange={(seconds) => { if (!isActive) useFocusRuntime.setState({ plannedSecs: seconds }) }} onStart={() => void start()} onStop={stop} onSkip={skipBreak} />}{!isActive && justFocusChoice ? <div className="inline-choice"><button className="btn" type="button" onClick={() => { const next = taskList.onDeck[0]; if (next) void start(next.id) }}>On Deckから1つ選ぶ</button><button className="btn" type="button" onClick={() => void start(null)}>このまま集中する</button></div> : null}{breakSuggestion ? <div className="break-suggestion"><p>{breakSuggestion === 'longBreak' ? '3本できました。長めに休みますか？' : 'ひと区切り。少し休みますか？'}</p><button className="btn btn-primary" type="button" onClick={startBreak}>{breakSuggestion === 'longBreak' ? '長めに休む（15分）' : '休憩する（5分）'}</button><button className="btn" type="button" onClick={() => setBreakSuggestion(null)}>もう1本</button></div> : null}</section>
    <TaskList currentTask={currentTask} onDeck={taskList.onDeck} backlog={taskList.backlog} done={taskList.todaysDone} turnstileToken={effectiveTurnstileToken} onRefresh={refresh} onMoveToNow={(task: TaskView) => moveTaskToNow.mutate({ id: task.id, turnstileToken: effectiveTurnstileToken ?? undefined }, { onSuccess: refresh })} />
    <TaskDetailsSheet key={detailsTask?.id ?? 'closed'} task={detailsTask} turnstileToken={effectiveTurnstileToken} onClose={() => setDetailsTask(null)} onSaved={refresh} onDeleted={() => { if (detailsTask?.id === currentTask?.id) setNextTaskSuggestion(taskList.onDeck[0] ?? null); setDetailsTask(null); refresh() }} />
    <Link className="review-link" to="/app/review">{messages.app.review} →</Link>
    <Toast message={toast} onClose={() => setToast(null)} />
  </main></div>
}
