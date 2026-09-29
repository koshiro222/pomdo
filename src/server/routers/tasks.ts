import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, protectedProcedure, turnstileProcedure } from '../context'
import { recordFirstTaskCreated } from '../services/analytics-service'
import { hasAnalyticsEvent } from '../repositories/analytics-event-repository'
import { buildDeckOrder, deriveTaskBuckets, formatTaskCalendarDate, promoteTaskToNow } from '../services/task-service'
import {
  completeTask,
  createTask,
  deleteTask,
  findCurrentTask,
  findTaskById,
  findDeckTasks,
  listTasks,
  moveTaskToNow as persistTaskToNow,
  updateDeckOrders,
  updateTask,
} from '../repositories/task-repository'
import { confirmTaskDecomposition, decompositionProposalSchema, generateTaskDecompositionProposal, TaskDecompositionError } from '../services/task-decomposition-service'

const writeInput = z.object({ turnstileToken: z.string().optional() })
const taskIdInput = z.object({ id: z.string().uuid(), turnstileToken: z.string().optional() })
const decompositionConfirmInput = z.object({
  id: z.string().uuid(),
  items: decompositionProposalSchema.shape.items,
  turnstileToken: z.string().optional(),
})

function getToday(timezone: string, now: Date): string {
  return formatTaskCalendarDate(now, timezone)
}

export const tasksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const allTasks = await listTasks(ctx.db, ctx.user.id)
    const currentTask = await findCurrentTask(ctx.db, ctx.user.id)
    const today = getToday(ctx.user.timezone, ctx.now)
    const buckets = deriveTaskBuckets(allTasks, today, ctx.user.timezone, currentTask?.id ?? null)
    return { today, currentTask, ...buckets }
  }),

  create: turnstileProcedure.input(writeInput.extend({
    title: z.string().trim().min(1).max(240),
    note: z.string().max(2000).nullable().optional(),
    estimate: z.number().int().min(1).max(8).nullable().optional(),
    bucket: z.enum(['onDeck', 'backlog']).default('onDeck'),
  })).mutation(async ({ ctx, input }) => {
    const existing = await listTasks(ctx.db, ctx.user.id)
    const today = getToday(ctx.user.timezone, ctx.now)
    const onDeck = existing.filter((task) => task.plannedFor === today && task.completedAt === null).sort((left, right) => (left.deckOrder ?? '').localeCompare(right.deckOrder ?? ''))
    const deckOrder = input.bucket === 'onDeck'
      ? buildDeckOrder(onDeck.at(-1)?.deckOrder ?? null, null)
      : null
    const created = await createTask(ctx.db, {
      userId: ctx.user.id,
      title: input.title,
      note: input.note ?? null,
      estimate: input.estimate ?? null,
      plannedFor: input.bucket === 'onDeck' ? today : null,
      deckOrder,
    })
    if (!created) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'タスクを作成できませんでした' })
    if (!(await hasAnalyticsEvent(ctx.db, ctx.user.id, 'first_task_created'))) await recordFirstTaskCreated(ctx.db, ctx.user.id)
    return created
  }),

  update: turnstileProcedure.input(taskIdInput.extend({
    title: z.string().trim().min(1).max(240).optional(),
    note: z.string().max(2000).nullable().optional(),
    estimate: z.number().int().min(1).max(8).nullable().optional(),
  })).mutation(async ({ ctx, input }) => {
    const updated = await updateTask(ctx.db, ctx.user.id, input.id, {
      title: input.title,
      note: input.note,
      estimate: input.estimate,
    })
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    return updated
  }),

  complete: turnstileProcedure.input(taskIdInput).mutation(async ({ ctx, input }) => {
    const updated = await completeTask(ctx.db, ctx.user.id, input.id)
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    return updated
  }),

  delete: turnstileProcedure.input(taskIdInput).mutation(async ({ ctx, input }) => {
    const deleted = await deleteTask(ctx.db, ctx.user.id, input.id)
    if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    return deleted
  }),

  moveToNow: turnstileProcedure.input(taskIdInput).mutation(async ({ ctx, input }) => {
    const task = await findTaskById(ctx.db, ctx.user.id, input.id)
    if (!task || task.completedAt) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    const today = getToday(ctx.user.timezone, ctx.now)
    const updated = await persistTaskToNow(ctx.db, ctx.user.id, input.id, promoteTaskToNow(task, today, ctx.user.timezone))
    if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    return updated
  }),

  reorder: turnstileProcedure.input(taskIdInput.extend({
    previousId: z.string().uuid().nullable(),
    nextId: z.string().uuid().nullable(),
  })).mutation(async ({ ctx, input }) => {
    const target = await findTaskById(ctx.db, ctx.user.id, input.id)
    const today = getToday(ctx.user.timezone, ctx.now)
    if (!target || target.completedAt || target.plannedFor !== today) throw new TRPCError({ code: 'BAD_REQUEST', message: 'On Deck のタスクだけ並べ替えできます' })
    const [previous, next] = await Promise.all([
      input.previousId ? findTaskById(ctx.db, ctx.user.id, input.previousId) : Promise.resolve(null),
      input.nextId ? findTaskById(ctx.db, ctx.user.id, input.nextId) : Promise.resolve(null),
    ])
    if ((previous && (previous.completedAt || previous.plannedFor !== today)) || (next && (next.completedAt || next.plannedFor !== today))) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'On Deck の隣接タスクを指定してください' })
    }
    try {
      const deckOrder = buildDeckOrder(previous?.deckOrder ?? null, next?.deckOrder ?? null)
      return updateTask(ctx.db, ctx.user.id, input.id, { deckOrder })
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      const deckTasks = await findDeckTasks(ctx.db, ctx.user.id, today)
      const ordered = deckTasks.filter((task) => task.id !== target.id)
      const insertionIndex = input.nextId === null
        ? ordered.length
        : Math.max(0, ordered.findIndex((task) => task.id === input.nextId))
      ordered.splice(insertionIndex, 0, target)
      const rebalanced = buildDeckOrder(ordered)
      await updateDeckOrders(ctx.db, ctx.user.id, rebalanced.map((task) => ({ id: task.id, deckOrder: task.deckOrder ?? '' })))
      return rebalanced.find((task) => task.id === target.id) ?? null
    }
  }),

  decomposePreview: turnstileProcedure.input(taskIdInput).mutation(async ({ ctx, input }) => {
    const task = await findTaskById(ctx.db, ctx.user.id, input.id)
    if (!task) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
    try {
      return await generateTaskDecompositionProposal({
        ai: ctx.env.AI,
        title: task.title,
        note: task.note,
        e2eTestMode: ctx.env.E2E_TEST_MODE === 'true',
      })
    } catch (error) {
      if (error instanceof TaskDecompositionError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '分解案を生成できませんでした。もう一度お試しください' })
      }
      throw error
    }
  }),

  decomposeConfirm: turnstileProcedure.input(decompositionConfirmInput).mutation(async ({ ctx, input }) => {
    try {
      const plan = await confirmTaskDecomposition({
        db: ctx.db,
        userId: ctx.user.id,
        taskId: input.id,
        today: getToday(ctx.user.timezone, ctx.now),
        items: input.items,
      })
      if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'タスクが見つかりません' })
      return { items: plan.replacementTasks.map(({ title, note }) => ({ title, note })) }
    } catch (error) {
      if (error instanceof TRPCError) throw error
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'タスクの分解を確定できませんでした。元のタスクは変更されていません' })
    }
  }),
})
