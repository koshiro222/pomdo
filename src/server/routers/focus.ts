import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, turnstileProcedure } from '../context'
import {
  buildCompletedFocusSessionPayload,
  buildInterruptedFocusSessionPayload,
  validateFocusSessionPayload,
} from '../services/focus-session-service'
import { recordFirstFocusCompleted } from '../services/analytics-service'
import { insertFocusSession, listFocusSessions } from '../repositories/focus-session-repository'
import { findTaskById } from '../repositories/task-repository'
import { createFocusStartProof, verifyFocusStartProof } from '../integrations/focus-proof'

const baseInput = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  startedAt: z.string().datetime(),
  plannedSecs: z.union([z.literal(15 * 60), z.literal(25 * 60), z.literal(45 * 60)]),
  startToken: z.string().min(1),
  turnstileToken: z.string().optional(),
})
const startInput = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string().uuid().nullable(),
  plannedSecs: z.union([z.literal(15 * 60), z.literal(25 * 60), z.literal(45 * 60)]),
  turnstileToken: z.string().optional(),
})

async function assertTaskOwnership(db: Parameters<typeof findTaskById>[0], userId: string, taskId: string | null) {
  if (taskId && !(await findTaskById(db, userId, taskId))) throw new TRPCError({ code: 'FORBIDDEN', message: 'タスクが見つかりません' })
}

async function resolveTaskId(db: Parameters<typeof findTaskById>[0], userId: string, taskId: string | null): Promise<string | null> {
  if (!taskId) return null
  // 開始後にユーザーが Task を削除しても、開始証明が有効なら Just Focus として実績を残す。
  return (await findTaskById(db, userId, taskId))?.id ?? null
}

async function assertStartProof(input: { id: string; startToken: string; taskId: string | null; startedAt: string; plannedSecs: number }, userId: string, secret: string) {
  const proof = await verifyFocusStartProof(secret, input.startToken)
  if (!proof || proof.userId !== userId || proof.sessionId !== input.id || proof.taskId !== input.taskId || proof.startedAt !== input.startedAt || proof.plannedSecs !== input.plannedSecs) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Focus の開始情報を確認できません' })
  }
  return proof
}

async function saveFocusPayload(db: Parameters<typeof insertFocusSession>[0], userId: string, payload: ReturnType<typeof buildCompletedFocusSessionPayload>) {
  const created = await insertFocusSession(db, {
    id: payload.id,
    userId,
    taskId: payload.taskId,
    startedAt: new Date(payload.startedAt),
    completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    durationSecs: payload.durationSecs,
    plannedSecs: payload.plannedSecs,
  })
  if (created?.completedAt) await recordFirstFocusCompleted(db, userId)
  return created
}

export const focusRouter = router({
  start: turnstileProcedure.input(startInput).mutation(async ({ ctx, input }) => {
    await assertTaskOwnership(ctx.db, ctx.user.id, input.taskId)
    const now = ctx.now.toISOString()
    return { now, plannedSecs: input.plannedSecs, startToken: await createFocusStartProof(ctx.env.BETTER_AUTH_SECRET, { userId: ctx.user.id, sessionId: input.sessionId, taskId: input.taskId, startedAt: now, plannedSecs: input.plannedSecs }) }
  }),

  complete: turnstileProcedure.input(baseInput.extend({
    endsAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
  })).mutation(async ({ ctx, input }) => {
    const proof = await assertStartProof(input, ctx.user.id, ctx.env.BETTER_AUTH_SECRET)
    const taskId = await resolveTaskId(ctx.db, ctx.user.id, input.taskId)
    const payload = buildCompletedFocusSessionPayload({
      id: input.id,
      taskId,
      startedAt: input.startedAt,
      endsAt: input.endsAt,
      completedAt: input.completedAt,
      plannedSecs: input.plannedSecs,
    })
    if (ctx.now.getTime() < Date.parse(proof.startedAt) + proof.plannedSecs * 1000) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Focus はまだ終了していません' })
    validateFocusSessionPayload(payload)
    return saveFocusPayload(ctx.db, ctx.user.id, payload)
  }),

  interrupt: turnstileProcedure.input(baseInput.extend({ stoppedAt: z.string().datetime() })).mutation(async ({ ctx, input }) => {
    const proof = await assertStartProof(input, ctx.user.id, ctx.env.BETTER_AUTH_SECRET)
    const taskId = await resolveTaskId(ctx.db, ctx.user.id, input.taskId)
    if (Date.parse(input.stoppedAt) > ctx.now.getTime() + 5_000) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: '未来の時刻では Focus を停止できません' })
    if (Date.parse(input.stoppedAt) < Date.parse(proof.startedAt)) throw new TRPCError({ code: 'BAD_REQUEST', message: '停止時刻が開始時刻より前です' })
    const payload = buildInterruptedFocusSessionPayload({
      id: input.id,
      taskId,
      startedAt: input.startedAt,
      stoppedAt: input.stoppedAt,
      plannedSecs: input.plannedSecs,
    })
    if (!payload) return null
    validateFocusSessionPayload(payload)
    return saveFocusPayload(ctx.db, ctx.user.id, payload)
  }),

  sessions: protectedProcedure.query(({ ctx }) => listFocusSessions(ctx.db, ctx.user.id)),
})
